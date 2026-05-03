<div align="center">

# Morphr

### AI-powered resume tailoring backed by real GitHub data

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0+-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🛠️ Tech Stack](#️-tech-stack)
- [🏗️ Architecture](#️-architecture)
- [📁 Project Structure](#-project-structure)
- [📖 User Guide](#-user-guide)
- [👨‍💻 Developer Guide](#-developer-guide)
- [🤝 Contributing](#-contributing)
- [⚠️ Known Issues](#️-known-issues)

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔗 GitHub Grounding
Maps job requirements to your repositories by analyzing repos, READMEs, and code to generate verifiable bullets

</td>
<td width="50%">

### 🤖 AI-Powered Rewrite
Tailors resume bullets to job descriptions using Google Gemini to extract skills and rewrite content

</td>
</tr>
<tr>
<td width="50%">

### 📄 LaTeX Compilation
Produces ATS-friendly PDF resumes by compiling modified `.tex` files via `pdflatex` or `tectonic`

</td>
<td width="50%">

### 🔒 Privacy-First
No credential storage on backend - API keys stored in browser `localStorage` only

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 18+  |  Python 3.9+  |  LaTeX (pdflatex/tectonic)
```

### Installation

**Backend**
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
> 🌐 Backend runs on `http://localhost:8000`

**Frontend**
```powershell
cd frontend
npm install
npm run dev
```
> 🌐 Frontend runs on `http://localhost:5173`

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technologies |
|:-----:|:------------|
| **Frontend** | ![React](https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/-Vite-646CFF?style=flat-square&logo=vite&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/-Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) ![Framer](https://img.shields.io/badge/-Framer-0055FF?style=flat-square&logo=framer&logoColor=white) |
| **Backend** | ![Python](https://img.shields.io/badge/-Python-3776AB?style=flat-square&logo=python&logoColor=white) ![Flask](https://img.shields.io/badge/-Flask-000000?style=flat-square&logo=flask&logoColor=white) ![PyGithub](https://img.shields.io/badge/-PyGithub-181717?style=flat-square&logo=github&logoColor=white) |
| **AI/ML** | ![Google Gemini](https://img.shields.io/badge/-Gemini-8E75B2?style=flat-square&logo=google&logoColor=white) |
| **Compiler** | ![LaTeX](https://img.shields.io/badge/-LaTeX-008080?style=flat-square&logo=latex&logoColor=white) |

</div>

### Required API Keys

- 🔑 **Gemini API Key** - [Get it here](https://makersuite.google.com/app/apikey)
- 🔑 **GitHub Personal Access Token** - [Generate here](https://github.com/settings/tokens)

---

## 🏗️ Architecture

```mermaid
flowchart TB
    subgraph Client["🖥️ Frontend (React + Vite)"]
        UI[User Interface]
        Settings[⚙️ Settings Panel]
        Upload[📤 File Uploader]
        Preview[👁️ PDF Preview]
    end

    subgraph API["⚡ Backend API (Flask)"]
        Endpoint["/api/analyze"]
        Validator[✅ Input Validator]
        Orchestrator[🎯 Processing Orchestrator]
    end

    subgraph Processing["🔧 Core Processing Modules"]
        Crawler[🕷️ GitHub Crawler]
        Analyzer[🧠 JD Analyzer]
        Compiler[📝 LaTeX Compiler]
    end

    subgraph External["🌐 External Services"]
        GH[GitHub API]
        Gemini[Google Gemini API]
    end

    subgraph Storage["💾 File System"]
        Output[resumes/]
    end

    UI -->|1. Configure| Settings
    Settings -->|Store keys| LocalStorage[(localStorage)]
    UI -->|2. Upload .tex + JD| Upload
    Upload -->|3. POST request| Endpoint
    
    Endpoint --> Validator
    Validator --> Orchestrator
    
    Orchestrator -->|4. Fetch repos| Crawler
    Crawler -->|API call| GH
    GH -->|Repo data| Crawler
    
    Crawler -->|5. Repo metadata| Analyzer
    Orchestrator -->|Job description| Analyzer
    Analyzer -->|6. Generate bullets| Gemini
    Gemini -->|Tailored content| Analyzer
    
    Analyzer -->|7. Modified .tex| Compiler
    Compiler -->|8. Compile| Output
    Output -->|9. PDF + logs| Compiler
    
    Compiler -->|10. Response| Endpoint
    Endpoint -->|11. Download links| Preview
    Preview -->|Display| UI

    style Client fill:#e0f2fe,stroke:#0369a1,stroke-width:2px
    style API fill:#fef3c7,stroke:#d97706,stroke-width:2px
    style Processing fill:#ddd6fe,stroke:#7c3aed,stroke-width:2px
    style External fill:#fee2e2,stroke:#dc2626,stroke-width:2px
    style Storage fill:#d1fae5,stroke:#059669,stroke-width:2px
```

### 🔄 Data Flow

| Step | Process |
|:----:|:--------|
| **1** | User configures API keys in Settings (stored in browser) |
| **2** | User uploads base `.tex` resume and pastes job description |
| **3** | Frontend sends POST request to `/api/analyze` with credentials |
| **4** | Backend crawls GitHub repositories using provided token |
| **5** | JD Analyzer extracts skills and requirements from job description |
| **6** | Gemini API generates tailored resume bullets with GitHub evidence |
| **7** | LaTeX Compiler processes modified `.tex` file |
| **8** | System outputs PDF and compilation logs |
| **9** | Frontend receives download links for `.tex` and PDF files |

---

## 📁 Project Structure

```
Morphr/
├── 🔧 backend/
│   ├── 📂 resumes/              # Output directory for generated files
│   │   ├── amazon/              # Company-specific outputs
│   │   └── google/
│   ├── 🚀 main.py               # Flask API entrypoint
│   ├── 🕷️ github_crawler.py     # GitHub API integration
│   ├── 🧠 jd_analyzer.py        # Gemini-powered JD analysis
│   ├── 📝 compiler.py           # LaTeX compilation logic
│   ├── ⚙️ config.py             # Configuration management
│   ├── 📦 requirements.txt      # Python dependencies
│   └── 📄 .env.example          # Environment template
│
├── 🎨 frontend/
│   ├── 📂 src/
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── pages/               # Page components
│   │   ├── App.jsx              # Main app component
│   │   └── main.jsx             # React entrypoint
│   ├── 🌐 index.html
│   ├── 📦 package.json
│   ├── ⚡ vite.config.js
│   └── 🎨 tailwind.config.js
│
└── 📖 README.md
```

---

## 📖 User Guide

### 🎯 Usage Workflow

<div align="center">

| Step | Action | Details |
|:----:|:-------|:--------|
| **1** | 🔧 **Configure Settings** | Open web app → Navigate to Settings |
| **2** | 🔑 **Add Credentials** | Enter Gemini API key and GitHub username/token |
| **3** | 📤 **Upload Resume** | Upload your base LaTeX resume (`.tex` file) |
| **4** | 📋 **Paste Job Description** | Paste the job description in the text area |
| **5** | ⚡ **Generate** | Click "Generate" and wait for processing |
| **6** | 📥 **Download** | Download the tailored `.tex` and PDF files |

</div>
---

## 👨‍💻 Developer Guide

### 🏗️ Backend Architecture

| Module | Purpose | Key Functions |
|:-------|:--------|:--------------|
| `main.py` | API server and routing | `/api/analyze`, `/api/health`, `/ping` |
| `github_crawler.py` | Repository data extraction | `fetch_repos()`, `analyze_repo()` |
| `jd_analyzer.py` | AI-powered content generation | `extract_skills()`, `generate_bullets()` |
| `compiler.py` | LaTeX to PDF conversion | `compile_latex()`, `validate_output()` |

### 🔧 Local Development

**1. Environment Setup**

Create `.env` file in `backend/` (optional):
```env
GEMINI_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here
```

**2. Run Tests**
```powershell
pytest backend/tests/
```

**3. Frontend Development**
```powershell
npm run dev
```

### 🌐 API Endpoints

| Endpoint | Method | Description | Status |
|:---------|:------:|:------------|:------:|
| `/api/analyze` | POST | Process resume with JD and GitHub data | ✅ |
| `/api/health` | GET | Health check with service validation | ✅ |
| `/ping` | GET | Simple uptime monitoring | ✅ |
| `/api/projects` | GET | Fetch GitHub projects | ✅ |
| `/api/upload-resume` | POST | Upload base resume | ✅ |
| `/api/download/<folder>/<file>` | GET | Download generated files | ✅ |
| `/api/history` | GET | Get generation history | ✅ |

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

<table>
<tr>
<td width="50%">

### 📝 Pull Requests
- Small, focused changes
- Clear descriptions
- Link related issues

</td>
<td width="50%">

### 🧪 Testing
- Include unit tests
- Test edge cases
- Maintain coverage

</td>
</tr>
<tr>
<td width="50%">

### 🎨 UI/UX
- Visual consistency
- Responsive design
- Accessibility compliance

</td>
<td width="50%">

### 🔒 Privacy
- No credential persistence
- Secure data handling
- Follow best practices

</td>
</tr>
</table>

---

## ⚠️ Known Issues

| Issue | Impact | Workaround |
|:------|:------:|:-----------|
| 🐌 Large GitHub accounts | Increased processing time | Use fine-grained tokens with repo-only access |
| 📄 Complex LaTeX templates | Compilation failures | Check `backend/resumes/` logs for errors |
| ⏱️ GitHub rate limiting | API throttling | Authenticate with personal access token |
| 📑 Multi-page resumes | ATS compatibility issues | Ensure base template fits single page |

---

<div align="center">

### Made with 💗 by [BlaZe](https://github.com/BlaZe)

</div>
