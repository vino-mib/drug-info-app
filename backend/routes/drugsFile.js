const express = require('express');

module.exports = (fileDB) => {
  const router = express.Router();

  // GET /api/drugs - Get all drugs with optional company filter
  router.get('/', (req, res) => {
    try {
      const { company, page = 1, limit = 50, sortBy = 'launchDate', sortOrder = 'desc' } = req.query;
      
      // Build filter object
      const filter = {};
      if (company && company.trim() !== '') {
        filter.company = company;
      }

      // Get filtered data
      let drugs = fileDB.find(filter);

      // Sort data
      drugs.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (sortBy === 'launchDate') {
          const aDate = new Date(aValue);
          const bDate = new Date(bValue);
          return sortOrder === 'desc' ? bDate - aDate : aDate - bDate;
        }
        
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });

      // Calculate pagination
      const totalCount = drugs.length;
      const totalPages = Math.ceil(totalCount / parseInt(limit));
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      
      const paginatedDrugs = drugs.slice(startIndex, endIndex);

      // Add display name and sequential ID to each drug
      const drugsWithDisplayInfo = paginatedDrugs.map((drug, index) => ({
        ...drug,
        id: drug._id,
        displayName: `${drug.genericName} (${drug.brandName})`,
        sequentialId: startIndex + index + 1
      }));

      res.json({
        drugs: drugsWithDisplayInfo,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: endIndex < totalCount,
          hasPrevPage: parseInt(page) > 1
        }
      });
    } catch (error) {
      console.error('Error fetching drugs:', error);
      res.status(500).json({ error: 'Failed to fetch drugs' });
    }
  });

  // GET /api/drugs/:id - Get single drug by ID
  router.get('/:id', (req, res) => {
    try {
      const drug = fileDB.findById(req.params.id);
      if (!drug) {
        return res.status(404).json({ error: 'Drug not found' });
      }
      
      res.json({
        ...drug,
        id: drug._id,
        displayName: `${drug.genericName} (${drug.brandName})`
      });
    } catch (error) {
      console.error('Error fetching drug:', error);
      res.status(500).json({ error: 'Failed to fetch drug' });
    }
  });

  return router;
};