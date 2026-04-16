# Scholar AI

An AI-powered study assistant that helps students learn faster by turning notes, PDFs, and images into interactive quizzes and explanations.

Scholar AI combines chat-based learning, quiz generation, image-assisted assignment help, and performance tracking into a single platform designed for active recall and deeper understanding.

---

## 🌐 Live Demo
https://scholar-ai-xi.vercel.app/

⚠️ Note: The public version runs in demo mode to prevent API abuse and control costs. The full AI-powered version is available in local development with a valid API key.

---

## 🚀 Features

- 💬 AI Chat Assistant (by subject)
- 🧠 Smart Quiz Generator from notes or PDFs
- ✅ Answer checking with explanations
- 📊 Score tracking + quiz history
- 📉 Weak topic detection
- 💾 Saved study sets
- 📄 PDF + TXT upload support
- 🖼️ Image upload for assignment help *(in progress)*
- ➗ Math rendering using LaTeX (KaTeX)
- 🔒 Secure backend with protected API keys
- ⚡ Rate limiting and usage controls
- 🎭 Demo mode for safe public deployment

---

## 🛠 Tech Stack

### Frontend
- React + Vite
- React Markdown + KaTeX
- PDF.js

### Backend
- Node.js + Express
- Anthropic API (Claude)
- Multer (image uploads)
- dotenv + CORS

---

## 🧠 How It Works

1. User inputs notes, uploads a PDF, or submits an image
2. Backend securely processes the request
3. AI generates:
   - explanations
   - quiz questions
   - answer feedback
4. App tracks performance and highlights weak areas

---

## ⚙️ Setup

### Install dependencies
```bash
npm install