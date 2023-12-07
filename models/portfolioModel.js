import mongoose from 'mongoose';

const gainLoss = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  portgainloss: {
    type: Number,
    required: true
  }
});

  const StockToPortfolio = new mongoose.Schema({
    symbol: String,
    quantity: Number,
    wacc: Number,
    costprice : Number,
    currentprice: Number,
    netgainloss: Number
  });


  const portfolioSchema = new mongoose.Schema({
    id: {
      type: Number,
      required: true,
    },
    userToken: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    stocks: [StockToPortfolio],

    portfoliocost: {
      type: Number,
      default: function () {
        return this.stocks.reduce((total, stock) => total + stock.costprice * stock.quantity, 0);
      },
    },

    portfoliovalue: {
      type: Number,
      default: function () {
        return this.stocks.reduce((total, stock) => total + stock.currentprice * stock.quantity, 0);
      },
    },

    totalunits: {
      type: Number,
      default: function () {
        return this.stocks.reduce((total, stock) => total + stock.quantity, 0);
      },
    },

    gainLossRecords: [gainLoss],

  }, { collection: 'portfolios' });

  const Portfolio = mongoose.model('Portfolio', portfolioSchema);

  export default Portfolio;
