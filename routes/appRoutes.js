import { Router } from 'express';
import { deleteUserByEmail, editUserByEmail, getAllPortfolios, getAllUsers } from '../controllers/adminController.js';
import { AssetMergedData, AssetMergedDataBySector, CombinedIndexData, CommodityData, DashBoardData, IndexData, SingeAssetMergedData, TopGainersData, TopLoosersData, TopTransData, TopTurnoverData, TopVolumeData, WorldMarketData, createAsset, fetchMetalPrices } from '../controllers/assetControllers.js';
import { NrbBankingData, NrbBankingDataAll, combinedNrbData, nrbForexData } from '../controllers/extraDataControllers.js';
import { sendOTP, verifyOTP } from '../controllers/otpControllers.js';
import { addStockToPortfolio, createPortfolio, deletePortfolio, getAllPortfoliosForUser, removeStockFromPortfolio, renamePortfolio } from '../controllers/portfolioControllers.js';
import { createUser, deleteAccount, forgetPass, googleSignIn, loginUser, makeadmin, updateUser, updateUserData, updateUserProfilePicture, verifyData, verifyUser } from '../controllers/userController.js';
import { addStockToWatchlist, createWatchlist, deleteWatchlist, getWatchlistsByUserEmail, removeStockFromWatchlist, renameWatchlist } from '../controllers/watchlistController.js';
import { authGuard, authGuardAdmin } from '../middleware/authGuard.js';
import { startNewsServer } from '../server/newsServer.js';

const router = Router();

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
//router.post('/whattoken', fetchToken);
router.post('/delete-acc',deleteAccount);
router.post('/pre-verify',verifyData);
//portfolio
router.post('/newport',createPortfolio);
router.post('/addstock', addStockToPortfolio);
router.delete('/delport',deletePortfolio);
router.post('/renameportfolio',renamePortfolio);
router.post('/getallportforuser',getAllPortfoliosForUser);
router.post('/remstock',removeStockFromPortfolio);
router.post('/newasset',authGuard,createAsset);
// router.post('/getassetnames',getAllAssetNames);
router.get('/commodity', CommodityData);
// router.post('/singleassetdetails', getSingleAssetDetails);
// router.post('/multiassetdetails', getMultiAssetDetails);
//router.post('/trending', getTopGainers);
//router.post('/metalhist', metalHistController);
router.get('/metal', fetchMetalPrices);
//router.post('/turnover', getTopTurnover);
//router.post('/volume', getTopVolume);

// router.post('/adddefaultport',authGuard, defaultportfolio);
// router.post('/removedefaultport',authGuard, removedefaultportfolio);
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
router.get('/combinedindex', CombinedIndexData);


//admin routes
router.get('/allusers', getAllUsers);
router.delete('/deleteUser',authGuardAdmin, deleteUserByEmail);
router.put('/edituser',authGuardAdmin, editUserByEmail);
router.get('/allportfolios', getAllPortfolios);

//watchlist routes
router.post('/createwatchlist', createWatchlist);
router.post('/getwatchlist', getWatchlistsByUserEmail);
router.post('/renamewatchlist', renameWatchlist);
router.post('/deletewatchlist', deleteWatchlist);
router.post('/addstocktowatchlist', addStockToWatchlist);
router.post('/remstockfromwatchlist', removeStockFromWatchlist);

//nrb datas
router.get('/nrbbankdata', NrbBankingData);
router.get('/nrbbankingdataAll', NrbBankingDataAll);


router.get('/nrbforexdata', nrbForexData);
router.get('/combinednrbdata', combinedNrbData);

//world indices
router.get('/worldmarketdata', WorldMarketData);



export default router;
