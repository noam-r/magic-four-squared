# GitHub Pages Setup Guide

## Automatic Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup Steps

1. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save

2. **Push Changes**
   ```bash
   git add .
   git commit -m "Add GitHub Pages deployment"
   git push
   ```

3. **Wait for Deployment**
   - Go to **Actions** tab
   - Watch the "Deploy to GitHub Pages" workflow
   - Takes ~2-3 minutes

4. **Access Your Site**
   - Game: `https://yourusername.github.io/magic-four-squared/`
   - Editor: `https://yourusername.github.io/magic-four-squared/editor/`

## What Gets Deployed

The build process creates:
```
dist/
├── index.html          # Game (client)
├── assets/             # JS/CSS bundles
├── editor/             # Puzzle editor
├── puzzles/            # Sample puzzles
└── shared/             # Shared code
```

## URLs

After deployment, your app will be available at:

- **Game:** `https://yourusername.github.io/magic-four-squared/`
- **Editor:** `https://yourusername.github.io/magic-four-squared/editor/`

Replace `yourusername` with your actual GitHub username.

## Local Testing

Test the production build locally:

```bash
# Build for GitHub Pages
npm run build

# Preview the build
npx serve dist

# Open http://localhost:3000
```

## Configuration

### Base Path

The base path is configured in `vite.config.js`:

```javascript
base: process.env.GITHUB_PAGES ? '/magic-four-squared/' : '/'
```

This ensures all assets load correctly on GitHub Pages.

### Build Script

The custom build script (`scripts/build-gh-pages.js`) handles:
- Building the client with Vite
- Copying the editor
- Copying puzzles
- Copying shared files

## Troubleshooting

### Assets Not Loading

If CSS/JS files don't load:
1. Check the base path in `vite.config.js`
2. Ensure it matches your repository name
3. Rebuild and redeploy

### Editor Not Working

If the editor doesn't work:
1. Check browser console for errors
2. Verify shared files are copied to `dist/shared/`
3. Check that pako CDN is accessible

### 404 Errors

If you get 404 errors:
1. Verify GitHub Pages is enabled
2. Check the deployment workflow succeeded
3. Wait a few minutes for DNS propagation

## Manual Deployment

If you prefer manual deployment:

```bash
# Build
npm run build

# Install gh-pages
npm install -g gh-pages

# Deploy
gh-pages -d dist
```

## Custom Domain

To use a custom domain:

1. Add a `CNAME` file to `client/public/`:
   ```
   yourdomain.com
   ```

2. Configure DNS:
   - Add A records pointing to GitHub's IPs
   - Or add CNAME record pointing to `yourusername.github.io`

3. Enable custom domain in GitHub Settings → Pages

## Workflow File

The deployment workflow is in `.github/workflows/deploy.yml`:

- Triggers on push to `main` branch
- Can be manually triggered
- Builds and deploys automatically
- Uses GitHub's official actions

## Environment Variables

The build uses:
- `GITHUB_PAGES=true` - Enables GitHub Pages mode
- Sets correct base path
- Optimizes for production

## Monitoring

Check deployment status:
- **Actions tab** - View workflow runs
- **Environments** - View deployment history
- **Pages settings** - View current deployment

## Updating

To update the live site:

```bash
git add .
git commit -m "Update site"
git push
```

The site will automatically rebuild and redeploy.

---

**Need help?** Check the [GitHub Pages documentation](https://docs.github.com/en/pages)
