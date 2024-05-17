import { Router } from 'express';
import { AllIndicesData, AssetMergedData, AssetMergedDataBySector, AvailableNepseSymbols, CombinedIndexData, CommodityData, DashBoardData, IndexData, SingeAssetMergedData, TopGainersData, TopHeavyStocks, TopLoosersData, TopTransData, TopTurnoverData, TopVolumeData, WorldMarketData, fetchAndMergeDailyNepsePrice, fetchIntradayCompanyGraph, fetchMetalPrices, getCompanyOHLCNepseAlpha, nepseDailyGraphData, refreshCommodityData, refreshMetalsData, refreshWorldMarketData } from '../controllers/assetControllers.js';
import { NrbBankingDataAll, combinedNrbData, nrbForexData, refreshNRBData } from '../controllers/extraDataControllers.js';
import { allowOnly } from '../middleware/methodAllowed.js';
import adminrouter from './adminRoutes.js';
import userrouter from './userRoutes.js';

const router = Router();

//asset data
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

//index data
router.get('/index', allowOnly(['GET']), IndexData);
router.get('/intradayindexgraph', allowOnly(['GET']), nepseDailyGraphData);
router.get('/nepsedailyindex', allowOnly(['GET']), CombinedIndexData); //older combinedindex
router.get('/fetchcompanygraphintraday', allowOnly(['GET']), fetchIntradayCompanyGraph); ////aauta company ko din vari ko data of today

//company ko historical or intraday ohlc data from nepsealpha or systemxlite //used for python chart
router.get('/getcompanyohlc', allowOnly(['GET']), getCompanyOHLCNepseAlpha);
router.get('/availablenepsecompanies', allowOnly(['GET']), AvailableNepseSymbols);


//nrb datas
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

//admin router
router.use('/admin', adminrouter); //https://localhost:4000/api/admin/allportfolios

//user router
router.use('/user', userrouter); //https://localhost:4000/api/user/login

router.get('/active-users', (req, res) => {
    const activeUsersCount = Object.keys(req.session.activeUsers).length;
    res.json({ activeUsers: activeUsersCount });
});


export default router;
