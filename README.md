Morphr

AI-powered resume tailoring backed by real GitHub data.

---

## 1. Title

**Morphr — AI-Powered Resume Tailoring Backed by Real GitHub Data**

## 2. Intro (one paragraph)

Morphr converts your base LaTeX resume into a tailored, ATS-friendly PDF by extracting role requirements from a job description (via Google's Gemini) and grounding each generated bullet with verifiable evidence from your public GitHub repositories.

## 3. Table of Contents

- [Features](#features)
- [Tech Stack & Prerequisites](#tech-stack--prerequisites)
- [Architecture Diagram](#architecture-diagram)
- [Project Structure](#project-structure)
- [User Instructions](#user-instructions)
- [Developer Instructions](#developer-instructions)
- [Contributor Expectations](#contributor-expectations)
- [Known Issues](#known-issues)
- [License & Credits](#license--credits)

## 4. Features

| Feature               | Purpose                                    | Notes                                            |
| --------------------- | ------------------------------------------ | ------------------------------------------------ |
| GitHub grounding      | Map JD skills to your repos                | Produces verifiable bullets with repo references |
| Gemini-driven rewrite | Extracts and rewrites role-focused bullets | Uses user key locally by default                 |
| LaTeX compilation     | Generates single-page A4 PDF               | Uses `pdflatex` / `tectonic`                     |
| Privacy-first         | Keys stored in browser `localStorage`      | Backend doesn't persist user secrets             |

## 5. Tech Stack & Prerequisites

| Layer       | Stack                                                   |
| ----------- | ------------------------------------------------------- |
| Frontend    | React, Vite, Tailwind, Framer Motion, React-Three-Fiber |
| Backend     | Python 3.9+, Flask, PyGithub, Google Generative AI SDK  |
| Compilation | `pdflatex` or `tectonic` (system-level)                 |

Prerequisites:

- Node.js 18+
- Python 3.9+
- LaTeX compiler (`pdflatex` or `tectonic`)

## 6. Architecture Diagram

Detailed flow (Mermaid):

```mermaid
flowchart TD
  subgraph FE[Frontend]
    UI[User Interface]
    UI -->|Upload `.tex` + JD| Uploader[Uploader]
    Uploader -->|POST /api/analyze| API[Backend API]
  end

  subgraph BE[Backend]
    API --> C[GitHub Crawler]
    API --> G[Gemini Adapter]
    API --> L[LaTeX Compiler]
    C -->|repo metadata, files| G
    G -->|rewritten bullets + mapping| API
    API -->|.tex| L
    L -->|PDF + logs| API
  end

  API -->|response| UI

  %% External services
  G -->|calls| Gemini[Google Gemini (user key)]
  C -->|calls| GitHub[GitHub API (user token)]

  style Gemini fill:#f7f7ff,stroke:#6b7280
  style GitHub fill:#fff7ed,stroke:#92400e
  style FE fill:#eef2ff,stroke:#4f46e5
  style BE fill:#fff1f2,stroke:#db2777
```

Diagram details:

- The frontend collects the JD and `.tex` and posts to `/api/analyze`.
- The backend crawls GitHub (repo list, README, code snippets), prompts Gemini to rewrite bullets, then compiles the modified `.tex` into a PDF.
- Keys: the frontend stores Gemini/GitHub credentials in `localStorage` by default.

## 7. Project Structure

Minimal tree:

```
backend/
  main.py
  github_crawler.py
  jd_analyzer.py
  compiler.py
  resumes/ (outputs: .tex, .pdf, logs)
frontend/
  index.html
  src/ (React app + components)
README.md
```

## 8. User Instructions

1. Backend (Windows PowerShell):

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

2. Frontend:

```powershell
cd frontend
npm install
npm run dev
```

3. In the web app: open Settings → paste Gemini API key and GitHub username/token → upload your base `.tex` → paste JD → Generate → download `.tex` and PDF.

## 9. Developer Instructions

- Backend entrypoint: `backend/main.py`.
- Core modules: `backend/github_crawler.py`, `backend/jd_analyzer.py`, `backend/compiler.py`.
- For local testing, place `GEMINI_API_KEY` and `GITHUB_TOKEN` in a local `.env` (optional).
- Add unit tests for parsing and prompt-generation logic.

## 10. Contributor Expectations

- Small, focused PRs with clear descriptions.
- Include tests for new backend logic where applicable.
- Keep UI changes visually consistent and responsive.
- Respect privacy design: don't persist user API keys.

## 11. Known Issues

- Large GitHub accounts increase analysis time.
- Complex LaTeX templates may require manual tweaks; see `backend/resumes/` logs.
- Rate limiting possible without a fine-grained GitHub token.

## 12. License & Credits

Made with care by BlaZe.

---

If you'd like, I can render the Mermaid diagram to a PNG and add it to the repo.
