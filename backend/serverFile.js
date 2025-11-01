const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import database utilities
const FileDatabase = require('./utils/fileDatabase');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Initialize file-based database
const dbPath = path.join(__dirname, 'data/drugs.json');
const fileDB = new FileDatabase(dbPath);

console.log('🗃️  Using file-based database');
console.log(`📄 Database file: ${dbPath}`);

// Routes for file-based database
app.use('/api/drugs', require('./routes/drugsFile')(fileDB));
app.use('/api/companies', require('./routes/companiesFile')(fileDB));
app.use('/api/config', require('./routes/config'));

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'file-based',
    totalDrugs: fileDB.countDocuments(),
    uniqueCompanies: fileDB.distinct('company').length
  };
  res.json(stats);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Database contains ${fileDB.countDocuments()} drugs`);
});

module.exports = app;