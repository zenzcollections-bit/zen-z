// ============================================================
// ZEN-Z COLLECTION — Backend Server
// Stack: Node.js + Express + Nodemailer + Razorpay
// ============================================================

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// ───── MIDDLEWARE ─────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ───── CONFIG ─────
const CONFIG = {
  razorpay: {
    key_id: 'rzp_test_YOUR_KEY_ID',       // ← Replace with your Razorpay key
    key_secret: 'YOUR_RAZORPAY_SECRET'    // ← Replace with your Razorpay secret
  },
  email: {
    host: 'smtp.gmail.com',
    port: 587,
    user: 'your-email@gmail.com',          // ← Replace with your Gmail
    pass: 'your-app-password',             // ← Replace with Gmail App Password
    from: '"ZEN-Z Collection" <your-email@gmail.com>',
    storeEmail: 'orders@zen-z.in'
  }
};

// ───── IN-MEMORY DB (use MongoDB/PostgreSQL in production) ─────
let orders = [];
let subscribers = [];
let cartEvents = [];

// ───── RAZORPAY INSTANCE ─────
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: CONFIG.razorpay.key_id,
    key_secret: CONFIG.razorpay.key_secret
  });
} catch(e) {
  console.log('[Razorpay] Not initialized - check credentials');
}

// ───── EMAIL TRANSPORTER ─────
const transporter = nodemailer.createTransport({
  host: CONFIG.email.host,
  port: CONFIG.email.port,
  secure: false,
  auth: { user: CONFIG.email.user, pass: CONFIG.email.pass },
  tls: { rejectUnauthorized: false }
});

// ───── EMAIL TEMPLATES ─────
function orderConfirmationEmail(order) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #1A1A2E;">${item.name}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #1A1A2E;text-align:center;">${item.qty}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #1A1A2E;text-align:right;color:#00FFD1;font-weight:700;">
        ₹${(item.price * item.qty).toLocaleString('en-IN')}
      </td>
    </tr>`).join('');

  const total = order.items.reduce((s,c) => s + c.price*c.qty, 0);
  const shipping = total >= 2000 ? 0 : 99;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050508;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#050508;">
    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#0A0A12,#1A1A2E);padding:40px 40px 30px;text-align:center;border-bottom:1px solid rgba(0,255,209,0.2);">
      <div style="font-family:monospace;font-size:28px;font-weight:900;letter-spacing:0.1em;background:linear-gradient(135deg,#00FFD1,#A855F7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">ZEN-Z</div>
      <div style="color:#8888AA;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;margin-top:6px;">COLLECTION</div>
    </div>
    <!-- HERO -->
    <div style="background:#0A0A12;padding:40px;text-align:center;border-bottom:1px solid rgba(0,255,209,0.1);">
      <div style="font-size:48px;margin-bottom:16px;">✅</div>
      <h1 style="color:#00FFD1;font-size:24px;font-weight:900;letter-spacing:0.05em;margin:0 0 12px;text-transform:uppercase;">Order Confirmed!</h1>
      <p style="color:#8888AA;font-size:15px;line-height:1.6;margin:0;">Thank you, <strong style="color:#F0F0F8;">${order.customer.name}</strong>! Your order has been placed and is being processed.</p>
      <div style="display:inline-block;background:rgba(0,255,209,0.1);border:1px solid rgba(0,255,209,0.3);padding:10px 24px;border-radius:2px;margin-top:20px;">
        <span style="color:#8888AA;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;">Order ID</span>
        <div style="color:#00FFD1;font-weight:700;font-size:16px;margin-top:4px;">${order.orderId}</div>
      </div>
    </div>
    <!-- ORDER ITEMS -->
    <div style="background:#050508;padding:40px;">
      <h2 style="color:#F0F0F8;font-size:14px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 20px;">Order Summary</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#0A0A12;">
            <th style="padding:12px 16px;text-align:left;color:#8888AA;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Product</th>
            <th style="padding:12px 16px;text-align:center;color:#8888AA;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Qty</th>
            <th style="padding:12px 16px;text-align:right;color:#8888AA;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Amount</th>
          </tr>
        </thead>
        <tbody style="color:#F0F0F8;">${itemsHtml}</tbody>
        <tfoot>
          <tr><td colspan="2" style="padding:12px 16px;color:#8888AA;font-size:13px;">Shipping</td><td style="padding:12px 16px;text-align:right;color:#F0F0F8;">${shipping === 0 ? 'FREE' : '₹'+shipping}</td></tr>
          <tr style="background:#0A0A12;">
            <td colspan="2" style="padding:16px;font-weight:700;font-size:15px;text-transform:uppercase;letter-spacing:0.1em;color:#F0F0F8;">Total</td>
            <td style="padding:16px;text-align:right;font-weight:700;font-size:20px;color:#00FFD1;">₹${(total+shipping).toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    <!-- SHIPPING ADDRESS -->
    <div style="background:#0A0A12;padding:40px;border-top:1px solid rgba(0,255,209,0.1);">
      <h2 style="color:#F0F0F8;font-size:14px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 16px;">Shipping To</h2>
      <div style="color:#8888AA;font-size:14px;line-height:1.8;">
        <div style="color:#F0F0F8;font-weight:600;">${order.customer.name}</div>
        <div>${order.shipping.addr1}${order.shipping.addr2 ? ', '+order.shipping.addr2 : ''}</div>
        <div>${order.shipping.city}, ${order.shipping.state} ${order.shipping.pin}</div>
        <div>${order.shipping.country}</div>
        <div style="margin-top:8px;">📞 ${order.customer.phone}</div>
      </div>
    </div>
    <!-- FOOTER -->
    <div style="background:#050508;padding:30px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.04);">
      <p style="color:#8888AA;font-size:12px;margin:0 0 12px;">Expected delivery: 3–5 business days</p>
      <p style="color:#8888AA;font-size:11px;margin:0;">Questions? Contact us at <a href="mailto:hello@zen-z.in" style="color:#00FFD1;">hello@zen-z.in</a></p>
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.04);">
        <span style="font-family:monospace;font-size:14px;font-weight:700;color:#A855F7;letter-spacing:0.1em;">ZEN-Z COLLECTION</span>
        <p style="color:#8888AA;font-size:11px;margin:8px 0 0;">© 2025 ZEN-Z Collection · Mumbai, India</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function welcomeEmail(email) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#050508;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#050508;">
    <div style="background:linear-gradient(135deg,#0A0A12,#1A1A2E);padding:40px;text-align:center;">
      <div style="font-family:monospace;font-size:32px;font-weight:900;color:#00FFD1;letter-spacing:0.1em;">ZEN-Z</div>
    </div>
    <div style="padding:40px;text-align:center;">
      <div style="font-size:48px;margin-bottom:20px;">🎉</div>
      <h1 style="color:#F0F0F8;font-size:24px;">Welcome to the Movement!</h1>
      <p style="color:#8888AA;font-size:15px;line-height:1.7;">You're now part of the ZEN-Z tribe. Get ready for exclusive drops, early access to new collections, and members-only discounts.</p>
      <div style="background:rgba(0,255,209,0.1);border:1px solid rgba(0,255,209,0.3);padding:20px;border-radius:4px;margin:30px 0;">
        <div style="color:#8888AA;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Your Welcome Discount</div>
        <div style="color:#00FFD1;font-size:32px;font-weight:900;margin-top:8px;">ZENZ10</div>
        <div style="color:#8888AA;font-size:13px;margin-top:6px;">10% off your first order</div>
      </div>
    </div>
    <div style="padding:20px 40px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.04);">
      <p style="color:#8888AA;font-size:11px;">© 2025 ZEN-Z Collection · <a href="#" style="color:#A855F7;">Unsubscribe</a></p>
    </div>
  </div>
</body></html>`;
}

// ───── EMAIL SENDER ─────
async function sendEmail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: CONFIG.email.from,
      to,
      subject,
      html
    });
    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Error:', error.message);
    return { success: false, error: error.message };
  }
}

// ────────────────────────────────────────────
//  ROUTES
// ────────────────────────────────────────────

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'ZEN-Z Backend', timestamp: new Date().toISOString() });
});

// ── RAZORPAY: Create Order ──
app.post('/api/payment/create-order', async (req, res) => {
  const { amount, currency = 'INR' } = req.body;
  if (!amount) return res.status(400).json({ error: 'Amount is required' });
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: 'ZNZ_' + Date.now(),
      notes: { source: 'ZEN-Z Collection' }
    });
    res.json({ success: true, order });
  } catch (err) {
    console.error('[Razorpay] Create order error:', err);
    res.status(500).json({ error: 'Payment initiation failed', details: err.message });
  }
});

// ── RAZORPAY: Verify Payment ──
app.post('/api/payment/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSig = crypto
    .createHmac('sha256', CONFIG.razorpay.key_secret)
    .update(body)
    .digest('hex');
  if (expectedSig === razorpay_signature) {
    res.json({ success: true, verified: true, paymentId: razorpay_payment_id });
  } else {
    res.status(400).json({ success: false, error: 'Payment signature mismatch' });
  }
});

// ── ORDERS: Create ──
app.post('/api/orders/create', async (req, res) => {
  const orderData = req.body;
  if (!orderData.orderId || !orderData.customer || !orderData.items) {
    return res.status(400).json({ error: 'Invalid order data' });
  }
  const order = {
    ...orderData,
    createdAt: new Date().toISOString(),
    status: 'confirmed'
  };
  orders.push(order);
  console.log(`[Order] Created: ${order.orderId} | ₹${order.total} | ${order.customer.email}`);

  // Fire emails
  if (orderData.customer.email) {
    // Customer confirmation email
    sendEmail(
      orderData.customer.email,
      `✅ Order Confirmed — ${orderData.orderId} | ZEN-Z Collection`,
      orderConfirmationEmail(order)
    );
    // Store notification
    sendEmail(
      CONFIG.email.storeEmail,
      `🛍 New Order: ${orderData.orderId} | ₹${orderData.total}`,
      `<pre style="font-family:monospace;background:#0A0A12;color:#00FFD1;padding:20px;border-radius:4px;">${JSON.stringify(order, null, 2)}</pre>`
    );
  }

  res.json({ success: true, orderId: order.orderId, message: 'Order placed successfully' });
});

// ── ORDERS: Get All ──
app.get('/api/orders', (req, res) => {
  res.json({ success: true, orders, total: orders.length });
});

// ── ORDERS: Get by ID ──
app.get('/api/orders/:orderId', (req, res) => {
  const order = orders.find(o => o.orderId === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ success: true, order });
});

// ── NEWSLETTER: Subscribe ──
app.post('/api/newsletter/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  if (subscribers.find(s => s.email === email)) {
    return res.json({ success: true, message: 'Already subscribed' });
  }
  subscribers.push({ email, subscribedAt: new Date().toISOString() });
  console.log(`[Newsletter] Subscribed: ${email}`);
  // Send welcome email
  sendEmail(email, '🎉 Welcome to ZEN-Z Collection!', welcomeEmail(email));
  res.json({ success: true, message: 'Subscribed successfully' });
});

// ── CART: Track ──
app.post('/api/cart/add', (req, res) => {
  cartEvents.push({ ...req.body, timestamp: new Date().toISOString() });
  res.json({ success: true });
});

// ── PRODUCTS: Serve product data ──
app.get('/api/products', (req, res) => {
  const products = [
    { id: 0, name: "Shadow Tech Hoodie", category: "tops", price: 5499, oldPrice: 7999, badge: "BESTSELLER" },
    { id: 1, name: "Glitch Graphic Tee", category: "tops", price: 1799, oldPrice: 2499, badge: "NEW" },
    { id: 2, name: "Matrix Crop Top", category: "tops", price: 1499, oldPrice: null, badge: null },
    { id: 3, name: "X-Ray Cargo Pants", category: "bottoms", price: 3299, oldPrice: 4499, badge: "HOT" },
    { id: 4, name: "Neon Stride Sneakers", category: "accessories", price: 6999, oldPrice: 8999, badge: "LIMITED" },
    { id: 5, name: "Quantum Jacket", category: "outerwear", price: 7499, oldPrice: 9999, badge: "NEW" },
    { id: 6, name: "Cyber Baggy Shorts", category: "bottoms", price: 1999, oldPrice: 2799, badge: null },
    { id: 7, name: "Circuit Cap", category: "accessories", price: 1299, oldPrice: 1799, badge: "SALE" },
    { id: 8, name: "Void Bomber Jacket", category: "outerwear", price: 8999, oldPrice: 12999, badge: "EXCLUSIVE" },
    { id: 9, name: "Neo-Wrap Scarf Set", category: "accessories", price: 899, oldPrice: 1299, badge: null }
  ];
  res.json({ success: true, products });
});

// ── CONTACT FORM ──
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'All fields required' });
  await sendEmail(
    CONFIG.email.storeEmail,
    `📩 Contact Form: ${name}`,
    `<div style="font-family:sans-serif;padding:20px;background:#050508;color:#F0F0F8;">
      <h2 style="color:#00FFD1;">New Contact Message</h2>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Message:</strong></p>
      <p style="background:#0A0A12;padding:16px;border-left:3px solid #00FFD1;">${message}</p>
    </div>`
  );
  res.json({ success: true, message: 'Message sent successfully' });
});

// ── ANALYTICS: Dashboard ──
app.get('/api/analytics', (req, res) => {
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const topProducts = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      topProducts[item.name] = (topProducts[item.name] || 0) + item.qty;
    });
  });
  res.json({
    success: true,
    analytics: {
      totalOrders: orders.length,
      totalRevenue,
      totalSubscribers: subscribers.length,
      topProducts: Object.entries(topProducts).sort((a,b) => b[1]-a[1]).slice(0,5),
      recentOrders: orders.slice(-5).reverse()
    }
  });
});

// ── SERVE FRONTEND ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'zen-z-frontend.html'));
});

// ────────────────────────────────────────────
//  START SERVER
// ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║    ZEN-Z Collection Backend Server    ║
╠════════════════════════════════════════╣
║  🚀 Running on: http://localhost:${PORT}  ║
║  📦 Products API: /api/products        ║
║  🛍 Orders API:   /api/orders          ║
║  💳 Payment API:  /api/payment         ║
║  📧 Newsletter:   /api/newsletter      ║
║  📊 Analytics:    /api/analytics       ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
