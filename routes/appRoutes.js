import { Router } from 'express';
import { deleteUserByEmail, editUserByEmail, getAllPortfolios, getAllUsers } from '../controllers/adminController.js';
import { AllIndicesData, AssetMergedData, AssetMergedDataBySector, AvailableNepseSymbols, CombinedIndexData, CommodityData, DashBoardData, IndexData, SingeAssetMergedData, TopGainersData, TopHeavyStocks, TopLoosersData, TopTransData, TopTurnoverData, TopVolumeData, WorldMarketData, fetchAndMergeDailyNepsePrice, fetchIntradayCompanyGraph, fetchMetalPrices, getCompanyOHLCNepseAlpha, nepseDailyGraphData, refreshCommodityData, refreshMetalsData, refreshWorldMarketData } from '../controllers/assetControllers.js';
import { NrbBankingDataAll, combinedNrbData, nrbForexData, refreshNRBData } from '../controllers/extraDataControllers.js';
import { sendOTP, verifyOTP } from '../controllers/otpControllers.js';
import { addStockToPortfolio, createPortfolio, deletePortfolio, getAllPortfoliosForUser, removeStockFromPortfolio, renamePortfolio } from '../controllers/portfolioControllers.js';
import { createUser, deleteAccount, forgetPass, googleSignIn, loginUser, makeadmin, updateUser, updateUserData, updateUserProfilePicture, verifyData, verifyEmail, verifyName, verifyPassword, verifyPhoneNumber, verifyUser } from '../controllers/userController.js';
import { addStockToWatchlist, createWatchlist, deleteWatchlist, getWatchlistsByUserEmail, removeStockFromWatchlist, renameWatchlist } from '../controllers/watchlistController.js';
import { authGuard, authGuardAdmin } from '../middleware/authGuard.js';
import { getNews } from '../server/newsserver.js';

const router = Router();

// Middleware to block requests with disallowed methods //not working
const allowOnly = (allowedMethods) => {
    return (req, res, next) => {
        if (!allowedMethods.includes(req.method)) {
            return res.status(405).json({ error: 'Method Not Allowed', message: `${req.method} method is not allowed on this route` });
        }
        next();
    };
};

//user routes
//security verification on fly
router.post('/verifyname', allowOnly(['POST']), verifyName);
router.post('/verifyemail', allowOnly(['POST']), verifyEmail);
router.post('/verifypassword', allowOnly(['POST']), verifyPassword);
router.post('/verifyphone', allowOnly(['POST']), verifyPhoneNumber);

//general routes
router.post('/create', allowOnly(['POST']), createUser);
router.post('/login', allowOnly(['POST']), loginUser);
router.post('/googlelogin', allowOnly(['POST']), googleSignIn);
router.post('/otp-login', allowOnly(['POST']), sendOTP);
router.post('/otp-verify', allowOnly(['POST']), verifyOTP);
router.post('/forget', allowOnly(['POST']), forgetPass);
router.post('/updateuser', allowOnly(['POST']), updateUser);
router.post('/updatealluserdata', allowOnly(['POST']), updateUserData);
router.post('/updateprofilepic', allowOnly(['POST']), updateUserProfilePicture);

router.post('/verify', allowOnly(['POST']), verifyUser);
router.post('/delete-acc', allowOnly(['POST']), deleteAccount);
router.post('/pre-verify', allowOnly(['POST']), verifyData);

//portfolio
router.post('/newport', allowOnly(['POST']), createPortfolio);
router.post('/addstock', allowOnly(['POST']), addStockToPortfolio);
router.delete('/delport', allowOnly(['DELETE']), deletePortfolio);
router.post('/renameportfolio', allowOnly(['POST']), renamePortfolio);
router.post('/getallportforuser', allowOnly(['POST']), getAllPortfoliosForUser);
router.post('/remstock', allowOnly(['POST']), removeStockFromPortfolio);

//
router.get('/commodity', allowOnly(['GET']), CommodityData);
router.get('/metal', allowOnly(['GET']), fetchMetalPrices);
router.get('/sharesansardata', allowOnly(['GET']), AssetMergedData);
router.post('/singlesharesansardata', allowOnly(['POST']), SingeAssetMergedData);
router.post('/sectorsharesansardata', allowOnly(['POST']), AssetMergedDataBySector);

//homepage data
router.get('/topgainers', allowOnly(['GET']), TopGainersData);
router.get('/toploosers', allowOnly(['GET']), TopLoosersData);
router.get('/topturnover', allowOnly(['GET']), TopTurnoverData);
router.get('/topvolume', allowOnly(['GET']), TopVolumeData);
router.get('/toptrans', allowOnly(['GET']), TopTransData);
router.get('/dashboard', allowOnly(['GET']), DashBoardData);
router.get('/news', allowOnly(['GET']), getNews);
//router.get('/nepsesummary', allowOnly(['GET']), nepseSummary); //merged to index data

//index data
router.get('/index', allowOnly(['GET']), IndexData);
router.get('/intradayindexgraph', allowOnly(['GET']), nepseDailyGraphData);
router.get('/nepsedailyindex', allowOnly(['GET']), CombinedIndexData); //older combinedindex
router.get('/fetchcompanygraphintraday', allowOnly(['GET']), fetchIntradayCompanyGraph); ////aauta company ko din vari ko data of today

//company ko historical or intraday ohlc data from nepsealpha or systemxlite //used for python chart
router.get('/getcompanyohlc', allowOnly(['GET']), getCompanyOHLCNepseAlpha);
router.get('/availablenepsecompanies', allowOnly(['GET']), AvailableNepseSymbols);



//admin routes
router.get('/allusers', allowOnly(['GET']), getAllUsers);
router.delete('/deleteUser', allowOnly(['DELETE']), authGuardAdmin, deleteUserByEmail);
router.put('/edituser', allowOnly(['PUT']), authGuardAdmin, editUserByEmail);
router.get('/allportfolios', allowOnly(['GET']), getAllPortfolios);
router.post('/makeadmin', allowOnly(['POST']), authGuard, makeadmin);

//watchlist routes
router.post('/createwatchlist', allowOnly(['POST']), createWatchlist);
router.post('/getwatchlist', allowOnly(['POST']), getWatchlistsByUserEmail);
router.post('/renamewatchlist', allowOnly(['POST']), renameWatchlist);
router.post('/deletewatchlist', allowOnly(['POST']), deleteWatchlist);
router.post('/addstocktowatchlist', allowOnly(['POST']), addStockToWatchlist);
router.post('/remstockfromwatchlist', allowOnly(['POST']), removeStockFromWatchlist);

//nrb datas
//router.get('/nrbbankdata', NrbBankingData);
router.get('/nrbbankingdataAll', allowOnly(['GET']), NrbBankingDataAll);
router.get('/nrbforexdata', allowOnly(['GET']), nrbForexData);
router.get('/combinednrbdata', allowOnly(['GET']), combinedNrbData);

//world indices
router.get('/worldmarketdata', allowOnly(['GET']), WorldMarketData); //crypto dead

//routes for machine learning model and 6th sem project
router.get('/allindices', allowOnly(['GET']), AllIndicesData);
router.get('/heavyStocks', allowOnly(['GET']), TopHeavyStocks);

//routes for chron server to fetch data per day automatically
router.get('/refreshmetals', allowOnly(['GET']), refreshMetalsData);
router.get('/refreshworldmarket', allowOnly(['GET']), refreshWorldMarketData);
router.get('/refreshcommodity', allowOnly(['GET']), refreshCommodityData);
router.get('/refreshnrbdata', allowOnly(['GET']), refreshNRBData);
router.get('/adddailyOHLC', allowOnly(['GET']), fetchAndMergeDailyNepsePrice);
//router.get('/fetchindexdatafromnepsealpha', allowOnly(['GET']), FetchSingleDatafromAPINepseAlpha);

router.get('/active-users', (req, res) => {
    const activeUsersCount = Object.keys(req.session.activeUsers).length;
    res.json({ activeUsers: activeUsersCount });
});


export default router;
