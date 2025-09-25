🚀 Knowledge Weave - Complete Installation and Setup Guide

Welcome! 👋 to Knowledge Weave, a self-hosted knowledge management system built with React (frontend) and Node.js (backend). This project is fully independent of Supabase—data (articles and interns) is stored locally in JSON files for easy persistence. This README covers everything from zero to hero (0 to 100): prerequisites, installation, version checks, running the app, and troubleshooting. If you hit issues, check GitHub issues or drop a comment. Let's get started! 😊

## 📋 Prerequisites

Before diving in, ensure you have these basics. All are free and straightforward!

Node.js ⚡: Version 20.x or higher (LTS recommended). Check with:

## textnode -v

If lower, download from nodejs.org.

npm (comes with Node): Version 10.x+.

## textnpm -v

## Git 🐙: For cloning the repo. Check with:

## textgit --version

If missing, install from git-scm.com.

Docker 🐳 (optional, for self-hosting): Version 20+. Check with:

## textdocker --version

VS Code (recommended) 📝: For editing, with extensions like "Tailwind CSS IntelliSense" and "ES7+ React Snippets".

Pro Tip: Works on Windows/macOS/Linux. For macOS M1/M2, install ARM64 Node.

## 🛣️ Step 1: Clone and Prepare the Project

Grab the repo and navigate to it.

bashgit clone [https://github.com/your-username/KnowledgeWeave.git](https://github.com/your-username/KnowledgeWeave.git)

## cd KnowledgeWeave

Verify: Run tree -I node_modules (or dir /s on Windows)—you should see this structure:

text.

## ├── Dockerfile

## ├── README.md

## ├── backend

## │ ├── articles.json

## │ ├── interns.json

## │ ├── package.json

## │ └── server.js

## ├── src

## │ ├── App.jsx

## │ ├── pages

## │ │ ├── Dashboard.jsx

## │ │ └── InternTracking.jsx

## │ └── entities

## │ ├── Article.js

## │ └── Intern.js

## ├── vite.config.js

## └── package.json

## 🔧 Step 2: Install Dependencies

Install frontend and backend packages separately.

## Frontend (root directory):

## textnpm install

## (Installs React, Vite, Tailwind, shadcn/ui, etc.)

## Backend:

## textcd backend

## npm install

## (Installs Express, lowdb v7, CORS.)

Return to root: cd ..

## Version Check:

## textnpm list react vite express lowdb

Expected: React ~18.x, Vite ~5.x, Express ~5.x, lowdb ~7.x.

If errors (e.g., peer deps), run npm install --legacy-peer-deps.

## 📁 Step 3: Initial Setup (JSON Files & Config)

Set up local data storage and verify configs.

## Create/Verify JSON Files (in backend/):

## articles.json:

## json{ "articles": [] }

## interns.json:

## json{ "interns": [] }

Import Existing Data (if you have backups): Copy arrays from your backup JSONs into the files (ensure IDs are strings).

Check vite.config.js (root): Ensure proxy for API:

## jsserver: {

## proxy: {

## "/api": {

      target: "[http://localhost:3001",](http://localhost:3001",)

## changeOrigin: true,

## },

## },

## }

Verify: Open JSONs in VS Code—no syntax errors. Configs saved?

## ▶️ Step 4: Run in Development Mode (Local Dev)

Run backend first (for API), then frontend.

## Start Backend (in backend/):

## textnpm start

Output: "Server running on port 3001" ✅. Keep this terminal open.

## Start Frontend (in root, new terminal):

## textnpm run dev

Output: "Local: [http://localhost:5173/"](http://localhost:5173/") (or similar port).

Open Browser: [http://localhost:5173](http://localhost:5173)

## Test Suite: 🎯

Dashboard: Loads with "No articles yet" (if empty). Recent Articles section visible.

Intern Tracking: Click sidebar—interns load (empty list if new).

Create Article: + New Article → Fill form → Submit → Refresh (F5) → Article persists.

Add Intern: + Add Intern → Form → Submit → Refresh → Intern shows.

Console Check (F12 > Console/Network): No CORS/fetch errors. API calls (e.g., /api/articles) return 200 OK.

Pro Tip: Data saves to backend/\*.json—edit manually for testing!

🔨 Step 5: Build and Run in Production Mode (Optional)

For a production-like setup (no dev servers).

## Build Frontend:

## textnpm run build

## (Creates dist/ folder.)

## Run Backend with Build (serves static files):

## textcd backend

## npm start

Now accesses [http://localhost:3001](http://localhost:3001) for full app.

Test: Browser to [http://localhost:3001—app](http://localhost:3001—app) loads, APIs work. Optimized and faster! 🚀

🐳 Step 6: Self-Host with Docker (Optional, for Servers)

Easy deployment on any machine with Docker.

## Build & Run:

## textdocker-compose up --build

Output: Builds frontend/backend, starts on port 3001.

Access: [http://localhost:3001](http://localhost:3001)

Stop: Ctrl+C, then docker-compose down -v (cleans volumes).

Verify: Logs show "Server running on port 3001". Data persists via mounted JSON volumes.

## 📈 Next Steps & Customization

Add Data: Edit JSONs manually or via UI.

Security: For prod, add JWT auth in backend (extend server.js).

Export/Import: Copy JSONs for backups.

## Contribute: Fork, PR, or star the repo! ⭐

Support: Questions? Open an issue with screenshots/console logs.

Thanks for using Knowledge Weave—build your knowledge base effortlessly! 🌟 Made with ❤️ using React, Tailwind, and lowdb.
