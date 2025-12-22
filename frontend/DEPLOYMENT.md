# Axum Deployment Guide

## Quick Start (Local Development)

### Step 1: Install Dependencies
```bash
cd axum-frontend
npm install
```

### Step 2: Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your values:
# REACT_APP_API_URL=http://localhost:5000
# REACT_APP_TELEGRAM_BOT_USERNAME=YourBotUsername
```

### Step 3: Start Development Server
```bash
npm start
```

Visit `http://localhost:3000` to see the app!

---

## Production Deployment (Vercel)

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
cd axum-frontend
vercel
```

4. **Configure on First Deploy**
- Project name: `axum-frontend`
- Framework: `Create React App`
- Build command: `npm run build`
- Output directory: `build`

5. **Set Environment Variables**
```bash
vercel env add REACT_APP_API_URL production
# Enter your production API URL when prompted

vercel env add REACT_APP_TELEGRAM_BOT_USERNAME production
# Enter your bot username when prompted
```

6. **Redeploy with Environment Variables**
```bash
vercel --prod
```

### Option 2: Deploy via GitHub Integration

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit: Axum frontend"
git remote add origin https://github.com/yourusername/axum-frontend.git
git push -u origin main
```

2. **Connect to Vercel**
- Go to [vercel.com/new](https://vercel.com/new)
- Click "Import Project"
- Select your GitHub repository
- Configure settings:
  - Framework Preset: `Create React App`
  - Build Command: `npm run build`
  - Output Directory: `build`
  - Install Command: `npm install`

3. **Add Environment Variables**
In Vercel dashboard → Settings → Environment Variables:
```
REACT_APP_API_URL = https://your-api.com
REACT_APP_TELEGRAM_BOT_USERNAME = AxumGameBot
```

4. **Deploy**
Click "Deploy" - Vercel will build and deploy automatically!

---

## Backend API Requirements

Your backend must provide these endpoints:

### Authentication
```
POST /api/auth/telegram
Body: { id, first_name, username, photo_url, auth_date, hash }
Response: { token: string, user: {...} }

GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { id, username, points, badges, ... }
```

### Game Data
```
GET /api/levels
Response: { levels: [...] }

GET /api/user/stats
Response: { currentLevel, totalPoints, globalRank, badges, ... }

GET /api/leaderboard?level=X
Response: { rankings: [...], finalists: [...] }
```

### Tasks
```
GET /api/tasks
Response: { tasks: [...] }

POST /api/tasks/:id/complete
Response: { success: boolean, points: number }
```

### Rewards
```
GET /api/rewards
Response: { rewards: [...] }
```

---

## CORS Configuration

Your backend must allow requests from your frontend domain:

### Express.js Example
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app',
    'https://yourdomain.com'
  ],
  credentials: true
}));
```

---

## Telegram Bot Setup

1. **Create Bot with BotFather**
```
/newbot
Name: Axum Game Bot
Username: AxumGameBot
```

2. **Configure Bot for Web Login**
```
/setdomain
Select: @AxumGameBot
Domain: your-vercel-app.vercel.app
```

3. **Set Bot Commands** (Optional)
```
/setcommands
start - Begin your quest
help - Get help
leaderboard - View rankings
```

---

## Custom Domain Setup (Optional)

### In Vercel Dashboard

1. Go to Project Settings → Domains
2. Add your domain: `axum.yourdomain.com`
3. Follow DNS configuration instructions
4. Add CNAME record:
   ```
   Type: CNAME
   Name: axum
   Value: cname.vercel-dns.com
   ```
5. Wait for propagation (5-10 minutes)
6. Update Telegram bot domain to match

---

## Environment-Specific Configuration

### Development (.env.local)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_TELEGRAM_BOT_USERNAME=AxumGameBot_Dev
```

### Production (Vercel)
```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_TELEGRAM_BOT_USERNAME=AxumGameBot
```

---

## Monitoring & Analytics

### Vercel Analytics (Built-in)
Automatically tracks:
- Page views
- Unique visitors
- Top pages
- Performance metrics

Enable in: Vercel Dashboard → Analytics → Enable

### Custom Analytics (Optional)
Add Google Analytics or Mixpanel:

1. Add to `.env`:
```env
REACT_APP_GA_ID=UA-XXXXXXXXX-X
```

2. Add to `public/index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR_GA_ID');
</script>
```

---

## Troubleshooting Common Issues

### Issue: "Failed to fetch" errors
**Solution**: Check CORS configuration on backend and verify API_URL in environment variables

### Issue: Telegram login not working
**Solution**: 
- Verify bot username matches .env
- Check domain configuration in BotFather
- Ensure HTTPS in production

### Issue: Build fails on Vercel
**Solution**:
- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json
- Test build locally: `npm run build`

### Issue: Environment variables not working
**Solution**:
- Variables must start with `REACT_APP_`
- Redeploy after adding variables
- Clear cache: `vercel --force`

---

## Performance Optimization

### Code Splitting
Already implemented via React.lazy (if needed):
```javascript
const GamePage = React.lazy(() => import('./pages/GamePage'));
```

### Image Optimization
Use WebP format for images:
```bash
# Convert images to WebP
cwebp input.png -q 80 -o output.webp
```

### Caching Strategy
Vercel automatically handles:
- Static asset caching
- Edge caching
- Automatic compression (Brotli/Gzip)

---

## Continuous Deployment

### Automatic Deployments
Once connected to GitHub:
1. Push to `main` branch → Production deploy
2. Push to other branches → Preview deploy
3. Pull requests → Preview deploy with unique URL

### Rollback
In Vercel dashboard:
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → Promote to Production

---

## Security Checklist

- [ ] API endpoints use HTTPS
- [ ] Environment variables are secure
- [ ] CORS is properly configured
- [ ] Telegram auth is validated on backend
- [ ] Rate limiting is enabled on API
- [ ] Input validation on all forms
- [ ] XSS protection headers enabled
- [ ] Regular dependency updates

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **React Docs**: https://react.dev
- **Telegram Bot API**: https://core.telegram.org/bots/api

---

**Deployment Complete! 🎉**

Your Axum frontend should now be live and ready for Queen Makeda's quest!
