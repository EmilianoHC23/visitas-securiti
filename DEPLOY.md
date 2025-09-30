# Vercel Deployment Guide for Visitas SecuriTI

## 🚀 Quick Deploy

1. **Import Project in Vercel:**
   - Go to https://vercel.com/new
   - Import from Git Repository
   - Select `EmilianoHC23/visitas-securiti`

2. **Configure Environment Variables:**
   Add these in Vercel Dashboard > Settings > Environment Variables:
   
   ```
   DATABASE_URL=mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti
   JWT_SECRET=Prod_VisitasSecuriTI_2025_Ultra_Secure_JWT_Secret_Key_For_Production_Only!@#$%
   NODE_ENV=production
   ```

3. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically detect configuration from `vercel.json`
   - Build will use `npm run vercel-build` command

## 📁 Project Structure for Vercel

```
├── api/           # Serverless functions entry point
├── server/        # Express.js backend
├── pages/         # React frontend pages
├── dist/          # Built frontend (auto-generated)
├── vercel.json    # Vercel configuration
└── package.json   # Dependencies & scripts
```

## 🔧 Configuration Files

- `vercel.json` - Vercel deployment configuration
- `api/index.js` - Serverless function entry point
- `server/index.js` - Express app (exported for serverless)

## 🔍 Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check that all dependencies are in `package.json`
   - Verify `npm run build` works locally

2. **API Routes Not Working:**
   - Ensure environment variables are set in Vercel
   - Check that MongoDB Atlas allows connections from Vercel IPs

3. **Database Connection Issues:**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist includes 0.0.0.0/0 for Vercel

### Verification Steps:

1. **Local Build Test:**
   ```bash
   npm run build
   npm run preview
   ```

2. **API Test:**
   ```bash
   npm run server:dev
   # Test endpoints at localhost:3001/api
   ```

## 📊 Monitoring

After deployment, monitor your app:
- Vercel Analytics Dashboard
- Function logs in Vercel
- MongoDB Atlas monitoring

## 🔄 Auto-Deploy

Every push to `main` branch will automatically trigger a new deployment.