let state = {
    isMarketOpen: false,
    previousIndexData: [],
    todayAllIndexData: [],
    dailyIndexData: [],
    loggedInUsers: [],
  };

  export function setIsMarketOpen(value) {
    state.isMarketOpen = value;
  }

  export function setPreviousIndexData(data) {
    state.previousIndexData = data;
  }

  export function setTodayAllIndexData(data) {
    state.todayAllIndexData = data;
  }

  export function setLoggedInUsers(users) {
    state.loggedInUsers = users;
  }

  export function getIsMarketOpen() {
    return state.isMarketOpen;
  }

  export function getPreviousIndexData() {
    return state.previousIndexData;
  }

  export function getTodayAllIndexData() {
    return state.todayAllIndexData;
  }

  export function getLoggedInUsers() {
    return state.loggedInUsers;
  }

  export function getState() {
    return { ...state };
  }
