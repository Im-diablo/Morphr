"""
Flask application â€” Morphr API server.
All API keys are optional in .env. Users provide them via request headers.
"""
# Security: max upload size = 5 MB

import os
import json
import re
import hashlib
import shutil
import logging
import threading
from datetime import datetime, timedelta, timezone

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import GEMINI_API_KEY, GITHUB_TOKEN, GITHUB_USERNAME
from github_crawler import fetch_projects
from jd_analyzer import analyze_and_edit, sanitize_latex
from resume_parser import convert_to_latex
from compiler import compile_to_pdf
from exporter import generate_pdf, generate_docx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backend.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5 MB upload limit

# Rate limiting to prevent DoS and API quota exhaustion
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["60 per minute"],
    storage_uri="memory://",
)

# Restrict CORS to known frontend origins instead of wildcard "*"
ALLOWED_ORIGINS = [
    "https://morphr.vercel.app",
    "https://www.morphr.vercel.app",
    "https://getmorphr.vercel.app",
    "https://www.getmorphr.vercel.app",
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
CORS(app, resources={
    r"/api/*": {"origins": ALLOWED_ORIGINS, "expose_headers": ["Content-Disposition"]},
    r"/ping": {"origins": ALLOWED_ORIGINS}
}, supports_credentials=False)

RESUMES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "resumes")
BASE_RESUME_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "resume_base.tex")
os.makedirs(RESUMES_DIR, exist_ok=True)

# â”€â”€ Job ID counter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
_COUNTER_FILE = os.path.join(RESUMES_DIR, "counter.json")
_counter_lock = threading.Lock()


def _next_job_id() -> int:
    """
    Atomically increment and return the next global job ID.
    Persisted in RESUMES_DIR/counter.json so IDs survive server restarts.
    """
    with _counter_lock:
        try:
            with open(_COUNTER_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            next_id = int(data.get("next", 1))
        except (FileNotFoundError, json.JSONDecodeError, ValueError):
            next_id = 1
        with open(_COUNTER_FILE, "w", encoding="utf-8") as f:
            json.dump({"next": next_id + 1}, f)
        return next_id


def _session_id(github_token: str, github_username: str, gemini_key: str) -> str:
    """
    Derive a stable, opaque session identifier for a user.

    Priority:
      1. GitHub personal access token  â€” ideal: tied to a specific GH account.
      2. github_username + gemini_key  â€” fallback when repo is public (no token).

    We store a SHA-256 hash (first 24 hex chars) so the raw credentials
    are never written to disk.
    """
    if github_token and github_token.strip():
        raw = github_token.strip()
    else:
        # Combine username + Gemini key so it's still unique per person
        raw = f"{github_username.strip()}:{gemini_key.strip()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:24]


def _fix_tex(tex: str) -> str:
    """
    Auto-correct known AI-generated LaTeX preamble bugs so Tectonic
    can compile without manual intervention.
    """
    # 1. LaTeX color names are case-sensitive. AI sometimes uppercases them.
    for color in ("sectioncolor", "headercolor", "linkcolor"):
        tex = re.sub(r'\\color\{' + color.upper() + r'\}',
                     r'\\color{' + color + '}', tex)
        tex = re.sub(r'\\textcolor\{' + color.upper() + r'\}',
                     r'\\textcolor{' + color + '}', tex)

    # 2. \uppercase inside \titleformat breaks xcolor colour parsing
    tex = re.sub(r'\\uppercase\b', '', tex)

    # 3. Ensure \sectionrule is defined when used
    SECTIONRULE_DEF = (
        r'\newcommand{\sectionrule}'
        r'{\vspace{-6pt}\textcolor{sectioncolor}{\rule{\linewidth}{0.4pt}}\vspace{2pt}}'
        '\n'
    )
    if r'\sectionrule' in tex and r'\newcommand{\sectionrule}' not in tex:
        tex = tex.replace(r'\begin{document}',
                          SECTIONRULE_DEF + r'\begin{document}')

    return tex

# â”€â”€ History TTL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
HISTORY_TTL_HOURS = 3  # folders older than this are deleted automatically


def _cleanup_expired_resumes():
    """
    Delete any resume folder whose metadata.json 'date' is older than HISTORY_TTL_HOURS.
    Safe to call from any thread. Returns the count of folders deleted.
    """
    if not os.path.exists(RESUMES_DIR):
        return 0
    cutoff = datetime.now(timezone.utc) - timedelta(hours=HISTORY_TTL_HOURS)
    deleted = 0
    for folder_name in os.listdir(RESUMES_DIR):
        folder_path = os.path.join(RESUMES_DIR, folder_name)
        if not os.path.isdir(folder_path):
            continue
        meta_path = os.path.join(folder_path, "metadata.json")
        try:
            if os.path.exists(meta_path):
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                date_str = meta.get("date", "")
                if date_str:
                    # Parse ISO string; handle both tz-aware and naive
                    dt = datetime.fromisoformat(date_str)
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    if dt < cutoff:
                        shutil.rmtree(folder_path, ignore_errors=True)
                        logger.info("TTL cleanup: deleted expired folder '%s'", folder_name)
                        deleted += 1
            else:
                # Orphan folder with no metadata â€” delete it too
                shutil.rmtree(folder_path, ignore_errors=True)
                deleted += 1
        except Exception as e:
            logger.warning("Cleanup error for '%s': %s", folder_name, e)
    return deleted


def _start_cleanup_scheduler(interval_minutes=15):
    """Run _cleanup_expired_resumes() in a background daemon thread every N minutes."""
    def _loop():
        while True:
            try:
                n = _cleanup_expired_resumes()
                if n:
                    logger.info("Scheduled cleanup removed %d expired folder(s)", n)
            except Exception as e:
                logger.warning("Scheduled cleanup failed: %s", e)
            threading.Event().wait(interval_minutes * 60)
    t = threading.Thread(target=_loop, daemon=True, name="cleanup-scheduler")
    t.start()
    logger.info("History cleanup scheduler started (interval=%dmin, TTL=%dh)",
                interval_minutes, HISTORY_TTL_HOURS)


_start_cleanup_scheduler()


def _get_key(header_name, env_fallback):
    """Get a key from request header, falling back to .env value."""
    val = request.headers.get(header_name, "").strip()
    return val if val else env_fallback


@app.route("/api/health", methods=["GET"])
@limiter.limit("30 per minute")
def health_check():
    github_ok = False
    gemini_ok = False

    token = _get_key("x-github-token", GITHUB_TOKEN)
    gemini_key = _get_key("x-gemini-key", GEMINI_API_KEY)
    username = _get_key("x-github-username", GITHUB_USERNAME)

    if username:
        try:
            from github import Github, Auth
            if token:
                g = Github(auth=Auth.Token(token), per_page=1, timeout=3)
            else:
                g = Github(per_page=1, timeout=3)
            user = g.get_user(username)
            _ = user.login
            github_ok = True
        except Exception as e:
            logger.error(f"GitHub health check failed: {e}")
            # If no token provided, still mark as OK if username exists
            if not token:
                try:
                    from github import Github
                    g = Github(per_page=1, timeout=3)
                    user = g.get_user(username)
                    _ = user.login
                    github_ok = True
                except Exception as e:
                    logger.debug("GitHub username check failed (no token): %s", e)
                    pass

    gemini_ok = bool(gemini_key and len(gemini_key) > 10)
    return jsonify({"status": "ok", "github": github_ok, "gemini": gemini_ok})


@app.route("/ping", methods=["GET"])
def ping():
    """Simple ping endpoint for Uptime Robot and Render."""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()}), 200


@app.route("/api/projects", methods=["GET"])
@limiter.limit("20 per minute")
def get_projects():
    token = _get_key("x-github-token", GITHUB_TOKEN)
    username = _get_key("x-github-username", GITHUB_USERNAME)

    if not username:
        return jsonify({"detail": "GitHub username is required. Set it in Settings."}), 400

    try:
        projects = fetch_projects(token, username)
        return jsonify(projects)
    except Exception as e:
        logger.exception("GitHub crawl failed")
        return jsonify({"detail": "Failed to fetch GitHub projects. Check your username and token."}), 500


ALLOWED_RESUME_EXTENSIONS = {".tex", ".pdf", ".docx"}

@app.route("/api/upload-resume", methods=["POST"])
@limiter.limit("20 per minute")
def upload_resume():
    if "file" not in request.files:
        return jsonify({"detail": "No file provided"}), 400
    file = request.files["file"]
    filename = file.filename or ""
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in ALLOWED_RESUME_EXTENSIONS:
        return jsonify({"detail": "Unsupported file type. Please upload a .tex, .pdf, or .docx file."}), 400

    file_bytes = file.read()

    # Reject files that are too large
    if len(file_bytes) > 5_000_000:
        return jsonify({"detail": "File is too large (max 5 MB)."}), 400

    # â”€â”€ Handle PDF / DOCX: convert to LaTeX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if ext in (".pdf", ".docx"):
        try:
            content = convert_to_latex(file_bytes, filename)
            logger.info("Converted %s to LaTeX (%d chars)", filename, len(content))
        except ValueError as e:
            return jsonify({"detail": f"Could not parse {ext.upper()} file: {e}"}), 400
        except Exception as e:
            logger.exception("Resume conversion failed")
            return jsonify({"detail": f"Failed to parse {ext.upper()} file: {str(e)}"}), 500
    else:
        # â”€â”€ Handle .tex: decode and sanitize â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        try:
            content = file_bytes.decode("utf-8", errors="replace")
        except Exception:
            return jsonify({"detail": "Could not read .tex file content."}), 400

        if len(content) > 500_000:
            return jsonify({"detail": "File is too large (max 500 KB text content)."}), 400

        try:
            content = sanitize_latex(content)
        except ValueError as e:
            return jsonify({"detail": f"File rejected: {e}"}), 400

    # Write to the base resume path (always stores as .tex internally)
    with open(BASE_RESUME_PATH, "w", encoding="utf-8") as f:
        f.write(content)

    return jsonify({"success": True, "message": "Resume uploaded", "type": ext.lstrip(".")})


@app.route("/api/analyze", methods=["POST"])
@limiter.limit("10 per minute")
def analyze():
    body = request.get_json()
    if not body:
        return jsonify({"detail": "Request body required"}), 400

    jd = body.get("jd", "")
    company = body.get("company", "")
    if not jd or not company:
        return jsonify({"detail": "Both 'jd' and 'company' are required"}), 400

    # Input length validation to prevent abuse
    if len(jd) > 50_000:
        return jsonify({"detail": "Job description is too long (max 50,000 characters)."}), 400
    if len(company) > 200:
        return jsonify({"detail": "Company name is too long (max 200 characters)."}), 400

    token = _get_key("x-github-token", GITHUB_TOKEN)
    gemini_key = _get_key("x-gemini-key", GEMINI_API_KEY)
    username = _get_key("x-github-username", GITHUB_USERNAME)

    if not gemini_key:
        return jsonify({"detail": "Gemini API key is required. Set it in Settings."}), 400
    if not username:
        return jsonify({"detail": "GitHub username is required. Set it in Settings."}), 400

    if not os.path.exists(BASE_RESUME_PATH):
        return jsonify({"detail": "No base resume found. Upload a .tex file first."}), 400

    with open(BASE_RESUME_PATH, "r", encoding="utf-8") as f:
        resume_tex = f.read()

    try:
        projects = fetch_projects(token, username)
    except Exception as e:
        logger.exception("GitHub crawl failed during analysis")
        return jsonify({"detail": "Failed to fetch GitHub projects. Check your username and token."}), 500

    try:
        result = analyze_and_edit(jd, projects, resume_tex, api_key=gemini_key)
    except ValueError as e:
        # ValueError = our own validation (sanitizer, JSON schema, missing key)
        logger.warning("Analysis validation error: %s", e)
        return jsonify({"detail": str(e)}), 400
    except Exception as e:
        logger.exception("Gemini analysis failed")
        error_type = type(e).__name__
        error_msg = str(e)
        logger.error(f"Full error details - Type: {error_type}, Message: {error_msg}")
        return jsonify({"detail": f"AI analysis failed ({error_type}). {error_msg}"}), 500

    job_id  = _next_job_id()
    sess_id = _session_id(token, username, gemini_key)
    slug = re.sub(r"[^a-z0-9]+", "_", company.lower()).strip("_") or "untitled"
    folder_name = f"{slug}_{job_id:05d}"     # e.g. oracle_00003 â€” unique per analysis
    output_dir = os.path.join(RESUMES_DIR, folder_name)
    os.makedirs(output_dir, exist_ok=True)

    # Auto-fix known AI preamble issues before writing to disk
    fixed_tex = _fix_tex(result["updated_tex"])

    tex_filename = f"resume_{folder_name}.tex"
    tex_path = os.path.join(output_dir, tex_filename)
    with open(tex_path, "w", encoding="utf-8") as f:
        f.write(fixed_tex)

    # â”€â”€ PDF: compile with Tectonic, fall back to fpdf2 only if binary missing â”€â”€
    pdf_filename = f"resume_{folder_name}.pdf"
    pdf_path_out = os.path.join(output_dir, pdf_filename)
    pdf_compiled = False

    try:
        compiled_path = compile_to_pdf(tex_path, output_dir)
        # Tectonic names the PDF after the tex file; rename to our convention
        if compiled_path != pdf_path_out and os.path.exists(compiled_path):
            os.replace(compiled_path, pdf_path_out)
        pdf_compiled = True
        logger.info("LaTeX compilation succeeded: %s", pdf_path_out)
    except RuntimeError as e:
        logger.error("Tectonic compile error: %s", e)

    if not pdf_compiled:
        logger.warning("Falling back to fpdf2 for PDF generation")
        try:
            generate_pdf(fixed_tex, pdf_path_out)
        except Exception as e:
            logger.error("fpdf2 fallback failed: %s", e)
            pdf_path_out = None

    pdf_url     = f"/api/download/{folder_name}/{pdf_filename}" if pdf_path_out else None
    preview_url = f"/api/preview/{folder_name}/{pdf_filename}"  if pdf_path_out else None

    # â”€â”€ DOCX export (always from the fixed tex) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    docx_filename = f"resume_{folder_name}.docx"
    docx_path_out = os.path.join(output_dir, docx_filename)
    docx_url = None
    try:
        generate_docx(fixed_tex, docx_path_out)
        docx_url = f"/api/download/{folder_name}/{docx_filename}"
    except Exception as e:
        logger.error("DOCX generation failed: %s", e)

    tex_url = f"/api/download/{folder_name}/{tex_filename}"

    metadata = {
        "company": company,
        "slug": folder_name,
        "company_slug": slug,
        "job_id": job_id,
        "session_id": sess_id,          # hashed identity â€” never the raw token
        "date": datetime.now(timezone.utc).isoformat(),
        "match_score": result["match_score"],
        "top_keywords": result["top_keywords"],
        "matched_projects": result["matched_projects"],
    }
    with open(os.path.join(output_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return jsonify({
        "match_score": result["match_score"], "top_keywords": result["top_keywords"],
        "missing_keywords": result["missing_keywords"], "matched_projects": result["matched_projects"],
        "pdf_url": pdf_url, "tex_url": tex_url, "docx_url": docx_url, "preview_url": preview_url,
    })


def _resolve_resume_file(folder, filename):
    """Resolve and validate a file path inside RESUMES_DIR. Returns (path, error_response)."""
    file_path = os.path.realpath(os.path.join(RESUMES_DIR, folder, filename))
    resumes_real = os.path.realpath(RESUMES_DIR)
    if not file_path.startswith(resumes_real + os.sep):
        return None, (jsonify({"detail": "Invalid path"}), 403)
    if not os.path.exists(file_path):
        return None, (jsonify({"detail": "File not found"}), 404)
    allowed = (".pdf", ".tex", ".docx")
    if not any(filename.endswith(ext) for ext in allowed):
        return None, (jsonify({"detail": "File type not allowed"}), 403)
    return file_path, None


@app.route("/api/download/<folder>/<filename>", methods=["GET"])
def download_file(folder, filename):
    """Download a PDF, TEX, or DOCX file as an attachment."""
    file_path, err = _resolve_resume_file(folder, filename)
    if err:
        return err
    if filename.endswith(".pdf"):
        mimetype = "application/pdf"
    elif filename.endswith(".docx"):
        mimetype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    else:
        mimetype = "text/plain"
    return send_file(file_path, mimetype=mimetype, as_attachment=True, download_name=filename)


@app.route("/api/preview/<folder>/<filename>", methods=["GET"])
def preview_file(folder, filename):
    """Serve a PDF inline (for iframe previews). No Content-Disposition: attachment header."""
    file_path, err = _resolve_resume_file(folder, filename)
    if err:
        return err
    if not filename.endswith(".pdf"):
        return jsonify({"detail": "Only PDF files can be previewed"}), 400
    return send_file(file_path, mimetype="application/pdf", as_attachment=False)


@app.route("/api/history", methods=["GET"])
def get_history():
    # Run cleanup on every history fetch so expired items never appear
    _cleanup_expired_resumes()

    # Derive the caller's session identity from their credentials
    token    = _get_key("x-github-token",    GITHUB_TOKEN)
    username = _get_key("x-github-username", GITHUB_USERNAME)
    gem_key  = _get_key("x-gemini-key",      GEMINI_API_KEY)
    caller_session = _session_id(token, username, gem_key)

    now = datetime.now(timezone.utc)
    history = []

    if not os.path.exists(RESUMES_DIR):
        return jsonify(history)

    for folder_name in os.listdir(RESUMES_DIR):
        # Skip the counter file and any non-directories
        folder_path = os.path.join(RESUMES_DIR, folder_name)
        if not os.path.isdir(folder_path):
            continue
        meta_path = os.path.join(folder_path, "metadata.json")
        if not os.path.exists(meta_path):
            continue
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)

            # â”€â”€ Privacy gate: only return jobs owned by this caller â”€â”€â”€â”€â”€â”€â”€
            if meta.get("session_id") != caller_session:
                continue

            # Parse the creation date
            date_str = meta.get("date", "")
            dt = datetime.fromisoformat(date_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)

            expires_at = dt + timedelta(hours=HISTORY_TTL_HOURS)
            seconds_remaining = max(0, int((expires_at - now).total_seconds()))

            slug = meta.get("slug", folder_name)
            meta["pdf_url"]           = f"/api/download/{slug}/resume_{slug}.pdf"
            meta["tex_url"]           = f"/api/download/{slug}/resume_{slug}.tex"
            meta["docx_url"]          = f"/api/download/{slug}/resume_{slug}.docx"
            meta["preview_url"]       = f"/api/preview/{slug}/resume_{slug}.pdf"
            meta["expires_at"]        = expires_at.isoformat()
            meta["seconds_remaining"] = seconds_remaining
            meta["ttl_hours"]         = HISTORY_TTL_HOURS
            # Never expose the raw session hash to the client
            meta.pop("session_id", None)

            history.append(meta)
        except (json.JSONDecodeError, KeyError, ValueError):
            continue

    # Sort by job_id descending (newest first); return at most 10
    history.sort(key=lambda x: (x.get("job_id", 0), x.get("date", "")), reverse=True)
    return jsonify(history[:10])


@app.route("/api/history/cleanup", methods=["POST"])
@limiter.limit("10 per minute")
def manual_cleanup():
    """Manually trigger TTL cleanup (useful for testing)."""
    deleted = _cleanup_expired_resumes()
    return jsonify({"deleted": deleted, "ttl_hours": HISTORY_TTL_HOURS})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    # In dev, bind to localhost only; in production, use gunicorn instead.
    host = os.environ.get("HOST", "127.0.0.1")
    debug = os.environ.get("FLASK_DEBUG", "false").lower() in ("true", "1", "yes")
    app.run(host=host, port=port, debug=debug)
