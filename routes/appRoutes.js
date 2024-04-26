import { Router } from 'express';
import { deleteUserByEmail, editUserByEmail, getAllPortfolios, getAllUsers } from '../controllers/adminController.js';
import { AllIndicesData, AssetMergedData, AssetMergedDataBySector, CombinedIndexData, CommodityData, DashBoardData, IndexData, SingeAssetMergedData, TopGainersData, TopHeavyStocks, TopLoosersData, TopTransData, TopTurnoverData, TopVolumeData, WorldMarketData, fetchMetalPrices, refreshCommodityData, refreshMetalsData, refreshWorldMarketData } from '../controllers/assetControllers.js';
import { NrbBankingDataAll, combinedNrbData, nrbForexData, refreshNRBData } from '../controllers/extraDataControllers.js';
import { sendOTP, verifyOTP } from '../controllers/otpControllers.js';
import { addStockToPortfolio, createPortfolio, deletePortfolio, getAllPortfoliosForUser, removeStockFromPortfolio, renamePortfolio } from '../controllers/portfolioControllers.js';
import { createUser, deleteAccount, forgetPass, googleSignIn, loginUser, makeadmin, updateUser, updateUserData, updateUserProfilePicture, verifyData, verifyEmail, verifyName, verifyPassword, verifyPhoneNumber, verifyUser } from '../controllers/userController.js';
import { addStockToWatchlist, createWatchlist, deleteWatchlist, getWatchlistsByUserEmail, removeStockFromWatchlist, renameWatchlist } from '../controllers/watchlistController.js';
import { authGuard, authGuardAdmin } from '../middleware/authGuard.js';
import { startNewsServer } from '../server/newsserver.js';

const router = Router();

//user routes
//security verification
router.post('/verifyname',verifyName);
router.post('/verifyemail',verifyEmail);
router.post('/verifypassword',verifyPassword);
router.post('/verifyphone',verifyPhoneNumber);

//general routes
router.post('/create', createUser);
router.post('/login', loginUser);
router.post('/googlelogin', googleSignIn);
router.post('/otp-login', sendOTP);
router.post('/otp-verify', verifyOTP);
router.post('/forget', forgetPass);
router.post('/updateuser', updateUser);
router.post('/updatealluserdata', updateUserData);
router.post('/updateprofilepic', updateUserProfilePicture);

router.post('/news', startNewsServer);
router.post('/verify', verifyUser);
router.post('/delete-acc',deleteAccount);
router.post('/pre-verify',verifyData);
//portfolio
router.post('/newport',createPortfolio);
router.post('/addstock', addStockToPortfolio);
router.delete('/delport',deletePortfolio);
router.post('/renameportfolio',renamePortfolio);
router.post('/getallportforuser',getAllPortfoliosForUser);
router.post('/remstock',removeStockFromPortfolio);

//
router.get('/commodity', CommodityData);
router.get('/metal', fetchMetalPrices);
router.get('/sharesansardata', AssetMergedData);
router.post('/singlesharesansardata', SingeAssetMergedData);
router.post('/sectorsharesansardata', AssetMergedDataBySector);

//homepage data
router.get('/topgainers', TopGainersData);
router.get('/toploosers', TopLoosersData);
router.get('/topturnover', TopTurnoverData);
router.get('/topvolume', TopVolumeData);
router.get('/toptrans', TopTransData);
router.get('/dashboard', DashBoardData);
router.get('/index', IndexData);
router.get('/combinedindex', CombinedIndexData);

//admin routes
router.get('/allusers', getAllUsers);
router.delete('/deleteUser',authGuardAdmin, deleteUserByEmail);
router.put('/edituser',authGuardAdmin, editUserByEmail);
router.get('/allportfolios', getAllPortfolios);
router.post('/makeadmin',authGuard, makeadmin);

//watchlist routes
router.post('/createwatchlist', createWatchlist);
router.post('/getwatchlist', getWatchlistsByUserEmail);
router.post('/renamewatchlist', renameWatchlist);
router.post('/deletewatchlist', deleteWatchlist);
router.post('/addstocktowatchlist', addStockToWatchlist);
router.post('/remstockfromwatchlist', removeStockFromWatchlist);

//nrb datas
//router.get('/nrbbankdata', NrbBankingData);
router.get('/nrbbankingdataAll', NrbBankingDataAll);
router.get('/nrbforexdata', nrbForexData);
router.get('/combinednrbdata', combinedNrbData);

//world indices
router.get('/worldmarketdata', WorldMarketData); //crypto dead

//routes for machine learning model and 6th sem project
router.get('/allindices',AllIndicesData);
router.get('/heavyStocks',TopHeavyStocks);

//routes for chron server to fetch data per day automatically
router.get('/refreshmetals',refreshMetalsData);
router.get('/refreshworldmarket',refreshWorldMarketData);
router.get('/refreshcommodity',refreshCommodityData);
router.get('/refreshnrbdata', refreshNRBData);

export default router;
