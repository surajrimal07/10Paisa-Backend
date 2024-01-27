import mongoose from 'mongoose';
import Asset from '../models/assetModel.js';
import User from '../models/userModel.js';
import Watchlist from '../models/watchlistModel.js';
import { respondWithData, respondWithError } from '../utils/response_utils.js';

//working
export const createWatchlist = async (req, res) => {

    console.log("Create Watchlist requested");

    const {email, name } = req.body;
    try {
      const user = await User.findOne({ email });

      console.log("User found");

      if (!user) {
        console.log("User not found");
        return respondWithError(res, 'NOT_FOUND', 'User not found');
      }

      const existingWatchlist = await Watchlist.findOne({ user: user.email, name: name });

      if (existingWatchlist) {
        console.log("Watchlist already exists with same name");
        return respondWithError(res, 'BAD_REQUEST', 'Watchlist already exists');
      }
      const newWatchlist = new Watchlist({
        user: user.email,
        name
      });

      console.log(" watchlist to be created is " + newWatchlist);

      const savedWatchlist = await newWatchlist.save();

     console.log("Watchlist created successfully");
      return respondWithData(res, 'SUCCESS', 'Watchlist created successfully', savedWatchlist);
    } catch (error) {
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while creating the watchlist');
    }
  };

  //fetch watchlist //working
  export const getWatchlistsByUserEmail = async (req, res) => {
    console.log("Fetch Watchlists by User Email requested");

    const { email } = req.body;

    try {
      const userWatchlists = await Watchlist.find({ user: email });

      if (!userWatchlists || userWatchlists.length === 0) {
        console.log("No watchlists found for the user");
        return respondWithError(res, 'NOT_FOUND', 'No watchlists found for the user');
      }

      console.log("Watchlists fetched successfully");
      return respondWithData(res, 'SUCCESS', 'Watchlists fetched successfully', userWatchlists);
    } catch (error) {
      console.error("Error fetching watchlists:", error);
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while fetching watchlists');
    }
  };

// Rename Watchlist //working
export const renameWatchlist = async (req, res) => {
    console.log("Rename Watchlist requested");
    const {email, watchlistId, newName } = req.body;
    const ObjectId = mongoose.Types.ObjectId;

  try {
     const watchlist = await Watchlist.findOne({ _id: new ObjectId(watchlistId)});

      if (!watchlist) {
        return respondWithError(res, 'NOT_FOUND', 'Watchlist not found');
      }

    if (watchlist.user !== email) {
        return respondWithError(res, 'FORBIDDEN', 'You do not have permission to access this watchlist');}

    const existingWatchlistWithNewName = await Watchlist.findOne({
    user: email,
    name: newName,
    _id: { $ne: watchlistId }
    });

    if (existingWatchlistWithNewName) {
    return respondWithError(res, 'BAD_REQUEST', 'Watchlist with the new name already exists');
    }

    watchlist.name = newName;

    const updatedWatchlist = await watchlist.save();
   return respondWithData(res, 'SUCCESS', 'Watchlist renamed successfully', updatedWatchlist);
  } catch (error) {
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while renaming the watchlist');
  }
};

//working
export const deleteWatchlist = async (req, res) => {
    console.log("Delete Watchlist requested");
    const { email, watchlistId } = req.body;
    const ObjectId = mongoose.Types.ObjectId;

    try {

      // Find the watchlist by its _id
      const watchlist = await Watchlist.findOne({ _id: new ObjectId(watchlistId) });

      if (!watchlist) {
        return respondWithError(res, 'NOT_FOUND', 'Watchlist not found');
      }

      // Check if the watchlist belongs to the user
      if (watchlist.user !== email) {
        return respondWithError(res, 'FORBIDDEN', 'You do not have permission to delete this watchlist');
      }

      // Delete the watchlist
      const deletedWatchlist = await Watchlist.findByIdAndDelete(watchlistId);

      if (!deletedWatchlist) {
        return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while deleting the watchlist');
      }

      return respondWithData(res, 'SUCCESS', 'Watchlist deleted successfully', deletedWatchlist);
    } catch (error) {
      console.error('Error deleting watchlist:', error);
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'An error occurred while deleting the watchlist');
    }
  };


// Add Stock to Watchlist //works
export const addStockToWatchlist = async (req, res) => {

    const {watchlistId, email ,stockSymbol  } = req.body;

    const ObjectId = mongoose.Types.ObjectId;
  try {

    const watchlist = await Watchlist.findOne({ _id: new ObjectId(watchlistId) });

    if (!watchlist) {
      return respondWithError(res, 'NOT_FOUND', 'Watchlist not found');
    }

    // Check if the watchlist belongs to the user
    if (watchlist.user !== email) {
    return respondWithError(res, 'FORBIDDEN', 'You do not have permission to delete this watchlist');
    }

    // Check if the stock exists
    const stocksUpper = stockSymbol ? stockSymbol.toString().toUpperCase() : '';

    const stock = await Asset.findOne({ symbol: stocksUpper });
    if (!stock) {
        return respondWithError(res, 'NOT_FOUND', 'Stock not found');
    }

    //check if same stock already exists in same watchlist
    if (watchlist.stocks.includes(stock.symbol)) {
        return respondWithError(res, 'BAD_REQUEST', 'Stock already exists in the watchlist');
        }

    watchlist.stocks.push(stock.symbol);

    // Save the updated watchlist
    const updatedWatchlist = await watchlist.save();

    return respondWithData(res, 'SUCCESS', 'Stock added to watchlist successfully', updatedWatchlist);
  } catch (error) {
    return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Wrong Watchlist ID');
  }
};

// Remove Stock from Watchlist
export const removeStockFromWatchlist = async (req, res) => {
    const { watchlistId, email, stockSymbol } = req.body;
    const ObjectId = mongoose.Types.ObjectId;

    try {
      const watchlist = await Watchlist.findOne({ _id: new ObjectId(watchlistId) });

      if (!watchlist) {
        return respondWithError(res, 'NOT_FOUND', 'Watchlist not found');
      }

      // Check if the watchlist belongs to the user
      if (watchlist.user !== email) {
        return respondWithError(res, 'FORBIDDEN', 'You do not have permission to modify this watchlist');
      }


      // Check if the stock symbol exists in the watchlist
      const stocksUpper = stockSymbol ? stockSymbol.toString().toUpperCase() : '';

      if (!watchlist.stocks.includes(stocksUpper)) {
        return respondWithError(res, 'BAD_REQUEST', 'Stock not found in the watchlist');
      }

      // Remove the stock symbol from the watchlist's stocks array
      watchlist.stocks = watchlist.stocks.filter(symbol => symbol !== stocksUpper);

      // Save the updated watchlist
      const updatedWatchlist = await watchlist.save();

      return respondWithData(res, 'SUCCESS', 'Stock removed from watchlist successfully', updatedWatchlist);
    } catch (error) {
      return respondWithError(res, 'INTERNAL_SERVER_ERROR', 'Wrong Watchlist ID');
    }
  };

