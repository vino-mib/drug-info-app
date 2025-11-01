const express = require('express');
const router = express.Router();
const Drug = require('../models/Drug');

// GET /api/companies - Get all unique company names
router.get('/', async (req, res) => {
  try {
    const companies = await Drug.distinct('company');
    
    // Sort companies alphabetically
    const sortedCompanies = companies.sort((a, b) => 
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
    
    res.json({ companies: sortedCompanies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// GET /api/companies/stats - Get company statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Drug.aggregate([
      {
        $group: {
          _id: '$company',
          drugCount: { $sum: 1 },
          latestLaunch: { $max: '$launchDate' },
          earliestLaunch: { $min: '$launchDate' }
        }
      },
      {
        $sort: { drugCount: -1 }
      }
    ]);

    res.json({ companyStats: stats });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({ error: 'Failed to fetch company statistics' });
  }
});

module.exports = router;