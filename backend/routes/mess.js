const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const db = require('../config/database');
const router = express.Router();

router.get('/menu', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;
    // Get the PG owner user_id from the tenant
    const tenant = await db('tenants').where({ tenant_id: tenantId }).first();
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    const userId = tenant.user_id;

    // Fetch the 7-day template menu
    const menuTemplate = await db('mess_menu').where({ user_id: userId }).orderBy('day_index', 'asc');

    // Generate the next 7 days
    const today = new Date();
    const upcomingMenu = [];
    
    // Check opt-outs for the next 7 days for this tenant
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const optOuts = await db('meal_opt_outs')
      .where({ tenant_id: tenantId })
      .whereBetween('opt_out_date', [startDate, endDate]);
      
    const optOutSet = new Set(optOuts.map(o => o.opt_out_date));

    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = dateObj.toISOString().split('T')[0];
      const dayIndex = dateObj.getDay(); // 0-6 (Sunday-Saturday)
      
      const dayMenu = menuTemplate.find(m => m.day_index === dayIndex) || {
        day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex],
        breakfast: 'Not set', lunch: 'Not set', dinner: 'Not set'
      };

      upcomingMenu.push({
        id: dateStr, // Using date string as ID for the frontend
        day: `${dayMenu.day_of_week}, ${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        date: dateStr,
        breakfast: dayMenu.breakfast,
        lunch: dayMenu.lunch,
        dinner: dayMenu.dinner,
        optedOut: optOutSet.has(dateStr)
      });
    }

    res.json({ success: true, menu: upcomingMenu });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/opt-out', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.tenant.tenant_id;
    const { id: dateStr, optedOut } = req.body;

    if (optedOut) {
      // Insert opt out
      await db('meal_opt_outs')
        .insert({ tenant_id: tenantId, opt_out_date: dateStr })
        .onConflict(['tenant_id', 'opt_out_date'])
        .ignore();
    } else {
      // Remove opt out
      await db('meal_opt_outs')
        .where({ tenant_id: tenantId, opt_out_date: dateStr })
        .del();
    }

    res.json({ success: true, message: 'Meal preference updated.' });
  } catch (error) {
    console.error('Error updating opt-out:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
