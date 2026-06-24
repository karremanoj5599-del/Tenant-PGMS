/**
 * Tenant PGMS - Backend API Server
 * Express.js + SQLite (ready for PostgreSQL migration)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db, dbType } = require('./db/database');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const paymentRoutes = require('./routes/payments');
const ticketRoutes = require('./routes/tickets');
const logRoutes = require('./routes/logs');
const messRoutes = require('./routes/mess');
const visitorRoutes = require('./routes/visitors');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send(`
    <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0F172A; color: #F8FAFC;">
      <div style="text-align: center;">
        <h1 style="color: #3B82F6;">🚀 Tenant PGMS API is Running</h1>
        <p>This is the backend data server. Please open the apps below:</p>
        <div style="margin-top: 20px;">
          <a href="http://localhost:8081" style="color: #3B82F6; text-decoration: none; font-weight: bold; margin: 0 10px;">Mobile App (Port 8081)</a> |
          <a href="http://localhost:8000" style="color: #3B82F6; text-decoration: none; font-weight: bold; margin: 0 10px;">Admin Dashboard (Port 8000)</a>
        </div>
      </div>
    </body>
  `);
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Tenant PGMS API', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found.` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Start server

app.listen(PORT, () => {
  console.log(`\n🚀 Tenant PGMS API running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Demo login: mobile=9876543210, password=1234\n`);
});
