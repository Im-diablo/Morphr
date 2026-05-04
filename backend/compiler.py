"""
LaTeX compiler — uses Tectonic with pdflatex fallback.
Handles Windows paths with spaces safely.

Security: Both compilers are invoked with shell-escape DISABLED
to prevent LaTeX command injection (e.g. \\write18{...}).
"""

import os
import subprocess


def compile_to_pdf(tex_path: str, output_dir: str) -> str:
    """
    Compile a .tex file to PDF.

    Tries tectonic first, falls back to pdflatex.
    All paths are quoted to handle spaces (e.g., 'd:\\Resume Automation\\...').

    Security: shell-escape is explicitly disabled in both compilers to prevent
    arbitrary command execution via \\write18, \\input{|cmd}, etc.

    Returns the path to the generated PDF.
    Raises RuntimeError on compilation failure.
    """
    # Security: validate that paths stay within the expected resumes directory
    base_dir = os.path.realpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "resumes"))
    real_tex = os.path.realpath(tex_path)
    real_out = os.path.realpath(output_dir)
    if not real_tex.startswith(base_dir + os.sep) or not real_out.startswith(base_dir + os.sep):
        raise RuntimeError("Compilation rejected: paths outside allowed directory.")

    os.makedirs(output_dir, exist_ok=True)

    tex_basename = os.path.splitext(os.path.basename(tex_path))[0]
    pdf_path = os.path.join(output_dir, f"{tex_basename}.pdf")

    # ── Try Tectonic first ────────────────────────────────────────────
    # Tectonic disables shell-escape by default, but --untrusted makes
    # it even more restrictive (no network access, no shell).
    try:
        result = subprocess.run(
            ["tectonic", "--untrusted", tex_path, "--outdir", output_dir],
            capture_output=True,
            text=True,
            timeout=90,
        )
        if result.returncode == 0 and os.path.exists(pdf_path):
            return pdf_path
    except FileNotFoundError:
        pass  # tectonic not installed, try pdflatex

    # ── Fallback: pdflatex (run twice for references) ─────────────────
    # -no-shell-escape: CRITICAL — prevents \write18{} command execution
    try:
        for _ in range(2):
            result = subprocess.run(
                [
                    "pdflatex",
                    "-no-shell-escape",
                    "-interaction=nonstopmode",
                    f"-output-directory={output_dir}",
                    tex_path,
                ],
                capture_output=True,
                text=True,
                timeout=90,
            )

        if result.returncode == 0 and os.path.exists(pdf_path):
            return pdf_path

        raise RuntimeError(
            "pdflatex compilation failed. Check the LaTeX source for errors."
        )
    except FileNotFoundError:
        raise RuntimeError(
            "No LaTeX compiler found. Install tectonic (recommended) or pdflatex.\n"
            "  tectonic: https://tectonic-typesetting.github.io/\n"
            "  pdflatex: install TeX Live or MiKTeX"
        )
