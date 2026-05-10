"""
LaTeX compiler — uses Tectonic (bundled or on PATH).

Security: shell-escape is NOT passed; Tectonic disables it by default.
The LaTeX content is pre-sanitized by jd_analyzer.sanitize_latex before
this module is called.
"""

import os
import logging
import subprocess

logger = logging.getLogger(__name__)


def compile_to_pdf(tex_path: str, output_dir: str) -> str:
    """
    Compile a .tex file to PDF using Tectonic.

    Returns the path to the generated PDF.
    Raises RuntimeError with the compiler error message on failure.
    """
    # Security: validate that paths stay within the expected resumes directory
    base_dir = os.path.realpath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "resumes")
    )
    real_tex = os.path.realpath(tex_path)
    real_out = os.path.realpath(output_dir)
    if not real_tex.startswith(base_dir + os.sep) or not real_out.startswith(base_dir + os.sep):
        raise RuntimeError("Compilation rejected: paths outside allowed directory.")

    os.makedirs(output_dir, exist_ok=True)

    tex_basename = os.path.splitext(os.path.basename(tex_path))[0]
    pdf_path = os.path.join(output_dir, f"{tex_basename}.pdf")

    # ── Locate Tectonic ───────────────────────────────────────────────────────
    _backend_dir = os.path.dirname(os.path.abspath(__file__))
    _candidates = [
        os.path.join(_backend_dir, "tectonic"),      # Linux portable install
        os.path.join(_backend_dir, "tectonic.exe"),  # Windows portable install
        "tectonic",                                   # system PATH
    ]
    tectonic_cmd = next((c for c in _candidates if os.path.isfile(c)), "tectonic")

    # ── Run Tectonic ──────────────────────────────────────────────────────────
    try:
        result = subprocess.run(
            [tectonic_cmd, "--print", tex_path, "--outdir", output_dir],
            capture_output=True,
            text=True,
            timeout=120,
        )
    except FileNotFoundError:
        raise RuntimeError(
            "Tectonic not found. Install it from https://tectonic-typesetting.github.io/"
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError("Tectonic timed out after 120 seconds.")

    if result.returncode == 0 and os.path.exists(pdf_path):
        logger.info("Tectonic compiled %s (%d bytes)", pdf_path, os.path.getsize(pdf_path))
        return pdf_path

    # ── Compilation failed — surface the error ────────────────────────────────
    stderr = (result.stderr or "").strip()
    stdout = (result.stdout or "").strip()
    error_output = stderr or stdout or "No output from tectonic."
    logger.error("Tectonic failed (exit %d):\n%s", result.returncode, error_output[-3000:])
    raise RuntimeError(f"LaTeX compilation failed:\n{error_output[-1500:]}")
