from nepse.TokenUtils import TokenManager
from datetime import date, datetime

import json
import requests
import pathlib


class Nepse:
    def __init__(self):
        # internal flag to set tls verification true or false during http request
        self._tls_verify = True

        self.token_manager = TokenManager()
        self.dummy_id_manager = DummyIDManager(
            market_status_function=self.getMarketStatus,
            date_function=datetime.now,
        )

        self.company_symbol_id_keymap = None
        self.company_list = None

        self.floor_sheet_size = 500

        self.base_url = "https://www.nepalstock.com.np"

        self.load_json_api_end_points()
        self.load_json_dummy_data()
        self.load_json_header()

    ###############################################PRIVATE METHODS###############################################
    def load_json_header(self):
        json_file_path = f"{pathlib.Path(__file__).parent}/HEADERS.json"
        with open(json_file_path, "r") as json_file:
            self.headers = json.load(json_file)
            self.headers["Host"] = self.base_url.replace("https://", "")
            self.headers["Referer"] = self.base_url.replace("https://", "")

    def load_json_api_end_points(self):
        json_file_path = f"{pathlib.Path(__file__).parent}/API_ENDPOINTS.json"
        with open(json_file_path, "r") as json_file:
            self.api_end_points = json.load(json_file)

        for key, value in self.api_end_points.items():
            self.api_end_points[key] = f"{self.base_url}{value}"

    def load_json_dummy_data(self):
        json_file_path = f"{pathlib.Path(__file__).parent}/DUMMY_DATA.json"
        with open(json_file_path, "r") as json_file:
            self.dummy_data = json.load(json_file)

    def getAuthorizationHeaders(self):
        headers = self.headers
        access_token = self.token_manager.getAccessToken()

        headers = {
            "Authorization": f"Salter {access_token}",
            "Content-Type": "application/json",
            **self.headers,
        }

        return headers

    def requestAPI(self, url):
        response = requests.get(
            url, headers=self.getAuthorizationHeaders(), verify=self._tls_verify
        )
        return response.json()

    def requestPOSTAPI(self, url, payload_generator):
        response = requests.post(
            url,
            headers=self.getAuthorizationHeaders(),
            data=json.dumps({"id": payload_generator()}),
            verify=self._tls_verify,
        )
        return response.json()

    ##################method to get post payload id#################################33
    def getDummyID(self):
        # return self.getMarketStatus()["id"]
        return self.dummy_id_manager.getDummyID()

    def getDummyData(self):
        return self.dummy_data

    def getPOSTPayloadIDForScrips(self):
        dummy_id = self.getDummyID()
        e = self.getDummyData()[dummy_id] + dummy_id + 2 * (date.today().day)
        return e

    def getPOSTPayloadID(self):
        e = self.getPOSTPayloadIDForScrips()
        post_payload_id = (
            e
            + self.token_manager.salts[3 if e % 10 < 5 else 1] * date.today().day
            - self.token_manager.salts[(3 if e % 10 < 5 else 1) - 1]
        )
        return post_payload_id

    def getPOSTPayloadIDForFloorSheet(self):
        e = self.getPOSTPayloadIDForScrips()
        post_payload_id = (
            e
            + self.token_manager.salts[1 if e % 10 < 4 else 3] * date.today().day
            - self.token_manager.salts[(1 if e % 10 < 4 else 3) - 1]
        )
        return post_payload_id

    ###############################################PUBLIC METHODS###############################################
    def setTLSVerification(self, flag):
        self._tls_verify = flag

    def getMarketStatus(self):
        return self.requestAPI(url=self.api_end_points["nepse_open_url"])

    def getPriceVolume(self):
        return self.requestAPI(url=self.api_end_points["price_volume_url"])

    def getSummary(self):
        return self.requestAPI(url=self.api_end_points["summary_url"])

    def getTopTenTradeScrips(self):
        return self.requestAPI(url=self.api_end_points["top_ten_trade_url"])

    def getTopTenTransactionScrips(self):
        return self.requestAPI(url=self.api_end_points["top_ten_transaction_url"])

    def getTopTenTurnoverScrips(self):
        return self.requestAPI(url=self.api_end_points["top_ten_turnover_url"])

    def getSupplyDemand(self):
        return self.requestAPI(url=self.api_end_points["supply_demand_url"])

    def getTopGainers(self):
        return self.requestAPI(url=self.api_end_points["top_gainers_url"])

    def getTopLosers(self):
        return self.requestAPI(url=self.api_end_points["top_losers_url"])

    def isNepseOpen(self):
        return self.requestAPI(url=self.api_end_points["nepse_open_url"])

    def getNepseIndex(self):
        return self.requestAPI(url=self.api_end_points["nepse_index_url"])

    def getNepseSubIndices(self):
        return self.requestAPI(url=self.api_end_points["nepse_subindices_url"])

    def getCompanyList(self):
        self.company_list = self.requestAPI(url=self.api_end_points["company_list_url"])
        return self.company_list

    def getCompanyIDKeyMap(self, force_update=False):
        if self.company_symbol_id_keymap is None or force_update:
            company_list = self.getCompanyList()
            self.company_symbol_id_keymap = {
                company["symbol"]: company["id"] for company in company_list
            }
        return self.company_symbol_id_keymap

    #####api requiring post method
    def getDailyNepseIndexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["nepse_index_daily_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailySensitiveIndexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["sensitive_index_daily_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyFloatIndexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["float_index_daily_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailySensitiveFloatIndexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["sensitive_float_index_daily_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyBankSubindexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["banking_sub_index_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyDevelopmentBankSubindexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["development_bank_sub_index_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyFinanceSubindexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["finance_sub_index_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyHotelTourismSubindexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["hotel_tourism_sub_index_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyHydroSubindexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["hydro_sub_index_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyInvestmentSubindexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["investment_sub_index_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyLifeInsuranceSubindexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["life_insurance_sub_index_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyManufacturingSubindexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["manufacturing_sub_index_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyMicrofinanceSubindexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["microfinance_sub_index_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyMutualfundSubindexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["mutual_fund_sub_index_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyNonLifeInsuranceSubindexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["non_life_insurance_sub_index_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyOthersSubindexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["others_sub_index_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyTradingSubindexGraph(self):
        return self.requestPOSTAPI(
            url=self.api_end_points["trading_sub_index_graph"],
            payload_generator=self.getPOSTPayloadID,
        )

    def getDailyScripPriceGraph(self, symbol):
        # return self.getCompanyIDKeyMap()
        company_id = self.getCompanyIDKeyMap()[symbol]
        return self.requestPOSTAPI(
            url=f"{self.api_end_points['company_daily_graph']}{company_id}",
            payload_generator=self.getPOSTPayloadIDForScrips,
        )

    def getCompanyDetails(self, symbol):
        company_id = self.getCompanyIDKeyMap()[symbol]
        return self.requestPOSTAPI(
            url=f"{self.api_end_points['company_details']}{company_id}",
            payload_generator=self.getPOSTPayloadIDForScrips,
        )

    def getCompanyPriceVolumeHistory(self, symbol):
        company_id = self.getCompanyIDKeyMap()[symbol]
        return self.requestPOSTAPI(
            url=f"{self.api_end_points['company_price_volume_history']}{company_id}",
            payload_generator=self.getPOSTPayloadIDForScrips,
        )

    def getFloorSheet(self):
        url = f"{self.api_end_points['floor_sheet']}?&size={self.floor_sheet_size}&sort=contractId,desc"
        sheet = self.requestPOSTAPI(
            url=url, payload_generator=self.getPOSTPayloadIDForFloorSheet
        )
        floor_sheets = sheet["floorsheets"]["content"]
        page_range = range(1, sheet["floorsheets"]["totalPages"] + 1)
        for page in page_range:
            next_sheet = self.requestPOSTAPI(
                url=f"{url}&page={page}",
                payload_generator=self.getPOSTPayloadIDForFloorSheet,
            )
            next_floor_sheet = next_sheet["floorsheets"]["content"]
            floor_sheets.extend(next_floor_sheet)
        return floor_sheets

    def getFloorSheetOf(self, symbol):
        company_id = self.getCompanyIDKeyMap()[symbol]
        url = f"{self.api_end_points['company_floorsheet']}{company_id}?&businessDate=2023-09-27&size={self.floor_sheet_size}&sort=contractid,desc"
        sheet = self.requestPOSTAPI(
            url=url, payload_generator=self.getPOSTPayloadIDForFloorSheet
        )
        floor_sheets = sheet["floorsheets"]["content"]
        for page in range(1, sheet["floorsheets"]["totalPages"] + 1):
            next_sheet = self.requestPOSTAPI(
                url=f"{url}&page={page}",
                payload_generator=self.getPOSTPayloadIDForFloorSheet,
            )
            next_floor_sheet = next_sheet["floorsheets"]["content"]
            floor_sheets.extend(next_floor_sheet)
        return floor_sheets


class DummyIDManager:
    def __init__(self, market_status_function=None, date_function=datetime.now):
        self.data = None
        self.dummy_id = None
        self.date_stamp = None

        self.setDateFunction(date_function)
        self.setMarketStatusFunction(market_status_function)

    def setDateFunction(self, func):
        self.date_function = func

    def setMarketStatusFunction(self, func):
        self.market_status_function = func
        self.data = None

    def populateData(self):
        today = self.date_function()

        if self.data is None:
            self.data = self.market_status_function()
            self.dummy_id = self.data["id"]
            self.date_stamp = today
            return

        # check is day has already passed
        # print("whey", self.date_stamp.date(), today.date())

        if self.date_stamp.date() < today.date():
            new_data = self.market_status_function()
            new_converted_date = self.convertToDateTime(new_data["asOf"])

            # check if nepse date is equal to current date
            if new_converted_date.date() == today.date():
                self.data = new_data
                self.dummy_id = self.data["id"]
                self.date_stamp = new_converted_date

            # nepse date is not equal to current date which means nepse is closed
            # in such case we set the date stamp to today so that we dont have to check it everytime
            else:
                self.data = new_data
                self.dummy_id = self.data["id"]
                self.date_stamp = today

    def convertToDateTime(self, date_time_str):
        return datetime.strptime(date_time_str, "%Y-%m-%dT%H:%M:%S")

    def getDummyID(self):
        self.populateData()
        return self.dummy_id

    def __repr__(self):
        return f"<Dummy ID: {self.dummy_id}, Date: {self.date_stamp}>"


def testDummyManager():
    def friday():
        print("friday_called")
        return {
            "isOpen": "Pre Open CLOSE",
            "asOf": "2023-09-27T10:45:00",
            "id": 80,
        }

    def saturday():
        print("saturday_called")
        return {
            "isOpen": "Pre Open CLOSE",
            "asOf": "2023-09-27T10:45:00",
            "id": 81,
        }

    def sunday():
        print("sunday_called")
        return {
            "isOpen": "Pre Open CLOSE",
            "asOf": "2023-10-01T10:45:00",
            "id": 82,
        }

    def monday():
        print("monday called")
        return {
            "isOpen": "Pre Open CLOSE",
            "asOf": "2023-10-02T10:45:00",
            "id": 82,
        }

    today_friday = lambda: datetime(2023, 9, 28)
    today_saturday = lambda: datetime(2023, 9, 29)
    today_sunday = lambda: datetime(2023, 10, 1)
    today_monday = lambda: datetime(2023, 10, 2)

    dummy_manager = DummyIDManager()

    # dummy_manager.setDateFunction(today_friday)
    # dummy_manager.setMarketStatusFunction(friday)
    # dummy_manager.getDummyID()
    # print(dummy_manager)

    # dummy_manager.setMarketStatusFunction(friday)
    # dummy_manager.getDummyID()
    # print(dummy_manager)

    # dummy_manager.setMarketStatusFunction(friday)
    # dummy_manager.getDummyID()
    # print(dummy_manager)

    # dummy_manager.setDateFunction(today_saturday)
    # dummy_manager.setMarketStatusFunction(saturday)
    # dummy_manager.getDummyID()
    # print(dummy_manager)

    dummy_manager.setDateFunction(today_saturday)
    dummy_manager.setMarketStatusFunction(saturday)

    dummy_manager.getDummyID()
    print(dummy_manager)
    dummy_manager.getDummyID()
    print(dummy_manager)
    dummy_manager.getDummyID()
    print(dummy_manager)

    dummy_manager.setDateFunction(today_sunday)
    dummy_manager.setMarketStatusFunction(saturday)

    dummy_manager.getDummyID()
    print(dummy_manager)
    dummy_manager.getDummyID()
    print(dummy_manager)

    dummy_manager.setDateFunction(today_sunday)
    dummy_manager.setMarketStatusFunction(sunday)

    dummy_manager.getDummyID()
    print(dummy_manager)
    dummy_manager.getDummyID()
    print(dummy_manager)

    dummy_manager.setDateFunction(today_monday)
    dummy_manager.getDummyID()
    print(dummy_manager)
    dummy_manager.getDummyID()
    print(dummy_manager)
