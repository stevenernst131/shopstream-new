# Copilot Instructions — ShopStream

## Project Overview

ShopStream is a multi-vendor marketplace admin dashboard built with vanilla JavaScript (frontend) and Node.js/Express + PostgreSQL (backend). It is deployed on **Embr**, a PaaS platform that builds and deploys from GitHub.

- **Embr Project ID:** `prj_a5c00958b3c84db487f118cba51fd3d8`
- **Production Environment:** `env_3cf24674717d46a7a12f84b4b1a80071` (tracks `master` branch)
- **Portal:** https://portal.embr.azure/project/prj_a5c00958b3c84db487f118cba51fd3d8/overview

## Testing Changes via Embr

### PR Preview Environments

When you create a pull request, Embr **automatically creates an ephemeral PR environment** with its own URL, database, and deployment. This is the primary way to test changes before merging.

**Workflow:**

1. **Create a branch and push your changes:**
   ```bash
   git checkout -b feature/my-feature
   # ... make changes ...
   git add . && git commit -m "Add feature"
   git push -u origin feature/my-feature
   ```

2. **Create a pull request** (via `gh pr create` or GitHub UI). Embr detects the PR and automatically provisions a preview environment.

3. **Find the PR environment URL:**
   ```bash
   embr environments list -p prj_a5c00958b3c84db487f118cba51fd3d8
   ```
   Look for the environment matching your PR branch. The URL column has the live preview URL (e.g., `https://pr-my-feature-shopstream-new-abc123.app.embr.azure`).

   You can also get details for a specific environment:
   ```bash
   embr environments get -p prj_a5c00958b3c84db487f118cba51fd3d8 -e <environment-id>
   ```

4. **Browse the PR environment using Playwright** to validate changes visually and functionally:
   - Navigate to the PR environment URL
   - Take snapshots of key pages (Dashboard, Products, Orders, etc.)
   - Verify new UI elements render correctly
   - Test interactive features (clicks, form submissions, navigation)

5. **Push additional commits** to the PR branch — Embr auto-deploys each push to the same PR environment.

6. **The PR environment is automatically cleaned up** when the PR is merged or closed.

### Checking Logs

Use the Embr CLI to inspect application logs and verify there are no errors or red flags:

```bash
# Stream live logs from the PR environment
embr logs -p prj_a5c00958b3c84db487f118cba51fd3d8 -e <environment-id>

# Show recent logs (last 100 lines) without streaming
embr logs -p prj_a5c00958b3c84db487f118cba51fd3d8 -e <environment-id> --tail 100 --no-follow

# Show logs from the last 5 minutes
embr logs -p prj_a5c00958b3c84db487f118cba51fd3d8 -e <environment-id> --since 5m --no-follow

# View build logs for a specific deployment
embr deployments logs <deployment-id> -p prj_a5c00958b3c84db487f118cba51fd3d8 -e <environment-id>
```

**What to look for in logs:**
- Server startup confirmation (listening on port 3000)
- No unhandled exceptions or crash loops
- Database connection established successfully
- API endpoints responding without 5xx errors
- No deprecation warnings or memory leaks

### Checking Production

```bash
# Production environment details
embr environments get -p prj_a5c00958b3c84db487f118cba51fd3d8 -e env_3cf24674717d46a7a12f84b4b1a80071

# Production logs
embr logs -p prj_a5c00958b3c84db487f118cba51fd3d8 -e env_3cf24674717d46a7a12f84b4b1a80071 --tail 50 --no-follow

# List recent deployments
embr deployments list -p prj_a5c00958b3c84db487f118cba51fd3d8 -e env_3cf24674717d46a7a12f84b4b1a80071
```

### Rollbacks

If a deployment causes issues in production, roll back instantly:

```bash
# List deployments to find the last known good one
embr deployments list -p prj_a5c00958b3c84db487f118cba51fd3d8 -e env_3cf24674717d46a7a12f84b4b1a80071

# Rollback to a previous deployment (no rebuild needed)
embr deployments rollback <deployment-id> -p prj_a5c00958b3c84db487f118cba51fd3d8 -e env_3cf24674717d46a7a12f84b4b1a80071
```

## Recommended Validation Checklist

After pushing changes to a PR, follow this checklist:

1. ✅ **PR environment is running** — `embr environments list` shows status `running`
2. ✅ **Browse with Playwright** — Navigate to the PR URL and verify pages load correctly
3. ✅ **Check logs for errors** — `embr logs ... --tail 100 --no-follow` shows no 5xx errors or crashes
4. ✅ **Test the health endpoint** — Confirm `/health` returns a success response
5. ✅ **Verify database seeding** — Dashboard shows expected seed data (products, orders, vendors)
6. ✅ **Test your specific changes** — Use Playwright to interact with the new/modified features

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | Vanilla JS, Vite                  |
| Backend   | Node.js 20, Express               |
| Database  | PostgreSQL (Embr-managed)         |
| Hosting   | Embr PaaS (`embr.yaml` config)    |
| Build     | `vite build` (static assets)      |
| Run       | `node server/index.js` on port 3000 |

## Key Files

- `embr.yaml` — Embr build and deployment configuration
- `server/index.js` — Express server entry point
- `client/` — Frontend source files
- `db/seed.sql` — Database seed data
- `vite.config.js` — Vite build configuration
