import { Router } from 'express';
import { AllIndicesData,fetchSupplyDemand, AssetMergedData, AvailableNepseSymbols, CombinedIndexData, CommodityData, DashBoardData, IndexData, SingeAssetMergedData, TopGainersData, TopHeavyStocks, TopLoosersData, TopTransData, TopTurnoverData, TopVolumeData, WorldMarketData, fetchAndMergeDailyNepsePrice, fetchIntradayCompanyGraph, fetchMetalPrices, getCompanyOHLCNepseAlpha, nepseDailyGraphData, refreshCommodityData, refreshMetalsData, refreshWorldMarketData } from '../controllers/assetControllers.js';
import { NrbBankingDataAll, combinedNrbData, nrbForexData, refreshNRBData } from '../controllers/extraDataControllers.js';
//import { allowOnly } from '../middleware/methodAllowed.js';
import adminrouter from './adminRoutes.js';
import userrouter from './userRoutes.js';

const router = Router();

//asset data
router.get('/commodity', CommodityData);
router.get('/metal', fetchMetalPrices);
router.get('/sharesansardata', AssetMergedData);
router.get('/singlesharesansardata', SingeAssetMergedData);

//homepage data
router.get('/topgainers', TopGainersData);
router.get('/toploosers', TopLoosersData);
router.get('/topturnover', TopTurnoverData);
router.get('/topvolume', TopVolumeData);
router.get('/toptrans', TopTransData);
router.get('/dashboard', DashBoardData);

//index data
router.get('/index', IndexData);
router.get('/intradayindexgraph', nepseDailyGraphData);
router.get('/nepsedailyindex', CombinedIndexData); //older combinedindex
router.get('/fetchcompanygraphintraday', fetchIntradayCompanyGraph); ////aauta company ko din vari ko data of today

//company ko historical or intraday ohlc data from nepsealpha or systemxlite //used for python chart
router.get('/getcompanyohlc', getCompanyOHLCNepseAlpha);
router.get('/availablenepsecompanies', AvailableNepseSymbols);


//nrb datas
router.get('/nrbbankingdataAll', NrbBankingDataAll);
router.get('/nrbforexdata', nrbForexData);
router.get('/combinednrbdata', combinedNrbData);

//world indices
router.get('/worldmarketdata', WorldMarketData); //crypto dead

//routes for machine learning model and 6th sem project
router.get('/allindices', AllIndicesData);
router.get('/heavyStocks', TopHeavyStocks);
router.get('/supplydemand', fetchSupplyDemand);

//routes for chron server to fetch data per day automatically
router.get('/refreshmetals', refreshMetalsData);
router.get('/refreshworldmarket', refreshWorldMarketData);
router.get('/refreshcommodity', refreshCommodityData);
router.get('/refreshnrbdata', refreshNRBData);
router.get('/adddailyOHLC', fetchAndMergeDailyNepsePrice);
//router.get('/fetchindexdatafromnepsealpha'  , FetchSingleDatafromAPINepseAlpha);

//admin router
router.use('/admin', adminrouter); //https://localhost:4000/api/admin/allportfolios

//user router
router.use('/user', userrouter); //https://localhost:4000/api/user/login



// router.get('/active-users', (req, res) => {
//     const activeUsersCount = Object.keys(req.session.activeUsers).length;
//     res.json({ activeUsers: activeUsersCount });
// });


export default router;
