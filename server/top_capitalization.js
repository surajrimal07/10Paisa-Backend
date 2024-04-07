const top20Companies = [
    { ticker: 'NTC', name: 'Nepal Doorsanchar Comapany Limited', impactPercentage: 4.72 },
    { ticker: 'NABIL', name: 'Nabil Bank Limited', impactPercentage: 3.70 },
    { ticker: 'CIT', name: 'Citizen Investment Trust', impactPercentage: 3.51 },
    { ticker: 'NRIC', name: 'Nepal Reinsurance Company Limited', impactPercentage: 2.84 },
    { ticker: 'GBIME', name: 'Global IME Bank Limited', impactPercentage: 2.04 },
    { ticker: 'HRL', name: 'Himalayan Reinsurance Limited', impactPercentage: 1.93 },
    { ticker: 'NICA', name: 'NIC Asia Bank Ltd.', impactPercentage: 1.87 },
    { ticker: 'EBL', name: 'Everest Bank Limited', impactPercentage: 1.83 },
    { ticker: 'NIMB', name: 'Nepal Investment Mega Bank Limited', impactPercentage: 1.68 },
    { ticker: 'NLIC', name: 'Nepal Life Insurance Co. Ltd.', impactPercentage: 1.54 },
    { ticker: 'SCB', name: 'Standard Chartered Bank Limited', impactPercentage: 1.53 },
    { ticker: 'NIFRA', name: 'Nepal Infrastructure Bank Limited', impactPercentage: 1.37 },
    { ticker: 'SHL', name: 'Soaltee Hotel Limited', impactPercentage: 1.28 },
    { ticker: 'HBL', name: 'Himalayan Bank Limited', impactPercentage: 1.25 },
    { ticker: 'HDL', name: 'Himalayan Distillery Limited', impactPercentage: 1.25 },
    { ticker: 'SARBTM', name: 'Sarbottam Cement Limited', impactPercentage: 1.23 },
    { ticker: 'HIDCL', name: 'Hydroelectricity Investment and Development Company Ltd', impactPercentage: 1.19 },
    { ticker: 'UNL', name: 'Unilever Nepal Limited', impactPercentage: 1.16 },
    { ticker: 'PCBL', name: 'Prime Commercial Bank Ltd.', impactPercentage: 1.15 },
    { ticker: 'CHCL', name: 'Chilime Hydropower Company Limited', impactPercentage: 1.13 },
    { ticker: 'LICN', name: 'Life Insurance Co. Nepal', impactPercentage: 1.13 }
];

//readjusting the impact percentage to make it out of 100
const totalImpactPercentage = top20Companies.reduce((total, company) => total + company.impactPercentage, 0);

const topCompaniess = top20Companies.map(company => ({
    ticker: company.ticker,
    name: company.name,
    impact: parseFloat(((company.impactPercentage / totalImpactPercentage) * 100).toFixed(2)),
}));

export default function topCompanies() {
    return topCompaniess;
}

