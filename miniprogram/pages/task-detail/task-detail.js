const store = require("../../services/store");
const rules = require("../../utils/rules");

Page({
  data: {
    task: {},
    activeTab: "measures",
    isStrategy: false,
    expandedMeasureId: "",
    expandedStandardId: "",
    showAllHistory: false,
    tabs: [{ key: "overview", label: "概览" }, { key: "measures", label: "举措" }, { key: "standards", label: "标准" }, { key: "history", label: "记录" }],
    history: [],
    visibleHistory: [],
  },
  onLoad(query) {
    const user = store.getUser();
    if (!user) return wx.redirectTo({ url: "/pages/login/login" });
    rules.configureTabBar(user);
    const data = store.getData();
    const task = data.tasks.find((item) => item.id === query.id);
    task.progress = rules.progress(task);
    const isStrategy = rules.isStrategy(user);
    task.measures = (task.measures || []).map((item) => ({ ...item, canFill: !isStrategy && rules.canFillMeasure(user, task, item) }));
    task.completionStandards = (task.completionStandards || []).map((item) => ({ ...item, displayGroup: item.groupName || "-" }));
    const history = (task.updateHistory || []).concat((task.measures || []).flatMap((m) => m.updateHistory || []))
      .sort((a, b) => String(b.time).localeCompare(String(a.time)));
    this.setData({ task, activeTab: query.tab || "overview", isStrategy, history, visibleHistory: history.slice(0, 5) });
  },
  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab });
  },
  fillMeasure(event) {
    if (this.data.isStrategy) return;
    wx.navigateTo({ url: `/pages/measure-form/measure-form?taskId=${this.data.task.id}&measureId=${event.currentTarget.dataset.id}` });
  },
  toggleMeasure(event) {
    const id = event.currentTarget.dataset.id;
    this.setData({ expandedMeasureId: this.data.expandedMeasureId === id ? "" : id });
  },
  toggleStandard(event) {
    const id = event.currentTarget.dataset.id;
    this.setData({ expandedStandardId: this.data.expandedStandardId === id ? "" : id });
  },
  showAllHistory() {
    this.setData({ showAllHistory: true, visibleHistory: this.data.history });
  },
});
