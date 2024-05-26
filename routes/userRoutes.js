
import { Router } from 'express';
import { sendOTP, verifyOTP } from '../controllers/otpControllers.js';
import { addStockToPortfolio, createPortfolio, deletePortfolio, getAllPortfoliosForUser, removeStockFromPortfolio, renamePortfolio } from '../controllers/portfolioControllers.js';
import { createUser, deleteAccount, forgetPass, loginUser, updateUser, updateUserData, updateUserProfilePicture, verifyData, verifyEmail, verifyName, verifyPassword, verifyPhoneNumber, verifyUser } from '../controllers/userController.js';
import { addStockToWatchlist, createWatchlist, deleteWatchlist, getWatchlistsByUserEmail, removeStockFromWatchlist, renameWatchlist } from '../controllers/watchlistController.js';
import { authGuard } from '../middleware/authGuard.js';


const router = Router();

//Unprotected routes
//user routes
//security verification on fly
router.post('/verifyname', verifyName);
router.post('/verifyemail', verifyEmail);
router.post('/verifypassword', verifyPassword);
router.post('/verifyphone', verifyPhoneNumber);

//general routes
router.post('/create', createUser);
router.post('/login', loginUser);
router.post('/otp-login', sendOTP);
router.post('/otp-verify', verifyOTP);
router.post('/forget', forgetPass);

//protected routes
router.post('/updateuser', authGuard, updateUser);
router.post('/updatealluserdata', authGuard, updateUserData);
router.post('/updateprofilepic', authGuard, updateUserProfilePicture);
router.get('/verify', authGuard, verifyUser);
router.post('/delete-acc', authGuard, deleteAccount);
router.post('/pre-verify', authGuard, verifyData);  //obselote

//portfolio
router.post('/newport', authGuard, createPortfolio);
router.post('/addstock', authGuard, addStockToPortfolio);
router.delete('/delport', authGuard, deletePortfolio);
router.post('/renameportfolio', authGuard, renamePortfolio);
router.get('/getallportforuser', authGuard, getAllPortfoliosForUser);
router.post('/remstock', authGuard, removeStockFromPortfolio);

//watchlist routes
router.post('/createwatchlist', authGuard, createWatchlist);
router.post('/getwatchlist', authGuard, getWatchlistsByUserEmail);
router.post('/renamewatchlist', authGuard, renameWatchlist);
router.post('/deletewatchlist', authGuard, deleteWatchlist);
router.post('/addstocktowatchlist', authGuard, addStockToWatchlist);
router.post('/remstockfromwatchlist', authGuard, removeStockFromWatchlist);

export default router;