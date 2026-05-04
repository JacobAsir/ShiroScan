# 🛡️ ShiroScan (シロスキャン)

Understand any Japanese food label in seconds. ShiroScan is a professional-grade ingredient scanner designed to help travelers and residents in Japan navigate complex food labels with ease, focusing on dietary safety and allergen detection.

![ShiroScan Dashboard Screenshot](https://raw.githubusercontent.com/JacobAsir/ShiroScan/main/artifacts/shiroscan/public/samples/sample1.png)

## ✨ Key Features

- **Multi-Modal AI Analysis:** Combines high-accuracy OCR (Gemini 2.0) with advanced LLM reasoning (Groq/Llama 3.3) for precise ingredient decoding.
- **Split-Panel Dashboard:** Professional desktop UI with independent scrolling for image/preferences and analysis results.
- **Custom Allergies & Dietary Rules:** Beyond standard presets, add your own custom terms (e.g., "Soy", "Pork", "Alcohol") which are matched via substring analysis.
- **"Info Mode" (Guest Scan):** No preferences? No problem. ShiroScan will provide a factual breakdown of all detected allergens and notable ingredients.
- **Session History:** Quick-access sidebar to revisit your recent scans during a shopping trip.
- **Bilingual Explanations:** Every result is explained in both English and Japanese for maximum clarity.

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **OCR Engine:** Google Gemini Pro Vision
- **LLM Engine:** Groq (Llama-3.3-70b-versatile)
- **Settings:** Pydantic V2 & Pydantic-Settings
- **Server:** Uvicorn

### Frontend
- **Core:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Shadcn UI
- **State Management:** Zustand (Session Storage)
- **Icons:** Lucide React
- **Routing:** Wouter

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **API Keys:**
  - [Google Gemini API Key](https://aistudio.google.com/app/apikey) (Free tier available)
  - [Groq API Key](https://console.groq.com/keys) (High-speed inference)

### 1. Clone the Repository
```bash
git clone https://github.com/JacobAsir/ShiroScan.git
cd ShiroScan
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Configure Environment:**
Create a `.env` file in the `backend/` directory based on `.env.example`:
```env
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
APP_ENV=production
```

**Run Backend:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```
The API will be available at `http://localhost:8080/docs`.

### 3. Frontend Setup
```bash
cd artifacts/shiroscan
npm install
```

**Run Frontend:**
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🌍 Deployment (Render)

ShiroScan is optimized for deployment on **Render** using the included `render.yaml` blueprint.

### One-Click Deployment
1. Connect your GitHub repository to [Render](https://dashboard.render.com).
2. Render will automatically detect the `render.yaml` file and suggest a **Blueprint** deployment.
3. Set your `GEMINI_API_KEY` and `GROQ_API_KEY` in the Render dashboard when prompted.

### How it handles "Sleep"
On the Render free tier, the backend service sleeps after 15 minutes of inactivity. To ensure a smooth user experience:
- **Always-On Frontend:** The React frontend is deployed as a **Static Site**, which never sleeps.
- **Auto-Wake (Pre-warm):** As soon as a user lands on your site, the frontend sends a silent "wake-up" ping to the backend. By the time the user is ready to scan, the backend is already awake and ready to process.

## 🔒 Security & Privacy

- **No Data Persistence:** Images are processed in-memory and sent to AI providers via encrypted HTTPS. ShiroScan never stores your product images on a database.
- **Environment Driven:** All sensitive API keys are managed through standard `.env` patterns and are never hardcoded.
- **CORS Protection:** Configurable origins for safe web deployment.

## 🤝 Contributing

Contributions are welcome! Whether it's adding more Japanese keywords to the rule engine, improving the UI, or fixing bugs:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

## 👤 Author
**Jacob Asir**  
[GitHub](https://github.com/JacobAsir)

---
*Developed for the Japan MVP startup ecosystem.*
