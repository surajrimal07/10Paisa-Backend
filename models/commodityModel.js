import mongoose from 'mongoose';

const CommoditySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
  },
  unit: String,
  ltp: Number,

}, { collection: 'commodity' });

const commodity = mongoose.model('Commodity', CommoditySchema);

export default commodity;
