const store = require("../../services/store");
const rules = require("../../utils/rules");

Page({
  data: { notice: getApp().globalData.demoNotice, isStrategy: false, title: "", subtitle: "", judgment: {}, kpis: [], exceptions: [], deptStats: [], todos: [], leadTasks: [], dueTasks: [] },
  onShow() {
    const user = store.getUser();
    if (!user) return wx.redirectTo({ url: "/pages/login/login" });
    rules.configureTabBar(user);
    const data = store.getData();
    const tasks = data.tasks.filter((task) => rules.relevantTask(task, user));
    tasks.forEach((task) => task.progress = rules.progress(task));
    const isStrategy = rules.isStrategy(user);
    this.setData(isStrategy ? strategyData(tasks, data.indicators) : departmentData(tasks, user));
  },
  openTask(event) {
    wx.navigateTo({ url: `/pages/task-detail/task-detail?id=${event.currentTarget.dataset.id}` });
  },
});

function avg(values) { return Math.round(values.reduce((a, b) => a + Number(b || 0), 0) / (values.length || 1)); }
function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }

function strategyData(tasks, indicators) {
  const standards = tasks.flatMap((task) => task.completionStandards || []);
  const actual = avg(tasks.map((task) => task.progress));
  const plan = rules.planProgress();
  const delta = actual - plan;
  const overdue = tasks.filter((task) => task.status === "已逾期").length;
  const highRisk = tasks.filter((task) => task.riskLevel === "高风险").length;
  const deptStats = departmentStats(tasks);
  const missingDepartments = deptStats.filter((item) => item.missingFill > 0).length;
  const watchDepartments = deptStats.slice(0, 3).map((item) => item.name).join("、") || "暂无";
  return {
    isStrategy: true,
    title: "战略驾驶舱",
    subtitle: "全行战略任务、风险、部门填报和待审核事项",
    judgment: {
      level: delta < -5 || overdue || highRisk ? "danger" : delta < 0 ? "warn" : "ok",
      status: delta < -5 || overdue || highRisk ? "预警" : delta < 0 ? "关注" : "正常",
      actual,
      plan,
      delta,
      text: `当前全行 ${tasks.length} 项任务总体进度 ${actual}%，较序时计划${delta >= 0 ? "高" : "低"} ${Math.abs(delta)} 个百分点；${overdue} 项任务逾期，${highRisk} 项高风险，${missingDepartments} 个部门填报不及时，需重点关注${watchDepartments}相关任务。`,
    },
    kpis: [
      kpi("逾期任务", overdue, overdue ? "danger" : "ok"),
      kpi("高风险任务", highRisk, highRisk ? "danger" : "ok"),
      kpi("待审核", tasks.filter((task) => task.reviewStatus === "待审核").length, "warn"),
      kpi("未按期填报", missingDepartments, missingDepartments ? "warn" : "ok"),
      kpi("未达标标准", standards.filter((item) => item.status !== "已达标").length, "warn"),
      kpi("即将到期", dueTasks(tasks).length, "warn"),
    ],
    exceptions: priorityExceptions(tasks).slice(0, 4),
    deptStats: deptStats.slice(0, 5),
    todos: [
      { label: "待审核", value: tasks.filter((task) => task.reviewStatus === "待审核").length },
      { label: "待协调", value: tasks.filter((task) => task.coordinationRequest).length },
      { label: "待决策", value: tasks.filter((task) => task.decisionRequest).length },
      { label: "未完成指标", value: indicators.filter((item) => Number(item.achievementRate || 0) < 100).length },
    ],
  };
}

function departmentData(tasks, user) {
  const measures = tasks.flatMap((task) => (task.measures || []).filter((measure) => rules.canFillMeasure(user, task, measure)));
  const leadTasks = tasks.filter((task) => rules.canFillTask(user, task));
  const due = dueTasks(tasks).slice(0, 5);
  const todo = uniqueBy(tasks.filter((task) => task.reviewStatus === "已退回" || task.riskLevel === "高风险" || task.status === "已逾期")
    .concat(tasks.filter((task) => (task.measures || []).some((measure) => rules.canFillMeasure(user, task, measure) && (measure.progress < 100 || measure.reviewStatus !== "已通过")))), "id");
  return {
    isStrategy: false,
    title: `${user.roleName}工作台`,
    subtitle: "本部门牵头、协同、填报、反馈和到期事项",
    kpis: [
      kpi("牵头任务", leadTasks.length, "ok"),
      kpi("协同任务", tasks.length - leadTasks.length, "ok"),
      kpi("待填报举措", measures.filter((item) => item.progress < 100 || item.reviewStatus !== "已通过").length, "warn"),
      kpi("被退回事项", tasks.filter((item) => item.reviewStatus === "已退回").length + measures.filter((item) => item.reviewStatus === "已退回").length, "danger"),
      kpi("逾期任务", tasks.filter((item) => item.status === "已逾期").length, tasks.some((item) => item.status === "已逾期") ? "danger" : "ok"),
      kpi("平均进度", `${avg(tasks.map((item) => item.progress))}%`, "ok"),
    ],
    todos: todo.slice(0, 4),
    leadTasks: leadTasks.slice(0, 3),
    dueTasks: due,
  };
}

function kpi(label, value, level) {
  return { label, value, level, state: level === "danger" ? "预警" : level === "warn" ? "关注" : "正常" };
}

function priorityExceptions(tasks) {
  const plan = rules.planProgress();
  return tasks.map((task) => {
    let score = 0;
    let reason = "";
    if (task.status === "已逾期" && task.riskLevel === "高风险") [score, reason] = [100, "逾期且高风险"];
    else if (task.status === "已逾期") [score, reason] = [90, "任务逾期"];
    else if (task.riskLevel === "高风险") [score, reason] = [80, "高风险"];
    else if (task.progress < plan - 10) [score, reason] = [70, "进度严重落后"];
    else if ((task.completionStandards || []).some((item) => item.status !== "已达标")) [score, reason] = [55, "完成标准未达标"];
    return { ...task, reason, score };
  }).filter((item) => item.score).sort((a, b) => b.score - a.score);
}

function departmentStats(tasks) {
  return rules.unique(tasks.map((task) => task.leadDepartment).filter(Boolean)).map((name) => {
    const rows = tasks.filter((task) => task.leadDepartment === name);
    const progress = avg(rows.map((task) => task.progress));
    const overdue = rows.filter((task) => task.status === "已逾期").length;
    const highRisk = rows.filter((task) => task.riskLevel === "高风险").length;
    const missingFill = rows.filter((task) => task.reviewStatus === "草稿").length;
    const score = overdue * 5 + highRisk * 3 + missingFill + Math.max(0, rules.planProgress() - progress);
    return { name, progress, overdue, highRisk, missingFill, status: score > 10 ? "预警" : score > 4 ? "关注" : "正常", score };
  }).sort((a, b) => b.score - a.score);
}

function dueTasks(tasks) {
  return tasks.filter((task) => task.endDate).sort((a, b) => String(a.endDate).localeCompare(String(b.endDate)));
}

function uniqueBy(rows, key) {
  const seen = {};
  return rows.filter((row) => {
    if (seen[row[key]]) return false;
    seen[row[key]] = true;
    return true;
  });
}
