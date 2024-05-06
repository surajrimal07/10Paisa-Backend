export async function FetchSingularDataOfAssetFromAPI() {
  const url = "http://localhost:8000/CompanyList";
  const url2 = "http://localhost:8000/TradeTurnoverTransactionSubindices";

  try {
    const data = await fetch(url).then((response) => response.json());
    const data2 = await fetch(url2).then((response) => response.json());

    if (!data || !data2) {
      return null;
    }

    const filteredData = data
      .filter((company) => company.status === "A")
      .map(({ id, sectorName, securityName, ...rest }) => rest);

    const mergedData = filteredData.map((company) => {
      const symbol = company.symbol;
      const extraInfo = data2.scripsDetails[symbol];
      if (extraInfo) {
        return { ...company, ...extraInfo };
      } else {
        return company;
      }
    });

    return mergedData;
  } catch (error) {
    console.error(error);
  }
}

async function FetchSingleDatafromAPI(symbol) {
  const url = `http://localhost:8000/CompanyDetails?symbol=${symbol}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data) {
      return null;
    }

    data.securityDailyTradeDto.open = data.securityDailyTradeDto.openPrice;
    delete data.securityDailyTradeDto.openPrice;

    data.securityDailyTradeDto.high = data.securityDailyTradeDto.highPrice;
    delete data.securityDailyTradeDto.highPrice;

    data.securityDailyTradeDto.low = data.securityDailyTradeDto.lowPrice;
    delete data.securityDailyTradeDto.lowPrice;

    data.securityDailyTradeDto.close = data.securityDailyTradeDto.closePrice;
    delete data.securityDailyTradeDto.closePrice;

    delete data.securityDailyTradeDto.securityId;
    delete data.security.id;
    delete data.security.isin;
    delete data.security.creditRating;
    delete data.security.meInstanceNumber;
    delete data.security.recordType;
    delete data.security.shareGroupId;
    delete data.security.cdsStockRefId;
    delete data.security.securityTradeCycle;
    delete data.security.companyId;
    delete data.security.instrumentType;
    delete data.security.sectorMaster;
    delete data.security.highRangeDPR;
    delete data.security.issuerName;
    delete data.security.parentId;
    delete data.security.schemeDescription;
    delete data.security.schemeName;
    delete data.security.series;
    delete data.security.divisor;
    delete data.security.secured;

    if (data.security.companyId) {
      delete data.security.companyId.companyShortName;
      delete data.security.companyId.companyWebsite;
      delete data.security.companyId.companyRegistrationNumber;
      delete data.security.companyId.modifiedBy;
      delete data.security.companyId.modifiedDate;
    }

    delete data.updatedDate;
    delete data.securityId;

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

FetchSingularDataOfAssetFromAPI().then(console.log).catch(console.error);
