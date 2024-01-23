import { Router } from 'express';
import { deleteUserByEmail, editUserByEmail, getAllUsers } from '../controllers/adminController.js';
import { AssetMergedData, AssetMergedDataBySector, CommodityData, DashBoardData, IndexData, SingeAssetMergedData, TopGainersData, TopLoosersData, TopTransData, TopTurnoverData, TopVolumeData, createAsset, fetchMetalPrices, metalHistController } from '../controllers/assetControllers.js';
import { sendOTP, verifyOTP } from '../controllers/otpControllers.js';
import { addStockToPortfolio, createPortfolio, deletePortfolio, getAllPortfoliosForUser, removeStockFromPortfolio, renamePortfolio } from '../controllers/portfolioControllers.js';
import { createUser, defaultportfolio, deleteAccount, fetchToken, forgetPass, googleSignIn, loginUser, makeadmin, removedefaultportfolio, updateUser, verifyData, verifyUser } from '../controllers/userController.js';
import { authGuard, authGuardAdmin } from '../middleware/authGuard.js';
import { startNewsServer } from '../server/newsServer.js';
import { createWatchlist,removeStockFromWatchlist, deleteWatchlist,addStockToWatchlist, getWatchlistsByUserEmail, renameWatchlist } from '../controllers/watchlistController.js';

const router = Router();

router.post('/create', createUser);
router.post('/login', loginUser);
router.post('/googlelogin', googleSignIn);
router.post('/otp-login', sendOTP);
router.post('/otp-verify', verifyOTP);
router.post('/forget', forgetPass);
router.post('/updateuser', updateUser);
router.post('/news', startNewsServer);
router.post('/verify', verifyUser);
router.post('/whattoken', fetchToken);
router.post('/delete-acc',deleteAccount);
router.post('/pre-verify',verifyData);
//portfolio
router.post('/newport', authGuard,createPortfolio);
router.post('/addstock',authGuard, addStockToPortfolio);
router.delete('/delport',authGuard,deletePortfolio);
router.post('/renameportfolio',authGuard,renamePortfolio);
router.post('/getallportforuser',getAllPortfoliosForUser);
router.post('/remstock',authGuard,removeStockFromPortfolio);
router.post('/newasset',authGuard,createAsset);
// router.post('/getassetnames',getAllAssetNames);
router.get('/commodity', CommodityData);
// router.post('/singleassetdetails', getSingleAssetDetails);
// router.post('/multiassetdetails', getMultiAssetDetails);
//router.post('/trending', getTopGainers);
router.post('/metalhist', metalHistController);
router.get('/metal', fetchMetalPrices);
//router.post('/turnover', getTopTurnover);
//router.post('/volume', getTopVolume);

router.post('/adddefaultport',authGuard, defaultportfolio);
router.post('/removedefaultport',authGuard, removedefaultportfolio);
router.post('/makeadmin',authGuard, makeadmin);
router.get('/sharesansardata', AssetMergedData);
router.post('/singlesharesansardata', SingeAssetMergedData);
router.post('/sectorsharesansardata', AssetMergedDataBySector);

//homepage data
router.post('/topgainers', TopGainersData);
router.post('/toploosers', TopLoosersData);
router.post('/topturnover', TopTurnoverData);
router.post('/topvolume', TopVolumeData);
router.post('/toptrans', TopTransData);
router.get('/dashboard', DashBoardData);
router.get('/index', IndexData);

//admin routes
router.get('/allusers',authGuardAdmin, getAllUsers);
router.delete('/deleteUser',authGuardAdmin, deleteUserByEmail);
router.put('/edituser',authGuardAdmin, editUserByEmail);

//watchlist routes

router.post('/createwatchlist', createWatchlist);
router.post('/getwatchlist', getWatchlistsByUserEmail);
router.post('/renamewatchlist', renameWatchlist);
router.post('/deletewatchlist', deleteWatchlist);
router.post('/addstocktowatchlist', addStockToWatchlist);
router.post('/remstockfromwatchlist', removeStockFromWatchlist);



export default router;
