# Azure Deployment Guide

## Quick Fix for 503 Error

The 503 error is caused by the server trying to connect to the private PostgreSQL database. Here's how to fix it:

### Option 1: Deploy with Mock Mode (Quick Fix)

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "Fix Azure deployment - add mock mode fallback"
   git push
   ```

2. **The Azure app should automatically redeploy** and work in mock mode

### Option 2: Configure Azure for Private Database Access

If you want to use the real database, you need to:

1. **Set up VNet Integration** in Azure App Service:
   - Go to your App Service in Azure Portal
   - Navigate to "Networking" > "VNet Integration"
   - Connect to the same VNet as your PostgreSQL server

2. **Set Environment Variables** in Azure App Service:
   - Go to "Configuration" > "Application settings"
   - Add: `PG_URL` = `postgresql://pchyekepax:maNE1123@docsearchengine-pg.postgres.database.azure.com:5432/docsearchengine?sslmode=require`

3. **Disable Server-Side Builds** so Azure uses the artifact from CI:
   - Still under "Configuration" > "Application settings"
   - Add `SCM_DO_BUILD_DURING_DEPLOYMENT` with value `0`
   - This stops Oryx from running `npm run build` during deployment because GitHub Actions already bundles everything into `backend.zip`

4. **Confirm the GitHub Actions workflow**:
   - The `.github/workflows/azure.yml` pipeline builds the frontend + backend, copies the built frontend into `backend/dist/public`, reinstalls production-only dependencies, zips the backend folder, and deploys `backend.zip`
   - Make sure no other workflow or manual deployment targets the repo root—`azure.yml` should be the only deployment path

### Option 3: Use Public Database (Alternative)

If you can make your PostgreSQL database publicly accessible:
1. Go to Azure Portal > PostgreSQL server
2. Navigate to "Networking"
3. Change from "Private access" to "Public access"
4. Add your IP address to allowed IPs

## Testing

After deployment, test these endpoints:
- `https://docsearchengine-amd3dvf7hch0cnax.eastus2-01.azurewebsites.net/health`
- `https://docsearchengine-amd3dvf7hch0cnax.eastus2-01.azurewebsites.net/app.html`

The app will work in mock mode with sample data for testing.
