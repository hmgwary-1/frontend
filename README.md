# Phoenix Media Vault — Frontend

Frontend for **Design of a Mobile Application for Hiding Media (Photos and Videos) Galleries**
Student: Hamdan Madu Gwary | U22/CPS/1064

## Structure

```
phoenix-frontend/
├── index.html          # HTML entry point
├── package.json
├── vite.config.js
├── .env                # VITE_API_BASE points to the backend
└── src/
    ├── main.jsx         # Mounts <App /> to #root
    └── App.jsx           # Entire application (auth, albums, media, UI) — kept
                          # as one file to mirror the single-file backend server.js
```

Kept compacted rather than split into many component files/folders, matching
the same single-file philosophy as `server.js` on the backend.

## Setup

```bash
cd phoenix-frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` by default and talks to the backend at the
URL set in `.env` (`VITE_API_BASE`, default `http://localhost:5000/api`).

## Backend

Make sure `phoenix-media-vault-backend` (server.js) is running on port 5000
(or update `VITE_API_BASE` accordingly) with MongoDB connected and a `.env`
file with `JWT_SECRET`, `ENC_SECRET`, `MONGO_URI`.

## Auth token storage

The app stores the JWT under `localStorage["phoenix_token"]`, matching the
`generateToken()` / `authenticate()` flow in `server.js`.
