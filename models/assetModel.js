import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  sector: {
    type: String,
    required: true,
  },
  eps:String,
  bookvalue:String,
  pe:String,
  change:String,
  ltp:String,

}, { collection: 'asset' });

const Asset = mongoose.model('Stock', assetSchema);

export default Asset;
