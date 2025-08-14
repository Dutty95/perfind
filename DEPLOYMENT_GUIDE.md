# Deployment Guide for Perfind

This guide will walk you through deploying your Perfind application to production using MongoDB Atlas, GitHub, and Netlify.

## 📋 Pre-Deployment Checklist ✅

- [x] Environment files properly configured
- [x] .gitignore updated to exclude sensitive files
- [x] Build process tested and working
- [x] Production start script added to backend
- [x] Security configurations in place

## 🗄️ Step 1: Set Up MongoDB Atlas (Free Tier)

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose the **FREE** tier (M0 Sandbox)
4. Select a cloud provider and region (choose closest to your users)
5. Create your cluster (this takes 1-3 minutes)

### 1.2 Configure Database Access
1. In Atlas dashboard, go to **Database Access**
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and strong password
5. Set user privileges to "Read and write to any database"
6. Click "Add User"

### 1.3 Configure Network Access
1. Go to **Network Access**
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - This is needed for Netlify deployment
   - For better security, you can later restrict to specific IPs
4. Click "Confirm"

### 1.4 Get Connection String
1. Go to **Database** → **Connect**
2. Choose "Connect your application"
3. Select "Node.js" and version "4.1 or later"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `perfind`

Example: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/perfind?retryWrites=true&w=majority`

## 🔧 Step 2: Update Database Configuration

### 2.1 Update Backend Environment
1. Open `backend/.env.production`
2. Replace the `MONGO_URI` with your Atlas connection string
3. Keep this file for reference but **DO NOT commit it to Git**

### 2.2 Test Connection (Optional)
1. Temporarily update your local `backend/.env` with the Atlas URI
2. Run your backend locally to test the connection
3. Revert back to local MongoDB URI for development

## 📚 Step 3: Prepare Git Repository

### 3.1 Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### 3.2 Create GitHub Repository
1. Go to [GitHub](https://github.com)
2. Click "New repository"
3. Name it `perfind` (or your preferred name)
4. Make it **Public** (required for free Netlify deployment)
5. **DO NOT** initialize with README (you already have files)
6. Click "Create repository"

### 3.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/perfind.git
git branch -M main
git push -u origin main
```

## 🚀 Step 4: Deploy Backend (Choose One Option)

### Option A: Railway (Recommended - Free Tier)
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `perfind` repository
5. Railway will auto-detect the backend in `/backend` folder
6. Add environment variables in Railway dashboard:
   - `MONGO_URI`: Your Atlas connection string
   - `JWT_SECRET`: Your JWT secret
   - `JWT_REFRESH_SECRET`: Your refresh secret
   - `SESSION_SECRET`: Your session secret
   - `GOOGLE_CLIENT_ID`: Your Google OAuth ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth secret
   - `MICROSOFT_CLIENT_ID`: Your Microsoft OAuth ID
   - `MICROSOFT_CLIENT_SECRET`: Your Microsoft OAuth secret
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `https://your-app-name.netlify.app` (update after Netlify deployment)
7. Deploy and note your backend URL

### Option B: Render (Alternative)
1. Go to [Render](https://render.com)
2. Connect your GitHub account
3. Create a new "Web Service"
4. Connect your repository
5. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add the same environment variables as above

## 🌐 Step 5: Deploy Frontend to Netlify

### 5.1 Create Netlify Account
1. Go to [Netlify](https://app.netlify.com)
2. Sign up with GitHub

### 5.2 Deploy from Git
1. Click "New site from Git"
2. Choose "GitHub" and authorize Netlify
3. Select your `perfind` repository
4. Configure build settings:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click "Deploy site"

### 5.3 Configure Environment Variables
1. Go to **Site settings** → **Environment variables**
2. Add:
   - `VITE_API_URL`: Your backend URL from Step 4 (e.g., `https://your-backend.railway.app`)

### 5.4 Update Backend CORS
1. Update your backend's `FRONTEND_URL` environment variable
2. Set it to your Netlify URL (e.g., `https://your-app-name.netlify.app`)
3. Redeploy your backend

### 5.5 Configure Redirects for SPA
1. Create `public/_redirects` file in your project root:
```
/*    /index.html   200
```
2. Commit and push this change
3. Netlify will auto-deploy

## 🔄 Step 6: Update OAuth Redirect URIs

### 6.1 Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to your OAuth 2.0 client
3. Add authorized redirect URIs:
   - `https://your-backend-url.com/auth/google/callback`

### 6.2 Microsoft OAuth
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your app registration
3. Add redirect URIs:
   - `https://your-backend-url.com/auth/microsoft/callback`

## ✅ Step 7: Final Testing

1. Visit your Netlify URL
2. Test user registration/login
3. Test OAuth login (Google/Microsoft)
4. Test all main features:
   - Dashboard loading
   - Transaction creation
   - Budget management
   - Goals functionality
5. Check browser console for errors
6. Test on mobile devices

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Ensure `FRONTEND_URL` in backend matches your Netlify URL
   - Check that backend is running and accessible

2. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check network access settings in Atlas
   - Ensure database user has correct permissions

3. **OAuth Not Working**
   - Verify redirect URIs are updated
   - Check OAuth client IDs and secrets
   - Ensure backend URL is correct in OAuth settings

4. **Build Failures**
   - Check environment variables are set correctly
   - Verify all dependencies are in package.json
   - Check build logs for specific errors

## 📝 Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Database connection works
- [ ] User registration/login works
- [ ] OAuth login works
- [ ] All features functional
- [ ] Mobile responsive
- [ ] No console errors
- [ ] SSL certificates active (https)

## 🎉 Congratulations!

Your Perfind application is now live! Share your Netlify URL with users.

### Your URLs:
- **Frontend**: `https://your-app-name.netlify.app`
- **Backend**: `https://your-backend-url.com`
- **Database**: MongoDB Atlas cluster

---

**Need Help?** Check the troubleshooting section or review the deployment logs in Netlify and your backend hosting service.