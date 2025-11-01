const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Drug = require('../models/Drug');

async function seedDatabase() {
  try {
    // Try to connect to MongoDB with timeout
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/druginfo';
    console.log('Attempting to connect to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Drug.deleteMany({});
    console.log('Cleared existing drug data');

    // Read the drug data JSON file
    const drugDataPath = path.join(__dirname, '../drugData 2025.json');
    const drugDataRaw = fs.readFileSync(drugDataPath, 'utf8');
    const drugData = JSON.parse(drugDataRaw);

    console.log(`Found ${drugData.length} drugs to import`);

    // Transform and insert data in batches
    const batchSize = 100;
    let importedCount = 0;

    for (let i = 0; i < drugData.length; i += batchSize) {
      const batch = drugData.slice(i, i + batchSize);
      
      // Transform the data to match our schema
      const transformedBatch = batch.map(drug => ({
        code: drug.code,
        genericName: drug.genericName,
        brandName: drug.brandName,
        company: drug.company,
        launchDate: new Date(drug.launchDate)
      }));

      try {
        await Drug.insertMany(transformedBatch, { ordered: false });
        importedCount += transformedBatch.length;
        console.log(`Imported batch: ${importedCount}/${drugData.length} drugs`);
      } catch (error) {
        // Handle duplicate key errors and continue
        if (error.name === 'BulkWriteError') {
          const successfulInserts = error.result.insertedCount;
          importedCount += successfulInserts;
          console.log(`Batch had ${error.writeErrors.length} duplicates, imported ${successfulInserts} drugs`);
        } else {
          throw error;
        }
      }
    }

    console.log(`✅ Successfully imported ${importedCount} drugs`);

    // Create indexes for better performance
    await Drug.createIndexes();
    console.log('✅ Created database indexes');

    // Show some statistics
    const totalDrugs = await Drug.countDocuments();
    const uniqueCompanies = await Drug.distinct('company');
    const dateRange = await Drug.aggregate([
      {
        $group: {
          _id: null,
          minDate: { $min: '$launchDate' },
          maxDate: { $max: '$launchDate' }
        }
      }
    ]);

    console.log('\n📊 Database Statistics:');
    console.log(`Total drugs: ${totalDrugs}`);
    console.log(`Unique companies: ${uniqueCompanies.length}`);
    if (dateRange.length > 0) {
      console.log(`Date range: ${dateRange[0].minDate.toISOString().split('T')[0]} to ${dateRange[0].maxDate.toISOString().split('T')[0]}`);
    }

    console.log('\n🔝 Top 10 companies by drug count:');
    const topCompanies = await Drug.aggregate([
      { $group: { _id: '$company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    topCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company._id}: ${company.count} drugs`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

// Run the seeding function
seedDatabase();