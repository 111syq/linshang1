const store = require("../../services/store");

Page({
  data: { roles: [], selectedAccount: "", selectedRole: null },
  onLoad() {
    this.setData({ roles: store.users });
  },
  selectRole(event) {
    const user = store.users.find((item) => item.account === event.currentTarget.dataset.account);
    this.setData({ selectedAccount: user.account, selectedRole: user });
  },
  enterSystem() {
    const user = this.data.selectedRole;
    if (!user) {
      wx.showToast({ title: "请先选择角色", icon: "none" });
      return;
    }
    store.setUser(user);
    wx.switchTab({ url: "/pages/dashboard/dashboard" });
  },
});
