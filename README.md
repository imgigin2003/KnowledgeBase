# 📚 KnowledgeWeave

> **Organize your knowledge. Track your team. Manage your tasks.** All in one place.

KnowledgeWeave is a lightweight, full-stack web app for managing articles, tracking interns, and organizing tasks—designed to grow with your team without the bloat.

---

## ✨ Features

### 📖 Knowledge Base

- **Rich Articles** — Write and organize articles with categories, tags, and summaries
- **Nested Categories** — Organize knowledge hierarchically
- **Comments & Discussion** — Annotate articles with inline comments
- **Quick Search** — Find what you need fast

### 👥 Intern Tracking

- **Profiles** — Track intern name, email, program, mentor, and status
- **Requirements** — Attach and track learning goals
- **Notes & History** — Keep detailed records of progress

### ✅ Task Management

- **Flexible Tasks** — Create tasks with custom fields and priorities
- **Hierarchical Structure** — Parent/child task relationships
- **File Uploads** — Upload and organize JSON task files
- **Status Tracking** — Track status changes with timestamps
- **Multiple Task Lists** — Manage different projects independently

### 🎨 Beautiful UI

- **Responsive Design** — Works on desktop, tablet, and mobile
- **Dark Mode Ready** — Tailwind CSS with custom theme
- **Real-time Updates** — React + TanStack Query for snappy interactions

---

## 🛠️ Tech Stack

| Layer       | Technology                           |
| ----------- | ------------------------------------ |
| Frontend    | React 19, Vite, Tailwind CSS v3      |
| UI          | shadcn/ui, Radix UI, React Hook Form |
| Backend     | Node.js, Express                     |
| Database    | lowdb (JSON files)                   |
| Forms       | React Hook Form                      |
| HTTP Client | Browser Fetch API                    |

---

## 📁 Project Structure

```
KnowledgeWeave/
├── frontend/              # React SPA (Vite + Tailwind)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route-level pages
│   │   ├── entities/      # API client functions
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Helpers
│   └── ...config files
├── backend/               # Express API + lowdb
│   ├── src/
│   │   ├── controllers/   # Request handlers (articles, tasks, interns)
│   │   ├── routes/        # API route definitions
│   │   ├── db/            # lowdb setup & initialization
│   │   ├── middleware/    # File upload & CORS
│   │   ├── app.js         # Express app setup
│   │   └── server.js      # Entry point
│   ├── data/              # JSON databases (gitignored at runtime)
│   └── __test__/          # Jest + supertest tests
├── Dockerfile             # Multi-stage: builds frontend, runs backend
└── docker-compose.yml     # One-command dev/prod stack
```

---

## ⚡ Quick Start

### Development (two terminals)

**Terminal 1 — Backend** (http://localhost:3001):

```bash
cd backend
npm install
npm run dev          # Auto-restarts on file changes
```

**Terminal 2 — Frontend** (http://localhost:5173):

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api/*` to the backend, so everything just works.

### Testing

```bash
cd backend
npm test            # 20 Jest + supertest tests
```

### Production with Docker

```bash
docker compose up --build
```

App runs on http://localhost:3001 with the frontend built-in.

---

## 📊 Data & Persistence

**Your data is safe and portable:**

- **No data in git** — Articles, interns, and tasks are gitignored; your local data stays local
- **Empty deployments** — Fresh installs start with no content (zero cold-start data)
- **Persistent volumes** — In production, `backend/data/` mounts as a Docker volume
- **JSON-based** — Easy to inspect, backup, or migrate (no DB server needed)

### Fresh Deploy Behavior

A fresh deployment starts completely empty:

```bash
curl https://your-app.com/api/articles
# Response: []
```

As users add content, the app writes to `backend/data/` (or wherever `DATA_DIR` points). Back it up by saving that folder.

---

## ⚙️ Configuration

The backend respects these environment variables (all optional):

| Variable     | Default          | Purpose                                  |
| ------------ | ---------------- | ---------------------------------------- |
| `PORT`       | `3001`           | Port the API/server listens on           |
| `DATA_DIR`   | `backend/data`   | Where the JSON databases live            |
| `PUBLIC_DIR` | `backend/public` | Built frontend to serve (if it exists)   |
| `NODE_ENV`   | `development`    | Set to `production` for optimized output |

---

## 🗂️ API Routes

All routes live under `/api`:

```
GET    /api/articles              # List articles
POST   /api/articles              # Create article
GET    /api/articles/:id          # Get article
PUT    /api/articles/:id          # Update article
DELETE /api/articles/:id          # Delete article

POST   /api/articles/:id/comments # Add comment
PUT    /api/articles/:aid/comments/:cid
DELETE /api/articles/:aid/comments/:cid

GET    /api/interns               # List interns
POST   /api/interns               # Create intern
PUT    /api/interns/:id           # Update intern
DELETE /api/interns/:id           # Delete intern

GET    /api/tasks                 # List tasks
POST   /api/tasks                 # Create task
PUT    /api/tasks/:id             # Update task
DELETE /api/tasks/:id             # Delete task (and children)

GET    /api/task-files            # List uploaded task files
POST   /api/task-files/upload     # Upload JSON task file
```

Query params:

- `?file=filename.json` — Select which task list to operate on (default: `reminders.json`)
- `?_sort=field&_order=asc` — Sort results

---

## 🚀 Roadmap

- [x] Clean architecture (controllers, routes, DB layer)
- [x] Comprehensive tests (20+ Jest tests)
- [x] Multi-stage Docker build
- [x] Data isolation (empty deployments)
- [x] Inline editing in the UI
- [ ] Export to PDF/JSON
- [ ] Leaderboards (if adding user auth)

---

## 🤝 Contributing

Found a bug? Have an idea? Fork, explore, and submit a PR. All contributions welcome.

---

_Keep your knowledge organized. Build something great. 📚✨_
