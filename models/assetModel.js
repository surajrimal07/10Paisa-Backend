import mongoose from 'mongoose';


const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  purchasePrice: {
    type: Number,
    required: true,
  },
  purchaseDate: {
    type: Date,
    required: true,
  },
});

const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;
