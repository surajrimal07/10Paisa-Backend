import mongoose from 'mongoose';


const StockToPortfolio = new mongoose.Schema({
    name: {
        type: String,
        default: 'Unknown'
    },
    ltp: {
        type: Number,
        set: v => Math.round(v * 100) / 100,
        min: 0
    },
    symbol: String,
    quantity: Number,
    wacc: {
    type: Number,
    set: v => Math.round(v * 100) / 100
},
    costprice: {
    type: Number,
    set: v => Math.round(v * 100) / 100,
    default: function () {
        return (this.quantity * this.wacc).toFixed(2);
    }
},
    currentprice: {
    type: Number,
    set: v => Math.round(v * 100) / 100,
    default: function () {
        return (this.quantity * this.ltp).toFixed(2);
    }
},
    netgainloss: {
    type: Number,
    set: v => Math.round(v * 100) / 100,
    default: function () {
        return (this.currentprice - this.costprice).toFixed(2);
    }
},
    time: {
    type: Number,
    default: function () {
        return Math.floor(Date.now() / 1000);
    }
}

});

const portfolioSchema = new mongoose.Schema({
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
        set: v => Math.round(v * 100) / 100
    },

    portfoliovalue: {
        type: Number,
        set: v => Math.round(v * 100) / 100
    },
    portgainloss: {
        type: Number,
        default: 0,
        set: v => Math.round(v * 100) / 100
    },
    portfolioGoal: {
        type: String,
        default: 'Not set'

    },
    recommendation: {
        type: String,
        default: 'No recommendation'
    },
    portfolioPercentage: {
        type: Number,
        default: 0
    },
    totalStocks: {
        type: Number,
        default: 0,
        min: 0
    },

    totalunits: {
        type: Number,
        default: 0,
        min: 0
    }
});


// portfolioSchema.pre('save', async function (next) {
//     console.log(`we are inside pre save hook`);
//     try {
//             const asset = await fetchFromCache('AssetMergedDataShareSansar');
//             if (!asset) {
//                 portfolioLogger.error('Asset not found');
//                 throw new Error('Asset not found');
//             }
//             for (const stock of this.stocks) {
//                 const assetLTP = asset.find(item => item.symbol === stock.symbol);
//                 if (assetLTP) {
//                     stock.ltp = assetLTP.ltp;
//                     stock.costprice = (stock.quantity * stock.wacc).toFixed(2);
//                     stock.name = assetLTP.name;

//                     stock.currentprice = (assetLTP.ltp * stock.quantity).toFixed(2);
//                     stock.netgainloss = (stock.currentprice - stock.costprice).toFixed(2);
//                 }
//             }

//         next();
//     } catch (error) {
//         portfolioLogger.error('Error updating stock data, userAmount, and gainLossRecords:', error.message);
//         next(error);
//     }
// });


// portfolioSchema.post('find', async function (docs, next) {
//     try {
//         if (!Array.isArray(docs) || docs.length === 0) {
//             portfolioLogger.error('No portfolios found to process');
//             return;
//         }

//         const asset = await fetchFromCache('AssetMergedDataShareSansar');
//         if (!asset) {
//             portfolioLogger.error('Asset not found');
//             throw new Error('Asset not found');
//         }

//         await Promise.all(docs.map(async (doc) => {
//             if (!doc.stocks || !Array.isArray(doc.stocks) || doc.stocks.length === 0) {
//                 return;
//             }

//             await Promise.all(doc.stocks.map(async (stock) => {
//                 const assetLTP = asset.find(item => item.symbol === stock.symbol);
//                 if (assetLTP) {
//                     stock.ltp = assetLTP.ltp;
//                     stock.costprice = (stock.quantity * stock.wacc).toFixed(2);
//                     stock.name = assetLTP.name;
//                     stock.currentprice = (assetLTP.ltp * stock.quantity).toFixed(2);
//                     stock.netgainloss = (stock.currentprice - stock.costprice).toFixed(2);
//                 }
//             }));

//             doc.portfoliocost = (doc.stocks.reduce((total, stock) => total + stock.costprice, 0)).toFixed(2);
//             doc.portfoliovalue = (doc.stocks.reduce((total, stock) => total + stock.currentprice, 0)).toFixed(2);
//             const returns = (doc.portfoliovalue - doc.portfoliocost) / doc.portfoliocost * 100;
//             doc.portfolioPercentage = !isNaN(returns) ? parseFloat(returns.toFixed(1)) : 0;

//             doc.totalStocks = doc.stocks.length;
//             doc.totalunits = doc.stocks.reduce((total, stock) => total + stock.quantity, 0);

//             switch (true) {
//                 case doc.portfolioPercentage === 0:
//                     doc.recommendation = "Please add stocks to get a recommendation";
//                     break;
//                 case doc.portfolioPercentage > 50:
//                     doc.recommendation = "You are doing great, look to book your profits";
//                     break;
//                 case doc.portfolioPercentage >= 10 && doc.portfolioPercentage <= 50:
//                     doc.recommendation = "Strong hold and ride the trend";
//                     break;
//                 case doc.portfolioPercentage >= -10 && doc.portfolioPercentage < 0:
//                     doc.recommendation = "Look for a stop-loss";
//                     break;
//                 case doc.portfolioPercentage <= -10:
//                     doc.recommendation = "Hold and average";
//                     break;
//                 default:
//                     doc.recommendation = "Unable to provide a recommendation";
//             }

//             await doc.save();
//         }));

//     } catch (error) {
//         portfolioLogger.error(`Error updating stock data in post-find: ${error.message}`);
//         throw error;
//     }
// });



// portfolioSchema.post('findOne', async function (doc, next) {
//     try {
//         const asset = await fetchFromCache('AssetMergedDataShareSansar');
//         if (!asset) {
//             portfolioLogger.error('Asset not found');
//             throw new Error('Asset not found');
//         }

//         for (const stock of doc.stocks) {
//             const assetLTP = asset.find(item => item.symbol === stock.symbol);
//             if (assetLTP) {
//                 stock.ltp = assetLTP.ltp;
//                 stock.costprice = (stock.quantity * stock.wacc).toFixed(2);
//                 stock.name = assetLTP.name;
//                 stock.currentprice = (assetLTP.ltp * stock.quantity).toFixed(2);
//                 stock.netgainloss = (stock.currentprice - stock.costprice).toFixed(2);
//             }
//         }

//         // Calculate portfoliocost and portfoliovalue
//         doc.portfoliocost = (doc.stocks.reduce((total, stock) => total + stock.costprice, 0)).toFixed(2);
//         doc.portfoliovalue = (doc.stocks.reduce((total, stock) => total + stock.currentprice, 0)).toFixed(2);
//         const returns = (doc.portfoliovalue - doc.portfoliocost) / doc.portfoliocost * 100;
//         doc.portfolioPercentage = returns !== null && !isNaN(returns) ? parseFloat(returns.toFixed(1)) : 0;
//         doc.totalStocks = doc.stocks.length;
//         doc.totalunits = doc.stocks.reduce((total, stock) => total + stock.quantity, 0);

//         // Update recommendation based on portfolioPercentage
//         switch (true) {
//             case doc.portfolioPercentage === 0:
//                 doc.recommendation = "Please add stocks to get a recommendation";
//                 break;
//             case doc.portfolioPercentage > 50:
//                 doc.recommendation = "You are doing great, look to book your profits";
//                 break;
//             case doc.portfolioPercentage >= 10 && doc.portfolioPercentage <= 50:
//                 doc.recommendation = "Strong hold and ride the trend";
//                 break;
//             case doc.portfolioPercentage >= -10 && doc.portfolioPercentage < 0:
//                 doc.recommendation = "Look for a stop-loss";
//                 break;
//             case doc.portfolioPercentage <= -10:
//                 doc.recommendation = "Hold and average";
//                 break;
//             default:
//                 doc.recommendation = "Unable to provide a recommendation";
//         }

//         await doc.save();
//     } catch (error) {
//         portfolioLogger.error(`Error updating stock data in post-find: ${error.message}`);
//         throw error;
//     }
// });



const Portfolio = mongoose.model('Portfolio', portfolioSchema);

export default Portfolio;


