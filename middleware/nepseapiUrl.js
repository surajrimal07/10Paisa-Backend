const BASE_URL = 'http://localhost:9000';

const nepseUrls = {
    Gainer_URL: `${BASE_URL}/top-ten/top-gainer?all=true`,
    Looser_URL: `${BASE_URL}/top-ten/top-loser?all=true`,
    Turnover_URL: `${BASE_URL}/top-ten/turnover?all=true`,
    Volume_URL: `${BASE_URL}/top-ten/trade?all=true`,
    API_URL: `${BASE_URL}/securityDailyTradeStat`,
    Company_URL: `${BASE_URL}/company/list`,
};

const othersUrls = {
    debenture_URL: `https://nepsealpha.com/investment-calandar/bonds-debenture`,
    mutual_URL: `https://www.sharesansar.com/mutual-fund-navs`,
};

export default nepseUrls;