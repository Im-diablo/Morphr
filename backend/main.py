"""
Flask application — Morphr API server.
All API keys are optional in .env. Users provide them via request headers.
"""

import os
import json
import re
from datetime import datetime

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

from config import GEMINI_API_KEY, GITHUB_TOKEN, GITHUB_USERNAME
from github_crawler import fetch_projects
from jd_analyzer import analyze_and_edit
from compiler import compile_to_pdf

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "expose_headers": ["Content-Disposition"]}})

RESUMES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "resumes")
BASE_RESUME_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "resume_base.tex")
os.makedirs(RESUMES_DIR, exist_ok=True)


def _get_key(header_name, env_fallback):
    """Get a key from request header, falling back to .env value."""
    val = request.headers.get(header_name, "").strip()
    return val if val else env_fallback


@app.route("/api/health", methods=["GET"])
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
            # If no token provided, still mark as OK if username exists
            if not token:
                try:
                    from github import Github
                    g = Github(per_page=1, timeout=3)
                    user = g.get_user(username)
                    _ = user.login
                    github_ok = True
                except:
                    pass

    gemini_ok = bool(gemini_key and len(gemini_key) > 10)
    return jsonify({"status": "ok", "github": github_ok, "gemini": gemini_ok})


@app.route("/ping", methods=["GET"])
def ping():
    """Simple ping endpoint for Uptime Robot and Render."""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()}), 200


@app.route("/api/projects", methods=["GET"])
def get_projects():
    token = _get_key("x-github-token", GITHUB_TOKEN)
    username = _get_key("x-github-username", GITHUB_USERNAME)

    if not username:
        return jsonify({"detail": "GitHub username is required. Set it in Settings."}), 400

    try:
        projects = fetch_projects(token, username)
        return jsonify(projects)
    except Exception as e:
        return jsonify({"detail": str(e)}), 500


@app.route("/api/upload-resume", methods=["POST"])
def upload_resume():
    if "file" not in request.files:
        return jsonify({"detail": "No file provided"}), 400
    file = request.files["file"]
    if not file.filename.endswith(".tex"):
        return jsonify({"detail": "Only .tex files are accepted"}), 400
    file.save(BASE_RESUME_PATH)
    return jsonify({"success": True, "message": "Resume uploaded"})


@app.route("/api/analyze", methods=["POST"])
def analyze():
    body = request.get_json()
    if not body:
        return jsonify({"detail": "Request body required"}), 400

    jd = body.get("jd", "")
    company = body.get("company", "")
    if not jd or not company:
        return jsonify({"detail": "Both 'jd' and 'company' are required"}), 400

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
        return jsonify({"detail": f"GitHub crawl failed: {e}"}), 500

    try:
        result = analyze_and_edit(jd, projects, resume_tex, api_key=gemini_key)
    except Exception as e:
        return jsonify({"detail": f"Gemini analysis failed: {e}"}), 500

    slug = re.sub(r"[^a-z0-9]+", "_", company.lower()).strip("_") or "untitled"
    output_dir = os.path.join(RESUMES_DIR, slug)
    os.makedirs(output_dir, exist_ok=True)

    tex_filename = f"resume_{slug}.tex"
    tex_path = os.path.join(output_dir, tex_filename)
    with open(tex_path, "w", encoding="utf-8") as f:
        f.write(result["updated_tex"])

    pdf_url = None
    try:
        pdf_path = compile_to_pdf(tex_path, output_dir)
        pdf_url = f"/api/download/{slug}/{os.path.basename(pdf_path)}"
    except RuntimeError:
        pdf_url = None

    tex_url = f"/api/download/{slug}/{tex_filename}"

    metadata = {
        "company": company, "slug": slug, "date": datetime.now().isoformat(),
        "match_score": result["match_score"], "top_keywords": result["top_keywords"],
        "matched_projects": result["matched_projects"],
    }
    with open(os.path.join(output_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return jsonify({
        "match_score": result["match_score"], "top_keywords": result["top_keywords"],
        "missing_keywords": result["missing_keywords"], "matched_projects": result["matched_projects"],
        "pdf_url": pdf_url, "tex_url": tex_url,
    })


@app.route("/api/download/<folder>/<filename>", methods=["GET"])
def download_file(folder, filename):
    file_path = os.path.join(RESUMES_DIR, folder, filename)
    if not os.path.exists(file_path):
        return jsonify({"detail": "File not found"}), 404
    mimetype = "application/pdf" if filename.endswith(".pdf") else "text/plain"
    return send_file(file_path, mimetype=mimetype, as_attachment=True, download_name=filename)


@app.route("/api/history", methods=["GET"])
def get_history():
    history = []
    if not os.path.exists(RESUMES_DIR):
        return jsonify(history)
    for folder_name in os.listdir(RESUMES_DIR):
        meta_path = os.path.join(RESUMES_DIR, folder_name, "metadata.json")
        if os.path.exists(meta_path):
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                meta["pdf_url"] = f"/api/download/{folder_name}/resume_{folder_name}.pdf"
                meta["tex_url"] = f"/api/download/{folder_name}/resume_{folder_name}.tex"
                history.append(meta)
            except (json.JSONDecodeError, KeyError):
                continue
    history.sort(key=lambda x: x.get("date", ""), reverse=True)
    return jsonify(history)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
