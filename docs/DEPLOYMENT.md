# Guide de déploiement — MarketAgent

## Architecture

```
frontend/   → React + Vite  → Vercel (gratuit)
backend/    → FastAPI        → Railway (gratuit jusqu'à 500h/mois)
```

---

## 1. Prérequis

- Compte GitHub (pour connecter Vercel et Railway)
- Compte [Vercel](https://vercel.com) (gratuit)
- Compte [Railway](https://railway.app) (gratuit)
- Clé API Anthropic → https://console.anthropic.com
- Bot Telegram (voir AlertsPanel dans l'app)

---

## 2. Backend — Railway

### a) Pusher le code sur GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/TON_USERNAME/market-agent
git push -u origin main
```

### b) Déployer sur Railway
1. Va sur https://railway.app → New Project → Deploy from GitHub
2. Sélectionne ton repo, puis le dossier `backend/`
3. Railway détecte automatiquement Python/FastAPI
4. Ajoute les variables d'environnement :
   ```
   ANTHROPIC_API_KEY=sk-ant-xxx
   TELEGRAM_BOT_TOKEN=xxx
   TELEGRAM_CHAT_ID=xxx
   ```
5. Railway te donne une URL publique ex: `https://market-agent-backend.up.railway.app`

### c) Procfile (Railway en a besoin)
Crée un fichier `backend/Procfile` :
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## 3. Frontend — Vercel

### a) Configurer l'URL de l'API
Crée `frontend/.env.production` :
```
VITE_API_URL=https://market-agent-backend.up.railway.app/api
```

### b) Déployer sur Vercel
1. Va sur https://vercel.com → New Project → Import from GitHub
2. Sélectionne le dossier `frontend/`
3. Vercel détecte Vite automatiquement
4. Ajoute la variable d'environnement :
   ```
   VITE_API_URL=https://TON_URL_RAILWAY.up.railway.app/api
   ```
5. Deploy → tu obtiens une URL ex: `https://market-agent.vercel.app`

---

## 4. Lancer en local (développement)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # puis remplir les vraies valeurs
uvicorn main:app --reload
# → http://localhost:8000
# → Docs auto: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 5. Structure du projet

```
market-agent/
├── backend/
│   ├── main.py                    # FastAPI app + scheduler
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/
│   │   ├── markets.py             # /api/markets/*
│   │   ├── agent.py               # /api/agent/*
│   │   └── alerts.py              # /api/alerts/*
│   └── services/
│       ├── market_service.py      # yfinance + indicateurs
│       ├── agent_service.py       # Claude API
│       └── telegram_service.py    # Bot Telegram
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx
        ├── services/api.js
        └── components/
            ├── MarketOverview.jsx
            ├── SuggestionsPanel.jsx
            ├── ChatPanel.jsx
            └── AlertsPanel.jsx
```

---

## 6. Pour aller plus loin (monétisation)

- Ajouter une auth (Supabase Auth, gratuit)
- Freemium : limiter les suggestions à 2 sans compte premium
- Stripe pour les paiements (5-15€/mois)
- Ajouter un vrai historique des alertes en base (Supabase PostgreSQL)
