"""
Job description analyzer — uses Gemini 2.5 Flash for analysis and resume editing.
Accepts api_key as parameter for per-request key override.
"""

import json
import re
from google import genai
from google.genai import types


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

    analysis_response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=analysis_prompt,
        config=analysis_config,
    )
    analysis_text = analysis_response.text.strip()

    analysis_text = re.sub(r"^```(?:json)?\s*", "", analysis_text)
    analysis_text = re.sub(r"\s*```$", "", analysis_text)

    analysis = json.loads(analysis_text)

    # ── Call 2: LaTeX Edit ────────────────────────────────────────────
    editor_config = types.GenerateContentConfig(
        system_instruction=(
            "You are a LaTeX resume editor. "
            "Edit ONLY content between %% EDITABLE:X and %% END:X markers. "
            "Never modify LaTeX commands, preamble, or structure. "
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
10. Return the COMPLETE .tex file."""

    edit_response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=edit_prompt,
        config=editor_config,
    )
    updated_tex = edit_response.text.strip()

    updated_tex = re.sub(r"^```(?:latex|tex)?\s*\n?", "", updated_tex)
    updated_tex = re.sub(r"\n?\s*```$", "", updated_tex)

    return {
        "match_score": analysis.get("match_score", 0),
        "top_keywords": analysis.get("top_keywords", []),
        "missing_keywords": analysis.get("missing_keywords", []),
        "matched_projects": analysis.get("matched_projects", []),
        "updated_tex": updated_tex,
    }
