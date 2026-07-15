const store = require("../../services/store");
const rules = require("../../utils/rules");

Page({
  data: { notice: getApp().globalData.demoNotice, user: {} },
  onShow() {
    const user = store.getUser();
    if (!user) return wx.redirectTo({ url: "/pages/login/login" });
    rules.configureTabBar(user);
    this.setData({ user });
  },
  reset() {
    store.resetData();
    wx.showToast({ title: "已恢复" });
  },
  logout() {
    store.clearUser();
    wx.redirectTo({ url: "/pages/login/login" });
  },
});
