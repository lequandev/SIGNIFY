# Signify Frontend

React + TypeScript + Vite frontend for Signify.

## Local development

Requirements: Node.js 22 and npm.

```bash
npm ci
npm run dev
```

Local development uses `http://localhost:8080/api` by default. Override it by
creating `frontend/.env.local`:

```dotenv
VITE_API_URL=http://localhost:8080/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Production deployment on Render

The production API is `https://signify-g3zb.onrender.com/api`. The frontend
Blueprint is defined in `frontend/render.yaml`.

Create or update the Render Static Site with these settings:

| Setting | Value |
| --- | --- |
| Blueprint Path | `frontend/render.yaml` |
| Root Directory | `frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| `VITE_API_URL` | `https://signify-g3zb.onrender.com/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth web client ID |

The SPA rewrite in `render.yaml` sends all browser routes to `index.html`, so
routes such as `/verify-email/:token` and `/payment-success` continue to work
after a page refresh.

After Render assigns the frontend URL, configure the backend Render service:

```dotenv
SPRING_PROFILES_ACTIVE=prod
FRONTEND_URL=https://signify-i3rd.onrender.com
CORS_ALLOWED_ORIGINS=https://signify-i3rd.onrender.com
```

Then redeploy the backend so verification emails, school invitations, PayOS
callbacks, and CORS all use the frontend origin. Also add
`https://signify-i3rd.onrender.com` to Google OAuth's authorized JavaScript
origins.

## Verification

```bash
npm run build
npm run lint
```
