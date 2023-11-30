import mongoose from 'mongoose';
import Asset from './assetModel.js';

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
  id: {
    type: Number,
    required: true},

  userToken: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  stocks: [Asset.schema],
  gainLossRecords: [gainLossSchema],


}, { collection: 'portfolios' });

//portfolioSchema.index({ userToken: 1, name: 1 }, { unique: true });
const Portfolio = mongoose.model('Portfolio', portfolioSchema);

export default Portfolio;








// const mongoose = require('mongoose');

// const gainLossSchema = new mongoose.Schema({
//   // Define gain/loss schema as needed
// });

// const stockSchema = new mongoose.Schema({
//   symbol: {
//     type: String,
//     required: true,
//   },
//   name: {
//     type: String,
//     required: true,
//   },
//   averageCostPrice: {
//     type: Number,
//     required: true,
//   },
//   // Other stock fields as needed
// });

// const portfolioSchema = new mongoose.Schema({
//   userToken: {
//     type: String,
//     required: true,
//   },
//   name: {
//     type: String,
//     required: true,
//   },
//   stocks: [stockSchema],
//   gainLossRecords: [gainLossSchema],
// }, { collection: 'portfolios' });

// portfolioSchema.index({ userToken: 1, name: 1 }, { unique: true });
// const Portfolio = mongoose.model('Portfolio', portfolioSchema);

// module.exports = Portfolio;
