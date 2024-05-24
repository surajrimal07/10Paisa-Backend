//   export default formatPortfolios;
import { fetchFromCache } from '../controllers/savefetchCache.js';
import { portfolioLogger } from '../utils/logger/logger.js';

//add extra portfolio datas
export const addExtraPortfolioData = async (portfolios) => {
    try {
        if (Array.isArray(portfolios) && portfolios.some(portfolio => portfolio.stocks.length === 0)) {
            return portfolios;
        }

        //first let's format the portfolio
        const asset = await fetchFromCache('AssetMergedDataShareSansar');
        if (!asset) {
            portfolioLogger.error('Asset not found');
            throw new Error('Asset not found');
        }

        await Promise.all(portfolios.map(async (portfolio) => {
            if (!portfolio.stocks || !Array.isArray(portfolio.stocks) || portfolio.stocks.length === 0) {
                return;
            }
            await Promise.all(portfolio.stocks.map(async (stock) => {
                const assetLTP = asset.find(item => item.symbol === stock.symbol);
                if (assetLTP) {
                    stock.ltp = assetLTP.ltp;
                    stock.costprice = (stock.quantity * stock.wacc).toFixed(2);
                    stock.name = assetLTP.name;
                    stock.currentprice = (assetLTP.ltp * stock.quantity).toFixed(2);
                    stock.netgainloss = (stock.currentprice - stock.costprice).toFixed(2);
                }
            }));

            portfolio.portfoliocost = (portfolio.stocks.reduce((total, stock) => total + stock.costprice, 0)).toFixed(2);
            portfolio.portfoliovalue = (portfolio.stocks.reduce((total, stock) => total + stock.currentprice, 0)).toFixed(2);
            const returns = (portfolio.portfoliovalue - portfolio.portfoliocost) / portfolio.portfoliocost * 100;
            portfolio.portfolioPercentage = !isNaN(returns) ? parseFloat(returns.toFixed(1)) : 0;

            portfolio.totalStocks = portfolio.stocks.length;
            portfolio.totalunits = portfolio.stocks.reduce((total, stock) => total + stock.quantity, 0);

            switch (true) {
                case portfolio.portfolioPercentage === 0:
                    portfolio.recommendation = "Please add stocks to get a recommendation";
                    break;
                case portfolio.portfolioPercentage > 50:
                    portfolio.recommendation = "You are doing great, look to book your profits";
                    break;
                case portfolio.portfolioPercentage >= 10 && portfolio.portfolioPercentage <= 50:
                    portfolio.recommendation = "Strong hold and ride the trend";
                    break;
                case portfolio.portfolioPercentage >= -10 && portfolio.portfolioPercentage < 0:
                    portfolio.recommendation = "Look for a stop-loss";
                    break;
                case portfolio.portfolioPercentage <= -10:
                    portfolio.recommendation = "Hold and average";
                    break;
                default:
                    portfolio.recommendation = "Unable to provide a recommendation";
            }
        }));


        //then let's add the exra data
        const totalPortfolioCostPromise = portfolios.reduce((total, portfolio) => total + portfolio.portfoliocost, 0);
        const totalPortfolioValuePromise = portfolios.reduce((total, portfolio) => total + portfolio.portfoliovalue, 0);
        const portfolioCount = portfolios.length;
        const totalStocksPromise = portfolios.reduce((total, portfolio) => total + portfolio.stocks.length, 0);
        const totalUnitsPromise = portfolios.reduce((total, portfolio) => total + portfolio.totalunits, 0);

        const [totalPortfolioCost, totalPortfolioValue, totalStocks, totalUnits] = await Promise.all([
            totalPortfolioCostPromise,
            totalPortfolioValuePromise,
            totalStocksPromise,
            totalUnitsPromise
        ]);

        const totalPortfolioReturns = totalPortfolioValue - totalPortfolioCost;
        const totalPortfolioReturnsPercentage = parseFloat(((totalPortfolioReturns / totalPortfolioCost) * 100).toFixed(2));

        const averagePortfolioReturns = parseFloat((totalPortfolioReturns / portfolioCount).toFixed(2));
        const averagePortfolioReturnsPercentage = parseFloat((totalPortfolioReturnsPercentage / portfolioCount).toFixed(2));

        const profitablePortfoliosPromise = portfolios.filter(portfolio => portfolio.portfoliovalue > portfolio.portfoliocost).length;
        const unprofitablePortfoliosPromise = portfolios.filter(portfolio => portfolio.portfoliovalue < portfolio.portfoliocost).length;

        const [profitablePortfolios, unprofitablePortfolios] = await Promise.all([
            profitablePortfoliosPromise,
            unprofitablePortfoliosPromise
        ]);

        const recommendation = totalPortfolioReturns > 0 ? 'Look for booking your profits' : 'Consider rebalancing your portfolio';

        const portfolioData = {
            totalPortfolioCost: totalPortfolioCost.toFixed(2),
            totalPortfolioValue: totalPortfolioValue.toFixed(2),
            totalPortfolioReturns: totalPortfolioReturns.toFixed(2),
            totalPortfolioReturnsPercentage,
            portfolioCount,
            averagePortfolioReturns,
            averagePortfolioReturnsPercentage,
            profitablePortfolios,
            unprofitablePortfolios,
            recommendation,
            totalStocks,
            totalUnits
        };

        const formPortfolios = {portfolio: portfolios, portfolioData: portfolioData};

        return formPortfolios;
    } catch (error) {
        console.error(error);
    }
};

export default addExtraPortfolioData;

//updates the stock data in the portfolio before saving
export const formatPreSavePortfolio = async (portfolio) => {
    try {
        const asset = await fetchFromCache('AssetMergedDataShareSansar');
        if (!asset) {
            portfolioLogger.error('Asset not found');
            throw new Error('Asset not found');
        }
        for (const stock of portfolio.stocks) {
            const assetLTP = asset.find(item => item.symbol === stock.symbol);
            if (assetLTP) {
                stock.ltp = assetLTP.ltp;
                stock.costprice = (stock.quantity * stock.wacc).toFixed(2);
                stock.name = assetLTP.name;
                stock.currentprice = (assetLTP.ltp * stock.quantity).toFixed(2);
                stock.netgainloss = (stock.currentprice - stock.costprice).toFixed(2);
            }
        }

        return portfolio;
    } catch (error) {
        portfolioLogger.error(`Error updating stock data in pre-save: ${error.message}`);
        throw error;
    }
};


export const formatPostFindPortfolio = async (docs) => {
    try {
        const asset = await fetchFromCache('AssetMergedDataShareSansar');
        if (!asset) {
            portfolioLogger.error('Asset not found');
            throw new Error('Asset not found');
        }

        await Promise.all(docs.map(async (doc) => {
            if (!doc.stocks || !Array.isArray(doc.stocks) || doc.stocks.length === 0) {
                return;
            }
            await Promise.all(doc.stocks.map(async (stock) => {
                const assetLTP = asset.find(item => item.symbol === stock.symbol);
                if (assetLTP) {
                    stock.ltp = assetLTP.ltp;
                    stock.costprice = (stock.quantity * stock.wacc).toFixed(2);
                    stock.name = assetLTP.name;
                    stock.currentprice = (assetLTP.ltp * stock.quantity).toFixed(2);
                    stock.netgainloss = (stock.currentprice - stock.costprice).toFixed(2);
                }
            }));

            doc.portfoliocost = (doc.stocks.reduce((total, stock) => total + stock.costprice, 0)).toFixed(2);
            doc.portfoliovalue = (doc.stocks.reduce((total, stock) => total + stock.currentprice, 0)).toFixed(2);
            const returns = (doc.portfoliovalue - doc.portfoliocost) / doc.portfoliocost * 100;
            doc.portfolioPercentage = !isNaN(returns) ? parseFloat(returns.toFixed(1)) : 0;

            doc.totalStocks = doc.stocks.length;
            doc.totalunits = doc.stocks.reduce((total, stock) => total + stock.quantity, 0);

            switch (true) {
                case doc.portfolioPercentage === 0:
                    doc.recommendation = "Please add stocks to get a recommendation";
                    break;
                case doc.portfolioPercentage > 50:
                    doc.recommendation = "You are doing great, look to book your profits";
                    break;
                case doc.portfolioPercentage >= 10 && doc.portfolioPercentage <= 50:
                    doc.recommendation = "Strong hold and ride the trend";
                    break;
                case doc.portfolioPercentage >= -10 && doc.portfolioPercentage < 0:
                    doc.recommendation = "Look for a stop-loss";
                    break;
                case doc.portfolioPercentage <= -10:
                    doc.recommendation = "Hold and average";
                    break;
                default:
                    doc.recommendation = "Unable to provide a recommendation";
            }
        }));

        return docs;

    } catch (error) {
        portfolioLogger.error(`Error updating stock data in post-find: ${error.message}`);
        throw error;
    }
};


export async function updatePortfolioDataAfterFindOne(doc) {
    try {
        const asset = await fetchFromCache('AssetMergedDataShareSansar');
        if (!asset) {
            portfolioLogger.error('Asset not found');
            throw new Error('Asset not found');
        }

        // for (const stock of doc.stocks) {
        //     const assetLTP = asset.find(item => item.symbol === stock.symbol);
        //     if (assetLTP) {
        //         stock.ltp = assetLTP.ltp;
        //         stock.costprice = (stock.quantity * stock.wacc).toFixed(2);
        //         stock.name = assetLTP.name;
        //         stock.currentprice = (assetLTP.ltp * stock.quantity).toFixed(2);
        //         stock.netgainloss = (stock.currentprice - stock.costprice).toFixed(2);
        //     }
        // }

        const stockUpdates = [];
        for (const stock of doc.stocks) {
            const assetLTP = asset.find(item => item.symbol === stock.symbol);
            if (assetLTP) {
                stock.ltp = assetLTP.ltp;
                stock.costprice = (stock.quantity * stock.wacc).toFixed(2);
                stock.name = assetLTP.name;
                stock.currentprice = (assetLTP.ltp * stock.quantity).toFixed(2);
                stock.netgainloss = (stock.currentprice - stock.costprice).toFixed(2);
            }
            stockUpdates.push(stock);
        }

        doc.stocks = await Promise.all(stockUpdates);

        doc.portfoliocost = (doc.stocks.reduce((total, stock) => total + stock.costprice, 0)).toFixed(2);
        doc.portfoliovalue = (doc.stocks.reduce((total, stock) => total + stock.currentprice, 0)).toFixed(2);
        const returns = (doc.portfoliovalue - doc.portfoliocost) / doc.portfoliocost * 100;
        doc.portfolioPercentage = returns !== null && !isNaN(returns) ? parseFloat(returns.toFixed(1)) : 0;
        doc.totalStocks = doc.stocks.length;
        doc.totalunits = doc.stocks.reduce((total, stock) => total + stock.quantity, 0);

        switch (true) {
            case doc.portfolioPercentage === 0:
                doc.recommendation = "Please add stocks to get a recommendation";
                break;
            case doc.portfolioPercentage > 50:
                doc.recommendation = "You are doing great, look to book your profits";
                break;
            case doc.portfolioPercentage >= 10 && doc.portfolioPercentage <= 50:
                doc.recommendation = "Strong hold and ride the trend";
                break;
            case doc.portfolioPercentage >= -10 && doc.portfolioPercentage < 0:
                doc.recommendation = "Look for a stop-loss";
                break;
            case doc.portfolioPercentage <= -10:
                doc.recommendation = "Hold and average";
                break;
            default:
                doc.recommendation = "Unable to provide a recommendation";
        }

        return doc;
    } catch (error) {
        portfolioLogger.error(`Error updating stock data in post-find: ${error.message}`);
        throw error;
    }
}