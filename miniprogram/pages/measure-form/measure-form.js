const store = require("../../services/store");
const rules = require("../../utils/rules");

Page({
  data: { task: {}, measure: {} },
  onLoad(query) {
    const user = store.getUser();
    if (!user) return wx.redirectTo({ url: "/pages/login/login" });
    rules.configureTabBar(user);
    const data = store.getData();
    const task = data.tasks.find((item) => item.id === query.taskId);
    const measure = task.measures.find((item) => item.id === query.measureId);
    if (!rules.canFillMeasure(user, task, measure)) {
      wx.showToast({ title: "无填报权限", icon: "none" });
      wx.navigateBack();
      return;
    }
    this.data.data = data;
    this.setData({ task, measure });
  },
  onProgress(event) { this.setData({ "measure.progress": Number(event.detail.value) }); },
  onSummary(event) { this.setData({ "measure.currentPeriodSummary": event.detail.value }); },
  onNext(event) { this.setData({ "measure.nextPlan": event.detail.value }); },
  saveDraft() { this.save("草稿"); },
  submit() { this.save("待审核"); },
  save(reviewStatus) {
    const time = new Date().toLocaleString();
    const data = this.data.data;
    const task = data.tasks.find((item) => item.id === this.data.task.id);
    const measure = task.measures.find((item) => item.id === this.data.measure.id);
    Object.assign(measure, this.data.measure, { reviewStatus, updatedAt: time, updatedBy: "小程序演示角色" });
    measure.updateHistory = [{ time, operator: "小程序演示角色", action: reviewStatus === "待审核" ? "提交审核" : "保存草稿", note: `${task.code} / 举措 ${measure.order}` }].concat(measure.updateHistory || []);
    task.reviewStatus = reviewStatus;
    task.updatedAt = time;
    store.saveData(data);
    wx.showToast({ title: reviewStatus === "待审核" ? "已提交" : "已保存" });
    wx.navigateBack();
  },
});
