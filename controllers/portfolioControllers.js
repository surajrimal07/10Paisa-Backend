import Portfolio from '../models/portfolioModel.js';

// export const createPortfolio = async (req, res) => {
//   try {
//     const userToken = req.body.token;
//     const portfolioName = req.body.name;

//     const portfolio = await Portfolio.create({ userToken, name: portfolioName });

//     res.status(201).json(portfolio);


//   } catch (error) {
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

export const createPortfolio = async (req, res) => {
  try {
    const userToken = req.body.token;
    const portfolioName = req.body.name;

    const maxPortfolio = await Portfolio.findOne({ userToken }, {}, { sort: { id: -1 } });
    const newPortfolioId = maxPortfolio ? maxPortfolio.id + 1 : 1;
    const portfolio = await Portfolio.create({ userToken, name: portfolioName, id: newPortfolioId });
    res.status(201).json(portfolio);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



//nottested from here
export const addStockToPortfolio = async (req, res) => {
  try {
    const { portfolioId, symbol, quantity } = req.body;
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    portfolio.stocks.push({ symbol, quantity });
    await portfolio.save();
    res.status(200).json(portfolio);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deletePortfolio = async (req, res) => {
    try {
      const { portfolioId } = req.params;
      const portfolio = await Portfolio.findByIdAndDelete(portfolioId);
      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }
      res.status(200).json({ message: 'Portfolio deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  export const removeStockFromPortfolio = async (req, res) => {
    try {
      const { portfolioId, stockId } = req.params;
      const portfolio = await Portfolio.findById(portfolioId);
      if (!portfolio) {
        return res.status(404).json({ error: 'Portfolio not found' });
      }
      const stockIndex = portfolio.stocks.findIndex((stock) => stock._id == stockId);
      if (stockIndex === -1) {
        return res.status(404).json({ error: 'Stock not found in portfolio' });
      }
      portfolio.stocks.splice(stockIndex, 1);
      await portfolio.save();
      res.status(200).json(portfolio);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  export const getAllPortfoliosForUser = async (req, res) => {
    try {
      const userToken = req.body.token;
      const portfolios = await Portfolio.find({ userToken });
      res.status(200).json(portfolios);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };