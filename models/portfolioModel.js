import mongoose from 'mongoose';

import Stock from './assetModel.js';


const gainLossSchema = new mongoose.Schema({
    date: {
      type: Date,
      required: true,
    },
    gainOrLoss: {
      type: Number,
      required: true,
    },
    // You can add more fields as needed
  });


const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  stocks: [Stock],
  gainLossRecords: [gainLossSchema],
  // Add more properties as needed
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;
