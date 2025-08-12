# Cosmic Commander Game - Deployment Guide

## 🚀 Deploy to Render (Free)

### Prerequisites
1. GitHub account with your code pushed
2. MongoDB Atlas account (free tier)
3. Render account (free)

### Step 1: Set up MongoDB Atlas (Free Database)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free account
3. Create a new cluster (choose the free tier M0)
4. Create a database user
5. Whitelist IP address (use 0.0.0.0/0 for all IPs)
6. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

### Step 2: Deploy to Render
1. Go to [Render.com](https://render.com)
2. Sign up and connect your GitHub account
3. Click "New Web Service"
4. Select your repository: `cosmic-commander-game`
5. Configure the service:
   - **Environment**: Docker
   - **Build Command**: (leave empty)
   - **Start Command**: (leave empty - uses Dockerfile)
   - **Health Check Path**: `/health`

### Step 3: Set Environment Variables
In Render's dashboard, add these environment variables:

**Required:**
- `NODE_ENV` = `production`
- `PORT` = `5000`
- `MONGODB_URI` = `your-mongodb-atlas-connection-string`
- `JWT_SECRET` = `cosmic-commander-elite-secret-key-2024-production` (or click Generate)
- `SESSION_SECRET` = `cosmic-session-secret-key-2024-production` (or click Generate)

**Optional (for Google OAuth):**
- `GOOGLE_CLIENT_ID` = `your-google-client-id`
- `GOOGLE_CLIENT_SECRET` = `your-google-client-secret`

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Your game will be live at: `https://your-app-name.onrender.com`

## 🎯 Features
- ✅ Docker containerized
- ✅ MongoDB Atlas integration
- ✅ Health checks
- ✅ Production-ready configuration
- ✅ Graceful shutdown
- ✅ Error handling
- ✅ Security middleware

## 🔧 Local Development
```bash
npm install
npm run dev
```

## 📝 Environment Variables Reference
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cosmic-commander
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 🆓 Free Resources Used
- **Render**: Free web hosting (500 hours/month)
- **MongoDB Atlas**: Free database (512MB storage)
- **GitHub**: Free code hosting

## 🎮 Game Features
- Space combat gameplay
- User authentication (local + Google OAuth)
- Score tracking and leaderboards
- Daily challenges
- User profiles
- Real-time game statistics

## 🔒 Security Features
- JWT authentication
- Session management
- Rate limiting
- Input validation
- CORS protection
- Environment-based configuration

## 📊 Monitoring
- Health check endpoint: `/health`
- API documentation: `/api`
- Error logging and handling

## 🐛 Troubleshooting
1. **Database connection issues**: Check MongoDB Atlas whitelist and connection string
2. **Environment variables**: Ensure all required variables are set in Render
3. **Build failures**: Check Dockerfile and dependencies
4. **CORS errors**: Verify CORS configuration in production

## 📞 Support
For issues, check the logs in Render dashboard or create an issue in the repository.
