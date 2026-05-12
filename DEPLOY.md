# 🚀 Deployment Guide — Uday Steels & General Stores

## Run Locally (Development)

```bash
# Terminal 1 — Backend
node server/index.js

# Terminal 2 — Frontend  
cd client && npm start
```

---

## Step 1 — Set Up MongoDB Atlas (Free)

1. Go to https://mongodb.com/atlas → Sign up free
2. Create a free **M0** cluster
3. **Database Access** → Add user with password
4. **Network Access** → Add IP → Allow from anywhere: `0.0.0.0/0`
5. **Connect** → Drivers → Copy connection string
6. Replace `MONGO_URI` in your deployment env vars:
   ```
   MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/ecommerce
   ```

---

## Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Uday Steels ecommerce app"
git remote add origin https://github.com/yourusername/uday-steels.git
git push -u origin main
```

---

## Step 3 — Deploy Backend on Render (Free)

1. Go to https://render.com → New → **Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Name**: uday-steels-api
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Add all environment variables from `.env.example`
5. Set `NODE_ENV=production`
6. Deploy → copy your backend URL e.g. `https://uday-steels-api.onrender.com`

---

## Step 4 — Deploy Frontend on Render (Free)

1. New → **Static Site**
2. Connect same GitHub repo
3. Settings:
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `client/build`
4. Add environment variable:
   ```
   REACT_APP_API_URL=https://uday-steels-api.onrender.com
   ```
5. Deploy → copy your frontend URL

---

## Step 5 — Update Backend CORS

In your backend Render service, add:
```
FRONTEND_URL=https://your-frontend.onrender.com
```

---

## Step 6 — Switch Razorpay to Live Mode

1. Go to https://razorpay.com → Settings → API Keys
2. Switch to **Live Mode**
3. Generate live keys
4. Update in Render backend env vars:
   ```
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_live_secret
   ```

---

## Important Credentials

| Key | Value |
|-----|-------|
| Seller Secret Key | `UDAY@STEELS#2024` |
| Default seller email | `shanukorukonda5@gmail.com` |
| Razorpay (test) | Already in `.env` |

---

## After Deployment

- Test registration with OTP
- Test adding a product as seller
- Test buying as buyer (Razorpay test cards work in test mode)
- Check seller gets order email
- Test chat widget

### Razorpay Test Card
- Card: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits
- OTP: `1234`
