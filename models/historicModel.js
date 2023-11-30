// import mongoose from 'mongoose';

// const HistoricPriceSchema = new mongoose.Schema({
//   Symbol: {
//     type: String,
//     required: true,
//   },
//   prices: {
//     type: Map,
//     of: Number,
//     required: true,
//   },
// }, { collection: 'historic_prices' });

// const HistoricPrice = mongoose.model('HistoricPrice', HistoricPriceSchema);

// export default HistoricPrice;
import mongoose from 'mongoose';

const historicPriceSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
  },
  historicalData: [
    {
      date: {
        type: Date,
        required: true,
      },
      price: {
        type: Map,
        of: Number,
      },
    },
  ],
});

const HistoricPrice = mongoose.model('HistoricPrice', historicPriceSchema);

export default HistoricPrice;
