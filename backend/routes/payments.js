/**
 * Payment Routes - Billing breakdown + payment history
 */

const express = require('express');
const { db, dbType } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/payments/billing
 * Returns current billing breakdown for the tenant
 */
router.get('/billing', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;

    // 1. Get current month's billing
    let latestBilling;
    if (dbType === 'supabase') {
      latestBilling = await db('billing')
        .where('tenant_id', tenantId)
        .orderBy('year', 'desc')
        .orderByRaw(`
          CASE month
            WHEN 'January' THEN 1 WHEN 'February' THEN 2 WHEN 'March' THEN 3
            WHEN 'April' THEN 4 WHEN 'May' THEN 5 WHEN 'June' THEN 6
            WHEN 'July' THEN 7 WHEN 'August' THEN 8 WHEN 'September' THEN 9
            WHEN 'October' THEN 10 WHEN 'November' THEN 11 WHEN 'December' THEN 12
          END DESC
        `)
        .first();
    } else {
      latestBilling = db.prepare(`
        SELECT * FROM billing
        WHERE tenant_id = ?
        ORDER BY year DESC,
          CASE month
            WHEN 'January' THEN 1 WHEN 'February' THEN 2 WHEN 'March' THEN 3
            WHEN 'April' THEN 4 WHEN 'May' THEN 5 WHEN 'June' THEN 6
            WHEN 'July' THEN 7 WHEN 'August' THEN 8 WHEN 'September' THEN 9
            WHEN 'October' THEN 10 WHEN 'November' THEN 11 WHEN 'December' THEN 12
          END DESC
        LIMIT 1
      `).get(tenantId);
    }

    if (!latestBilling) {
      return res.json({ success: true, billing: null });
    }

    res.json({
      success: true,
      billing: {
        month: latestBilling.month,
        year: latestBilling.year,
        fixed_rent: latestBilling.fixed_rent,
        previous_balance: latestBilling.previous_balance,
        total_due: latestBilling.total_due,
        amount_paid: latestBilling.amount_paid,
        current_balance: latestBilling.current_balance,
        due_date: latestBilling.due_date,
      },
    });
  } catch (err) {
    console.error('Billing error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/payments/history
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;

    let payments;
    if (dbType === 'supabase') {
      payments = await db('payments')
        .select(
          'payment_id as id', 'amount_paid as amount', 
          db.raw("to_char(payment_date::date, 'Month') as month"),
          'payment_date as year', // Reformatting needed later
          'payment_via as payment_method', 'utr_number as transaction_id', 
          db.raw("'completed' as status"), 'payment_date as created_at'
        )
        .where('tenant_id', tenantId)
        .orderBy('payment_date', 'desc');
    } else {
      payments = db.prepare(`
        SELECT 
          payment_id as id, amount_paid as amount, 
          strftime('%m', payment_date) as month_num, 
          strftime('%Y', payment_date) as year,
          payment_via as payment_method, utr_number as transaction_id, 
          'completed' as status, payment_date as created_at
        FROM payments
        WHERE tenant_id = ?
        ORDER BY payment_date DESC
      `).all(tenantId);
    }

    res.json({ success: true, payments });
  } catch (err) {
    console.error('Payment history error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/payments/record
 */
router.post('/record', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;
    const { amount, month, year, payment_method, transaction_id } = req.body;

    if (!amount || !month || !year) {
      return res.status(400).json({ error: 'Amount, month, and year are required.' });
    }

    // 1. Get Admin User ID for scoping
    let tenant;
    if (dbType === 'supabase') {
      tenant = await db('tenants').select('user_id').where('tenant_id', tenantId).first();
    } else {
      tenant = db.prepare('SELECT user_id FROM tenants WHERE tenant_id = ?').get(tenantId);
    }
    const adminUserId = tenant ? tenant.user_id : null;

    // 2. Record the payment
    let paymentId;
    if (dbType === 'supabase') {
      const [newPayment] = await db('payments').insert({
        tenant_id: tenantId,
        amount_paid: amount,
        payment_date: db.raw('CURRENT_DATE'),
        payment_via: payment_method || 'UPI',
        utr_number: transaction_id || null,
        payment_type: 'Rent',
        user_id: adminUserId
      }).returning('payment_id');
      paymentId = newPayment.payment_id;
    } else {
      const result = db.prepare(`
        INSERT INTO payments (tenant_id, amount_paid, payment_date, payment_via, utr_number, payment_type, user_id)
        VALUES (?, ?, date('now'), ?, ?, 'Rent', ?)
      `).run(tenantId, amount, payment_method || 'UPI', transaction_id || null, adminUserId);
      paymentId = result.lastInsertRowid;
    }

    // 3. Update billing record and auto-restore access
    let billing;
    if (dbType === 'supabase') {
      billing = await db('billing').where({ tenant_id: tenantId, month: month, year: year }).first();
      if (billing) {
        const newAmountPaid = Number(billing.amount_paid) + Number(amount);
        const newBalance = Math.max(0, Number(billing.total_due) - newAmountPaid);
        await db('billing').where({ id: billing.id }).update({
          amount_paid: newAmountPaid,
          current_balance: newBalance,
          status: newBalance <= 0 ? 'Paid' : 'Partial'
        });

        // AUTO-RESTORE: If paid, set access_status to active
        if (newBalance <= 0) {
          await db('tenants').where('tenant_id', tenantId).update({ access_status: 'active' });
          // Note: Hardware sync is usually triggered by PGMS backend, 
          // but we'll update the status so the PGMS Guard can pick it up.
        }
      }
    } else {
      billing = db.prepare('SELECT * FROM billing WHERE tenant_id = ? AND month = ? AND year = ?').get(tenantId, month, year);
      if (billing) {
        const newAmountPaid = billing.amount_paid + amount;
        const newBalance = Math.max(0, billing.total_due - newAmountPaid);
        db.prepare('UPDATE billing SET amount_paid = ?, current_balance = ?, status = ? WHERE id = ?')
          .run(newAmountPaid, newBalance, newBalance <= 0 ? 'Paid' : 'Partial', billing.id);
        
        if (newBalance <= 0) {
          db.prepare('UPDATE tenants SET access_status = "active" WHERE tenant_id = ?').run(tenantId);
        }
      }
    }

    res.json({
      success: true,
      message: 'Payment recorded successfully.',
      paymentId: paymentId,
    });
  } catch (err) {
    console.error('Payment record error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
