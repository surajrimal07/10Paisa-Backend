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

portfolioSchema.index({ userToken: 1, name: 1 }, { unique: true });
const Portfolio = mongoose.model('Portfolio', portfolioSchema);

export default Portfolio;
