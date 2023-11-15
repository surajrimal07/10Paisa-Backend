import Portfolio from '../models/portfolioModel.js';

export const createPortfolio = async (req, res) => {
  try {
    const { userId, name } = req.body;
    const portfolio = await Portfolio.create({ userId, name });
    res.status(201).json(portfolio);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

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
      const { userId } = req.params;
      const portfolios = await Portfolio.find({ userId });
      res.status(200).json(portfolios);
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };