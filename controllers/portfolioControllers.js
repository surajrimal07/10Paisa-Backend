import Asset from '../models/assetModel.js';
import Portfolio from '../models/portfolioModel.js';
import { respondWithError } from '../utils/response_utils.js';

export const createPortfolio = async (req, res) => {
  try {
    console.log('Create Portfolio Requested');
    const userEmail = req.body.email;
    const portfolioName = req.body.name;

    console.log(userEmail, portfolioName);

    const existingPortfolio = await Portfolio.findOne({ userEmail, name: portfolioName });

    if (existingPortfolio) {
      return res.status(400).json({success: false, message: "Duplicate Portfolio" });
    }
    const maxPortfolio = await Portfolio.findOne({ userEmail }, {}, { sort: { id: -1 } });

    const newPortfolioId = maxPortfolio ? maxPortfolio.id + 1 : 1;
    const portfolio = await Portfolio.create({ userEmail, name: portfolioName, id: newPortfolioId });
    res.status(200).json(portfolio);

  } catch (error) {
    console.error(error);
    res.status(500).json({success: false, message: "Internal Server Error" });
  }
};


//add stock to porfolio, don't ever change this
export const addStockToPortfolio = async (req, res) => {
  console.log('Add to Portfolio Requested');
  try {
    const { token, id, symbol, quantity } = req.body;

    const existingPortfolio = await Portfolio.findOne({
      userToken: token,
      id: id,
    });

    if (!existingPortfolio) {
      const costprice = req.body.price * quantity;
      const currentprice = await getLTPForStock(symbol) * quantity;
      const netgainloss = currentprice - costprice;
      console.log(costprice);
      console.log(currentprice);

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

      await newPortfolio.save();

      return res.status(200).json(newPortfolio);
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

    res.status(200).json(existingPortfolio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
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
    const userToken = req.body.token;
    const portid = req.body.id;

    const portfolio = await Portfolio.findOneAndDelete({
      userToken: userToken,
      id: portid,
    });

    if (!portfolio) {
      return res.status(404).json({success: false, message: "Portfolio not found" });
    }

    res.status(200).json({success: true, message: "Portfolio deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({success: false, message: "Internal Server Error" });
  }
};

//rename portfolio //tested working
export const renamePortfolio = async (req, res) => {
  try {
    const userToken = req.body.token;
    const portId = req.body.id;
    const newName = req.body.newName;

    const portfolio = await Portfolio.findOneAndUpdate(
      { userToken: userToken, id: portId },
      { name: newName },
      { new: true }
    );

    if (!portfolio) {
      return res.status(404).json({success: false, message: "Portfolio not found" });
    }

    res.status(200).json({success: true, message: "Portfolio renamed successfully", portfolio });
  } catch (error) {
    res.status(500).json({success: false, message: "Internal Server Error" });
  }
};

  //remove stock from portfolio // gainLossRecords is broken, felt tired to fix
  export const removeStockFromPortfolio = async (req, res) => {
    console.log('Delete Stock from Portfolio Requested');
    try {
      const { token, id, symbol, quantity } = req.body;

      console.log(token, id, symbol, quantity);

      const existingPortfolio = await Portfolio.findOne({
        userToken: token,
        id: id,
      });

      if (!existingPortfolio) {
        return res.status(404).json({success: false, message: "Portfolio not found" });
      }

    } catch (error) {
      console.error(error);
      res.status(500).json({success: false, message: "Internal Server Error" });
    }
  };
//

  //fetch portfolio //tested working
  // export const getAllPortfoliosForUser = async (req, res) => {
  //   try {
  //     const useremail = req.body.email;

  //     console.log("recieved email is "+useremail);
  //     console.log(useremail);

  //     const portfolios = await Portfolio.find({ userEmail: useremail });

  //     if (!portfolios || portfolios.length === 0) {
  //       return respondWithError(res, 'NOT_FOUND', 'No portfolios found');
  //       //return res.status(404).json({success: false, message: "Portfolios not found for the user" });
  //     }

  //    return res.status(200).json(portfolios);  //no error
  //     //return respondWithData(res, 'SUCCESS', 'Portfolios fetched successfully', portfolios); //throws error
  //   } catch (error) {
  //     return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while fetching portfolios');
  //   }

  export const getAllPortfoliosForUser = async (req, res) => {
    try {
      const useremail = req.body.email;

      console.log("received email is " + useremail);
      console.log(useremail);

      const portfolios = await Portfolio.find({ userEmail: useremail });

      if (!portfolios || portfolios.length === 0) {
        return respondWithError(res, 'NOT_FOUND', 'No portfolios found');
      }

      const formattedPortfolios = portfolios.map(portfolio => {
        const { _id, __v, ...rest } = portfolio._doc;
        return {
          id: rest.id,
          name: rest.name,
          stocks: rest.stocks,
          totalunits: rest.totalunits,
          gainLossRecords: rest.gainLossRecords,
          portfoliocost: rest.portfoliocost,
          portfoliovalue: rest.portfoliovalue,
        };
      });

     // return respondWithData(res, 'SUCCESS', 'Portfolios fetched successfully', formattedPortfolios); //throws error
      return res.status(200).json({ Portfolios: formattedPortfolios });
    } catch (error) {
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while fetching portfolios');
    }
  };



