const store = require("../../services/store");
const rules = require("../../utils/rules");

Page({
  data: { notice: getApp().globalData.demoNotice, indicators: [] },
  onShow() {
    const user = store.getUser();
    if (!user) return wx.redirectTo({ url: "/pages/login/login" });
    rules.configureTabBar(user);
    const data = store.getData();
    this.setData({ indicators: data.indicators.filter((item) => rules.relevantIndicator(item, user)) });
  },
});
