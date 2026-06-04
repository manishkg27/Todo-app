# 📝 Minimalist Todo App

A beautifully simple, distraction-free task management application built with modern web technologies. Designed for speed, ease of use, and a clean aesthetic.

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248?style=for-the-badge&logo=mongodb)

**Live Demo:** [https://todo-app-bice-nine-76.vercel.app/](https://todo-app-bice-nine-76.vercel.app/)

## ✨ Features

- **Minimalist UI:** A clean, bloat-free interface focused entirely on your tasks.
- **Secure Authentication:** User sign-up and login handled safely via NextAuth.js.
- **Drag & Drop:** Reorder your tasks seamlessly to prioritize your day.
- **Smart Filtering:** Quickly toggle between All, Active, and Completed tasks.
- **Instant Search:** Find specific tasks instantly with real-time filtering.
- **Responsive Design:** Works flawlessly across desktop, tablet, and mobile devices.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS for specific UI components
- **Database:** [MongoDB](https://www.mongodb.com/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun
- A MongoDB database (local or Atlas)

### Environment Variables

Create a `.env.local` file in the root of your project and add the following variables:

```env
# Your MongoDB connection string
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/todo-app

# NextAuth secret (Generate one using: openssl rand -base64 32)
NEXTAUTH_SECRET=your_super_secret_key_here

# NextAuth URL (Optional for local development, required for production)
NEXTAUTH_URL=http://localhost:3000
```

### Installation

1. Clone the repository
2. Install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📁 Project Structure

```text
├── app/
│   ├── api/            # Next.js API Routes (Auth, Todos, etc.)
│   ├── login/          # Login page
│   ├── register/       # Registration page
│   ├── globals.css     # Global styles and design system
│   ├── layout.jsx      # Root layout
│   └── page.jsx        # Main Todo application dashboard
├── models/             # Mongoose schemas (User, Todo)
├── lib/                # Utility functions (MongoDB connection)
└── public/             # Static assets
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.
