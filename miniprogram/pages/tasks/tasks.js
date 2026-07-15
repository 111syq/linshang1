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
    const tasks = data.tasks.filter((task) => rules.relevantTask(task, user)).map((task) => ({
      ...task,
      progress: rules.progress(task),
      doneMeasures: rules.doneMeasures(task),
      measureCount: (task.measures || []).length,
      doneStandards: rules.doneStandards(task),
      standardCount: (task.completionStandards || []).length,
      canFill: !isStrategy && (rules.canFillTask(user, task) || (task.measures || []).some((measure) => rules.canFillMeasure(user, task, measure))),
    }));
    this.setData({ tasks, isStrategy });
  },
  openTask(event) {
    wx.navigateTo({ url: `/pages/task-detail/task-detail?id=${event.currentTarget.dataset.id}` });
  },
  fillTask(event) {
    wx.navigateTo({ url: `/pages/task-detail/task-detail?id=${event.currentTarget.dataset.id}&tab=measures` });
  },
});
