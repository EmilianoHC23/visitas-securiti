const express = require('express');
const Visit = require('../models/Visit');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Yesterday for trends
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const filter = { companyId: req.user.companyId };

    // If user is a host, only show their visits
    if (req.user.role === 'host') {
      filter.host = req.user._id;
    }

    // Get today's visits count by status
    const todayFilter = {
      ...filter,
      scheduledDate: { $gte: today, $lt: tomorrow }
    };

    // Get yesterday's visits count by status for trends
    const yesterdayFilter = {
      ...filter,
      scheduledDate: { $gte: yesterday, $lt: today }
    };

    const [
      // Today's stats
      active,
      pending,
      approved,
      checkedIn,
      completed,
      totalUsers,
      totalHosts,
      // Yesterday's stats for trends
      yesterdayCheckedIn,
      yesterdayPending,
      yesterdayApproved,
      yesterdayCompleted
    ] = await Promise.all([
      // Active visits today (checked-in)
      Visit.countDocuments({ ...todayFilter, status: 'checked-in' }),
      
      // Pending visits today
      Visit.countDocuments({ ...todayFilter, status: 'pending' }),
      
      // Approved visits today
      Visit.countDocuments({ ...todayFilter, status: 'approved' }),
      
      // Checked-in visits today
      Visit.countDocuments({ ...todayFilter, status: 'checked-in' }),
      
      // Completed visits today
      Visit.countDocuments({ ...todayFilter, status: 'completed' }),
      
      // Total users (admin only)
      req.user.role === 'admin' ? User.countDocuments({ companyId: req.user.companyId, isActive: true }) : 0,
      
      // Total hosts
      User.countDocuments({ companyId: req.user.companyId, role: 'host', isActive: true }),

      // Yesterday's checked-in
      Visit.countDocuments({ ...yesterdayFilter, status: 'checked-in' }),
      
      // Yesterday's pending
      Visit.countDocuments({ ...yesterdayFilter, status: 'pending' }),
      
      // Yesterday's approved
      Visit.countDocuments({ ...yesterdayFilter, status: 'approved' }),
      
      // Yesterday's completed
      Visit.countDocuments({ ...yesterdayFilter, status: 'completed' })
    ]);

    // Calculate trends (percentage change from yesterday)
    const calculateTrend = (today, yesterday) => {
      if (yesterday === 0) return today > 0 ? 100 : 0;
      return Math.round(((today - yesterday) / yesterday) * 100);
    };

    res.json({
      active,
      pending,
      approved,
      checkedIn,
      completed,
      totalUsers,
      totalHosts,
      trends: {
        checkedIn: calculateTrend(checkedIn, yesterdayCheckedIn),
        pending: calculateTrend(pending, yesterdayPending),
        approved: calculateTrend(approved, yesterdayApproved),
        completed: calculateTrend(completed, yesterdayCompleted)
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Get recent visits
router.get('/recent-visits', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const filter = { companyId: req.user.companyId };

    // If user is a host, only show their visits
    if (req.user.role === 'host') {
      filter.host = req.user._id;
    }

    const recentVisits = await Visit.find(filter)
      .populate('host', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(recentVisits);
  } catch (error) {
    console.error('Get recent visits error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Get visits analytics (weekly/monthly data)
router.get('/analytics', auth, async (req, res) => {
  try {
    const { period = 'week' } = req.query; // 'week' or 'month'
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const filter = { 
      companyId: req.user.companyId,
      createdAt: { $gte: startDate }
    };

    // If user is a host, only show their visits
    if (req.user.role === 'host') {
      filter.host = req.user._id;
    }

    const analytics = await Visit.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          data: {
            $push: {
              status: "$_id.status",
              count: "$count"
            }
          },
          total: { $sum: "$count" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;