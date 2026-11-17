RiderLink MX

RiderLink MX is an app that helps people who need to send something — food, documents, or any item — but don't have time to do it themselves. On the other side, it helps repartidores earn extra money by completing a mandadito.

This app is being created for the community and its not a common app like uber or didi. This app helps build loyalty and confidence between repartidores and clients. This app will work like a social media the people trust each other based on reputation and reviews. 
This is a tool to connect people. No commissions. No payments processed by the app. Users agree and pay directly, and are responsible for their own agreements.


Tech Stack: React + Vite (Web demo), Kotlin (App Version, new version working it), Jetpack Compose, Python + FastAPI(main), SQLite

Project structure: backend / frontend-react / android-app (coming soon)

## How it works

1. A client publishes a need — what to send, from where, to where, and how much they offer.
2. A repartidor sees it in the feed and contacts the client on WhatsApp.
3. They agree directly on price and details — no commissions, no payment in the app.
4. After the service, they rate each other and build reputation.

## How to run it locally

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

The API runs at http://127.0.0.1:8000
cd frontend-react
npm install
npm run dev

### 3. Backend demo link — just add this next to your Netlify link

Live demo:
- Frontend: https://mandaditoswebapp.netlify.app/
- Backend API: https://mandaditosapp.onrender.com