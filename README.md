# Scholar AI

An AI-powered study assistant that helps students learn faster by turning notes and PDFs into interactive quizzes and explanations.

Built with a secure backend to protect API keys and optimize cost, Scholar AI combines chat-based learning with adaptive quiz generation.

---

## 🌐 Live Demo
https://scholar-ai-xi.vercel.app/

## 🔗 Backend API
https://scholar-ai-o86l.onrender.com

---

## 🚀 Features

- 💬 AI Chat Assistant (by subject)
- 🧠 Smart Quiz Generator from notes or PDFs
- ✅ Answer checking with explanations
- 📊 Score tracking + quiz history
- 📉 Weak topic detection
- 💾 Saved study sets
- 📄 PDF + TXT upload support
- 🖼 Image upload for assignment help *(in progress)*
- ➗ Math rendering (LaTeX with KaTeX)
- 🔒 Secure backend (API key never exposed)
- ⚡ Rate limiting to prevent abuse

---

## 🛠 Tech Stack

### Frontend
- React + Vite
- React Markdown + KaTeX
- PDF.js

### Backend
- Node.js + Express
- Anthropic API (Claude)
- dotenv + CORS
- Multer (image uploads)

---

## 🧠 How It Works

1. User inputs notes, uploads a PDF, or submits an image
2. Backend processes the request securely
3. Claude generates:
   - explanations
   - quiz questions
   - answer feedback
4. App tracks performance and highlights weak topics

---

## ⚙️ Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create `.env` in root
```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
```

### 3. Run backend
```bash
npm run server
```

### 4. Run frontend
```bash
npm run dev
```

---

## 🚀 Deployment

- Frontend: Vercel
- Backend: Render

---

## 🔐 Security

- API key stored server-side only
- `.env` ignored via `.gitignore`
- No direct browser access to AI API

---

## 💡 Future Improvements

- User authentication
- Paid subscription tiers
- Cloud database (user progress)
- AI-powered study plans
- Improved image recognition accuracy
- Full mobile optimization

---

## 📈 Why This Project Matters

Most AI study tools are passive. Scholar AI focuses on **active recall** and **personalized testing**, which are proven to improve learning outcomes.

---

## 👨‍💻 Author

**Nabeel Farooqi**