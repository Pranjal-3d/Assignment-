# Veridian Corp — ARIA IT Support Agent

**ARIA (Automated Resolution & IT Assistant)** is an AI-powered IT support triage and resolution system built for Veridian Corp. The agent automatically resolves standard self-service IT requests, escalates policy-restricted or security-critical cases to human teams, and provides real-time operational analytics for IT administrators.

---

## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Prerequisites](#-prerequisites)
- [Local Setup & Installation](#-local-setup--installation)
- [Running the Application](#-running-the-application)
- [API Reference](#-api-reference)
- [Production Deployment (Render)](#-production-deployment-render)
- [Architecture Document](#-architecture-document)

---

## 🏗 Architecture Overview

ARIA enforces a policy-grounded decision workflow separating direct self-service resolutions from human escalation paths:

```text
                 USER / IT ADMIN
                        │
                        ▼
             React UI (Next.js 14)
                        │
                        ▼
             Flask API Gateway (Port 5000)
                        │
                        ▼
             Google Gemini 2.5 Flash
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
    Knowledge Base (KB-01..10)    Ticket Queue Precedents (TK-1050)
         │                             │
         └──────────────┬──────────────┘
                        ▼
                 DECISION ENGINE
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
  [RESOLVE DIRECTLY]             [ROUTE TO HUMAN]
  Self-Service Portal            Security / Manager /
  Password / Wi-Fi /             Finance / Tier-2 IT
  Spooler / Archiving                   │
        │                               │
        └───────────────┬───────────────┘
                        ▼
                   ARIA Reply
```

For complete technical specifications, review [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## ✨ Key Features

* **Policy-Grounded Decision Engine**: Powered by Google Gemini 2.5 Flash, strictly evaluated against company knowledge base articles (`KB-01` to `KB-10`) and prior ticket resolution precedents (`TK-1050`).
* **Interactive Operations Dashboard**: Live analytics displaying total requests, open tickets, critical security alerts, priority distribution, and category breakdowns.
* **Ticket & Request Management**: Full status transition capabilities (**Mark Resolved**, **Reject/Close**, **Re-open**) with real-time UI synchronization.
* **Auto-Clearing Security Alerts**: Critical security alerts automatically remove from dashboard banners and counters upon resolution.
* **Isolated Customer Sessions**: Switching between customer requests initializes fresh, isolated AI session IDs (`session_<reqId>_<timestamp>`).
* **Fully Responsive Interface**: Tailored layout supporting desktop, tablet, and mobile screens with zero horizontal overflow.

---

## 🛠 Tech Stack

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Vanilla CSS Modules
* **Backend**: Python 3.11+, Flask, Flask-CORS, Gunicorn
* **AI Model**: Google Gemini 2.5 Flash (`google-generativeai`)
* **Styling**: Monochromatic high-contrast dark theme with glassmorphism accents

---

## 📁 Project Directory Structure

```text
aionos-assignment/
├── ARCHITECTURE.md              # Detailed System Architecture & Workflow Specs
├── README.md                    # Project Documentation & Setup Guide
├── start.bat                    # One-click startup script for Windows
├── .gitignore                   # Workspace git exclusion rules
├── package.json                 # Next.js workspace root scripts
│
├── backend/                     # Python Flask API Server
│   ├── app.py                   # Main Flask REST API Server
│   ├── knowledge_base.py        # KB Data, Request Queues, System Prompt Engine
│   └── requirements.txt         # Python dependencies (Flask, Gunicorn, Gemini)
│
└── frontend-next/               # Next.js Frontend Application
    ├── package.json             # Frontend dependencies
    ├── next.config.js           # Next.js rewrites configuration
    ├── tsconfig.json            # TypeScript configuration
    └── src/
        ├── app/                 # Next.js app pages
        ├── components/          # Dashboard, Requests, Tickets, Chat, Modal components
        └── lib/                 # API client helpers and types
```

---

## 📋 Prerequisites

Ensure you have the following installed on your system:
* **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
* **Python**: v3.9 or higher ([Download Python](https://www.python.org/))
* **Git**: ([Download Git](https://git-scm.com/))
* **Gemini API Key**: ([Get API Key from Google AI Studio](https://aistudio.google.com/))

---

## 🚀 Local Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Pranjal-3d/Assignment-.git
cd Assignment-
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (or copy `.env.example`):
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

### 3. Install Dependencies

#### Install Frontend Dependencies:
```bash
npm install
```

#### Install Backend Dependencies:
```bash
cd backend
pip install -r requirements.txt
cd ..
```

---

## 💻 Running the Application

### Option A: One-Click Launch (Windows)
Double-click `start.bat` or run in terminal:
```cmd
.\start.bat
```
This automatically starts both the Flask backend (port `5000`) and the Next.js frontend (port `3001`).

### Option B: Manual Execution

#### Terminal 1 — Start Backend API:
```bash
cd backend
python app.py
```
*Backend runs on `http://localhost:5000`*

#### Terminal 2 — Start Frontend Server:
```bash
npm run dev
```
*Frontend runs on `http://localhost:3001`*

---

## 🔌 API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Health check endpoint and API connectivity status |
| `/api/requests` | `GET` | Retrieve all employee requests |
| `/api/tickets` | `GET` | Retrieve active and closed ticket queue records |
| `/api/kb` | `GET` | Retrieve knowledge base articles (`KB-01` to `KB-10`) |
| `/api/stats` | `GET` | Retrieve live dashboard operational metrics |
| `/api/meta` | `GET` | Retrieve company metadata and active security alerts |
| `/api/chat` | `POST` | Execute AI chat query grounded in policy |
| `/api/chat/analyze/<id>` | `POST` | Generate automated ARIA triage recommendation |
| `/api/tickets/<id>/update` | `POST` | Update ticket status (`Resolved`, `In Progress`, `closed`) |
| `/api/requests/<id>/update` | `POST` | Update employee request status (`Resolved`, `Rejected`) |

---

## ☁️ Production Deployment (Render)

### 1. Backend Web Service (Render)
* **Root Directory**: `backend`
* **Runtime**: `Python 3`
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `gunicorn app:app`
* **Environment Variable**: `GEMINI_API_KEY` = `<your_api_key>`

### 2. Frontend Web Service (Render)
* **Root Directory**: `frontend-next`
* **Runtime**: `Node`
* **Build Command**: `npm install && npm run build`
* **Start Command**: `npm run start`
* **Environment Variable**: `NEXT_PUBLIC_API_URL` = `https://<your-backend-service>.onrender.com`

---

## 📖 Architecture Document

For full details on the cognitive decision matrix, security escalation rules, and ticket precedent handling, refer to **[ARCHITECTURE.md](./ARCHITECTURE.md)**.
