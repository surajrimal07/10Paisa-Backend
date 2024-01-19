import mongoose from 'mongoose';

const CommoditySchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, select: false },
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
