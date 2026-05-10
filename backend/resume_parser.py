"""
resume_parser.py — Extract text from PDF and DOCX resumes.

When a user uploads a PDF or DOCX instead of a .tex file, we:
  1. Extract all readable text
  2. Wrap it in a minimal, editable LaTeX template
  3. Pass that .tex to the existing AI editing pipeline

This preserves the full pipeline without breaking LaTeX compilation.
"""

import io
import re
import logging

logger = logging.getLogger(__name__)


# Use @@TOKEN@@ placeholders — replaced via str.replace() to avoid
# conflicts between Python's .format() brace syntax and LaTeX's {} braces.
_LATEX_WRAPPER = r"""\documentclass[10pt,a4paper]{article}
\usepackage[margin=0.75in]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{enumitem}
\usepackage{hyperref}
\hypersetup{colorlinks=true, urlcolor=blue, linkcolor=black}
\pagestyle{empty}
\setlength{\parskip}{4pt}
\setlength{\parindent}{0pt}

\begin{document}

%% EDITABLE:SUMMARY
@@SUMMARY@@
%% END:SUMMARY

%% EDITABLE:SKILLS
@@SKILLS@@
%% END:SKILLS

%% EDITABLE:EXPERIENCE
@@EXPERIENCE@@
%% END:EXPERIENCE

%% EDITABLE:PROJECTS
@@PROJECTS@@
%% END:PROJECTS

\end{document}
"""


def _clean_text(text: str) -> str:
    """Normalize whitespace and remove non-printable characters."""
    # Replace Windows line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Collapse runs of blank lines to at most 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Strip leading/trailing whitespace per line
    lines = [line.rstrip() for line in text.split("\n")]
    return "\n".join(lines).strip()


def _escape_latex(text: str) -> str:
    """Escape special LaTeX characters in plain text."""
    replacements = [
        ("\\", r"\textbackslash{}"),
        ("&",  r"\&"),
        ("%",  r"\%"),
        ("$",  r"\$"),
        ("#",  r"\#"),
        ("_",  r"\_"),
        ("{",  r"\{"),
        ("}",  r"\}"),
        ("~",  r"\textasciitilde{}"),
        ("^",  r"\textasciicircum{}"),
    ]
    for char, escaped in replacements:
        text = text.replace(char, escaped)
    return text


def _split_sections(text: str) -> dict:
    """
    Heuristically split extracted resume text into sections.
    Returns a dict with keys: summary, skills, experience, projects.
    Falls back to putting all text in summary if no sections detected.
    """
    section_keywords = {
        "summary":    ["summary", "objective", "profile", "about"],
        "skills":     ["skill", "technical", "technologies", "tools", "competencies", "languages"],
        "experience": ["experience", "employment", "work history", "career", "positions"],
        "projects":   ["project", "portfolio", "open source", "github", "personal work"],
    }

    # Find section boundaries
    lines = text.split("\n")
    section_map = {}  # line_index -> section_name

    for i, line in enumerate(lines):
        stripped = line.strip().lower()
        if not stripped or len(stripped) > 60:
            continue
        for section, keywords in section_keywords.items():
            if any(kw in stripped for kw in keywords):
                section_map[i] = section
                break

    if not section_map:
        # No sections detected — put everything in summary
        escaped = _escape_latex(text)
        return {
            "summary": escaped,
            "skills": r"\textit{(Skills section — to be filled by AI)}",
            "experience": r"\textit{(Experience section — to be filled by AI)}",
            "projects": r"\textit{(Projects section — will be rewritten with GitHub data)}",
        }

    # Sort section start lines
    boundaries = sorted(section_map.keys())
    sections = {"summary": [], "skills": [], "experience": [], "projects": []}

    for idx, start in enumerate(boundaries):
        end = boundaries[idx + 1] if idx + 1 < len(boundaries) else len(lines)
        section_name = section_map[start]
        content_lines = lines[start + 1:end]  # skip header line itself
        content = "\n".join(content_lines).strip()
        if section_name in sections:
            sections[section_name].append(content)

    # Also collect anything before the first section as summary
    if boundaries[0] > 0:
        preamble = "\n".join(lines[:boundaries[0]]).strip()
        if preamble:
            sections["summary"].insert(0, preamble)

    return {k: _escape_latex("\n\n".join(v)) if v else r"\textit{(To be filled)}"
            for k, v in sections.items()}


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file using PyPDF2."""
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        raise ImportError("PyPDF2 is required for PDF parsing. Run: pip install pypdf2")

    reader = PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        try:
            pages.append(page.extract_text() or "")
        except Exception as e:
            logger.warning("Failed to extract page: %s", e)
            pages.append("")

    full_text = "\n\n".join(pages)
    if not full_text.strip():
        raise ValueError("Could not extract any text from the PDF. The file may be image-based or encrypted.")

    return _clean_text(full_text)


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file using python-docx."""
    try:
        from docx import Document
    except ImportError:
        raise ImportError("python-docx is required for DOCX parsing. Run: pip install python-docx")

    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    full_text = "\n".join(paragraphs)

    if not full_text.strip():
        raise ValueError("Could not extract any text from the DOCX file. The file may be empty or corrupted.")

    return _clean_text(full_text)


def convert_to_latex(file_bytes: bytes, filename: str) -> str:
    """
    Convert a PDF or DOCX resume to a LaTeX string suitable for the AI editing pipeline.

    Returns a complete .tex document as a string.
    Raises ValueError with a user-friendly message on failure.
    """
    ext = filename.lower().rsplit(".", 1)[-1]

    if ext == "pdf":
        logger.info("Parsing PDF resume: %s", filename)
        text = extract_text_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        logger.info("Parsing DOCX resume: %s", filename)
        text = extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: .{ext}")

    logger.info("Extracted %d characters from %s", len(text), filename)

    sections = _split_sections(text)

    tex = (
        _LATEX_WRAPPER
        .replace("@@SUMMARY@@", sections["summary"])
        .replace("@@SKILLS@@", sections["skills"])
        .replace("@@EXPERIENCE@@", sections["experience"])
        .replace("@@PROJECTS@@", sections["projects"])
    )

    logger.info("Generated LaTeX template (%d chars) from %s", len(tex), filename)
    return tex
