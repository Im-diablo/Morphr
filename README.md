<div align="center">
  
# ✦ Morphr ✦
**AI-Powered Resume Tailoring Backed by Real GitHub Data**

[![React](https://img.shields.io/badge/React-18-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Flask](https://img.shields.io/badge/Flask-API-black.svg?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-orange.svg?style=for-the-badge&logo=google)](https://aistudio.google.com/)

[Features](#features) • [How It Works](#how-it-works) • [Installation](#installation) • [Architecture](#architecture)

</div>

<br/>

Morphr takes your base LaTeX resume template, analyzes a target Job Description using **Google's Gemini 2.5 Flash**, cross-references your real **GitHub repositories**, and generates a tailored, ATS-friendly PDF in seconds.

No hallucinations, no generic fluff. Every bullet point is backed by actual data from your public repositories.

---

## ✨ Features

- **Liquid Glass Frontend**: Glassmorphism cards, capsule navbar, scroll-reactive motion, and a visual style inspired by modern liquid UI systems.
- **Terminal Boot Screen**: A lightweight terminal-themed startup screen adds polish without introducing a heavy loading system.
- **Mobile-Friendly by Design**: 3D hero/scenes are reduced on smaller screens so the UI stays usable and lighter on phones.
- **Smart GitHub Sync**: Automatically fetches your public repositories, languages, and project data to build verifiable resume content.
- **Bring Your Own Key (BYOK)**: Privacy-first architecture. Your Gemini API key and GitHub tokens are stored in the browser's `localStorage` and never hit a database.
- **One-Page Resume Guard**: The backend prompt and LaTeX template are tuned to keep generated resumes within a single A4 page.
- **LaTeX Compilation Pipeline**: Server-side `.tex` compilation via Python, returning a PDF ready for submission.

## 🚀 How It Works

1. **Upload Resume**: Drop your base `.tex` template into the app.
2. **Paste Job Description**: Provide the company name and target role description.
3. **AI Morphing**: Gemini extracts key technical requirements and maps them to your GitHub projects.
4. **Download**: Receive both the modified `.tex` source and the compiled `PDF`.
5. **Navigate the App**: The app page keeps the same landing-style navbar and supports section jumps back to the landing page.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lenis Scroll, React Three Fiber for the hero/background scenes.
- **Backend**: Python 3, Flask, PyGithub for repository crawling, Google Generative AI SDK.
- **Compilation**: `pdflatex` / `tectonic`.

## 📦 Installation & Setup

### Prerequisites

- Python 3.9+
- Node.js 18+
- A LaTeX compiler installed on your system (e.g., `pdflatex` or `tectonic`).

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/morphr.git
cd morphr
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

_(Optional)_ Create a `.env` file in the `backend` directory if you wish to set default keys for local development (otherwise, enter them in the frontend Settings page).

```env
GEMINI_API_KEY=your_key_here
GITHUB_TOKEN=your_github_token_here
```

Run the Flask server:

```bash
python main.py
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173`.

### 4. App Configuration

1. Go to the **Settings** page (`/settings`).
2. Input your **Gemini API Key** (Free at Google AI Studio).
3. Input your **GitHub Username**.
4. _(Optional but recommended)_ Input a GitHub Fine-Grained Token to avoid rate limits.

### 5. What to Expect

- The landing page opens with a short terminal-style boot screen.
- The home hero is the default refresh target.
- On mobile, the visual effects are reduced so the app stays responsive.
- Generated resumes are constrained to a single A4 page as much as possible.

---

## 📁 Project Structure

- `backend/`: Flask API, GitHub crawling, Gemini analysis, and LaTeX compilation.
- `frontend/`: React app with the landing page, app workflow, settings page, and liquid-glass UI.
- `backend/resumes/`: Generated `.tex` files, PDFs, and metadata organized by company slug.

---

## 🔌 API Endpoints

- `GET /api/health` - checks GitHub and Gemini availability.
- `GET /api/projects` - fetches GitHub projects for the configured user.
- `POST /api/upload-resume` - stores the base LaTeX resume.
- `POST /api/analyze` - analyzes the JD, rewrites the resume, and compiles the PDF.
- `GET /api/history` - lists previously generated resumes.

---

## 🧱 Architecture

- **Frontend shell**: React + Vite app with liquid-glass styling, route transitions, and a lightweight terminal boot overlay.
- **Resume workflow**: Landing page, app workflow, and settings page are all routed through React Router.
- **Visual rendering**: 3D scenes are used for polish on desktop and reduced on mobile for better performance.
- **Backend pipeline**: Flask accepts the JD, crawls GitHub data, asks Gemini to rewrite the resume, then compiles LaTeX into PDF.
- **Output safety**: The template and prompt are tuned to keep generated resumes compact and close to a single page.

---

<div align="center">
  <p>Made With 💗 by BlaZe.</p>
</div>
