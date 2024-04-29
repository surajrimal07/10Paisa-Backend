import {saveToCache, fetchFromCache} from '../controllers/savefetchCache.js';

export async function setIsMarketOpen(value) {
  await saveToCache('isMarketOpen', value);
}

export async function setPreviousIndexData(data) {
  await saveToCache('previousIndexData', data);
}

export async function setTodayAllIndexData(data) {
  await saveToCache('todayAllIndexData', data);
}

export async function setLoggedInUsers(users) {
  await saveToCache('loggedInUsers', users);
}

export async function setIntradayGraph(indexData) {
  await saveToCache('intradayGraph', indexData);
}

export async function getIsMarketOpen() {
  return await fetchFromCache('isMarketOpen');
}

export async function getPreviousIndexData() {
  return await fetchFromCache('previousIndexData');
}

export async function getTodayAllIndexData() {
  return await fetchFromCache('todayAllIndexData');
}

export async function getIntradayGraph() {
  return await fetchFromCache('intradayGraph');
}

export async function getLoggedInUsers() {
  return await fetchFromCache('loggedInUsers');
}