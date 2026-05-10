"""End-to-end test: compile oracle tex with tectonic + generate DOCX."""
import os
from compiler import compile_to_pdf
from exporter import generate_docx, _parse_document

TEX = "resumes/oracle/resume_oracle.tex"
OUT = "resumes/oracle"

tex = open(TEX, encoding="utf-8").read()

# 1. Check _parse_document covers all sections
sections = _parse_document(tex)
print(f"Document sections: {len(sections)}")
for heading, content in sections:
    label = f'[{heading}]' if heading else '[HEADER]'
    print(f"  {label}: {len(content)} chars — {repr(content[:50])}")

# 2. Compile with tectonic
os.makedirs(OUT, exist_ok=True)
pdf = compile_to_pdf(TEX, OUT)
print(f"\nPDF: {os.path.getsize(pdf):,} bytes => {pdf}")

# 3. Generate DOCX from full doc
generate_docx(tex, "test_full.docx")
print(f"DOCX: {os.path.getsize('test_full.docx'):,} bytes")
os.remove("test_full.docx")

print("\nALL PASSED")
