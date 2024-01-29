import mongoose from 'mongoose';
import Asset from '../models/assetModel.js';
import Portfolio from '../models/portfolioModel.js';
import { respondWithData, respondWithError, respondWithSuccess } from '../utils/response_utils.js';

export const createPortfolio = async (req, res) => {
  try {
    console.log('Create Portfolio Requested');
    const userEmail = req.body.email;
    const portfolioName = req.body.name;

    console.log(userEmail, portfolioName);

    const existingPortfolio = await Portfolio.findOne({ userEmail, name: portfolioName });

    if (existingPortfolio) {
      return respondWithError(res, 'BAD_REQUEST', 'Duplicate Portfolio');
    }
    const maxPortfolio = await Portfolio.findOne({ userEmail }, {}, { sort: { id: -1 } });

    const newPortfolioId = maxPortfolio ? maxPortfolio.id + 1 : 1;
    const portfolio = await Portfolio.create({ userEmail, name: portfolioName, id: newPortfolioId });
    return respondWithData(res, 'SUCCESS', 'Portfolio created successfully', portfolio);

  } catch (error) {
    console.error(error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while creating portfolio');
  }
};

//add stock to porfolio, don't ever change this
export const addStockToPortfolio = async (req, res) => {
  console.log('Add to Portfolio Requested');

  const ObjectId = mongoose.Types.ObjectId;

  try {

    if (!req.body.email || !req.body.id || !req.body.symboll || !req.body.price || !req.body.quantityy) {
      return respondWithError(res, 'BAD_REQUEST', 'Email, id, symbol, price and quantity are required')
      };

    const { email, id, symboll,quantityy} = req.body;

    const symbol = String(symboll).toUpperCase();
    const quantity = Number(quantityy);

    const existingPortfolio = await Portfolio.findOne({
      userEmail: email,
      _id: new ObjectId(id),
    });

    if (!existingPortfolio) {
      const costprice = req.body.price * quantity;
      const currentprice = await getLTPForStock(symbol) * quantity;
      const netgainloss = currentprice - costprice;

      const newPortfolio = new Portfolio({
        userToken: token,
        id: id,
        name: "Default Portfolio",
        stocks: [
          {
            symbol,
            quantity,
            wacc: (req.body.price).toFixed(2),
            costprice: costprice.toFixed(2),
            currentprice: currentprice.toFixed(2),
            netgainloss: netgainloss.toFixed(2),
          },
        ],
        portfoliocost: costprice.toFixed(2),
        portfoliovalue: currentprice.toFixed(2),
        gainLossRecords: createNewGainLossRecord(currentprice, costprice)
      });

      const isStockValid = await isStockExists(symbol);
      if (!isStockValid) {
        return respondWithError(res, 'BAD_REQUEST', 'Stock not found');
      }

      await newPortfolio.save();
      return respondWithData(res, 'SUCCESS', 'Stock added to portfolio successfully', newPortfolio);
    }

    const isStockValid = await isStockExists(symbol);
    if (!isStockValid) {
      return respondWithError(res, 'BAD_REQUEST', 'Stock not found');
    }

    let wacc = req.body.price;

    const existingStockIndex = existingPortfolio.stocks.findIndex(
      (stock) => stock.symbol === symbol
    );

    if (existingStockIndex !== -1) {
      const existingStock = existingPortfolio.stocks[existingStockIndex];
      const totalShares = existingStock.quantity + quantity;

      existingStock.quantity += quantity;
      existingStock.currentprice = await getLTPForStock(symbol) * existingStock.quantity;

      existingStock.netgainloss = (existingStock.currentprice - existingStock.costprice).toFixed(2);

      //
      existingStock.wacc = ((existingStock.costprice + (wacc * quantity)) / totalShares).toFixed(2);
      existingStock.costprice = (existingStock.wacc * existingStock.quantity).toFixed(2);
      //
      updateGainLossRecords(existingPortfolio);
      existingPortfolio.portfoliovalue = await calculatePortfolioValue(existingPortfolio.stocks);
      //

    } else {
      const costprice = wacc * quantity;
      wacc = (req.body.price*quantity)/quantity ;
      const currentprice = await getLTPForStock(symbol) * quantity;
      const netgainloss = currentprice - costprice;

      existingPortfolio.stocks.push({
        symbol,
        quantity,
        wacc,
        costprice: costprice.toFixed(2),
        currentprice: currentprice.toFixed(2),
        netgainloss: netgainloss.toFixed(2),
      });

      existingPortfolio.portfoliocost = ((existingPortfolio.portfoliocost || 0) + costprice);

      existingPortfolio.portfoliovalue = (await calculatePortfolioValue(existingPortfolio.stocks)).toFixed(2);
      existingPortfolio.totalunits = existingPortfolio.quantity + quantity;


      updateGainLossRecords(existingPortfolio);
    }
    updateGainLossRecords(existingPortfolio);

    existingPortfolio.portfoliocost = existingPortfolio.stocks.reduce(
      (total, stock) => total + parseFloat(stock.costprice),
      0
    ).toFixed(2);

    existingPortfolio.portfoliovalue = await calculatePortfolioValue(
      existingPortfolio.stocks
    );

    existingPortfolio.totalunits = existingPortfolio.stocks.reduce(
      (total, stock) => total + stock.quantity,
      0
    );

    await existingPortfolio.save();

    return respondWithData(res, 'SUCCESS', 'Stock added to portfolio successfully', existingPortfolio);
  } catch (error) {
    console.error(error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while adding stock to portfolio');
  }
};

//function to check if stock exists in assets collection
const isStockExists = async (symbol) => {
  try {
    const asset = await Asset.findOne({ symbol: symbol });
    return !!asset;
  } catch (error) {
    console.error('Error checking if stock exists:', error.message);
    return false;
  }
};

// Function to update gainLossRecords
const updateGainLossRecords = (portfolio) => {
  const currentDate = new Date().toLocaleDateString();

  if (portfolio.gainLossRecords.length === 0) {
    portfolio.gainLossRecords.push(createNewGainLossRecord(portfolio.portfoliovalue, portfolio.portfoliocost));
  } else {
    const latestRecordDate = portfolio.gainLossRecords[portfolio.gainLossRecords.length - 1].date.toLocaleDateString();

    if (latestRecordDate !== currentDate) {
      portfolio.gainLossRecords.push(createNewGainLossRecord(portfolio.portfoliovalue, portfolio.portfoliocost));
    } else {
      const latestGainLossRecord = portfolio.gainLossRecords[portfolio.gainLossRecords.length - 1];
      latestGainLossRecord.value = portfolio.portfoliovalue.toFixed(2);
      latestGainLossRecord.portgainloss = (portfolio.portfoliovalue - portfolio.portfoliocost).toFixed(2);
    }
  }
};

const createNewGainLossRecord = (portfolioValue, portfolioCost) => {
  console.log(portfolioValue);
  console.log(portfolioCost);

  return {
    date: new Date(),
    value: portfolioValue,
    portgainloss: portfolioValue - portfolioCost,
  };
};
//get portfolio value //helper function
const calculatePortfolioValue = async (stocks) => {
  const ltpValues = await Promise.all(
    stocks.map(async (stock) => {
      const ltp = await getLTPForStock(stock.symbol);
      return ltp * stock.quantity;
    })
  );

  const portfoliovalue = ltpValues.reduce((total, value) => total + value, 0);
  return portfoliovalue;
}

// Function to get LTP (current market value) for a stock //helper function
const getLTPForStock = async (symbol) => {
  try {
    const asset = await Asset.findOne({ symbol });

    if (!asset) {
      console.error(`Asset with symbol ${symbol} not found.`);
      return 0;
    }

    return asset.ltp || 0;
  } catch (error) {
    console.error('Error fetching LTP:', error.message);
    return 0;
  }
};

// end of add stock to portfolio

// tested and working
export const deletePortfolio = async (req, res) => {
  try {
    console.log('Delete Portfolio Requested');

    const userEmail = req.body.email;
    const portid = req.body.id;

    console.log(userEmail, portid);

    const ObjectId = mongoose.Types.ObjectId;

    const portfolio = await Portfolio.findOne({ _id: new ObjectId(portid) });

    if (!portfolio) {
      return respondWithError(res, 'NOT_FOUND', 'Portfolio not found');
    }

    if (portfolio.userEmail !== userEmail) {
      return respondWithError(res, 'FORBIDDEN', 'You do not have permission to delete this portfolio');
    }

    const delectedportfolio = await Portfolio.findByIdAndDelete(portid);

    if (!delectedportfolio) {
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while deleting portfolio');
    }

    return respondWithData(res, 'SUCCESS', 'Portfolio deleted successfully', delectedportfolio);
  } catch (error) {
    console.error(error);
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while deleting portfolio');
  }
};

//rename portfolio //tested working
export const renamePortfolio = async (req, res) => {
  try {
    const userEmail = req.body.email;
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
    const updatedPortfolio = await portfolio.save();
    return respondWithData(res, 'SUCCESS', 'Portfolio renamed successfully', updatedPortfolio);

  } catch (error) {
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while renaming portfolio');
  }
};

  //remove stock from portfolio // gainLossRecords is broken, felt tired to fix
  export const removeStockFromPortfolio = async (req, res) => {
    console.log('Delete Stock from Portfolio Requested');
    const ObjectId = mongoose.Types.ObjectId;

    try {
      const { email, id, quantity } = req.body;

      const symbol = String(req.body.symbol).toUpperCase();

      if (!email || !id || !symbol || !quantity) {
        return respondWithError(res, 'BAD_REQUEST', 'Email, id, symbol and quantity are required');
      }

      console.log(email, id, symbol, quantity);

      const portfolio = await Portfolio.findOne({ _id: new ObjectId(id) });

      if (!portfolio) {
        return respondWithError(res, 'NOT_FOUND', 'Portfolio not found');
      }

      const stockIndex = portfolio.stocks.findIndex((stock) => stock.symbol === symbol);

      if (stockIndex === -1) {
        return respondWithError(res, 'NOT_FOUND', 'Stock not found in portfolio');
      }

      const existingQuantity = portfolio.stocks[stockIndex].quantity;

      if (quantity > existingQuantity) {
        return respondWithError(res, 'BAD_REQUEST', 'Quantity to remove exceeds existing quantity');
      }

      if (quantity === existingQuantity) {
        portfolio.stocks.splice(stockIndex, 1);
      } else {
        portfolio.stocks[stockIndex].quantity -= quantity;
      }

      await portfolio.save();

      return respondWithSuccess(res, 'SUCCESS', 'Stock removed from portfolio successfully');
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };

  export const getAllPortfoliosForUser = async (req, res) => {

    console.log("Get all portfolios for user requested");
    try {
      const useremail = req.body.email;

      if (!useremail) {
        return respondWithError(res, 'BAD_REQUEST', 'Email is required');
      }

      const portfolios = await Portfolio.find({ userEmail: useremail });

      if (!portfolios || portfolios.length === 0) {
        return respondWithError(res, 'NOT_FOUND', 'No portfolios found');
      }

      const formattedPortfolios = portfolios.map(portfolio => {
        const { __v, _id, ...rest } = portfolio._doc;
        const recommendation = generateRecommendation({ portfolio });
        const returns = (portfolio.portfoliovalue - portfolio.portfoliocost) / portfolio.portfoliocost * 100;
        const percentage = parseFloat(returns.toFixed(1));

        return {
          _id,
          id: rest.id,
          name: rest.name,
          userEmail: rest.userEmail,
          stocks: rest.stocks,
          totalunits: rest.totalunits,
          gainLossRecords: rest.gainLossRecords,
          portfoliocost: rest.portfoliocost,
          portfoliovalue: rest.portfoliovalue,
          recommendation,
          percentage
        };
      });
      return res.status(200).json({ portfolio: formattedPortfolios });
    } catch (error) {
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while fetching portfolios');
    }
  };


  //very basic and logically flawed recommendation system //just for assingment purpose only
  const generateRecommendation = ({ portfolio }) => {
    const calculateReturnPercentage = () => {

      if (portfolio.portfoliocost === 0) {
        return 0;
      }

      const returns = (portfolio.portfoliovalue - portfolio.portfoliocost) / portfolio.portfoliocost * 100;
      return returns;
    };

    const returnPercentage = calculateReturnPercentage();

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

