# PDF & DOCX Upload Support — Feasibility Analysis

> **TL;DR:** Adding PDF/DOCX support is technically possible but introduces significant quality, reliability, and security tradeoffs. Cost is not a concern. The current `.tex` workflow is recommended for production use.

---

## Current Architecture

Morphr's pipeline is built end-to-end around LaTeX (`.tex`) files:

```
User uploads .tex → stored as resume_base.tex → Gemini edits LaTeX → Tectonic compiles → PDF output
```

This is a **lossless, deterministic pipeline**. The input format is the same as the output format, so no conversion step is needed.

---

## What Would Change for PDF/DOCX Support

To accept PDF or DOCX files, a new conversion step must be inserted before the existing pipeline:

```
User uploads PDF/DOCX
        ↓
Parse file → extract plain text
        ↓
Gemini Call #1 (NEW): Convert plain text → LaTeX
        ↓
Store as resume_base.tex
        ↓
[existing pipeline continues as normal]
Gemini Call #2: Analyze JD vs GitHub projects
Gemini Call #3: Edit LaTeX resume
        ↓
Tectonic compiles → PDF output
```

### Backend changes required

| File | Change |
|---|---|
| `main.py` | Update `/api/upload-resume` to accept `.pdf` and `.docx`, route to parser |
| `jd_analyzer.py` | Add `convert_to_latex()` function (new Gemini call) |
| `requirements.txt` | Add `pdfplumber` or `pymupdf`, and `python-docx` |

### Frontend changes required

| File | Change |
|---|---|
| `UploadZone.jsx` | Update `accept` config, update UI text |
| `useResumeFlow.js` | No changes needed |

---

## Cost Analysis

### Current model: `gemini-2.5-flash`

Morphr already uses `gemini-2.5-flash`, which has a **free tier**:

| Limit | Value |
|---|---|
| Requests per minute | 10 RPM |
| Tokens per minute | 250,000 TPM |
| Requests per day | 500 RPD |

**Current cost: $0** — the entire pipeline runs on the free tier.

### Impact of adding PDF/DOCX conversion

The conversion adds one extra Gemini call per upload. This does **not** change the cost (still $0 on free tier), but it reduces daily capacity:

| Scenario | Gemini calls per session | Max full sessions/day (free tier) |
|---|---|---|
| Current `.tex` flow | 2 calls | ~250 sessions/day |
| With PDF/DOCX conversion | 3 calls | ~166 sessions/day |

### If you exceed the free tier

Gemini 2.5 Flash paid pricing (as of May 2026):

| | Price |
|---|---|
| Input tokens | $0.30 per 1M tokens |
| Output tokens | $2.50 per 1M tokens |

**Estimated cost per PDF/DOCX session** (conversion + analysis + edit, ~15,000 tokens total):

```
Input:  ~10,000 tokens × $0.30/1M = $0.003
Output: ~5,000 tokens  × $2.50/1M = $0.0125
Total per session ≈ $0.016 (~1.6 cents)
```

At 1,000 sessions/month → ~$16/month. At 10,000 sessions/month → ~$160/month.

**Cost is not a meaningful concern at any realistic scale for this project.**

---

## Downsides & Risks

### 1. Lossy PDF Text Extraction

PDF is a **presentation format**, not a data format. Text extraction is inherently imperfect.

- **Multi-column layouts** (very common in resumes) are extracted as interleaved text from both columns, producing garbled output.
- **Text boxes and overlapping elements** are extracted out of order.
- **Special characters, ligatures, and custom fonts** are frequently mangled or dropped entirely.
- **Scanned PDFs** (image-based) produce zero text — OCR would be required as an additional step.

Libraries like `pdfplumber` and `pymupdf` handle simple single-column PDFs reasonably well, but most professionally designed resumes use multi-column layouts.

### 2. DOCX Extraction is Better but Still Imperfect

`python-docx` handles standard DOCX files well, but:

- **Text boxes** (common in resume templates) are not extracted by `python-docx` — they are silently skipped.
- **Tables used for layout** (another common resume pattern) lose their spatial structure.
- **Custom fonts and styling** are stripped — only plain text survives.
- **Headers and footers** may be missed.

### 3. Gemini LaTeX Conversion Quality is Unpredictable

Converting extracted plain text back to LaTeX via Gemini is the weakest link in the chain:

- The model has no knowledge of the original visual layout — it must infer structure from plain text alone.
- The generated LaTeX may **not compile** on the first attempt, requiring retry logic.
- The output structure may be **inconsistent** across runs — same input can produce different LaTeX structures.
- The generated LaTeX may **overflow a single page**, breaking the strict single-page constraint Morphr enforces.
- Gemini may **hallucinate LaTeX packages or commands** that are not installed in the Tectonic environment.

### 4. Increased Token Consumption

A conversion prompt is token-heavy:

```
Resume plain text:     ~1,500 tokens
LaTeX template:        ~2,000 tokens
System instructions:   ~500 tokens
─────────────────────────────────────
Total input:           ~4,000 tokens per conversion call
LaTeX output:          ~3,000–5,000 tokens
```

This eats into the 250,000 TPM free tier limit faster, especially under concurrent load.

### 5. Debugging is Significantly Harder

When the final PDF looks wrong or fails to compile, the failure could originate from any of three places:

1. The PDF/DOCX parser (bad text extraction)
2. The Gemini conversion call (bad LaTeX generation)
3. The Tectonic compiler (LaTeX errors)

Tracing the root cause requires inspecting intermediate outputs at each stage, which adds complexity to both development and support.

### 6. Expanded Security Surface

Adding PDF and DOCX parsing introduces new attack vectors:

- **`pdfplumber` / `pymupdf`** have had CVEs related to malformed PDF parsing. A crafted PDF could trigger a crash or memory issue.
- **DOCX files are ZIP archives** containing XML. Malformed or malicious XML (e.g., XML entity expansion / "billion laughs" attack) can cause denial-of-service if not handled carefully.
- **Embedded macros** in DOCX files are not executed by `python-docx`, but the presence of macro content should be detected and rejected.
- The existing `.tex` sanitizer (`sanitize_latex`) would still apply to the Gemini-generated LaTeX, but the input validation layer becomes more complex.

### 7. User Experience Degradation

Users uploading a carefully designed PDF resume will likely receive a LaTeX output that looks **nothing like their original**. This creates a support burden and erodes trust in the product, especially compared to the current flow where the `.tex` input is preserved exactly.

---

## Recommendation

| Approach | Quality | Reliability | Complexity | Cost |
|---|---|---|---|---|
| Current `.tex` only | ✅ Lossless | ✅ Deterministic | ✅ Simple | ✅ Free |
| Add DOCX support | ⚠️ Partial loss | ⚠️ Mostly reliable | ⚠️ Moderate | ✅ Free |
| Add PDF support | ❌ High loss | ❌ Unreliable | ❌ Complex | ✅ Free |

**If you want to expand format support, DOCX is the better starting point** — it has structured XML that parsers handle more reliably than PDF. PDF support should only be considered after DOCX is stable and well-tested.

**The best long-term UX improvement** is not PDF/DOCX support, but rather providing users with a LaTeX template they can fill in — keeping the pipeline lossless while lowering the barrier to entry.

---

## Appendix: Libraries Considered

| Library | Format | Pros | Cons |
|---|---|---|---|
| `pdfplumber` | PDF | Good text + table extraction, pure Python | Struggles with multi-column, no OCR |
| `pymupdf` (fitz) | PDF | Fast, handles more edge cases | C extension, larger dependency, AGPL license |
| `python-docx` | DOCX | Official format support, well-maintained | Misses text boxes, no ODT support |
| `mammoth` | DOCX | Better semantic extraction | Less control over raw structure |

---

*Last updated: May 2026*  
*Applies to: Morphr v1.x, Gemini 2.5 Flash free tier*
