const mongoose = require('mongoose');

const drugSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  genericName: {
    type: String,
    required: true
  },
  brandName: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  launchDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
drugSchema.index({ company: 1 });
drugSchema.index({ launchDate: -1 });
drugSchema.index({ code: 1 });

// Virtual for combined drug name
drugSchema.virtual('displayName').get(function() {
  return `${this.genericName} (${this.brandName})`;
});

// Ensure virtual fields are serialized
drugSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Drug', drugSchema);