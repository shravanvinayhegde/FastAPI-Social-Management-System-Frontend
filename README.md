# FastAPI-Social-Management-System-Frontend
# 🗳️ VoteFlow — Frontend

[![Live Demo](https://img.shields.io/badge/Live%20Demo-voteflow--phi.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://voteflow-phi.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![Backend on Render](https://img.shields.io/badge/Backend%20API-Render-46E3B7?style=for-the-badge&logo=render)](https://fastapi-management-system.onrender.com/docs)

A clean, responsive **Next.js + TypeScript** frontend for the **FastAPI Social Management System** — a community platform where users can register, log in, create posts, and vote on content. Deployed independently on **Vercel**, consuming a separate **FastAPI + PostgreSQL** backend hosted on **Render**.

---

## 🌐 Live Demo

👉 **[https://voteflow-phi.vercel.app/](https://voteflow-phi.vercel.app/)**

> ⚠️ **Note:** The backend runs on Render's free tier, so the first API request may take **30–60 seconds** to wake up. Subsequent requests will be fast.

---

## ✨ Features

- **User Authentication** — Register and log in with JWT-based auth; tokens managed client-side across sessions
- **Community Feed** — Browse and search posts in a responsive social feed
- **Profiles and Connections** — View profiles, follow/unfollow users, and browse followers/following
- **Communities** — Discover, create, join, leave, view members, and browse community posts
- **Replies** — Create nested replies on posts
- **Direct Messaging** — Create conversations, send/read messages, and receive WebSocket events
- **Notifications** — View, count, and mark notifications read
- **My Posts** — View, edit, and delete only your own content
- **Create Posts** — Share text, image URL, video URL, and community-linked posts
- **Voting System** — Upvote posts and remove votes
- **Dark / Light Mode** — Toggle between themes with a single click
- **Responsive Layout** — Works smoothly on desktop, tablet, and mobile
- **Type-Safe Codebase** — Fully written in TypeScript for reliability and maintainability

---

## 🏗️ Architecture

This project is intentionally split into **two separate repositories** for independent deployment and scaling:

| Part | Repo | Hosted On |
|------|------|-----------|
| **Frontend** (this repo) | [FastAPI-Social-Management-System-Frontend](https://github.com/shravanvinayhege/FastAPI-Social-Management-System-Frontend) | Vercel |
| **Backend** | [FastAPI-Management-System](https://github.com/shravanvinayhege/FastAPI-Management-System) | Render |

```
Browser
  │
  ├── Vercel  ──────────────────────────────────────────────
  │     └── Next.js App (TypeScript + CSS)
  │           └── fetch() / API calls over HTTPS
  │
  |── Render  ──────────────────────────────────────────────
  |      ├── FastAPI (Python)
  |___Neon ___________________________________________________
     |---- Postgrsql

```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [Next.js](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Styling** | CSS Modules + PostCSS |
| **Hosting** | Vercel |
| **Backend API** | FastAPI (Python) — [separate repo](https://github.com/shravanvinayhege/FastAPI-Management-System) |
| **Database** | PostgreSQL — managed by backend |
| **Auth** | JWT tokens (issued by backend, stored client-side) |

---

## 📁 Project Structure

```
FastAPI-Social-Management-System-Frontend/
├── app/                  # Next.js App Router pages & layouts
├── lib/                  # Utility functions, API helpers, types
├── next.config.ts        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── postcss.config.mjs    # PostCSS / CSS processing config
├── package.json          # Dependencies & scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- npm or yarn

### Run Locally

**1. Clone the repository:**

```bash
git clone https://github.com/shravanvinayhege/FastAPI-Social-Management-System-Frontend.git
cd FastAPI-Social-Management-System-Frontend
```

**2. Install dependencies:**

```bash
npm install
```

**3. Set up environment variables:**

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_API_URL=https://fastapi-management-system.onrender.com
```

To use a locally running backend instead:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**4. Start the development server:**

```bash
npm run dev
```

The app will be available at **[http://localhost:3000](http://localhost:3000)**.

### Build for Production

```bash
npm run build
npm start
```

---

## 🔗 Backend API

The frontend communicates with the following backend endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/login` | Log in and receive a JWT token |
| `POST` | `/users/` | Register a new user |
| `GET` | `/posts/` | Fetch all posts |
| `POST` | `/posts/` | Create a new post |
| `PUT` | `/posts/{id}` | Edit your post |
| `DELETE` | `/posts/{id}` | Delete your post |
| `POST` | `/vote/` | Upvote or remove a vote |
| `GET/POST/DELETE` | `/users/{id}/follow*` | Follow status and connections |
| `GET/POST/DELETE` | `/communities/*` | Community discovery and membership |
| `GET/POST/PATCH/DELETE` | `/posts/{id}/replies*` | Nested replies |
| `GET/POST/PATCH/DELETE` | `/conversations/*`, `/messages/*` | Direct messages |
| `GET/POST` | `/notifications/*` | Notifications and read state |
| `WebSocket` | `/ws/events?token=...` | Real-time message and notification events |

Full interactive API docs: [https://fastapi-management-system.onrender.com/docs](https://fastapi-management-system.onrender.com/docs)

Backend repository: [FastAPI-Management-System](https://github.com/shravanvinayhege/FastAPI-Management-System)

---

## ☁️ Deployment

This frontend is deployed on **Vercel** directly from the `main` branch. Every push triggers an automatic redeploy with zero downtime.

To deploy your own fork:

1. Fork this repository
2. Go to [vercel.com](https://vercel.com/) and import your fork
3. Add the environment variable `NEXT_PUBLIC_API_URL` pointing to your backend
4. Vercel auto-detects Next.js — no extra build configuration needed

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📬 Related

- 🔧 **Backend Repo:** [FastAPI-Management-System](https://github.com/shravanvinayhege/FastAPI-Management-System)
- 📖 **API Docs (Swagger):** [fastapi-management-system.onrender.com/docs](https://fastapi-management-system.onrender.com/docs)
- 🌐 **Live Site:** [voteflow-phi.vercel.app](https://voteflow-phi.vercel.app/)

---

<div align="center">
  <img src="https://github.com/user-attachments/assets/e967071e-0596-46f5-976e-9df119307873" alt="giphy" />
</div>
