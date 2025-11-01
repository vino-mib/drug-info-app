const express = require('express');
const router = express.Router();
const Drug = require('../models/Drug');

// GET /api/drugs - Get all drugs with optional company filter
router.get('/', async (req, res) => {
  try {
    const { company, page = 1, limit = 50, sortBy = 'launchDate', sortOrder = 'desc' } = req.query;
    
    // Build filter object
    const filter = {};
    if (company && company.trim() !== '') {
      filter.company = company;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const drugs = await Drug.find(filter)
      .sort(sort)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await Drug.countDocuments(filter);
    
    // Add display name to each drug
    const drugsWithDisplayName = drugs.map((drug, index) => ({
      ...drug,
      id: drug._id.toString(),
      displayName: `${drug.genericName} (${drug.brandName})`,
      // Add sequential ID starting from skip + 1
      sequentialId: skip + index + 1
    }));

    res.json({
      drugs: drugsWithDisplayName,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: skip + drugs.length < totalCount,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching drugs:', error);
    res.status(500).json({ error: 'Failed to fetch drugs' });
  }
});

// GET /api/drugs/:id - Get single drug by ID
router.get('/:id', async (req, res) => {
  try {
    const drug = await Drug.findById(req.params.id).lean();
    if (!drug) {
      return res.status(404).json({ error: 'Drug not found' });
    }
    
    res.json({
      ...drug,
      id: drug._id.toString(),
      displayName: `${drug.genericName} (${drug.brandName})`
    });
  } catch (error) {
    console.error('Error fetching drug:', error);
    res.status(500).json({ error: 'Failed to fetch drug' });
  }
});

// POST /api/drugs - Create new drug (for testing purposes)
router.post('/', async (req, res) => {
  try {
    const { code, genericName, brandName, company, launchDate } = req.body;
    
    const drug = new Drug({
      code,
      genericName,
      brandName,
      company,
      launchDate: new Date(launchDate)
    });

    await drug.save();
    
    res.status(201).json({
      ...drug.toJSON(),
      id: drug._id.toString()
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Drug code already exists' });
    }
    console.error('Error creating drug:', error);
    res.status(500).json({ error: 'Failed to create drug' });
  }
});

module.exports = router;