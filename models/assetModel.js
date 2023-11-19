import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
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
  eps:Number,
  bookvalue:Number,
  pe:Number,
  percentchange:Number,
  ltp:Number,
  totaltradedquantity: Number,
  previousclose: Number,

}, { collection: 'asset' });

assetSchema.index({ symbol: 1 }, { unique: true });

const Asset = mongoose.model('Stock', assetSchema);

export default Asset;
