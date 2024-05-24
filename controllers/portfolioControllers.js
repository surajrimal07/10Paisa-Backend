import mongoose from 'mongoose';
import { addExtraPortfolioData } from '../models/portfolioExtraCalculations.js';
import { default as Portfolio } from '../models/portfolioModel.js';
import User from '../models/userModel.js';
import { FetchSingularDataOfAsset, fetchAvailableNepseSymbol } from '../server/assetServer.js';
import { portfolioLogger } from '../utils/logger/portfoliologger.js';
import { respondWithData, respondWithError, respondWithSuccess } from '../utils/response_utils.js';

export const createPortfolio = async (req, res) => {
  try {
    const userEmail = req.session.userEmail;
    const portfolioName = req.body.name;
    const portfolioGoal = req.body.goal;

    if (!userEmail || !portfolioName) {
      return respondWithError(res, 'BAD_REQUEST', 'Email and name are required');
    }

    portfolioLogger.info(`Create Portfolio Requested by ${userEmail}, for, ${portfolioName}`);

    const userPortfolios = await Portfolio.find({ userEmail: userEmail }).populate('stocks');
    const existingPortfolio = userPortfolios.find(portfolio => portfolio.name === portfolioName);

    if (existingPortfolio) {
      return respondWithError(res, 'BAD_REQUEST', 'Duplicate Portfolio');
    }

    await Portfolio.create({ userEmail, name: portfolioName, portfolioGoal });

    const data = await addExtraPortfolioData(userPortfolios);

    return respondWithData(res, 'SUCCESS', 'Portfolio created successfully', data);

  } catch (error) {
    console.error(error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while creating portfolio');
  }
};

//add stock to porfolio, don't ever change this
// export const addStockToPortfolio = async (req, res) => {
//   const ObjectId = mongoose.Types.ObjectId;

//   try {

//     if (!req.body.id || !req.body.symboll || !req.body.price || !req.body.quantityy) {
//       return respondWithError(res, 'BAD_REQUEST', 'Email, id, symbol, price and quantity are required')
//     };

//     const { id, symboll, quantityy } = req.body;
//     const email = req.session.userEmail;

//     const symbol = String(symboll).toUpperCase();
//     const quantity = Number(quantityy);
//     let wacc = req.body.price;

//     if (!await isStockExists(symbol)) {
//       return respondWithError(res, 'BAD_REQUEST', `Stock ${symbol} not found`);
//     }

//     // const existingPortfolio = await Portfolio.findOne({
//     //   userEmail: email,
//     //   _id: new ObjectId(id),
//     // });
//     const existingPortfolio = await Portfolio.findOne({ userEmail: email, _id: new ObjectId(id) }).populate('stocks');

//     if (!existingPortfolio) {
//       return respondWithError(res, 'NOT_FOUND', 'Portfolio not found, please create a portfolio first');
//     }

//     const hasBalance = await hasEnoughBalance(email, quantity, req.body.price, true);

//     if (!hasBalance) {
//       return respondWithError(res, 'BAD_REQUEST', 'Insufficient balance');
//     }

//     const existingStockIndex = existingPortfolio.stocks.findIndex(
//       (stock) => stock.symbol === symbol
//     );

//     if (existingStockIndex !== -1) {
//       const existingStock = existingPortfolio.stocks[existingStockIndex];
//       const totalShares = existingStock.quantity + quantity;
//       existingStock.ltp = await getLTPForStock(symbol);

//       existingStock.quantity += quantity;
//       existingStock.wacc = ((existingStock.costprice + (wacc * quantity)) / totalShares).toFixed(2);
//     } else {
//       wacc = (req.body.price * quantity) / quantity;
//       const ltp = await getLTPForStock(symbol);

//       existingPortfolio.stocks.push({
//         symbol,
//         quantity,
//         wacc,
//         ltp
//       });

//     }
//     await Promise.all([
//       hasEnoughBalance(email, quantity, req.body.price, false), //this decucts the balance from user account
//       existingPortfolio.save(), //calling save once here
//     ]);

//     // await hasEnoughBalance(email, quantity, req.body.price, false);
//     // await existingPortfolio.save();
//     //const data = await addExtraPortfolioData(email);

//     return res.status(200).json({ success: true, message: 'Stock added to portfolio successfully', existingPortfolio });

//   } catch (error) {
//     console.error(error);
//     return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while adding stock to portfolio');
//   }
// };
export const addStockToPortfolio = async (req, res) => {
  try {
    const { id, symboll, price, quantityy } = req.body;
    const email = req.session.userEmail;

    if (!id || !symboll || !price || !quantityy) {
      return respondWithError(res, 'BAD_REQUEST', 'Email, id, symbol, price, and quantity are required');
    }

    const symbol = symboll.toUpperCase();
    const quantity = Number(quantityy);
    const wacc = Number(price);
    const time = req.body.time ? Number(time) : Math.floor(Date.now() / 1000);

    const [stockExists, userPortfolios, UserData] = await Promise.all([
      isStockExists(symbol),
      Portfolio.find({ userEmail: email }),
      User.findOne({ email: email.toLowerCase() })
    ]);

    if (!stockExists) {
      return respondWithError(res, 'BAD_REQUEST', `Stock ${symbol} not found`);
    }

    const existingPortfolio = userPortfolios.find(portfolio => portfolio._id.toString() === id);
    if (!existingPortfolio) {
      return respondWithError(res, 'NOT_FOUND', 'selected Portfolio not found, please create one');
    }

    if (!UserData || UserData.userAmount < (quantity * price)) {
      return respondWithError(res, 'BAD_REQUEST', 'Insufficient balance');
    };

    const existingStockIndex = existingPortfolio.stocks.findIndex(stock => stock.symbol === symbol);

    if (existingStockIndex !== -1) {
      const existingStock = existingPortfolio.stocks[existingStockIndex];
      const totalShares = existingStock.quantity + quantity;
      const ltp = await getLTPForStock(symbol);

      existingStock.ltp = ltp;
      existingStock.quantity += quantity;
      existingStock.wacc = ((existingStock.costprice + (wacc * quantity)) / totalShares).toFixed(2);
      existingStock.time = time;
    } else {
      const ltp = await getLTPForStock(symbol);
      const newStock = {
        symbol,
        quantity,
        wacc: ((req.body.price * quantity) / quantity).toFixed(2),
        ltp: ltp,
        time: time
      };
      existingPortfolio.stocks.push(newStock);
    }

    UserData.userAmount -= (quantity * price);

    await Promise.all([
      existingPortfolio.save(),
      UserData.save()
    ]);

    const data = await addExtraPortfolioData(userPortfolios);
    return respondWithData(res, 'SUCCESS', 'Stock added to portfolio successfully', data);
  } catch (error) {
    console.error(error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while adding stock to portfolio');
  }
};

//function to check if stock exists in assets collection
const isStockExists = async (symbol) => {
  try {
    const symbols = await fetchAvailableNepseSymbol(true);
    return symbols.some(existingSymbol => existingSymbol === symbol);
  } catch (error) {
    return false;
  }
};


//function to check if user has enougn balance to purchase this asset
// const hasEnoughBalance = async (email, quantity, price, check = true) => {
//   const user = await User.findOne({ email: email.toLowerCase() })
//   const costprice = quantity * price;

//   if (check) {
//     try {
//       if (costprice > user.userAmount) {
//         portfolioLogger.warn(`User dont have enough balance`);
//         return false;
//       }
//       return costprice < user.userAmount;
//     } catch (error) {
//       portfolioLogger.error(`Error checking user balance: ${error.message}`);
//       return false;
//     }
//   }
//   else {
//     try {
//       user.userAmount -= costprice;
//       await user.save();
//       return true;
//     }
//     catch (error) {
//       portfolioLogger.error(`Error updating user balance: ${error.message}`);
//       return false;
//     }

//   }
// };

// Function to update gainLossRecords
// const updateGainLossRecords = (portfolio) => {
//   const currentDate = new Date().toLocaleDateString();

//   if (portfolio.gainLossRecords.length === 0) {
//     portfolio.gainLossRecords.push(createNewGainLossRecord(portfolio.portfoliovalue, portfolio.portfoliocost));
//   } else {
//     const latestRecordDate = portfolio.gainLossRecords[portfolio.gainLossRecords.length - 1].date.toLocaleDateString();

//     if (latestRecordDate !== currentDate) {
//       portfolio.gainLossRecords.push(createNewGainLossRecord(portfolio.portfoliovalue, portfolio.portfoliocost));
//     } else {
//       const latestGainLossRecord = portfolio.gainLossRecords[portfolio.gainLossRecords.length - 1];
//       latestGainLossRecord.value = portfolio.portfoliovalue.toFixed(2);
//       latestGainLossRecord.portgainloss = (portfolio.portfoliovalue - portfolio.portfoliocost).toFixed(2);
//     }
//   }
// };

// const createNewGainLossRecord = (portfolioValue, portfolioCost) => {
//   return {
//     date: new Date(),
//     value: portfolioValue.toFixed(2),
//     portgainloss: (portfolioValue - portfolioCost).toFixed(2),
//   };
// };
//get portfolio value //helper function
// const calculatePortfolioValue = async (stocks) => {
//   const ltpValues = await Promise.all(
//     stocks.map(async (stock) => {
//       const ltp = await getLTPForStock(stock.symbol);
//       return ltp * stock.quantity;
//     })
//   );

//   const portfoliovalue = ltpValues.reduce((total, value) => total + value, 0).toFixed(2);
//   return portfoliovalue;
// }

// Function to get LTP (current market value) for a stock //helper function
// const getLTPForStock = async (symbol) => {
//   try {
//     const assetLTP = await FetchSingularDataOfAsset();
//     if (assetLTP && Array.isArray(assetLTP)) {
//       const asset = assetLTP.find(item => item.symbol === symbol);
//       if (asset) {
//         return asset.ltp;
//       }
//     }
//     return 0;
//   } catch (error) {
//     portfolioLogger.error(`Error fetching LTP: ${error.message}`);
//     return 0;
//   }
// };

const getLTPForStock = async (symbol) => {
  try {
    const assetLTP = await FetchSingularDataOfAsset();
    if (Array.isArray(assetLTP) && assetLTP.some(item => item.symbol === symbol)) {
      return assetLTP.find(item => item.symbol === symbol).ltp;
    }
    return 0;
  } catch (error) {
    portfolioLogger.error(`Error fetching LTP: ${error.message}`);
    return 0;
  }
};


// end of add stock to portfolio

// tested and working
export const deletePortfolio = async (req, res) => {
  try {
    const portid = req.body.id;

    const ObjectId = mongoose.Types.ObjectId;

    const portfolio = await Portfolio.findOne({ _id: new ObjectId(portid) });

    if (!portfolio) {
      return respondWithError(res, 'NOT_FOUND', 'Portfolio not found');
    }

    if (portfolio.userEmail !== req.session.userEmail) {
      return respondWithError(res, 'FORBIDDEN', 'You do not have permission to delete this portfolio');
    }

    const delectedportfolio = await Portfolio.findByIdAndDelete(portid);

    if (!delectedportfolio) {
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while deleting portfolio');
    }

    return respondWithSuccess(res, 'SUCCESS', "Portfolio deleted successfully");

  } catch (error) {
    console.error(error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while deleting portfolio');
  }
};

//rename portfolio //tested working
export const renamePortfolio = async (req, res) => {
  try {
    const userEmail = req.session.userEmail;
    const portId = req.body.id;
    const newName = req.body.newName;

    const ObjectId = mongoose.Types.ObjectId;

    const portfolio = await Portfolio.findOne({ _id: new ObjectId(portId) });

    if (!portfolio) {
      return respondWithError(res, 'NOT_FOUND', 'Portfolio not found');
    }

    if (portfolio.userEmail !== userEmail) {
      return respondWithError(res, 'FORBIDDEN', 'You do not have permission to rename this portfolio');
    }

    const existingPortfolio = await Portfolio.findOne({ userEmail, name: newName });

    if (existingPortfolio) {
      return respondWithError(res, 'BAD_REQUEST', 'Duplicate Portfolio');
    }

    portfolio.name = newName;

    await portfolio.save();

    return respondWithSuccess(res, 'SUCCESS', "Portfolio renamed successfully");

  } catch (error) {
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while renaming portfolio');
  }
};

//remove stock from portfolio // gainLossRecords is broken, felt tired to fix
//works like remove not actual sell
//adding short sell and actual sell functionallity
export const removeStockFromPortfolio = async (req, res) => {
  const email = req.session.userEmail;
  const { id, quantity, symbol, price } = req.body;

  if (!id || !quantity || !symbol || !price) {
    return respondWithError(res, 'BAD_REQUEST', 'Email, id, symbol, price and quantity are required')
  };

  try {
    portfolioLogger.info(`Remove Stock from Portfolio Requested by ${email}`);
    const symbolUpper = String(symbol).toUpperCase();
    const time = req.body.time ? Number(time) : Math.floor(Date.now() / 1000);

    const [userPortfolios, UserData,stockExists] = await Promise.all([
      Portfolio.find({ userEmail: email }),
      User.findOne({ email: email.toLowerCase() }),
      isStockExists(symbolUpper),
    ]);

    if (!stockExists) {
      return respondWithError(res, 'BAD_REQUEST', `Stock ${symbol} not found`);
    }

    const portfolio = userPortfolios.find(portfolio => portfolio._id.toString() === id);

    if (!portfolio) {
      return respondWithError(res, 'NOT_FOUND', 'Selected Portfolio not found');
    }

    const stockIndex = portfolio.stocks.findIndex((stock) => stock.symbol === symbolUpper);


    if (stockIndex === -1) {
      // If the stock is not found in the portfolio, this means we are short selling
      portfolio.stocks.push({
        symbol: symbolUpper,
        quantity: -quantity, // Adding a negative quantity for short sell
        price: price, // Record the price at which the stock is short sold
        time: time
      });

      //if we are short selling then we have add the amount to user account
      UserData.userAmount += (quantity * price);

    } else {
      const existingQuantity = portfolio.stocks[stockIndex].quantity;
      console.log(`Existing Quantity: ${existingQuantity} and Quantity to sell: ${quantity}`);


      if (quantity > existingQuantity) {
        // Short sell the extra quantity
        portfolio.stocks[stockIndex].quantity -= quantity; // This will make the quantity negative indicating a short sell
        if (portfolio.stocks[stockIndex].quantity === 0) {
          portfolio.stocks.splice(stockIndex, 1);
        }
        //if the sell amount is > then existing amount
        //then for those remaning quantity we have to add the amount to user account
        UserData.userAmount += ((quantity - existingQuantity) * price);

      } else {
        //if sell quantity is same as existing quantity
        //then we have to add the amount to user account of total sales
        if (quantity === existingQuantity) {
          portfolio.stocks.splice(stockIndex, 1);
          UserData.userAmount += (quantity * price);
        } else {
          //if sell quantity is less than existing quantity
          //then we have to add the amount to user account of total quantity sales

          portfolio.stocks[stockIndex].quantity -= quantity;
          // if (portfolio.stocks[stockIndex].quantity === 0) {
          //   portfolio.stocks.splice(stockIndex, 1);
          // }
          UserData.userAmount += (quantity * price);
        }
      }
    }

    await Promise.all([
      portfolio.save(),
      UserData.save(),
    ]);

    const data = await addExtraPortfolioData(userPortfolios);
    return respondWithData(res, 'SUCCESS', 'Stock removed from portfolio successfully', data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const getAllPortfoliosForUser = async (req, res) => {

  try {
    const portfolios = await Portfolio.find({ userEmail: req.session.userEmail });
    if (!Array.isArray(portfolios) || portfolios.portfolios === 0) {
      return respondWithError(res, 'NOT_FOUND', 'No portfolios found');
    }

    const data = await addExtraPortfolioData(portfolios);
    return respondWithData(res, 'SUCCESS', 'Portfolios fetched successfully', data);
  } catch (error) {
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while fetching portfolios');
  }
};


//very basic and logically flawed recommendation system //just for assingment purpose only
const generateRecommendation = ({ portfolio }) => {

  const returnPercentage = portfolio.portfoliocost === 0 ? 0 : (portfolio.portfoliovalue - portfolio.portfoliocost) / portfolio.portfoliocost * 100;

  if (returnPercentage == 0) {
    return "Please add stocks to get recommendation";
  }
  if (returnPercentage > 50) {
    return "Look for booking your profits";
  } else if (returnPercentage >= 10 && returnPercentage <= 50) {
    return "Strong hold and ride the trend";
  } else if (returnPercentage >= -10 && returnPercentage < 0) {
    return "Look for stoploss";
  } else if (returnPercentage <= -10) {
    return "Hold and Average";
  } else {
    return "Unable to provide recommendation";
  }
};

