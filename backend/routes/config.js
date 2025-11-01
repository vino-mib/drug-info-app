const express = require('express');
const router = express.Router();

// GET /api/config - Get table configuration
router.get('/', (req, res) => {
  try {
    const tableConfig = {
      columns: [
        {
          key: 'sequentialId',
          label: 'Id',
          sortable: false,
          visible: true,
          width: 80
        },
        {
          key: 'code',
          label: 'Code',
          sortable: true,
          visible: true,
          width: 120
        },
        {
          key: 'displayName',
          label: 'Name',
          sortable: true,
          visible: true,
          width: 200
        },
        {
          key: 'company',
          label: 'Company',
          sortable: true,
          visible: true,
          width: 250,
          clickable: true // Indicates this column can be clicked for filtering
        },
        {
          key: 'launchDate',
          label: 'Launch Date',
          sortable: true,
          visible: true,
          width: 120,
          type: 'date'
        }
      ],
      pagination: {
        defaultPageSize: 50,
        pageSizeOptions: [25, 50, 100, 200]
      },
      sorting: {
        defaultSort: {
          field: 'launchDate',
          direction: 'desc'
        }
      }
    };

    res.json(tableConfig);
  } catch (error) {
    console.error('Error fetching table config:', error);
    res.status(500).json({ error: 'Failed to fetch table configuration' });
  }
});

module.exports = router;