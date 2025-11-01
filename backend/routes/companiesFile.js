const express = require('express');

module.exports = (fileDB) => {
  const router = express.Router();

  // GET /api/companies - Get all unique company names
  router.get('/', (req, res) => {
    try {
      const companies = fileDB.distinct('company');
      
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
  router.get('/stats', (req, res) => {
    try {
      const stats = fileDB.aggregate([
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

  return router;
};