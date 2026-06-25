# TCG Binder App

A web application for Pokémon card collectors to plan and organise binders in both traditional (cards only) and michi (cards combined with images) styles.

[Live Demo](https://tcg-binder-app.vercel.app) | [GitHub](https://github.com/GarethChong/TCG-Binder-App)

---

## Motivation

I have been collecting Pokémon cards since a young age. Over the years, I watched the hobby transition from a space of creativity and community to one increasingly driven by monetisation — with collectors chasing slabs and market value over the love of the cards themselves.

This app is my small push back against that. By giving collectors a dedicated space to plan, visualise, and express their creativity through binder organisation, I hope to celebrate what the hobby is really about.

---

## Features

- User authentication with secure login and registration
- Multi-binder management with persistent storage per user account
- Binder pages with 2×2, 3×3, and 4×4 grid layouts
- Michi-style support — place 1×1 or 1×2 images alongside cards
- Up to 30 pages per binder with a real book-style navigation
- Live card price lookup for individual cards
- AI adviser that scans the current page layout and suggests cards or images to complement it aesthetically

---

## Tech Stack

| Technology | Role | Why I chose it |
|---|---|---|
| Python + Flask | Backend API | Beginner-friendly with a flexible extension ecosystem (Flask-Login, Flask-Bcrypt) |
| SQLite | Database | Lightweight and simple for local development; straightforward to migrate to PostgreSQL for production |
| JavaScript + React | Frontend | Component-based architecture suited to the dynamic, interactive grid UI |
| Tailwind CSS | Styling | Utility-first approach that sped up UI development without leaving the HTML |
| Git | Version control | Tracked progress and decisions throughout the build |

---

## How to Run Locally

```bash
# Clone the repository
git clone https://github.com/yourusername/tcg-binder-app.git

# Backend
cd backend
pip install -r requirements.txt
flask run

# Frontend
cd frontend
npm install
npm run dev
```

---

## Challenges and Lessons Learned

**Technical challenge — michi grid logic**
The most complex feature to implement was 2×1 image support. The difficulty was not the layout itself, but the swap logic — accounting for every case when a 2×1 image is moved into a 1×1 slot, swapped with a card, or shifted to a position that would overflow the page boundary. Working through that logic systematically was one of the most rewarding parts of the build.

**Personal lesson — AI as a tool, not a lead**
Building this app as a first project with AI assistance taught me something I think is increasingly important. During long coding sessions I lost focus, and gradually let AI take over my reasoning — which led to product decisions that weren't mine and had to be reversed. If I were starting again, I would be more conscious of that boundary: AI can mentor and accelerate, but the thinking, the decisions, and the project have to remain yours.