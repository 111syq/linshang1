const store = require("../../services/store");
const rules = require("../../utils/rules");

Page({
  data: { notice: getApp().globalData.demoNotice, tasks: [], isStrategy: false },
  onShow() {
    const user = store.getUser();
    if (!user) return wx.redirectTo({ url: "/pages/login/login" });
    rules.configureTabBar(user);
    const data = store.getData();
    const isStrategy = rules.isStrategy(user);
    const tasks = data.tasks
      .filter((task) => rules.relevantTask(task, user))
      .filter((task) => isStrategy || rules.canFillTask(user, task) || (task.measures || []).some((measure) => rules.canFillMeasure(user, task, measure)))
      .map((task) => {
        const measures = task.measures || [];
        return {
          ...task,
          todoMeasures: measures.filter((measure) => measure.progress < 100 || measure.reviewStatus !== "已通过").length,
          missingMeasures: measures.filter((measure) => !measure.currentPeriodSummary || measure.reviewStatus === "草稿").length,
          pendingMeasures: measures.filter((measure) => measure.reviewStatus === "待审核").length,
          returnedMeasures: measures.filter((measure) => measure.reviewStatus === "已退回").length + (task.reviewStatus === "已退回" ? 1 : 0),
        };
      });
    this.setData({ tasks, isStrategy });
  },
  fillTask(event) {
    wx.navigateTo({ url: `/pages/task-detail/task-detail?id=${event.currentTarget.dataset.id}&tab=measures` });
  },
});
