# Vercel frontend deploy

Deploy the frontend as a static Vite app.

## Vercel project settings

Use `frontend` as the Root Directory in Vercel project settings.

- Framework Preset: Vite
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`

Set this environment variable in Vercel:

```env
VITE_API_URL=/api
```

If the variable already exists in Vercel as
`VITE_API_URL=https://growcore.onrender.com`, change it to `/api` and redeploy.
The repository also includes `frontend/.env.production` with `/api` as the
production default.

The backend URL is not removed. It stays in `frontend/vercel.json`, which proxies
`/api/*` to `https://growcore.onrender.com/*`.

This keeps auth requests same-origin from the browser point of view, so JWT
cookies are stored on the frontend domain instead of being treated as third-party
cookies between Vercel and Render.

For local development, `frontend/.env` can use the backend directly:

```env
VITE_API_URL=https://growcore.onrender.com
VITE_API_PROXY_TARGET=http://localhost:8000
```

## Backend CORS

After Vercel gives the production frontend URL, set it on the backend host:

```env
FRONTEND_URL=https://grow-core.vercel.app
```

For preview deployments or a custom domain, add extra origins as a comma-separated list:

```env
ADDITIONAL_CORS_ORIGINS=https://your-project-git-main.vercel.app,https://growcore.example.com
```

The backend uses cookie auth, so the frontend origin must be listed exactly.
