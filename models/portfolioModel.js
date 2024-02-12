import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';
import Asset from '../models/assetModel.js';


const AutoIncrement = mongooseSequence(mongoose);

const gainLoss = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    portgainloss: {
        type: Number,
        required: true,
    },
});

const StockToPortfolio = new mongoose.Schema({
    name: String,
    ltp: Number,
    symbol: String,
    quantity: Number,
    wacc: Number,
    costprice: Number,
    currentprice: Number,
    netgainloss: Number
});

const portfolioSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
    },
    userEmail: {
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
    },

    portfoliovalue: {
        type: Number,
    },

    portfolioGoal: {
        type : String
    },

    totalunits: {
        type: Number,
        default: function () {
            return this.stocks.reduce((total, stock) => total + stock.quantity, 0);
        },
    },

    gainLossRecords: [gainLoss],
});

portfolioSchema.plugin(AutoIncrement, { id: 'portfolio_id', inc_field: 'id' });


portfolioSchema.pre('save', async function (next) {
  try {
    //   if (!this.id) {
    //     const maxIdPortfolio = await this.constructor.findOne({}, { id: 1 }).sort({ id: -1 });
    //     this.id = (maxIdPortfolio ? maxIdPortfolio.id : 0) + 1;
    // }
      const updateStockPrices = async () => {
          for (const stock of this.stocks) {
              const asset = await Asset.findOne({ symbol: stock.symbol });

              if (asset) {
                  stock.currentprice = asset.ltp * stock.quantity; // Update current price based on the total units
                  stock.name = asset.name;
                  stock.ltp = asset.ltp;
              } else {
                  console.error(`Asset not found for symbol ${stock.symbol}`);
              }
          }
      };

      await updateStockPrices();

      // Calculate dynamically updated values for costprice and netgainloss
      this.stocks.forEach(stock => {
          stock.costprice = stock.quantity * stock.wacc; // Assuming wacc as the purchase price
          stock.netgainloss = stock.currentprice - stock.costprice; // Corrected netgainloss calculation
      });

      // Calculate portfoliocost and portfoliovalue
      this.portfoliocost = this.stocks.reduce((total, stock) => total + stock.costprice, 0);
      this.portfoliovalue = this.stocks.reduce((total, stock) => total + stock.currentprice, 0);

      const newStockValue = this.stocks.reduce((total, stock) => total + stock.currentprice, 0);
      const deltaStockValue = newStockValue - (this.portfoliovalue || 0);

      // Update userAmount based on the change in stock value
      if (deltaStockValue > 0) {
          // Check if the user has sufficient funds
          if (deltaStockValue <= this.userAmount) {
              // Deduct the stock value from userAmount
              this.userAmount -= deltaStockValue;
          } else {
              // Throw an error if userAmount is not enough
              throw new Error('Not Enough Money');
          }
      } else if (deltaStockValue < 0) {
          // Add back the value of stocks removed to userAmount
          this.userAmount -= deltaStockValue; // Since deltaStockValue is negative
      }

      // Update gainLossRecords with the calculated values
      this.gainLossRecords = [{
          date: new Date(),
          value: newStockValue,
          portgainloss: this.stocks.reduce((total, stock) => total + stock.netgainloss, 0),
      }];

      next();
  } catch (error) {
      console.error('Error updating stock data, userAmount, and gainLossRecords:', error.message);
      next(error);
  }
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

export default Portfolio;
