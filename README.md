# 🚀 Cosmic Commander Elite

A professional space combat game built with Node.js, Express, and MongoDB. Features real-time gameplay, user authentication, leaderboards, and daily challenges.

## 🌟 Live Demo
🎮 **Play Now**: [Your Render URL will be here]

## ✨ Features

### 🎯 Gameplay
- Immersive space combat experience
- Real-time action and controls
- Multiple enemy types and boss battles
- Power-ups and weapon upgrades
- Progressive difficulty levels

### 👤 User System
- User registration and authentication
- Google OAuth integration
- Secure password handling with bcrypt
- JWT token-based sessions
- User profiles and statistics

### 🏆 Competition
- Global leaderboards
- Personal best tracking
- Daily challenges
- Achievement system
- Player statistics

### 🛡️ Security & Performance
- Rate limiting
- Input validation
- CORS protection
- Session management
- Docker containerization
- Health checks

## 🚀 Quick Start

### Play Online
Visit the live game at: **[Your Render URL]**

### Local Development
```bash
# Clone the repository
git clone https://github.com/AamnaZafar02/cosmic-commander-game.git
cd cosmic-commander-game

# Install dependencies
npm install

# Set up environment variables
cp .env.production .env
# Edit .env with your local settings

# Start development server
npm run dev

# Open http://localhost:5000
```

## 🐳 Docker Deployment

```bash
# Build the image
docker build -t cosmic-commander .

# Run the container
docker run -p 5000:5000 cosmic-commander
```

## 🌐 Production Deployment

### Deploy to Render (Free)
1. Fork this repository
2. Create account at [Render.com](https://render.com)
3. Connect your GitHub account
4. Create new Web Service from your repository
5. Set environment variables (see DEPLOYMENT.md)
6. Deploy!

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🗄️ Database Setup

### MongoDB Atlas (Free)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create free cluster (M0 tier)
3. Create database user
4. Whitelist IP addresses
5. Get connection string
6. Add to environment variables

## ⚙️ Environment Variables

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cosmic-commander
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=your-google-client-id (optional)
GOOGLE_CLIENT_SECRET=your-google-client-secret (optional)
```

## 📁 Project Structure

```
cosmic-commander-game/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── passport.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rateLimiter.js
│   │   └── validation.js
│   ├── models/
│   │   └── User.js
│   └── routes/
│       ├── auth.js
│       ├── game.js
│       └── users.js
├── frontend/
│   ├── scripts/
│   ├── styles/
│   ├── index.html
│   └── game.html
├── Dockerfile
├── server.js
└── package.json
```

## 🎮 Game Controls

- **WASD** or **Arrow Keys**: Move spaceship
- **Spacebar**: Shoot
- **Mouse**: Aim (optional)
- **P**: Pause game
- **R**: Restart after game over

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Passport.js** - OAuth integration
- **bcrypt** - Password hashing

### Frontend
- **Vanilla JavaScript** - Game engine
- **HTML5 Canvas** - Graphics rendering
- **CSS3** - Styling and animations
- **Responsive Design** - Mobile-friendly

### DevOps
- **Docker** - Containerization
- **Render** - Hosting platform
- **MongoDB Atlas** - Database hosting
- **GitHub** - Version control

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/google` - Google OAuth
- `POST /auth/logout` - User logout
- `GET /auth/verify` - Verify token

### Game
- `POST /api/game/save-score` - Save game score
- `GET /api/game/leaderboard` - Get leaderboard
- `GET /api/game/user-stats` - Get user statistics
- `GET /api/game/global-stats` - Get global statistics
- `GET /api/game/daily-challenge` - Get daily challenge

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/change-password` - Change password
- `DELETE /api/users/account` - Delete account

## 📊 Monitoring

- **Health Check**: `/health`
- **API Documentation**: `/api`
- **Status Monitoring**: Built-in health checks
- **Error Logging**: Comprehensive error handling

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by classic space shooter games
- Community feedback and contributions

## 📞 Support

- Create an issue for bug reports
- Star the repository if you like it
- Share with friends and fellow developers

---

🌟 **Star this repository if you found it helpful!** 🌟

Made with ❤️ by [Your Name]
