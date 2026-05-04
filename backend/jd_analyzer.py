"""
Job description analyzer — uses Gemini 2.5 Flash for analysis and resume editing.
Accepts api_key as parameter for per-request key override.

Security: All AI-generated LaTeX is sanitized to strip dangerous commands
before being written to disk or compiled.
"""

import json
import re
import time
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# ── LaTeX Sanitization ────────────────────────────────────────────────
# These patterns can execute shell commands or read/write arbitrary files
# when processed by pdflatex/tectonic, even with -no-shell-escape in some
# These patterns can execute shell commands or arbitrary code.
# Only includes patterns that are genuinely exploitable — common LaTeX
# primitives like \read, \write, \catcode, \csname are NOT included
# because they are used legitimately by standard packages/classes.
DANGEROUS_LATEX_PATTERNS = [
    r"\\write18\b",                # Shell command execution
    r"\\immediate\s*\\write18\b",  # Immediate shell execution
    r"\\input\s*\|",               # Pipe input (shell command)
    r"\\include\s*\|",             # Pipe include
    r"\\directlua\b",             # LuaTeX arbitrary code execution
    r"\\luadirect\b",             # LuaTeX arbitrary code execution
    r"\\usepackage\{shellesc\}",  # Shell escape package
]

_DANGEROUS_RE = re.compile("|".join(DANGEROUS_LATEX_PATTERNS), re.IGNORECASE)


def sanitize_latex(tex_content: str) -> str:
    """
    Strip dangerous LaTeX commands from content.
    Returns the sanitized string. Raises ValueError if the content
    looks heavily malicious (multiple dangerous commands).
    """
    matches = _DANGEROUS_RE.findall(tex_content)
    if len(matches) > 5:
        raise ValueError(
            f"LaTeX content contains {len(matches)} dangerous commands and was rejected."
        )
    # Remove individual dangerous patterns
    sanitized = _DANGEROUS_RE.sub("% [SANITIZED]", tex_content)
    return sanitized


def _validate_analysis(data: dict) -> dict:
    """
    Validate and normalize the JSON analysis response from Gemini.
    Returns a safe, well-structured dict even if the AI output is malformed.
    """
    # Ensure match_score is an integer 0-100
    score = data.get("match_score", 0)
    try:
        score = int(score)
    except (ValueError, TypeError):
        score = 0
    score = max(0, min(100, score))

    # Ensure lists are actually lists of strings/dicts
    top_keywords = data.get("top_keywords", [])
    if not isinstance(top_keywords, list):
        top_keywords = []
    top_keywords = [str(k) for k in top_keywords[:20]]  # Cap at 20

    missing_keywords = data.get("missing_keywords", [])
    if not isinstance(missing_keywords, list):
        missing_keywords = []
    missing_keywords = [str(k) for k in missing_keywords[:20]]

    matched_projects = data.get("matched_projects", [])
    if not isinstance(matched_projects, list):
        matched_projects = []
    # Validate each project entry
    safe_projects = []
    for proj in matched_projects[:6]:
        if isinstance(proj, dict):
            safe_projects.append({
                "name": str(proj.get("name", "unknown"))[:100],
                "score": max(0, min(10, int(proj.get("score", 0)) if str(proj.get("score", "0")).isdigit() else 0)),
                "reason": str(proj.get("reason", ""))[:500],
            })
    
    return {
        "match_score": score,
        "top_keywords": top_keywords,
        "missing_keywords": missing_keywords,
        "matched_projects": safe_projects,
    }


def analyze_and_edit(jd: str, projects: list, resume_tex: str, api_key: str = None) -> dict:
    """
    Two-call Gemini pipeline:
      1. Analyze JD against projects
      2. Edit LaTeX resume using analysis results
    """
    if not api_key:
        raise ValueError("Gemini API key is required. Configure it in Settings.")

    client = genai.Client(api_key=api_key)

    # ── Call 1: Analysis ──────────────────────────────────────────────
    analysis_config = types.GenerateContentConfig(
        system_instruction=(
            "You are a resume expert. Return only valid JSON. "
            "No markdown fences. No explanation."
        ),
        temperature=0.2,
    )

    projects_summary = json.dumps(projects, indent=2, default=str)

    analysis_prompt = f"""Analyze this job description against the candidate's GitHub projects.

--- JOB DESCRIPTION ---
{jd}

--- GITHUB PROJECTS ---
{projects_summary}

Return a JSON object with exactly this structure:
{{
  "match_score": <0-100 integer>,
  "top_keywords": ["8-10 keywords extracted from the JD"],
  "missing_keywords": ["skills mentioned in JD but not found in any project"],
  "matched_projects": [
    {{"name": "repo_name", "score": <1-10 integer>, "reason": "why it matches the JD"}}
  ]
}}

Sort matched_projects by score descending. Include at most 6 projects."""

    def _call_gemini(prompt, config, retries=3):
        """Call Gemini with automatic retry on transient ServerErrors."""
        for attempt in range(retries):
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=config,
                )
                return response.text.strip()
            except Exception as e:
                if "ServerError" in type(e).__name__ or "500" in str(e):
                    if attempt < retries - 1:
                        wait = 2 ** (attempt + 1)  # 2s, 4s, 8s
                        logger.warning("Gemini ServerError (attempt %d/%d), retrying in %ds...", attempt + 1, retries, wait)
                        time.sleep(wait)
                        continue
                raise  # Re-raise if not a ServerError or all retries exhausted

    analysis_text = _call_gemini(analysis_prompt, analysis_config)

    analysis_text = re.sub(r"^```(?:json)?\s*", "", analysis_text)
    analysis_text = re.sub(r"\s*```$", "", analysis_text)

    # Security: validate JSON parsing with proper error handling (#15)
    try:
        raw_analysis = json.loads(analysis_text)
    except json.JSONDecodeError as e:
        logger.error("Gemini returned invalid JSON for analysis: %s", str(e)[:200])
        raise ValueError("AI returned malformed analysis. Please try again.")

    if not isinstance(raw_analysis, dict):
        raise ValueError("AI returned unexpected response format. Please try again.")

    # Validate and normalize the analysis data
    analysis = _validate_analysis(raw_analysis)

    # ── Call 2: LaTeX Edit ────────────────────────────────────────────
    editor_config = types.GenerateContentConfig(
        system_instruction=(
            "You are a LaTeX resume editor. "
            "Edit ONLY content between %% EDITABLE:X and %% END:X markers. "
            "Never modify LaTeX commands, preamble, or structure. "
            "NEVER use \\write18, \\input|, \\openin, \\openout, or any shell-escape commands. "
            "Return the complete .tex file only. No markdown. No explanation."
        ),
        temperature=0.2,
    )

    edit_prompt = f"""Edit the resume below using the analysis and project data provided.

--- ANALYSIS RESULTS ---
{json.dumps(analysis, indent=2)}

--- GITHUB PROJECT DATA ---
{projects_summary}

--- CURRENT RESUME (.tex) ---
{resume_tex}

Rules:
1. Rewrite the summary section to open with the top 3 JD keywords naturally.
2. Replace project bullets with the top 3 matched GitHub repos — use real data from the project list.
3. Weave missing keywords into the skills section naturally.
4. NEVER fabricate metrics, achievements, or technologies not present in the data.
5. ONLY use facts from the provided GitHub project data.
6. Keep all LaTeX formatting and commands intact.
7. Only modify content between %% EDITABLE:X and %% END:X markers.
8. Keep the final resume to a strict single A4 page.
9. If the content would overflow, shorten wording, remove lower-priority details, and prefer concise one-line bullets over adding more text.
10. Return the COMPLETE .tex file.
11. NEVER include \\write18, \\input|, \\openin, \\openout or any file/shell commands."""

    updated_tex = _call_gemini(edit_prompt, editor_config)

    updated_tex = re.sub(r"^```(?:latex|tex)?\s*\n?", "", updated_tex)
    updated_tex = re.sub(r"\n?\s*```$", "", updated_tex)

    # Security: sanitize AI-generated LaTeX to strip any dangerous commands (#3, #4)
    updated_tex = sanitize_latex(updated_tex)

    return {
        "match_score": analysis["match_score"],
        "top_keywords": analysis["top_keywords"],
        "missing_keywords": analysis["missing_keywords"],
        "matched_projects": analysis["matched_projects"],
        "updated_tex": updated_tex,
    }
