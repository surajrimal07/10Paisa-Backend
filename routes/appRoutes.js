import { Router } from 'express';
import { AssetMergedData, AssetMergedDataBySector, CommodityData, SingeAssetMergedData, TopGainersData, TopLoosersData, TopTransData, TopTurnoverData, TopVolumeData, createAsset, fetchMetalPrices, getTopGainers, getTopTurnover, getTopVolume, metalHistController } from '../controllers/assetControllers.js';
import { sendOTP, verifyOTP } from '../controllers/otpControllers.js';
import { addStockToPortfolio, createPortfolio, deletePortfolio, getAllPortfoliosForUser, removeStockFromPortfolio, renamePortfolio } from '../controllers/portfolioControllers.js';
import { createUser, defaultportfolio, deleteAccount, fetchToken, forgetPass, loginUser, makeadmin, removedefaultportfolio, updateUser, verifyData, verifyUser } from '../controllers/userController.js';
import { startNewsServer } from '../server/newsServer.js';

const router = Router();

router.post('/create', createUser);
router.post('/login', loginUser);

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
router.post('/newport', createPortfolio);
router.post('/addstock', addStockToPortfolio);
router.post('/delport',deletePortfolio);
router.post('/renameportfolio',renamePortfolio);
router.post('/getallportforuser',getAllPortfoliosForUser);
router.post('/remstock',removeStockFromPortfolio);
router.post('/newasset',createAsset);
// router.post('/getassetnames',getAllAssetNames);
router.post('/commodity', CommodityData);
// router.post('/singleassetdetails', getSingleAssetDetails);
// router.post('/multiassetdetails', getMultiAssetDetails);
router.post('/trending', getTopGainers);
router.post('/metalhist', metalHistController);
router.post('/metal', fetchMetalPrices);
router.post('/turnover', getTopTurnover);
router.post('/volume', getTopVolume);

router.post('/adddefaultport', defaultportfolio);
router.post('/removedefaultport', removedefaultportfolio);
router.post('/makeadmin', makeadmin);
router.post('/sharesansardata', AssetMergedData);
router.post('/singlesharesansardata', SingeAssetMergedData);
router.post('/sectorsharesansardata', AssetMergedDataBySector);
router.post('/topgainers', TopGainersData);
router.post('/toploosers', TopLoosersData);
router.post('/topturnover', TopTurnoverData);
router.post('/topvolume', TopVolumeData);
router.post('/toptrans', TopTransData);



export default router;
