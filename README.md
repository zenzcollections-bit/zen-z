# ZEN-Z COLLECTION — Full-Stack E-Commerce Setup Guide

## 🗂 Files Included
```
zen-z-frontend.html   ← Complete frontend (open in browser)
zen-z-server.js       ← Node.js backend server
package.json          ← Dependencies config
README.md             ← This file
```

---

## 🚀 Quick Start

### 1. Frontend Only (No Server Needed)
Simply open `zen-z-frontend.html` in your browser. The site works in "offline mode" — cart, checkout form, 3D animation, and all UI features work. API calls fail silently and are logged to console.

---

### 2. Full-Stack Setup

#### Prerequisites
- Node.js v16+ installed
- A Razorpay account (free at razorpay.com)
- A Gmail account (for email automation)

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Configure Razorpay
1. Sign up at https://razorpay.com
2. Go to Dashboard → Settings → API Keys
3. Generate Test API Keys
4. In `zen-z-server.js`, replace:
   ```js
   key_id: 'rzp_test_YOUR_KEY_ID',
   key_secret: 'YOUR_RAZORPAY_SECRET'
   ```
5. In `zen-z-frontend.html`, replace in the Razorpay options:
   ```js
   key: 'rzp_test_YOUR_KEY_HERE'
   ```

#### Step 3: Configure Email (Gmail)
1. Enable 2FA on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate an App Password for "Mail"
4. In `zen-z-server.js`, replace:
   ```js
   user: 'your-email@gmail.com',
   pass: 'your-app-password'
   ```

#### Step 4: Start Server
```bash
npm start
# or for development with hot-reload:
npm run dev
```

#### Step 5: Open Site
Visit `http://localhost:3001` in your browser.

---

## 📋 Features

### Frontend
- ✅ 3D animated particle canvas with rotating wireframe
- ✅ 10 products with 3 image slots each (emoji placeholders — replace with real images)
- ✅ Product filtering by category (Tops / Bottoms / Outerwear / Accessories)
- ✅ Product search
- ✅ Size selection per product
- ✅ Wishlist button
- ✅ Sliding cart sidebar
- ✅ 3-step checkout modal
- ✅ Detailed customer form (Name, Email, Phone, DOB, Gender, Notes)
- ✅ Full shipping address form with Indian states
- ✅ Order summary with shipping calculation
- ✅ Razorpay payment integration (Cards, UPI, Net Banking, Wallets)
- ✅ Cash on Delivery option
- ✅ Order confirmation screen
- ✅ Newsletter subscription
- ✅ Custom neon cursor
- ✅ Page loader animation
- ✅ Scroll animations
- ✅ Responsive design
- ✅ Toast notifications

### Backend (zen-z-server.js)
- ✅ Express.js REST API
- ✅ CORS enabled
- ✅ Razorpay order creation & payment verification
- ✅ Order management (create, list, get by ID)
- ✅ Email automation (Nodemailer + Gmail SMTP)
  - Customer order confirmation email (branded HTML)
  - Store notification email
  - Newsletter welcome email with discount code
- ✅ Newsletter subscription
- ✅ Cart event tracking
- ✅ Analytics dashboard
- ✅ Contact form handler
- ✅ Products API

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Server health check |
| GET | /api/products | List all products |
| POST | /api/payment/create-order | Create Razorpay order |
| POST | /api/payment/verify | Verify payment signature |
| POST | /api/orders/create | Create order + send emails |
| GET | /api/orders | List all orders |
| GET | /api/orders/:id | Get order by ID |
| POST | /api/newsletter/subscribe | Subscribe + send welcome email |
| POST | /api/contact | Contact form submission |
| GET | /api/analytics | Sales analytics dashboard |

---

## 🖼 Adding Real Product Images

To replace emoji placeholders with real images, in `zen-z-frontend.html`, find the products array and change the `emoji` array to image URLs:

```js
// Before (emoji):
emoji: ["🥷","⚫","🌑"]

// After (real images):
images: ["./img/hoodie-1.jpg", "./img/hoodie-2.jpg", "./img/hoodie-3.jpg"]
```

Then update the product card render function to use `<img>` tags.

---

## 🛡 Production Checklist

- [ ] Replace test Razorpay keys with live keys
- [ ] Use environment variables (.env file) for secrets
- [ ] Add MongoDB/PostgreSQL for persistent storage
- [ ] Enable HTTPS (SSL certificate)
- [ ] Add rate limiting (express-rate-limit)
- [ ] Add input sanitization (express-validator)
- [ ] Deploy backend to Railway/Render/AWS
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Set up proper CORS origins

---

## 📦 Environment Variables (.env)
```env
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_SECRET=xxxxxxxxxxxx
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password
PORT=3001
NODE_ENV=production
```

---

© 2025 ZEN-Z Collection · Built with ❤️ + ⚡
