import { Router } from 'express';
import { deleteUserByToken, editUserByToken, getAllUsers } from '../controllers/adminController.js';
import { AssetMergedData, AssetMergedDataBySector, CommodityData, SingeAssetMergedData, TopGainersData, TopLoosersData, TopTransData, TopTurnoverData, TopVolumeData, createAsset, fetchMetalPrices, getTopGainers, getTopTurnover, getTopVolume, metalHistController } from '../controllers/assetControllers.js';
import { sendOTP, verifyOTP } from '../controllers/otpControllers.js';
import { addStockToPortfolio, createPortfolio, deletePortfolio, getAllPortfoliosForUser, removeStockFromPortfolio, renamePortfolio } from '../controllers/portfolioControllers.js';
import { createUser, defaultportfolio, deleteAccount, fetchToken, forgetPass, loginUser, makeadmin, removedefaultportfolio, updateUser, verifyData, verifyUser } from '../controllers/userController.js';
import { authGuard, authGuardAdmin } from '../middleware/authGuard.js';
import { startNewsServer } from '../server/newsServer.js';

const router = Router();

router.post('/create', createUser);
router.post('/login', loginUser);

router.post('/otp-login', sendOTP);
router.post('/otp-verify', verifyOTP);
router.post('/forget', forgetPass);
router.post('/updateuser',authGuard, updateUser);
router.post('/news', startNewsServer);
router.post('/verify', verifyUser);
router.post('/whattoken', fetchToken);
router.post('/delete-acc',deleteAccount);
router.post('/pre-verify',verifyData);
//portfolio
router.post('/newport', authGuard,createPortfolio);
router.post('/addstock',authGuard, addStockToPortfolio);
router.post('/delport',authGuard,deletePortfolio);
router.post('/renameportfolio',authGuard,renamePortfolio);
router.post('/getallportforuser',authGuard,getAllPortfoliosForUser);
router.post('/remstock',authGuard,removeStockFromPortfolio);
router.post('/newasset',authGuard,createAsset);
// router.post('/getassetnames',getAllAssetNames);
router.post('/commodity', CommodityData);
// router.post('/singleassetdetails', getSingleAssetDetails);
// router.post('/multiassetdetails', getMultiAssetDetails);
router.post('/trending', getTopGainers);
router.post('/metalhist', metalHistController);
router.post('/metal', fetchMetalPrices);
router.post('/turnover', getTopTurnover);
router.post('/volume', getTopVolume);

router.post('/adddefaultport',authGuard, defaultportfolio);
router.post('/removedefaultport',authGuard, removedefaultportfolio);
router.post('/makeadmin',authGuard, makeadmin);
router.post('/sharesansardata', AssetMergedData);
router.post('/singlesharesansardata', SingeAssetMergedData);
router.post('/sectorsharesansardata', AssetMergedDataBySector);
router.post('/topgainers', TopGainersData);
router.post('/toploosers', TopLoosersData);
router.post('/topturnover', TopTurnoverData);
router.post('/topvolume', TopVolumeData);
router.post('/toptrans', TopTransData);

//admin routes
router.post('/allusers',authGuardAdmin, getAllUsers);
router.post('/deleteUser',authGuardAdmin, deleteUserByToken);
router.post('/edituser',authGuardAdmin, editUserByToken);




export default router;
