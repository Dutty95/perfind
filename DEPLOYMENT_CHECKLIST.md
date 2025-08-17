# 🚀 Deployment Checklist

This guide will help you deploy your Personal Finance Dashboard to GitHub, Netlify (frontend), and Railway (backend).

## 📋 Pre-Deployment Checklist

### ✅ Files to Keep Safe (Not Commit to Git)

The following files are automatically excluded by `.gitignore`:
- `backend/.env` (your local environment variables)
- `backend/.env.production` (production secrets)
- `.env` (frontend environment variables)
- `node_modules/` (dependencies)
- `build/` and `dist/` (build outputs)

### ✅ Template Files Created
- ✅ `.env.example` (frontend template)
- ✅ `backend/.env.example` (backend template)
- ✅ `backend/.env.production.example` (production template)

## 🔧 Step-by-Step Deployment

### 1. 📁 GitHub Repository Setup

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit - Personal Finance Dashboard"

# Add remote repository
git remote add origin https://github.com/yourusername/your-repo-name.git

# Push to GitHub
git push -u origin main
```

### 2. 🚂 Railway Backend Deployment

1. **Connect to Railway:**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub account
   - Create new project from your repository
   - Select the `backend` folder as root directory

2. **Set Environment Variables in Railway:**
   ```
   NODE_ENV=production
   PORT=5001
   MONGO_URI=mongodb+srv://duttynana66:MON9Zpr9acblksAN@perfind.ofdsddk.mongodb.net/?retryWrites=true&w=majority&appName=perfind
   JWT_SECRET=your_32_character_secret_here
   JWT_REFRESH_SECRET=your_32_character_refresh_secret_here
   SESSION_SECRET=your_32_character_session_secret_here
   FRONTEND_URL=https://your-app-name.netlify.app
   BACKEND_URL=https://your-app-name.railway.app
   ```

3. **Generate Strong Secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Run this command 3 times to generate JWT_SECRET, JWT_REFRESH_SECRET, and SESSION_SECRET.

4. **Optional OAuth Setup:**
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   MICROSOFT_CLIENT_ID=your_microsoft_client_id
   MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
   ```

### 3. 🌐 Netlify Frontend Deployment

1. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Connect your GitHub account
   - Create new site from your repository

2. **Build Settings:**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Environment Variables in Netlify:**
   ```
   VITE_API_URL=https://your-app-name.railway.app
   NODE_ENV=production
   ```

4. **Update Railway FRONTEND_URL:**
   - After Netlify deployment, update the `FRONTEND_URL` in Railway with your actual Netlify domain

### 4. 🔗 OAuth Configuration (If Using)

**Google OAuth Console:**
- Add authorized redirect URI: `https://your-app-name.railway.app/api/auth/google/callback`
- Add authorized JavaScript origin: `https://your-app-name.netlify.app`

**Microsoft Azure Portal:**
- Add redirect URI: `https://your-app-name.railway.app/api/auth/microsoft/callback`
- Add web platform: `https://your-app-name.netlify.app`

## 🧪 Testing Deployment

### Backend Health Check
Visit: `https://your-app-name.railway.app/api/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "database": "connected",
  "cors": "configured"
}
```

### Frontend-Backend Connection
1. Open your Netlify app
2. Try to register/login
3. Check browser console for any CORS errors
4. Verify data loads correctly

## 🔍 Common Issues & Solutions

### CORS Errors
- Ensure `FRONTEND_URL` in Railway matches your Netlify domain exactly
- Check that both HTTP and HTTPS are configured correctly

### Authentication Issues
- Verify all JWT secrets are set in Railway
- Check OAuth redirect URIs match your Railway domain

### Database Connection
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Verify the connection string is correct

### Build Failures
- Check that all dependencies are in `package.json`
- Ensure build commands are correct

## 📝 Post-Deployment Checklist

- [ ] Backend health endpoint responds correctly
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard data loads
- [ ] Charts render correctly
- [ ] Transactions can be added/edited
- [ ] Budget features work
- [ ] Goals functionality works
- [ ] OAuth login works (if configured)

## 🔒 Security Notes

1. **Never commit sensitive files:**
   - `.env` files with real secrets
   - Database credentials
   - API keys

2. **Use strong secrets:**
   - Minimum 32 characters for JWT secrets
   - Use cryptographically secure random generation

3. **Regular updates:**
   - Keep dependencies updated
   - Monitor for security vulnerabilities
   - Rotate secrets periodically

## 🆘 Support

If you encounter issues:
1. Check Railway and Netlify deployment logs
2. Verify environment variables are set correctly
3. Test API endpoints individually
4. Check browser console for frontend errors

---

**Your app URLs:**
- Frontend: `https://your-app-name.netlify.app`
- Backend: `https://your-app-name.railway.app`
- Health Check: `https://your-app-name.railway.app/api/health`