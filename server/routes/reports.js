const express = require('express');
const Visit = require('../models/Visit');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get advanced analytics
router.get('/analytics', auth, authorize(['admin', 'reception']), async (req, res) => {
  try {
    const { period = 'week', startDate, endDate } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = {
        scheduledDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      switch (period) {
        case 'week':
          dateFilter = {
            scheduledDate: {
              $gte: new Date(now.setDate(now.getDate() - 7))
            }
          };
          break;
        case 'month':
          dateFilter = {
            scheduledDate: {
              $gte: new Date(now.setMonth(now.getMonth() - 1))
            }
          };
          break;
        case 'year':
          dateFilter = {
            scheduledDate: {
              $gte: new Date(now.setFullYear(now.getFullYear() - 1))
            }
          };
          break;
      }
    }

    const filter = {
      companyId: req.user.companyId,
      ...dateFilter
    };

    // Visits by status
    const visitsByStatus = await Visit.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Visits by day
    const visitsByDay = await Visit.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top hosts
    const topHosts = await Visit.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'host',
          foreignField: '_id',
          as: 'hostInfo'
        }
      },
      { $unwind: '$hostInfo' },
      {
        $group: {
          _id: '$host',
          count: { $sum: 1 },
          hostName: { $first: { $concat: ['$hostInfo.firstName', ' ', '$hostInfo.lastName'] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Average visit duration
    const avgDuration = await Visit.aggregate([
      { 
        $match: { 
          ...filter,
          status: 'completed',
          checkInTime: { $exists: true },
          checkOutTime: { $exists: true }
        }
      },
      {
        $addFields: {
          duration: {
            $subtract: ['$checkOutTime', '$checkInTime']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    res.json({
      visitsByStatus,
      visitsByDay,
      topHosts,
      avgDuration: avgDuration[0]?.avgDuration || 0,
      period,
      dateRange: dateFilter
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Export reports
router.post('/export', auth, authorize(['admin', 'reception']), async (req, res) => {
  try {
    const { format = 'json', filters = {} } = req.body;
    
    const filter = {
      companyId: req.user.companyId,
      ...filters
    };

    if (filters.startDate && filters.endDate) {
      filter.scheduledDate = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    const visits = await Visit.find(filter)
      .populate('host', 'firstName lastName email')
      .sort({ scheduledDate: -1 });

    switch (format) {
      case 'json':
        res.json({
          data: visits,
          exportedAt: new Date().toISOString(),
          totalRecords: visits.length
        });
        break;
        
      case 'csv':
        const csvData = visits.map(visit => ({
          'Fecha': new Date(visit.scheduledDate).toLocaleDateString(),
          'Visitante': visit.visitorName,
          'Empresa': visit.visitorCompany,
          'Email': visit.visitorEmail || '',
          'Anfitrión': `${visit.host.firstName} ${visit.host.lastName}`,
          'Motivo': visit.reason,
          'Estado': visit.status,
          'Check-in': visit.checkInTime ? new Date(visit.checkInTime).toLocaleString() : '',
          'Check-out': visit.checkOutTime ? new Date(visit.checkOutTime).toLocaleString() : ''
        }));
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=visitas.csv');
        
        // Simple CSV generation
        const headers = Object.keys(csvData[0] || {}).join(',');
        const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
        res.send(`${headers}\n${rows}`);
        break;
        
      default:
        res.status(400).json({ message: 'Formato no soportado' });
    }
  } catch (error) {
    console.error('Export reports error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;