const tasks = require("../data/tasks");
const indicators = require("../data/indicators");
const users = require("../data/demo-users");

const VERSION = "2026.07.demo.v2.roles";
const DATA_KEY = "lsb_strategy_miniprogram_data";
const USER_KEY = "lsb_strategy_miniprogram_user";
const LEGACY = ["admin", "lead", "collaborator", "reviewer", "viewer"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getData() {
  const stored = wx.getStorageSync(DATA_KEY);
  if (stored && stored.version === VERSION) return stored;
  const data = { version: VERSION, tasks: clone(tasks), indicators: clone(indicators) };
  wx.setStorageSync(DATA_KEY, data);
  return data;
}

function saveData(data) {
  wx.setStorageSync(DATA_KEY, data);
}

function resetData() {
  wx.removeStorageSync(DATA_KEY);
  return getData();
}

function getUser() {
  const user = wx.getStorageSync(USER_KEY);
  if (!user || LEGACY.includes(user.account)) {
    wx.removeStorageSync(USER_KEY);
    return null;
  }
  return users.find((item) => item.account === user.account) || null;
}

function setUser(user) {
  wx.setStorageSync(USER_KEY, user);
}

function clearUser() {
  wx.removeStorageSync(USER_KEY);
}

module.exports = { getData, saveData, resetData, getUser, setUser, clearUser, users };
