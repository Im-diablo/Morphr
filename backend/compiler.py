"""
LaTeX compiler — uses Tectonic with pdflatex fallback.
Handles Windows paths with spaces safely.
"""

import os
import subprocess


def compile_to_pdf(tex_path: str, output_dir: str) -> str:
    """
    Compile a .tex file to PDF.

    Tries tectonic first, falls back to pdflatex.
    All paths are quoted to handle spaces (e.g., 'd:\\Resume Automation\\...').

    Returns the path to the generated PDF.
    Raises RuntimeError on compilation failure.
    """
    os.makedirs(output_dir, exist_ok=True)

    tex_basename = os.path.splitext(os.path.basename(tex_path))[0]
    pdf_path = os.path.join(output_dir, f"{tex_basename}.pdf")

    # ── Try Tectonic first ────────────────────────────────────────────
    try:
        result = subprocess.run(
            ["tectonic", tex_path, "--outdir", output_dir],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode == 0 and os.path.exists(pdf_path):
            return pdf_path
    except FileNotFoundError:
        pass  # tectonic not installed, try pdflatex

    # ── Fallback: pdflatex (run twice for references) ─────────────────
    try:
        for _ in range(2):
            result = subprocess.run(
                [
                    "pdflatex",
                    "-interaction=nonstopmode",
                    f"-output-directory={output_dir}",
                    tex_path,
                ],
                capture_output=True,
                text=True,
                timeout=120,
            )

        if result.returncode == 0 and os.path.exists(pdf_path):
            return pdf_path

        raise RuntimeError(
            f"pdflatex compilation failed.\n"
            f"STDOUT:\n{result.stdout[-2000:]}\n"
            f"STDERR:\n{result.stderr[-2000:]}"
        )
    except FileNotFoundError:
        raise RuntimeError(
            "No LaTeX compiler found. Install tectonic (recommended) or pdflatex.\n"
            "  tectonic: https://tectonic-typesetting.github.io/\n"
            "  pdflatex: install TeX Live or MiKTeX"
        )
