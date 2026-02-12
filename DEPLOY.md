# Deployment Guide

## Before you deploy

1. **Backend** – Set these in your host’s environment (or `.env`):

   | Variable         | Description                          | Example (production)              |
   |------------------|--------------------------------------|-----------------------------------|
   | `PORT`           | Server port                         | `3000` or host default (e.g. 8080) |
   | `CORS_ORIGIN`    | Frontend origin (for CORS + Socket) | `https://yourdomain.com`          |
   | `MONGO_URI`      | MongoDB connection string           | `mongodb+srv://...`               |
   | `JWT_SECRET`     | Secret for JWT signing             | Long random string                |
   | `GEMINI_API_KEY` | Google Gemini API key               | From Google AI Studio             |
   | `PINECONE_API_KEY` | Pinecone API key (if used)        | From Pinecone console             |

2. **Frontend** – At **build time** set:

   | Variable        | Description        | Example (production)        |
   |-----------------|--------------------|----------------------------|
   | `VITE_API_URL`  | Backend base URL   | `https://api.yourdomain.com` |

   Build the frontend with this set, e.g.:

   ```bash
   cd Frontend
   VITE_API_URL=https://api.yourdomain.com npm run build
   ```

3. **CORS / Socket** – `CORS_ORIGIN` must match the **exact** URL users use to open the app (scheme + host + port if non-default). Same origin is used for Socket.IO.

## Deploy steps

1. Deploy the **backend** (Node, `node server.js` or your process manager), with the env vars above. Ensure the app is reachable at the URL you will use for `VITE_API_URL`.
2. Build the **frontend** with `VITE_API_URL` set to that backend URL, then serve the `Frontend/dist` output (e.g. static hosting or same server).
3. Ensure cookies/credentials work: backend and frontend should use the same top-level domain or configure CORS/credentials accordingly.

## Quick checklist

- [ ] Backend env: `PORT`, `CORS_ORIGIN`, `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY` (and `PINECONE_API_KEY` if used)
- [ ] Frontend build: `VITE_API_URL` set to backend URL
- [ ] No hardcoded `localhost` in production build
- [ ] HTTPS in production for API and frontend
