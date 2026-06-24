const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

let visitors = [];
let nextId = 1;

router.get('/', authMiddleware, (req, res) => {
  const tenantId = req.tenant.tenant_id;
  res.json({ success: true, visitors: visitors.filter(v => v.tenantId === tenantId) });
});

router.post('/invite', authMiddleware, (req, res) => {
  const { name, phone, date, purpose } = req.body;
  const tenantId = req.tenant.tenant_id;
  
  const passCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit PIN
  
  const visitor = {
    id: nextId++,
    tenantId,
    name,
    phone,
    date,
    purpose,
    passCode,
    status: 'Pending' // Pending, Entered, Expired
  };
  
  visitors.push(visitor);
  
  res.json({ success: true, message: 'Visitor pass generated.', visitor });
});

module.exports = router;
