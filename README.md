# 🌟 Humanify AI

> **Multi-Stage Iterative AI to Authentic Human Converter**  
> *100% Free • Self-Hosted • No API Key Needed • Python + React*

---

## 🚀 Concept & Pipeline

When normal AI generates an answer, it includes recognizable AI patterns (overused words like *delve, testament, crucial, in conclusion*, rigid bullet points, and robotic syntax).

**Humanify AI** runs a multi-pass pipeline:
1. **Stage 0: Raw AI Brainstorming & Factual Draft** (AI Score ~98%)
2. **Stage 1: Anti-Cliché & De-Structuring Pass** (Strips AI buzzwords, breaks repetitive bullets, AI Score ~62%)
3. **Stage 2: Cadence & Burstiness Pass** (Injects sentence length variation, natural contractions, AI Score ~24%)
4. **Stage 3: Authentic Persona & Final Polish** (Applies selected tone: Casual, Hinglish, Professional, Storyteller, Punchy, Human Score ~98% / Undetectable)

---

## ⚡ Quick Start

### Option 1: 1-Click Launch (Windows)
Double-click **`start.bat`** in the project folder. It will automatically:
1. Start the Python FastAPI backend on port `8000`.
2. Start the React Vite frontend on port `5173`.
3. Open `http://localhost:5173` in your browser.

---

### Option 2: Manual Terminal Commands

**Terminal 1 (Python Backend):**
```bash
python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

Open **`http://localhost:5173`** in your browser!

---

## 💎 Features Included:
- **Zero Cost / 0 API Keys**: Runs 100% locally on your machine with built-in procedural intelligence.
- **Tone Selector**:
  - ☕ **Casual & Friendly** (Warm everyday talk)
  - 💼 **Professional & Crisp** (Clean workplace communication)
  - 📖 **Storyteller** (Narrative human perspective)
  - ⚡ **Punchy & Direct** (No fluff, high impact)
  - 🇮🇳 **Desi / Hinglish** (Natural Indian English/Hindi conversational tone)
- **Side-by-Side Comparison**: Compare raw AI output vs final humanized output.
- **Stage Inspector Tabs**: Inspect how your text evolved through all 4 stages.
- **Cliché Highlighter**: View robotic words that were detected and removed.
- **History Drawer**: Automatically saves previous prompts and conversions to `localStorage`.
- **Export & Copy**: 1-click clipboard copy or download as Markdown file.
