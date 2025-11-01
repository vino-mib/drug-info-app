const fs = require('fs');
const path = require('path');

// Simple file-based database for development
class FileDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error loading data:', error);
      return [];
    }
  }

  saveData() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // Simulate MongoDB-like operations
  find(filter = {}) {
    let results = [...this.data];
    
    // Apply filters
    if (filter.company) {
      results = results.filter(item => item.company === filter.company);
    }
    
    return results;
  }

  findById(id) {
    return this.data.find(item => item._id === id);
  }

  distinct(field) {
    const values = this.data.map(item => item[field]);
    return [...new Set(values)];
  }

  countDocuments(filter = {}) {
    return this.find(filter).length;
  }

  insertMany(documents) {
    documents.forEach((doc, index) => {
      doc._id = `drug_${Date.now()}_${index}`;
      doc.createdAt = new Date();
      doc.updatedAt = new Date();
    });
    
    this.data.push(...documents);
    this.saveData();
    return { insertedCount: documents.length };
  }

  deleteMany() {
    this.data = [];
    this.saveData();
    return { deletedCount: this.data.length };
  }

  aggregate(pipeline) {
    // Simple aggregation for company stats
    if (pipeline.some(stage => stage.$group && stage.$group._id === '$company')) {
      const companyStats = {};
      
      this.data.forEach(drug => {
        if (!companyStats[drug.company]) {
          companyStats[drug.company] = {
            _id: drug.company,
            drugCount: 0,
            latestLaunch: new Date(drug.launchDate),
            earliestLaunch: new Date(drug.launchDate)
          };
        }
        
        companyStats[drug.company].drugCount++;
        const launchDate = new Date(drug.launchDate);
        
        if (launchDate > companyStats[drug.company].latestLaunch) {
          companyStats[drug.company].latestLaunch = launchDate;
        }
        
        if (launchDate < companyStats[drug.company].earliestLaunch) {
          companyStats[drug.company].earliestLaunch = launchDate;
        }
      });
      
      return Object.values(companyStats).sort((a, b) => b.drugCount - a.drugCount);
    }
    
    return [];
  }
}

module.exports = FileDatabase;