import multipart from "connect-multiparty";
import { Router } from 'express';
import { sendOTP, verifyOTP } from '../controllers/otpControllers.js';
import { addStockToPortfolio, createPortfolio, deletePortfolio, getAllPortfoliosForUser, removeStockFromPortfolio, renamePortfolio } from '../controllers/portfolioControllers.js';
import { createUser, deleteAccount, forgetPass, loginUser, logoutUser, updateUser, updateUserData, updateUserProfilePicture, verifyData, verifyEmail, verifyName, verifyPassword, verifyPhoneNumber, verifyUser } from '../controllers/userController.js';
import { addStockToWatchlist, createWatchlist, deleteWatchlist, getWatchlistsByUserEmail, removeStockFromWatchlist, renameWatchlist } from '../controllers/watchlistController.js';
import { authGuard } from '../middleware/authGuard.js';
import { generateXsrfToken, validateXsrfToken } from '../middleware/csrfToken.js';

const router = Router();
const multipartMiddleware = multipart(); //kai form ma yo middleware halya xaina hola
//if error aaye ma yo middleware add garnu

router.use(validateXsrfToken);

//Unprotected routes
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
router.post('/updatealluserdata', authGuard, multipartMiddleware, updateUserData);
router.post('/updateprofilepic', authGuard, updateUserProfilePicture);
router.get('/verify', authGuard, verifyUser);
router.post('/delete-acc', authGuard, deleteAccount);
router.post('/pre-verify', authGuard, verifyData);  //obselote
router.get('/logout', logoutUser);

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

//get xsrf token
router.get('/csrf-token', function (req, res) {
    const token = generateXsrfToken();
    req.session.csrfToken = token;
    res.status(200).json({ token });
});

export default router;