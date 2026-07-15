function isStrategy(user) {
  return user && user.roleCode === "strategy";
}

function departments(user) {
  return user && user.departments && user.departments.length ? user.departments : [user && user.department].filter(Boolean);
}

function matchDept(value, user) {
  if (isStrategy(user)) return true;
  const text = String(value || "");
  return departments(user).some((dept) => text.includes(dept) || dept.includes(text));
}

function relevantTask(task, user) {
  if (isStrategy(user)) return true;
  const list = [task.leadDepartment].concat(task.collaboratorDepartments || []);
  (task.measures || []).forEach((m) => list.push(m.ownerDepartment, ...(m.collaboratorDepartments || [])));
  return list.some((dept) => matchDept(dept, user));
}

function relevantIndicator(indicator, user) {
  return isStrategy(user) || matchDept(indicator.department, user);
}

function canFillTask(user, task) {
  return !isStrategy(user) && matchDept(task && task.leadDepartment, user);
}

function canFillMeasure(user, task, measure) {
  if (!user || isStrategy(user)) return false;
  if (canFillTask(user, task)) return true;
  return matchDept(measure && measure.ownerDepartment, user)
    || ((measure && measure.collaboratorDepartments) || []).some((dept) => matchDept(dept, user));
}

function progress(task) {
  const measures = task.measures || [];
  if (!measures.length) return 0;
  const total = measures.reduce((sum, m) => sum + Number(m.weight || 0), 0);
  if (!total) return Math.round(measures.reduce((sum, m) => sum + Number(m.progress || 0), 0) / measures.length);
  return Math.round(measures.reduce((sum, m) => sum + Number(m.progress || 0) * Number(m.weight || 0), 0) / total);
}

function doneMeasures(task) {
  return (task.measures || []).filter((m) => Number(m.progress || 0) >= 100 || m.status === "已完成").length;
}

function doneStandards(task) {
  return (task.completionStandards || []).filter((s) => s.status === "已达标").length;
}

function configureTabBar(user) {
  if (!user || typeof wx === "undefined" || !wx.setTabBarItem) return;
  const strategy = isStrategy(user);
  wx.setTabBarItem({ index: 0, text: strategy ? "驾驶舱" : "工作台" });
  wx.setTabBarItem({ index: 2, text: strategy ? "审核" : "填报" });
}

function planProgress() {
  const today = new Date("2026-07-15");
  const start = new Date("2026-04-01");
  const end = new Date("2030-12-31");
  return Math.round(((today - start) / (end - start)) * 100);
}

function unique(values) {
  return Array.from(new Set(values));
}

module.exports = { isStrategy, relevantTask, relevantIndicator, progress, doneMeasures, doneStandards, matchDept, canFillTask, canFillMeasure, configureTabBar, planProgress, unique };
