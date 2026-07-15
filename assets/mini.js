import { LEGACY_ROLE_ACCOUNTS, RISK_LEVELS, ROLES, STORAGE_VERSION, TASK_STATUSES } from "../shared/constants/enums.mjs";
import { calculateTaskProgress, canEditMeasure, canEditTask, canFillMeasure, canFillTask, deriveRisk, deriveTaskStatus, isIndicatorRelevantToUser, isStrategyRole, isTaskRelevantToUser } from "../shared/utils/rules.mjs";

const MINI_KEY = "lsb_strategy_mini_web_data";
const MINI_USER = "lsb_strategy_mini_web_user";
const TODAY = new Date("2026-07-15");
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const state = { data: null, user: null, selectedAccount: "", keyword: "", statusFilter: "", activeTaskId: "", expandedMeasureId: "", expandedStandardId: "", showAllHistory: false };

async function init() {
  state.data = await loadData();
  state.user = loadUser();
  bind();
  renderLoginRoles();
  if (state.user) showApp();
}

async function loadData() {
  const raw = localStorage.getItem(MINI_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.version === STORAGE_VERSION) return parsed;
    } catch {}
  }
  const [tasks, indicators] = await Promise.all([
    fetch("./public/data/tasks.json").then((r) => r.json()),
    fetch("./public/data/indicators.json").then((r) => r.json()),
  ]);
  return save({ version: STORAGE_VERSION, tasks, indicators });
}

function loadUser() {
  const raw = localStorage.getItem(MINI_USER);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    if (!user?.account || LEGACY_ROLE_ACCOUNTS.includes(user.account) || !ROLES.some((role) => role.account === user.account)) {
      localStorage.removeItem(MINI_USER);
      return null;
    }
    return ROLES.find((role) => role.account === user.account);
  } catch {
    localStorage.removeItem(MINI_USER);
    return null;
  }
}

function save(data = state.data) {
  localStorage.setItem(MINI_KEY, JSON.stringify(data));
  return data;
}

function bind() {
  $$(".mini-tabbar button").forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.miniTab)));
  $("#mini-search").addEventListener("input", (event) => {
    state.keyword = event.target.value.trim();
    renderTasks();
  });
  $("#mini-filter").addEventListener("click", openFilter);
  $("#sheet-close").addEventListener("click", closeSheet);
  $("#sheet-mask").addEventListener("click", closeSheet);
  $("#mini-reset").addEventListener("click", resetData);
  $("#mini-profile-entry").addEventListener("click", () => switchTab("profile"));
  $("#mini-copy-summary").addEventListener("click", copySummary);
  $("#mini-enter").addEventListener("click", enterSelectedRole);
  $("#mini-logout").addEventListener("click", logout);
}

function renderLoginRoles() {
  $("#mini-login-roles").innerHTML = ROLES.map((role) => `<button class="mini-role-card" data-login-role="${role.account}" type="button"><strong>${role.roleName}</strong><span>${role.description}</span></button>`).join("");
  $("#mini-login-roles").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    state.selectedAccount = button.dataset.loginRole;
    $("#mini-login-roles").querySelectorAll("button").forEach((item) => item.classList.toggle("selected", item === button));
    $("#mini-enter").disabled = false;
  }));
}

function enterSelectedRole() {
  const account = state.selectedAccount || ROLES[0].account;
  state.user = ROLES.find((role) => role.account === account);
  localStorage.setItem(MINI_USER, JSON.stringify(state.user));
  showApp();
}

function showApp() {
  $("#mini-login").classList.add("hidden");
  $("#mini-app").classList.remove("hidden");
  configureTabs();
  switchTab("dashboard");
  renderAll();
}

function configureTabs() {
  $("#tab-dashboard").textContent = isStrategyRole(state.user) ? "驾驶舱" : "工作台";
  $("#tab-fill").textContent = isStrategyRole(state.user) ? "审核" : "填报";
}

function switchTab(tab) {
  $$(".mini-page").forEach((page) => page.classList.toggle("active", page.id === `mini-${tab}`));
  $$(".mini-tabbar button").forEach((button) => button.classList.toggle("active", button.dataset.miniTab === tab));
  renderHeader();
  if (tab === "dashboard") renderDashboard();
  if (tab === "tasks") renderTasks();
  if (tab === "fill") renderFill();
  if (tab === "indicators") renderIndicators();
  if (tab === "profile") renderProfile();
}

function renderAll() {
  recalc();
  configureTabs();
  renderHeader();
  renderDashboard();
  renderTasks();
  renderFill();
  renderIndicators();
  renderProfile();
}

function renderHeader() {
  const onHome = $(".mini-page.active")?.id === "mini-dashboard";
  const activeId = $(".mini-page.active")?.id;
  const title = activeId === "mini-fill" && isStrategyRole(state.user) ? "审核管理" : activeId === "mini-fill" ? "进度填报" : "临商银行";
  $("#mini-home-title").textContent = onHome ? (isStrategyRole(state.user) ? "战略驾驶舱" : `${state.user.roleName}工作台`) : title;
  $("#mini-home-subtitle").textContent = state.user ? `${state.user.roleName} / ${state.user.description}` : "战略任务小程序演示";
}

function recalc() {
  state.data.tasks.forEach((task) => {
    task.measures ||= [];
    task.completionStandards ||= [];
    task.measures.forEach((m) => {
      m.reviewStatus ||= "草稿";
      m.updateHistory ||= [];
    });
    task.progress = calculateTaskProgress(task.measures);
    task.riskLevel = deriveRisk(task);
    task.status = deriveTaskStatus(task, TODAY);
  });
  save();
}

function scopedTasks() {
  return state.data.tasks.filter((task) => isTaskRelevantToUser(task, state.user));
}

function scopedIndicators() {
  return state.data.indicators.filter((indicator) => isIndicatorRelevantToUser(indicator, state.user));
}

function renderDashboard() {
  isStrategyRole(state.user) ? renderStrategyHome() : renderDepartmentHome();
}

function renderStrategyHome() {
  const tasks = state.data.tasks;
  const measures = tasks.flatMap((task) => task.measures);
  const standards = tasks.flatMap((task) => task.completionStandards);
  const actual = avg(tasks.map((t) => t.progress));
  const plan = planProgress();
  const delta = actual - plan;
  const overdue = tasks.filter((t) => t.status === "已逾期").length;
  const highRisk = tasks.filter((t) => t.riskLevel === "高风险").length;
  const pending = tasks.filter((t) => t.reviewStatus === "待审核").length;
  const missingDepartments = departmentStats(tasks).filter((d) => d.missingFill > 0).length;
  const watchDepartments = departmentStats(tasks).slice(0, 3).map((d) => d.name).join("、") || "暂无";
  const stateClass = delta < -5 || overdue > 0 || highRisk > 0 ? "danger" : delta < 0 ? "warn" : "ok";
  const judgment = `当前全行 ${tasks.length} 项任务总体进度 ${actual}%，较序时计划${delta >= 0 ? "高" : "低"} ${Math.abs(delta)} 个百分点；${overdue} 项任务逾期，${highRisk} 项高风险，${missingDepartments} 个部门填报不及时，需重点关注${watchDepartments}相关任务。`;
  $("#mini-dashboard").innerHTML = `
    <article class="mini-hero ${stateClass}">
      <div class="mini-hero-top"><span>总体判断</span><b>${stateClass === "danger" ? "预警" : stateClass === "warn" ? "关注" : "正常"}</b></div>
      <div class="hero-metrics">
        <div><span>总体进度</span><strong>${actual}%</strong></div>
        <div><span>序时进度</span><strong>${plan}%</strong></div>
        <div><span>偏差</span><strong>${delta}pp</strong></div>
      </div>
      <p>${judgment}</p>
    </article>
    <div class="mini-kpis warning-grid">
      ${warningKpi("逾期任务", overdue, overdue > 0 ? "danger" : "ok")}
      ${warningKpi("高风险任务", highRisk, highRisk > 0 ? "danger" : "ok")}
      ${warningKpi("待审核", pending, pending > 0 ? "warn" : "ok")}
      ${warningKpi("未按期填报", missingDepartments, missingDepartments > 0 ? "warn" : "ok")}
      ${warningKpi("未达标标准", standards.filter((s) => s.mandatory !== false && s.status !== "已达标").length, "warn")}
      ${warningKpi("即将到期", dueTasks(tasks).slice(0, 12).length, "warn")}
    </div>
    <article class="mini-panel compact-panel">
      <div class="panel-head"><h2>重点异常任务</h2><button data-mini-tab-jump="tasks" type="button">查看全部</button></div>
      ${priorityExceptions(tasks).slice(0, 4).map(exceptionItem).join("") || emptyInline("暂无重点异常")}
    </article>
    <article class="mini-panel compact-panel">
      <div class="panel-head"><h2>部门执行情况</h2><button data-mini-tab-jump="tasks" type="button">查看任务</button></div>
      ${departmentStats(tasks).slice(0, 5).map(departmentItem).join("")}
    </article>
    <article class="mini-panel compact-panel">
      <div class="panel-head"><h2>待处理事项</h2><span>审核/协调/决策/到期</span></div>
      ${strategyTodoGroups(tasks)}
    </article>`;
  bindDashboardLinks();
}

function renderDepartmentHome() {
  const tasks = scopedTasks();
  const measures = tasks.flatMap((task) => task.measures.filter((m) => canEditMeasure(state.user, task, m) || isTaskRelevantToUser(task, state.user)));
  const leadTasks = tasks.filter((t) => canEditTask(state.user, t));
  const collabTasks = tasks.filter((t) => !canEditTask(state.user, t));
  const pendingMeasures = measures.filter((m) => m.progress < 100 || m.reviewStatus !== "已通过");
  const rejected = tasks.filter((t) => t.reviewStatus === "已退回").length + measures.filter((m) => m.reviewStatus === "已退回").length;
  $("#mini-dashboard").innerHTML = `
    <article class="mini-workbench-head">
      <strong>${state.user.roleName}工作台</strong>
      <span>本部门牵头、协同、填报、反馈和到期事项</span>
    </article>
    <div class="mini-kpis warning-grid">
      ${warningKpi("牵头任务", leadTasks.length, "ok")}
      ${warningKpi("协同任务", collabTasks.length, "ok")}
      ${warningKpi("待填报举措", pendingMeasures.length, pendingMeasures.length ? "warn" : "ok")}
      ${warningKpi("被退回事项", rejected, rejected ? "danger" : "ok")}
      ${warningKpi("逾期任务", tasks.filter((t) => t.status === "已逾期").length, tasks.some((t) => t.status === "已逾期") ? "danger" : "ok")}
      ${warningKpi("平均进度", `${avg(tasks.map((t) => t.progress))}%`, "ok")}
    </div>
    <article class="mini-panel compact-panel">
      <div class="panel-head"><h2>待我处理</h2><button data-mini-tab-jump="fill" type="button">去填报</button></div>
      ${departmentTodos(tasks, measures).slice(0, 4).map(taskMiniItem).join("") || emptyInline("暂无待处理事项")}
    </article>
    <article class="mini-panel compact-panel">
      <div class="panel-head"><h2>由我牵头</h2><span>${leadTasks.length}项</span></div>
      ${leadTasks.slice(0, 3).map(taskMiniItem).join("") || emptyInline("暂无牵头任务")}
    </article>
    <article class="mini-panel compact-panel">
      <div class="panel-head"><h2>近期截止事项</h2><span>前5项</span></div>
      ${dueTasks(tasks).slice(0, 5).map(taskMiniItem).join("") || emptyInline("暂无近期截止事项")}
    </article>`;
  bindDashboardLinks();
}

function renderTasks() {
  $("#mini-task-list").innerHTML = filteredTasks().map(taskCard).join("") || emptyMini("暂无任务");
  bindCardButtons();
}

function renderFill() {
  if (isStrategyRole(state.user)) {
    renderStrategyFillManagement();
    return;
  }
  const editable = scopedTasks().filter((task) => canEditTask(state.user, task) || task.measures.some((m) => canEditMeasure(state.user, task, m)));
  $("#mini-fill-list").innerHTML = editable.slice(0, 40).map((task) => taskCard(task, true)).join("") || emptyMini("暂无可填报任务");
  bindCardButtons();
}

function renderStrategyFillManagement() {
  const rows = state.data.tasks
    .filter((task) => ["草稿", "待审核", "已退回"].includes(task.reviewStatus) || task.measures.some((m) => ["草稿", "待审核", "已退回"].includes(m.reviewStatus)))
    .sort((a, b) => statusPriority(b) - statusPriority(a))
    .slice(0, 50);
  $("#mini-fill-list").innerHTML = rows.map((task) => {
    const missing = task.measures.filter((m) => !m.currentPeriodSummary || m.reviewStatus === "草稿").length;
    const pending = task.measures.filter((m) => m.reviewStatus === "待审核").length;
    const returned = task.measures.filter((m) => m.reviewStatus === "已退回").length + (task.reviewStatus === "已退回" ? 1 : 0);
    return `<article class="mini-card">
      <div class="mini-tags"><span class="mini-tag">${task.code}</span><span class="mini-tag">${task.reviewStatus}</span><span class="mini-tag risk-${task.riskLevel}">${task.riskLevel}</span></div>
      <h3>${esc(task.taskName)}</h3>
      <span>${task.leadDepartment} / 进度 ${task.progress}%</span>
      <span>待审核 ${pending} · 填报缺失 ${missing} · 退回 ${returned}</span>
      <div class="mini-actions"><button class="mini-secondary" data-detail="${task.id}" type="button">查看填报</button><button class="mini-primary" data-review-task="${task.id}" type="button">审核</button></div>
    </article>`;
  }).join("") || emptyMini("暂无待管理填报事项");
  bindCardButtons();
}

function renderIndicators() {
  $("#mini-indicator-list").innerHTML = scopedIndicators().slice(0, 60).map((item) => `<article class="mini-card"><h3>${esc(item.name)}</h3><div class="mini-tags"><span class="mini-tag">${item.businessLine || "指标"}</span><span class="mini-tag">${item.department || "-"}</span><span class="mini-tag risk-${item.riskLevel}">${item.riskLevel}</span></div><span>2026目标：${fmt(item.target2026)} / 当前值：${fmt(item.currentValue)} / 达成率：${item.achievementRate || "-"}%</span></article>`).join("") || emptyMini("暂无相关指标");
}

function renderProfile() {
  $("#mini-user").textContent = `${state.user.roleName} / ${state.user.description}`;
}

function filteredTasks() {
  return scopedTasks().filter((task) => {
    if (state.statusFilter && task.status !== state.statusFilter) return false;
    if (!state.keyword) return true;
    return [task.code, task.taskName, task.leadDepartment, task.businessSection].join(" ").includes(state.keyword);
  }).slice(0, 80);
}

function taskCard(task, fillMode = false) {
  const primary = isStrategyRole(state.user)
    ? `<button class="mini-primary" data-review-task="${task.id}" type="button">${task.reviewStatus === "待审核" ? "审核" : "查看填报"}</button>`
    : `<button class="mini-primary" data-fill="${task.id}" type="button">${fillMode ? "去填报" : "去填报"}</button>`;
  return `<article class="mini-card task-mini-card">
    <div class="mini-tags"><span class="mini-tag code">${task.code}</span><span class="mini-tag status-${task.status}">${task.status}</span><span class="mini-tag risk-${task.riskLevel}">${task.riskLevel}</span></div>
    <h3>${esc(task.taskName)}</h3>
    <span>${task.leadDepartment} / 截止 ${task.endDate || "-"}</span>
    <div class="progress-compact"><div class="mini-progress"><i style="width:${task.progress}%"></i></div><strong>${task.progress}%</strong></div>
    <span>举措 ${doneMeasures(task)}/${task.measures.length} · 标准 ${doneStandards(task)}/${task.completionStandards.length} · 审核 ${task.reviewStatus}</span>
    <div class="mini-actions"><button class="mini-secondary" data-detail="${task.id}" type="button">查看详情</button>${primary}</div>
  </article>`;
}

function bindCardButtons() {
  $$("[data-detail]").forEach((btn) => btn.addEventListener("click", () => openTask(btn.dataset.detail)));
  $$("[data-fill]").forEach((btn) => btn.addEventListener("click", () => openMeasurePicker(btn.dataset.fill)));
  $$("[data-review-task]").forEach((btn) => btn.addEventListener("click", () => openTask(btn.dataset.reviewTask)));
}

function openTask(id) {
  const task = getTask(id);
  state.activeTaskId = id;
  state.expandedMeasureId = "";
  state.expandedStandardId = "";
  state.showAllHistory = false;
  openSheet(`${task.code} 任务详情`, detailHtml(task, "overview"));
  bindDetailTabs(task);
}

function detailHtml(task, tab) {
  const tabs = ["overview:概览", "measures:举措", "standards:标准", "history:记录"].map((item) => {
    const [key, label] = item.split(":");
    return `<button class="mini-detail-tab ${tab === key ? "active" : ""}" data-detail-tab="${key}" type="button">${label}</button>`;
  }).join("");
  const historyRows = [...(task.updateHistory || []), ...task.measures.flatMap((m) => (m.updateHistory || []).map((h) => ({ ...h, action: `举措 ${m.order} ${h.action}` })))].sort((a, b) => String(b.time).localeCompare(String(a.time)));
  const visibleHistory = state.showAllHistory ? historyRows : historyRows.slice(0, 5);
  const content = tab === "overview" ? `<article class="mini-card detail-compact"><div class="mini-tags"><span class="mini-tag">${task.priority}</span><span class="mini-tag">${task.reviewStatus}</span><span class="mini-tag">${task.implementationPeriod}</span></div><details><summary>任务目标</summary><p>${esc(task.taskGoal)}</p></details><span>整体进展：${esc(task.currentPeriodSummary || "-")}</span><span>协调事项：${esc(task.coordinationRequest || "暂无")}</span><span>待决策事项：${esc(task.decisionRequest || "暂无")}</span></article>`
    : tab === "measures" ? task.measures.map((m) => measureCompact(task, m)).join("")
    : tab === "standards" ? task.completionStandards.map((s) => standardCompact(s)).join("")
    : `${visibleHistory.map((h) => `<div class="mini-list-item"><strong>${h.action}</strong><span>${h.time} / ${h.operator}</span></div>`).join("") || emptyMini("暂无记录")}${historyRows.length > 5 && !state.showAllHistory ? `<button class="mini-secondary full-button" data-show-history type="button">查看全部记录</button>` : ""}`;
  return `<div class="mini-summary"><strong>${esc(task.code)} ${esc(task.taskName)}</strong><span>${task.leadDepartment} / ${task.status} / ${task.riskLevel} / ${task.progress}% / 截止 ${task.endDate || "-"}</span></div><div class="mini-detail-tabs">${tabs}</div>${content}`;
}

function bindDetailTabs(task) {
  $("#sheet-content").querySelectorAll("[data-detail-tab]").forEach((btn) => btn.addEventListener("click", () => {
    $("#sheet-content").innerHTML = detailHtml(task, btn.dataset.detailTab);
    bindDetailTabs(task);
  }));
  $("#sheet-content").querySelectorAll("[data-fill-measure]").forEach((btn) => btn.addEventListener("click", () => openMeasureForm(task.id, btn.dataset.fillMeasure)));
  $("#sheet-content").querySelectorAll("[data-expand-measure]").forEach((btn) => btn.addEventListener("click", () => {
    state.expandedMeasureId = state.expandedMeasureId === btn.dataset.expandMeasure ? "" : btn.dataset.expandMeasure;
    $("#sheet-content").innerHTML = detailHtml(task, "measures");
    bindDetailTabs(task);
  }));
  $("#sheet-content").querySelectorAll("[data-expand-standard]").forEach((btn) => btn.addEventListener("click", () => {
    state.expandedStandardId = state.expandedStandardId === btn.dataset.expandStandard ? "" : btn.dataset.expandStandard;
    $("#sheet-content").innerHTML = detailHtml(task, "standards");
    bindDetailTabs(task);
  }));
  $("#sheet-content").querySelectorAll("[data-show-history]").forEach((btn) => btn.addEventListener("click", () => {
    state.showAllHistory = true;
    $("#sheet-content").innerHTML = detailHtml(task, "history");
    bindDetailTabs(task);
  }));
}

function openMeasurePicker(taskId) {
  const task = getTask(taskId);
  if (isStrategyRole(state.user)) return openTask(taskId);
  openSheet("选择填报举措", task.measures.filter((m) => canFillMeasure(state.user, task, m)).map((m) => `<article class="mini-card"><h3>${task.code} / 举措 ${m.order}</h3><span>${esc(m.title)} / ${m.progress}% / ${m.reviewStatus}</span><button class="mini-primary" data-fill-measure="${m.id}" type="button">去填报</button></article>`).join("") || emptyMini("暂无可填报举措"));
  $("#sheet-content").querySelectorAll("[data-fill-measure]").forEach((btn) => btn.addEventListener("click", () => openMeasureForm(task.id, btn.dataset.fillMeasure)));
}

function openMeasureForm(taskId, measureId) {
  const task = getTask(taskId);
  const measure = task.measures.find((m) => m.id === measureId) || task.measures[0];
  if (!canFillTask(state.user, task) && !canFillMeasure(state.user, task, measure)) return toast("当前角色没有该举措填报权限");
  openSheet(`${task.code} / 举措 ${measure.order}`, `<form class="mini-form" id="mini-measure-form"><label><span>举措原文</span><textarea disabled>${esc(measure.rawText || measure.description)}</textarea></label><label><span>状态</span><select name="status">${TASK_STATUSES.map((s) => `<option ${s === measure.status ? "selected" : ""}>${s}</option>`).join("")}</select></label><label><span>完成比例</span><input name="progress" type="number" min="0" max="100" value="${measure.progress}"></label><label><span>风险等级</span><select name="riskLevel">${RISK_LEVELS.map((s) => `<option ${s === measure.riskLevel ? "selected" : ""}>${s}</option>`).join("")}</select></label><label><span>本期完成情况</span><textarea name="currentPeriodSummary">${esc(measure.currentPeriodSummary || "")}</textarea></label><label><span>下一阶段计划</span><textarea name="nextPlan">${esc(measure.nextPlan || "")}</textarea></label><button class="mini-secondary" data-action="draft" type="submit">保存草稿</button><button class="mini-primary" data-action="submit" type="submit">提交审核</button></form>`);
  $("#mini-measure-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    measure.status = form.get("status");
    measure.progress = Number(form.get("progress"));
    measure.riskLevel = form.get("riskLevel");
    measure.currentPeriodSummary = form.get("currentPeriodSummary");
    measure.nextPlan = form.get("nextPlan");
    measure.reviewStatus = event.submitter.dataset.action === "submit" ? "待审核" : "草稿";
    measure.updatedAt = new Date().toLocaleString("zh-CN", { hour12: false });
    measure.updatedBy = state.user.roleName;
    measure.updateHistory.unshift({ time: measure.updatedAt, operator: state.user.roleName, action: event.submitter.dataset.action === "submit" ? "提交审核" : "保存草稿", note: `${task.code} / 举措 ${measure.order} 独立填报。` });
    task.reviewStatus = measure.reviewStatus;
    task.updatedAt = measure.updatedAt;
    task.updatedBy = state.user.roleName;
    task.updateHistory.unshift({ time: task.updatedAt, operator: state.user.roleName, action: measure.reviewStatus, note: `${task.code} / 举措 ${measure.order}` });
    recalc();
    closeSheet();
    renderAll();
    toast(event.submitter.dataset.action === "submit" ? "已提交模拟审核" : "草稿已保存");
  });
}

function warningKpi(label, value, level) {
  return `<article class="mini-kpi warning-${level}"><span>${label}</span><strong>${value}</strong><small>${level === "danger" ? "预警" : level === "warn" ? "关注" : "正常"}</small></article>`;
}

function exceptionItem({ task, reason }) {
  return `<button class="mini-row alert-row" data-detail="${task.id}" type="button">
    <b>${task.code}</b><span>${esc(task.taskName)}</span>
    <em>${task.leadDepartment} / ${task.status} / ${task.riskLevel} / ${task.progress}%</em>
    <i>${reason}</i>
  </button>`;
}

function departmentItem(item) {
  return `<div class="mini-row dept-row"><b>${item.name}</b><span>进度 ${item.progress}% · 逾期 ${item.overdue} · 高风险 ${item.highRisk}</span><em>填报缺失 ${item.missingFill} / ${item.status}</em></div>`;
}

function taskMiniItem(task) {
  return `<button class="mini-row" data-detail="${task.id}" type="button"><b>${task.code}</b><span>${esc(task.taskName)}</span><em>${task.leadDepartment} / ${task.status} / ${task.riskLevel} / ${task.progress}%</em></button>`;
}

function strategyTodoGroups(tasks) {
  const groups = [
    ["待审核", tasks.filter((t) => t.reviewStatus === "待审核").length],
    ["待协调", tasks.filter((t) => t.coordinationRequest).length],
    ["待决策", tasks.filter((t) => t.decisionRequest).length],
    ["即将到期", dueTasks(tasks).slice(0, 12).length],
    ["未完成指标", state.data.indicators.filter((i) => Number(i.achievementRate || 0) < 100).length],
  ];
  return `<div class="mini-chip-grid">${groups.map(([label, value]) => `<span><b>${value}</b>${label}</span>`).join("")}</div>`;
}

function departmentTodos(tasks, measures) {
  const risky = tasks.filter((t) => t.reviewStatus === "已退回" || t.riskLevel === "高风险" || t.status === "已逾期");
  const fillTasks = tasks.filter((t) => t.measures.some((m) => canFillMeasure(state.user, t, m) && (m.progress < 100 || m.reviewStatus !== "已通过")));
  return uniqueBy([...risky, ...fillTasks, ...dueTasks(tasks)], "id");
}

function priorityExceptions(tasks) {
  const plan = planProgress();
  return tasks.map((task) => {
    const overdueMeasure = task.measures.filter((m) => isOverdueMonth(m.dueDate) && Number(m.progress || 0) < 100).length;
    const unmet = task.completionStandards.some((s) => s.mandatory !== false && s.status !== "已达标");
    let score = 0;
    let reason = "";
    if (task.status === "已逾期" && task.riskLevel === "高风险") [score, reason] = [100, "逾期且高风险"];
    else if (task.status === "已逾期") [score, reason] = [90, "任务逾期"];
    else if (task.riskLevel === "高风险") [score, reason] = [80, "高风险"];
    else if (task.progress < plan - 10) [score, reason] = [70, "进度严重落后"];
    else if (overdueMeasure) [score, reason] = [65, `逾期举措 ${overdueMeasure} 项`];
    else if (unmet) [score, reason] = [55, "完成标准未达标"];
    else if (task.reviewStatus === "草稿") [score, reason] = [45, "长期未填报"];
    return { task, score, reason };
  }).filter((item) => item.score).sort((a, b) => b.score - a.score);
}

function departmentStats(tasks) {
  return unique(tasks.map((task) => task.leadDepartment).filter(Boolean)).map((name) => {
    const rows = tasks.filter((task) => task.leadDepartment === name);
    const progress = avg(rows.map((task) => task.progress));
    const overdue = rows.filter((task) => task.status === "已逾期").length;
    const highRisk = rows.filter((task) => task.riskLevel === "高风险").length;
    const missingFill = rows.filter((task) => task.reviewStatus === "草稿").length;
    const score = overdue * 5 + highRisk * 3 + missingFill + Math.max(0, planProgress() - progress);
    return { name, progress, overdue, highRisk, missingFill, status: score > 10 ? "预警" : score > 4 ? "关注" : "正常", score };
  }).sort((a, b) => b.score - a.score);
}

function measureCompact(task, measure) {
  const open = state.expandedMeasureId === measure.id;
  return `<article class="mini-card detail-compact">
    <button class="fold-head" data-expand-measure="${measure.id}" type="button"><b>举措 ${measure.order}</b><span>${measure.status} / ${measure.progress}% / ${measure.dueDate || "-"}</span></button>
    <h3>${esc(measure.title)}</h3>
    ${open ? `<div class="fold-body"><p>${esc(measure.rawText || measure.description)}</p><span>完成情况：${esc(measure.currentPeriodSummary || "-")}</span><span>下一步：${esc(measure.nextPlan || "-")}</span><span>风险：${esc(measure.riskDescription || measure.riskLevel || "-")}</span><span>记录：${(measure.updateHistory || []).slice(0, 3).map((h) => `${h.time} ${h.action}`).join("；") || "暂无"}</span></div>` : ""}
    ${isStrategyRole(state.user) ? `<button class="mini-secondary" type="button">查看填报记录</button>` : `<button class="mini-primary" data-fill-measure="${measure.id}" type="button" ${canFillMeasure(state.user, task, measure) ? "" : "disabled"}>去填报</button>`}
  </article>`;
}

function standardCompact(standard) {
  const open = state.expandedStandardId === standard.id;
  return `<article class="mini-card detail-compact">
    <button class="fold-head" data-expand-standard="${standard.id}" type="button"><b>标准 ${standard.order}</b><span>${standard.status} / ${standard.targetDate || "-"} / ${standard.completionRate || 0}%</span></button>
    ${open ? `<div class="fold-body"><p>${esc(standard.rawText || standard.description)}</p><span>分组：${standard.groupName || "-"}</span><span>目标：${fmt(standard.targetValue)}${standard.unit || ""} / 当前：${fmt(standard.currentValue)}${standard.unit || ""}</span><span>验收：${esc(standard.verificationNote || "暂无")}</span></div>` : ""}
  </article>`;
}

function bindDashboardLinks() {
  $$("[data-mini-tab-jump]").forEach((btn) => btn.addEventListener("click", () => switchTab(btn.dataset.miniTabJump)));
  $$("[data-detail]").forEach((btn) => btn.addEventListener("click", () => openTask(btn.dataset.detail)));
}

function logout() {
  localStorage.removeItem(MINI_USER);
  state.user = null;
  state.selectedAccount = "";
  $("#mini-enter").disabled = true;
  $("#mini-login-roles").querySelectorAll("button").forEach((item) => item.classList.remove("selected"));
  $("#mini-app").classList.add("hidden");
  $("#mini-login").classList.remove("hidden");
}

function openFilter() {
  const statusOptions = TASK_STATUSES.map((s) => `<button class="mini-secondary" data-status="${s}" type="button">${s}</button>`).join(" ");
  openSheet("筛选任务", `<div class="mini-panel"><h2>按状态快速筛选</h2>${statusOptions}<button class="mini-primary" data-status="" type="button">全部任务</button></div>`);
  $("#sheet-content").querySelectorAll("[data-status]").forEach((btn) => btn.addEventListener("click", () => {
    state.statusFilter = btn.dataset.status;
    state.keyword = "";
    $("#mini-search").value = "";
    closeSheet();
    renderTasks();
  }));
}

async function resetData() {
  if (!confirm("确认恢复演示数据？当前浏览器里的小程序风格演示修改会被清除。")) return;
  localStorage.removeItem(MINI_KEY);
  state.data = await loadData();
  renderAll();
  toast("已恢复演示数据");
}

function copySummary() {
  const tasks = scopedTasks();
  const summary = `临商银行战略任务演示：${state.user.roleName}相关任务${tasks.length}项，平均进度${avg(tasks.map((t) => t.progress))}%，高风险${tasks.filter((t) => t.riskLevel === "高风险").length}项。`;
  navigator.clipboard?.writeText(summary);
  toast("任务摘要已复制");
}

function openSheet(title, html) {
  $("#sheet-title").textContent = title;
  $("#sheet-content").innerHTML = html;
  $("#mini-sheet").classList.add("open");
}
function closeSheet() { $("#mini-sheet").classList.remove("open"); }
function getTask(id) { return state.data.tasks.find((t) => t.id === id); }
function doneMeasures(task) { return task.measures.filter((m) => m.progress >= 100 || m.status === "已完成").length; }
function doneStandards(task) { return task.completionStandards.filter((s) => s.status === "已达标").length; }
function dueTasks(tasks) { return tasks.filter((task) => task.endDate).sort((a, b) => a.endDate.localeCompare(b.endDate)); }
function kpi([k, v]) { return `<article class="mini-kpi"><span>${k}</span><strong>${v}</strong></article>`; }
function emptyMini(text) { return `<article class="mini-card"><h3>${text}</h3><span>当前为纯前端本地演示。</span></article>`; }
function emptyInline(text) { return `<div class="mini-empty">${text}</div>`; }
function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
function avg(values) { return Math.round(values.reduce((a, b) => a + Number(b || 0), 0) / (values.length || 1)); }
function fmt(value) { return value === "" || value === null || value === undefined ? "-" : value; }
function listItem(task) { return `<div class="mini-list-item"><strong>${task.code} ${esc(task.taskName)}</strong><span>${task.leadDepartment} / ${task.status} / ${task.riskLevel}</span></div>`; }
function unique(values) { return [...new Set(values)]; }
function uniqueBy(rows, key) {
  const seen = new Set();
  return rows.filter((row) => {
    const value = row[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}
function planProgress() {
  const start = new Date("2026-04-01");
  const end = new Date("2030-12-31");
  return Math.round(((TODAY - start) / (end - start)) * 100);
}
function isOverdueMonth(value) {
  if (!value) return false;
  const date = new Date(`${value.length === 7 ? `${value}-01` : value}`);
  return !Number.isNaN(date.getTime()) && date < TODAY;
}
function statusPriority(task) {
  if (task.reviewStatus === "待审核") return 3;
  if (task.reviewStatus === "已退回") return 2;
  if (task.reviewStatus === "草稿") return 1;
  return 0;
}
function esc(value) { return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])); }
function toast(text) {
  $("#mini-toast").textContent = text;
  $("#mini-toast").classList.add("show");
  setTimeout(() => $("#mini-toast").classList.remove("show"), 1800);
}

init().catch((error) => {
  document.body.innerHTML = `<main class="phone-app"><article class="mini-panel"><h2>初始化失败</h2><p>${error.message}</p></article></main>`;
});
