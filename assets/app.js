import { DEMO_NOTICE, LEGACY_ROLE_ACCOUNTS, PRIORITIES, REVIEW_STATUSES, RISK_LEVELS, ROLES, STANDARD_STATUSES, STORAGE_VERSION, TASK_STATUSES } from "../shared/constants/enums.mjs";
import { calculateTaskProgress, canEditMeasure, canEditTask, canFillMeasure, canFillTask, canReview, deriveRisk, deriveTaskStatus, isIndicatorRelevantToUser, isStrategyRole, isTaskRelevantToUser } from "../shared/utils/rules.mjs";

const DATA_KEY = "lsb_strategy_demo_data";
const USER_KEY = "lsb_strategy_demo_user";
const TODAY = new Date("2026-07-15");
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const state = {
  data: null,
  user: null,
  activeTaskId: "",
  activeTab: "measures",
  taskView: "card",
  formContext: null,
  routeView: "dashboard",
  filters: {},
};

async function bootstrap() {
  const base = await loadBaseData();
  state.data = loadStoredData(base);
  state.user = loadUser();
  setupLogin();
  bindEvents();
  if (state.user) showApp();
}

async function loadBaseData() {
  const [tasks, indicators, systems, departments, users, report] = await Promise.all([
    fetchJson("./public/data/tasks.json"),
    fetchJson("./public/data/indicators.json"),
    fetchJson("./public/data/systems.json"),
    fetchJson("./public/data/departments.json"),
    fetchJson("./public/data/demo-users.json"),
    fetchJson("./public/data/import-report.json"),
  ]);
  return { version: STORAGE_VERSION, tasks, indicators, systems, departments, users, report, logs: [] };
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`无法读取 ${url}`);
  return res.json();
}

function loadStoredData(base) {
  const raw = localStorage.getItem(DATA_KEY);
  if (!raw) return persistData(base);
  try {
    const parsed = JSON.parse(raw);
    if (parsed.version !== STORAGE_VERSION) return persistData(base);
    return parsed;
  } catch {
    return persistData(base);
  }
}

function loadUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    if (!user?.account || LEGACY_ROLE_ACCOUNTS.includes(user.account) || !ROLES.some((role) => role.account === user.account)) {
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return ROLES.find((role) => role.account === user.account);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function persistData(next = state.data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(next));
  return next;
}

function setupLogin() {
  const select = $("#login-account");
  select.innerHTML = ROLES.map((user) => `<option value="${user.account}">${user.roleName}</option>`).join("");
  $("#quick-roles").innerHTML = ROLES.map((user) => `
    <button class="role-option" data-role="${user.account}" type="button">
      <strong>${user.roleName}</strong>
      <span>${user.description}</span>
    </button>`).join("");
  $("#quick-roles").addEventListener("click", (event) => {
    const button = event.target.closest("[data-role]");
    if (!button) return;
    select.value = button.dataset.role;
    doLogin(button.dataset.role);
  });
  $("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if ($("#login-password").value !== "Linshang@2026") return toast("演示密码不正确。");
    doLogin(select.value);
  });
}

function doLogin(account) {
  state.user = ROLES.find((user) => user.account === account) || ROLES[0];
  localStorage.setItem(USER_KEY, JSON.stringify(state.user));
  showApp();
}

function showApp() {
  $("#login-screen").classList.add("hidden");
  $("#app-shell").classList.remove("hidden");
  $("#user-name").textContent = state.user.roleName;
  $("#user-meta").textContent = `${state.user.description}`;
  renderNav();
  renderFilters();
  renderRoute();
}

function renderNav() {
  const items = isStrategyRole(state.user)
    ? [
      ["dashboard", "战略驾驶舱"],
      ["tasks", "任务管理"],
      ["review", "模拟审核"],
      ["indicators", "指标管理"],
      ["systems", "系统项目"],
      ["reports", "报表导出"],
    ]
    : [
      ["dashboard", "部门工作台"],
      ["lead", "由我牵头"],
      ["collaboration", "我的协同任务"],
      ["progress", "进度填报"],
      ["indicators", "指标任务"],
      ["systems", "系统项目"],
      ["reports", "报表导出"],
    ];
  $("#nav").innerHTML = items.map(([id, label]) => `<a href="#${id}" data-view="${id}">${label}</a>`).join("");
}

function bindEvents() {
  window.addEventListener("hashchange", renderRoute);
  $("#logout-button").addEventListener("click", () => {
    localStorage.removeItem(USER_KEY);
    location.reload();
  });
  $("#reset-demo").addEventListener("click", resetDemo);
  $("#reset-demo-secondary").addEventListener("click", resetDemo);
  $("#export-all").addEventListener("click", () => downloadJson("临商银行战略规划全部演示数据.json", state.data));
  $("#export-filtered").addEventListener("click", () => exportTasks(filteredTasks(), "临商银行战略任务筛选结果.csv"));
  $("#reset-filters").addEventListener("click", () => {
    state.filters = {};
    $$(".filters input, .filters select").forEach((item) => (item.value = ""));
    renderTasks();
  });
  $("#toggle-advanced")?.addEventListener("click", () => {
    $("#advanced-filters").classList.toggle("hidden");
    $("#toggle-advanced").textContent = $("#advanced-filters").classList.contains("hidden") ? "展开高级筛选" : "收起高级筛选";
  });
  $$(".filters input, .filters select").forEach((item) => item.addEventListener("input", updateFilters));
  $$(".seg").forEach((btn) => btn.addEventListener("click", () => {
    state.taskView = btn.dataset.taskView;
    $$(".seg").forEach((item) => item.classList.toggle("active", item === btn));
    renderTasks();
  }));
  $("#close-detail").addEventListener("click", closeDetail);
  $("#close-form").addEventListener("click", closeForm);
  $("#cancel-form").addEventListener("click", closeForm);
  $("#detail-tabs").addEventListener("click", (event) => {
    const tab = event.target.dataset.tab;
    if (!tab) return;
    setDetailTab(tab);
  });
  $("#open-task-form").addEventListener("click", () => openFillWorkspace(getActiveTask()));
  $("#export-task").addEventListener("click", () => downloadJson(`${getActiveTask().code}-任务卡.json`, getActiveTask()));
  $("#print-task").addEventListener("click", () => window.print());
  $("#progress-form").addEventListener("submit", saveProgress);
  $("#import-json").addEventListener("change", importJson);
  $$("[data-export-type]").forEach((btn) => btn.addEventListener("click", () => exportReport(btn.dataset.exportType)));
}

function renderRoute() {
  const view = location.hash.replace("#", "") || "dashboard";
  state.routeView = view;
  const viewId = ["lead", "collaboration", "progress"].includes(view) ? "tasks" : view;
  $$(".view").forEach((item) => item.classList.toggle("active", item.id === `view-${viewId}`));
  $$("#nav a").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  const title = pageTitle(view);
  $("#page-title").textContent = title.title;
  $("#page-subtitle").textContent = title.subtitle;
  renderActiveView(view);
}

function pageTitle(view) {
  if (view === "dashboard") {
    if (isStrategyRole(state.user)) {
      return { title: "战略执行驾驶舱", subtitle: "全行战略任务、执行举措、验收标准、指标、风险和部门填报情况" };
    }
    return { title: `${state.user.roleName}工作台`, subtitle: "本部门牵头任务、协同任务、待填报事项、风险及指标执行情况" };
  }
  const map = {
    tasks: ["战略任务列表", isStrategyRole(state.user) ? "支持搜索、筛选、查看、审核和导出任务卡" : "支持搜索、筛选、查看、进度填报和导出任务卡"],
    lead: ["由我牵头", "本部门作为牵头部门负责推进的战略任务"],
    collaboration: ["我的协同任务", "本部门作为协同部门或举措责任部门参与的任务"],
    progress: ["进度填报", "本部门可填报的任务和举措"],
    review: ["模拟审核", "战略部门本地模拟审核下设部门提交内容"],
    indicators: [isStrategyRole(state.user) ? "指标管理" : "指标任务", "指标目标、当前值、达成率和风险状态"],
    systems: ["系统建设项目", "战略相关系统建设清单"],
    reports: ["报表导出", "导入导出、打印、恢复演示数据和 Demo 说明"],
  };
  return { title: map[view]?.[0] || "战略任务平台", subtitle: map[view]?.[1] || DEMO_NOTICE };
}

function renderActiveView(view) {
  recalcAllTasks();
  if (view === "dashboard") renderDashboard();
  if (["tasks", "lead", "collaboration", "progress"].includes(view)) renderTasks();
  if (view === "review") renderReview();
  if (view === "indicators") renderIndicators();
  if (view === "systems") renderSystems();
  if (view === "reports") renderReports();
}

function recalcAllTasks() {
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
  persistData();
}

function scopedTasks() {
  return state.data.tasks.filter((task) => isTaskRelevantToUser(task, state.user));
}

function scopedIndicators() {
  return state.data.indicators.filter((indicator) => isIndicatorRelevantToUser(indicator, state.user));
}

function renderDashboard() {
  if (isStrategyRole(state.user)) renderStrategyDashboard();
  else renderDepartmentWorkbench();
}

function renderStrategyDashboard() {
  const tasks = state.data.tasks;
  const measures = tasks.flatMap((task) => task.measures);
  const standards = tasks.flatMap((task) => task.completionStandards);
  const summary = executiveSummary(tasks, measures, standards);
  $("#view-dashboard").innerHTML = `
    <section class="executive-overview panel health-${summary.health}">
      <div>
        <span class="eyebrow">全行战略执行判断</span>
        <h2>${summary.health}</h2>
        <p>${summary.text}</p>
      </div>
      <div class="overview-metrics">
        <div><span>统计周期</span><strong>2026年第二季度</strong></div>
        <div><span>数据截至</span><strong>2026-07-15</strong></div>
        <div><span>总体进度</span><strong>${summary.actual}%</strong></div>
        <div><span>序时计划</span><strong>${summary.plan}%</strong></div>
        <div><span>进度偏差</span><strong class="${summary.delta < 0 ? "danger-text" : "ok-text"}">${summary.delta}pp</strong></div>
        <div><span>较上期</span><strong>${summary.change >= 0 ? "+" : ""}${summary.change}pp</strong></div>
      </div>
    </section>
    <section class="risk-kpi-grid">${strategyKpis(tasks, measures, standards).map(kpiCard).join("")}</section>
    <section class="dashboard-priority-layout">
      <article class="panel priority-exceptions">
        <div class="section-title"><h2>重点异常任务</h2><span>高风险、逾期、标准未达标优先</span></div>
        <div class="table-wrap compact-scroll"><table>${exceptionTable(priorityExceptions(tasks).slice(0, 8))}</table></div>
        <button class="secondary compact-more" data-filter-preset="exception" type="button">查看全部异常任务</button>
      </article>
      <article class="panel department-risk-panel">
        <div class="section-title"><h2>部门执行情况</h2><span>综合风险排序</span></div>
        <div class="table-wrap compact-scroll"><table>${departmentMatrix(tasks)}</table></div>
      </article>
    </section>
    <section class="decision-analysis-layout">
      <article class="panel decision-tabs">
        <div class="section-title"><h2>待办与决策事项</h2><span>统筹管理视角</span></div>
        <div class="decision-grid">
          ${decisionPanel("待审核", tasks.filter((t) => t.reviewStatus === "待审核").slice(0, 3), "review")}
          ${decisionPanel("待协调", tasks.filter((t) => t.coordinationRequest).slice(0, 3), "coordination")}
          ${decisionPanel("待决策", tasks.filter((t) => t.decisionRequest).slice(0, 3), "decision")}
          ${decisionPanel("即将到期", dueTasks(tasks).slice(0, 3), "due")}
        </div>
      </article>
      <article class="panel"><div class="section-title"><h2>未完成指标排行榜</h2><span>达成率升序</span></div><div class="table-wrap"><table>${indicatorRank(state.data.indicators)}</table></div></article>
    </section>
    <section class="chart-grid compact-charts">
      <article class="panel mini-chart"><div class="section-title"><h2>月度趋势</h2><span>完成率</span></div>${trendBars(summary.actual)}</article>
      <article class="panel mini-chart"><div class="section-title"><h2>序时对比</h2><span>计划 vs 实际</span></div>${compareBars(summary.plan, summary.actual)}</article>
      <article class="panel mini-chart"><div class="section-title"><h2>任务状态</h2><span>点击下钻</span></div>${distributionBars(TASK_STATUSES, tasks, "status")}</article>
      <article class="panel mini-chart"><div class="section-title"><h2>风险分布</h2><span>最高风险</span></div>${distributionBars(RISK_LEVELS, tasks, "riskLevel")}</article>
      <article class="panel mini-chart"><div class="section-title"><h2>未完成标准</h2><span>动态口径</span></div>${standardTrend(standards)}</article>
      <article class="panel mini-chart"><div class="section-title"><h2>部门完成/填报</h2><span>Top 6</span></div>${departmentBars(tasks)}</article>
    </section>`;
  bindDashboardDrilldowns();
}

function renderDepartmentWorkbench() {
  const tasks = scopedTasks();
  const measures = tasks.flatMap((task) => task.measures.filter((measure) => canEditMeasure(state.user, task, measure) || isTaskRelevantToUser(task, state.user)));
  const indicators = scopedIndicators();
  const leadTasks = tasks.filter((task) => canEditTask(state.user, task));
  const collabTasks = tasks.filter((task) => !canEditTask(state.user, task));
  const pendingMeasures = measures.filter((m) => m.reviewStatus !== "已通过" || m.progress < 100);
  $("#view-dashboard").innerHTML = `
    <section class="department-head panel">
      <div>
        <span class="eyebrow">部门工作台</span>
        <h2>${state.user.roleName}</h2>
        <p>${state.user.description}。本页只展示与当前部门牵头、协同、举措责任或指标责任相关的数据。</p>
      </div>
      <button class="primary" data-filter-preset="todo" type="button">查看待我处理</button>
    </section>
    <section class="dense-kpi-grid">${[
      ["牵头任务", leadTasks.length, "lead"],
      ["协同任务", collabTasks.length, "collab"],
      ["待填报举措", pendingMeasures.length, "todo"],
      ["待审核/退回", tasks.filter((t) => ["待审核", "已退回"].includes(t.reviewStatus)).length, "review"],
      ["逾期任务", tasks.filter((t) => t.status === "已逾期").length, "overdue"],
      ["高风险任务", tasks.filter((t) => t.riskLevel === "高风险").length, "risk"],
      ["平均进度", `${avg(tasks.map((t) => t.progress))}%`, "progress"],
      ["本期填报率", `${percent(tasks.filter((t) => t.reviewStatus !== "草稿").length, tasks.length)}%`, "fill"],
    ].map(([label, value, preset]) => kpiCard({ label, value, note: "点击查看", preset })).join("")}</section>
    <section class="split-main">
      <article class="panel">
        <div class="section-title"><h2>待我处理</h2><span>填报、退回、临期、高风险、标准未完成</span></div>
        <div class="compact-list">${departmentTodoList(tasks, measures)}</div>
      </article>
      <article class="panel">
        <div class="section-title"><h2>近期截止事项</h2><span>30/60/90 天视角</span></div>
        <div class="compact-list">${deadlineList(tasks)}</div>
      </article>
    </section>
    <section class="split-main">
      <article class="panel">
        <div class="section-title"><h2>由我牵头</h2><span>${leadTasks.length} 项</span></div>
        <div class="compact-list">${taskRows(leadTasks.slice(0, 8))}</div>
      </article>
      <article class="panel">
        <div class="section-title"><h2>我的协同任务</h2><span>${collabTasks.length} 项</span></div>
        <div class="compact-list">${taskRows(collabTasks.slice(0, 8))}</div>
      </article>
    </section>
    <section class="split-main">
      <article class="panel">
        <div class="section-title"><h2>本部门指标</h2><span>${indicators.length} 项</span></div>
        <div class="table-wrap"><table>${indicatorRank(indicators)}</table></div>
      </article>
      <article class="panel">
        <div class="section-title"><h2>最近审核反馈</h2><span>本地模拟记录</span></div>
        <div class="compact-list">${reviewFeedback(tasks)}</div>
      </article>
    </section>`;
  bindDashboardDrilldowns();
}

function executiveSummary(tasks, measures, standards) {
  const actual = avg(tasks.map((task) => task.progress));
  const plan = planProgress();
  const delta = actual - plan;
  const high = tasks.filter((task) => task.riskLevel === "高风险").length;
  const overdue = tasks.filter((task) => task.status === "已逾期").length;
  const missingFill = tasks.filter((task) => task.reviewStatus === "草稿").length;
  const pending = tasks.filter((task) => task.reviewStatus === "待审核").length;
  const slowDepartments = departmentStats(tasks).slice(0, 2).map((item) => item.name).join("、") || "暂无";
  const health = delta < -8 || high > tasks.length * 0.25 ? "风险较高" : delta < -3 || overdue > 0 ? "需要关注" : "整体平稳";
  const change = Math.max(-8, Math.min(8, Math.round(actual - avg(tasks.map((task) => Math.max(0, task.progress - 4))))));
  return {
    actual,
    plan,
    delta,
    high,
    overdue,
    pending,
    change,
    health,
    text: `截至 2026 年第二季度，全行 ${tasks.length} 项战略任务总体进度为 ${actual}%，较序时计划${delta >= 0 ? "高" : "低"} ${Math.abs(delta)} 个百分点。当前有 ${overdue} 项任务逾期、${high} 项任务存在高风险、${missingFill} 项任务填报缺失、${pending} 项部门提交待审核，建议重点关注${slowDepartments}相关任务。`,
  };
}

function planProgress() {
  const start = new Date("2026-04-01");
  const end = new Date("2030-12-31");
  return Math.round(((TODAY - start) / (end - start)) * 100);
}

function strategyKpis(tasks, measures, standards) {
  const actual = avg(tasks.map((task) => task.progress));
  const plan = planProgress();
  const overdueMeasures = measures.filter((m) => isOverdueMonth(m.dueDate) && Number(m.progress || 0) < 100).length;
  const unmetStandards = standards.filter((s) => s.mandatory !== false && s.status !== "已达标").length;
  return [
    { label: "任务总数", value: tasks.length, note: "全行任务", preset: "all" },
    { label: "总体完成率", value: `${actual}%`, note: "+4pp 较上期", preset: "progress" },
    { label: "进度偏差", value: `${actual - plan}pp`, note: "实际-序时", preset: "lag" },
    { label: "逾期任务", value: tasks.filter((t) => t.status === "已逾期").length, note: "需督办", preset: "overdue" },
    { label: "高风险任务", value: tasks.filter((t) => t.riskLevel === "高风险").length, note: "需关注", preset: "risk" },
    { label: "逾期举措", value: overdueMeasures, note: "举措未完成", preset: "measure-overdue" },
    { label: "未达标标准", value: unmetStandards, note: "必达标准", preset: "standard" },
    { label: "待审核事项", value: tasks.filter((t) => t.reviewStatus === "待审核").length, note: "可进入审核", preset: "review" },
  ];
}

function kpiCard(item) {
  const value = String(item.value);
  const cls = /逾期|高风险|偏差|未达标/.test(item.label) && !value.startsWith("0") ? " warn" : "";
  return `<button class="kpi-card drill${cls}" data-filter-preset="${item.preset}" type="button"><span>${item.label}</span><strong>${item.value}</strong><small>${item.note || ""}</small></button>`;
}

function priorityExceptions(tasks) {
  return tasks.map((task) => {
    const standardUnmet = task.completionStandards.some((s) => s.status !== "已达标");
    const overdueMeasureCount = task.measures.filter((m) => isOverdueMonth(m.dueDate) && Number(m.progress || 0) < 100).length;
    const longUnfilled = task.reviewStatus === "草稿";
    const dueSoon = isDueSoon(task.endDate);
    let score = 0;
    let type = "";
    if (task.riskLevel === "高风险" && task.status === "已逾期") [score, type] = [100, "高风险且逾期"];
    else if (task.status === "已逾期" && task.progress < planProgress() - 10) [score, type] = [95, "逾期且进度严重落后"];
    else if (overdueMeasureCount > 0) [score, type] = [88, `逾期举措 ${overdueMeasureCount} 项`];
    else if (task.status === "已逾期") [score, type] = [85, "已逾期"];
    else if (task.riskLevel === "高风险") [score, type] = [80, "高风险"];
    else if (standardUnmet) [score, type] = [70, "完成标准未达标"];
    else if (longUnfilled) [score, type] = [60, "长时间未填报"];
    else if (task.reviewStatus === "已退回") [score, type] = [50, "审核退回"];
    else if (dueSoon) [score, type] = [40, "即将到期"];
    return { task, score, type };
  }).filter((item) => item.score).sort((a, b) => b.score - a.score).slice(0, 12);
}

function exceptionTable(items) {
  const plan = planProgress();
  return table(["任务编号", "任务名称", "牵头部门", "状态", "风险", "进度", "序时", "偏差", "截止", "异常原因", "操作"], items.map(({ task, type }) => [
    `<span class="nowrap">${task.code}</span>`,
    `<button class="task-name-link" title="${escapeHtml(task.taskName)}" data-detail="${task.id}" type="button">${escapeHtml(task.taskName)}</button>`,
    task.leadDepartment,
    tag(task.status, "status"),
    tag(task.riskLevel, "risk"),
    `${task.progress}%`,
    `${plan}%`,
    `${task.progress - plan}pp`,
    task.endDate || "-",
    tag(type),
    `<button class="secondary" data-detail="${task.id}" type="button">查看</button>`,
  ]));
}

function departmentStats(tasks) {
  const names = unique(tasks.map((t) => t.leadDepartment).filter(Boolean));
  return names.map((name) => {
    const rows = tasks.filter((task) => task.leadDepartment === name);
    const standards = rows.flatMap((task) => task.completionStandards);
    const progress = avg(rows.map((task) => task.progress));
    const fillRate = percent(rows.filter((task) => task.reviewStatus !== "草稿").length, rows.length);
    const missingFill = rows.filter((task) => task.reviewStatus === "草稿").length;
    const riskScore = rows.filter((task) => task.status === "已逾期").length * 5 + rows.filter((task) => task.riskLevel === "高风险").length * 3 + Math.max(0, planProgress() - progress);
    const status = riskScore >= 12 ? "预警" : riskScore >= 5 ? "关注" : "正常";
    return {
      name,
      rows,
      leadTaskCount: rows.length,
      progress,
      delta: progress - planProgress(),
      overdue: rows.filter((task) => task.status === "已逾期").length,
      highRisk: rows.filter((task) => task.riskLevel === "高风险").length,
      fillRate,
      missingFill,
      standardRate: percent(standards.filter((s) => s.status === "已达标").length, standards.length),
      riskScore,
      status,
    };
  }).sort((a, b) => b.riskScore - a.riskScore);
}

function departmentMatrix(tasks) {
  return table(["部门", "牵头", "平均进度", "序时偏差", "逾期", "高风险", "未按期填报", "标准达标", "综合状态"], departmentStats(tasks).slice(0, 10).map((d) => [
    `<button class="link-button" data-dept="${d.name}" type="button">${d.name}</button>`,
    d.leadTaskCount,
    `${d.progress}%`,
    `${d.delta}pp`,
    d.overdue,
    d.highRisk,
    d.missingFill,
    `${d.standardRate}%`,
    tag(d.status),
  ]));
}

function distributionBars(labels, rows, field) {
  const total = rows.length || 1;
  return `<div class="chart-list">${labels.map((label) => {
    const count = rows.filter((row) => row[field] === label).length;
    return `<div class="bar-row"><button data-chart-filter="${field}" data-value="${label}" type="button">${label}</button><div class="bar"><i style="width:${percent(count, total)}%"></i></div><strong>${count}</strong></div>`;
  }).join("")}</div>`;
}

function trendBars(actual) {
  const values = [Math.max(0, actual - 12), Math.max(0, actual - 8), Math.max(0, actual - 5), Math.max(0, actual - 2), actual];
  return `<div class="chart-list">${values.map((value, idx) => `<div class="bar-row"><span>${idx + 2}月</span><div class="bar"><i style="width:${value}%"></i></div><strong>${value}%</strong></div>`).join("")}</div>`;
}

function compareBars(plan, actual) {
  return `<div class="chart-list">${[["序时计划", plan], ["实际进度", actual]].map(([label, value]) => `<div class="bar-row"><span>${label}</span><div class="bar"><i style="width:${value}%"></i></div><strong>${value}%</strong></div>`).join("")}</div>`;
}

function standardTrend(standards) {
  const undone = standards.filter((s) => s.status !== "已达标").length;
  const values = [undone + 18, undone + 12, undone + 8, undone + 4, undone].map((v) => Math.max(0, v));
  const max = Math.max(...values, 1);
  return `<div class="chart-list">${values.map((value, idx) => `<div class="bar-row"><span>${idx + 2}月</span><div class="bar"><i style="width:${percent(value, max)}%"></i></div><strong>${value}</strong></div>`).join("")}</div>`;
}

function departmentBars(tasks) {
  return `<div class="chart-list">${departmentStats(tasks).slice(0, 6).map((d) => `<div class="bar-row"><span>${d.name.slice(0, 5)}</span><div class="bar"><i style="width:${d.progress}%"></i></div><strong>${d.progress}%</strong></div>`).join("")}</div>`;
}

function leaderPanel(title, tasks) {
  return `<article class="panel"><div class="section-title"><h2>${title}</h2><span>${tasks.length} 项</span></div><div class="compact-list">${taskRows(tasks)}</div></article>`;
}

function decisionPanel(title, tasks, type) {
  return `<section class="decision-panel decision-${type}">
    <header><strong>${title}</strong><span>${tasks.length}</span></header>
    <div>${tasks.length ? tasks.map((task) => `<button class="decision-item" data-detail="${task.id}" type="button"><b>${task.code}</b><span title="${escapeHtml(task.taskName)}">${escapeHtml(task.taskName)}</span></button>`).join("") : `<p class="muted">暂无事项</p>`}</div>
  </section>`;
}

function taskRows(tasks) {
  return tasks.length ? tasks.map((task) => `<article class="compact-item"><strong>${task.code} ${escapeHtml(task.taskName)}</strong><span>${task.leadDepartment} / ${tag(task.status, "status")} ${tag(task.riskLevel, "risk")} / ${task.progress}%</span><button class="secondary" data-detail="${task.id}" type="button">查看</button></article>`).join("") : emptyState("暂无事项");
}

function indicatorRank(indicators) {
  const rows = indicators.slice().sort((a, b) => Number(a.achievementRate || 0) - Number(b.achievementRate || 0)).slice(0, 8);
  return table(["指标", "责任部门", "2026目标", "当前值", "达成率", "状态"], rows.map((item) => [item.name, item.department, formatValue(item.target2026), formatValue(item.currentValue), `${item.achievementRate || "-"}%`, tag(item.status)]));
}

function dueTasks(tasks) {
  return tasks.filter((task) => task.endDate).sort((a, b) => a.endDate.localeCompare(b.endDate));
}

function departmentTodoList(tasks, measures) {
  const todoTasks = [
    ...tasks.filter((t) => t.reviewStatus === "已退回").slice(0, 3),
    ...tasks.filter((t) => t.riskLevel === "高风险").slice(0, 3),
    ...tasks.filter((t) => t.completionStandards.some((s) => s.status !== "已达标")).slice(0, 3),
  ];
  const measureRows = measures.filter((m) => m.progress < 100).slice(0, 4).map((m) => `<article class="compact-item"><strong>${m.taskId} / 举措 ${m.order}</strong><span>${escapeHtml(m.title)} / ${m.progress}% / ${m.reviewStatus}</span></article>`).join("");
  return `${measureRows}${taskRows(todoTasks)}`;
}

function deadlineList(tasks) {
  const rows = tasks.flatMap((task) => [
    { label: "任务", task, date: task.endDate, text: task.taskName },
    ...task.measures.map((m) => ({ label: `举措 ${m.order}`, task, date: m.dueDate, text: m.title })),
    ...task.completionStandards.map((s) => ({ label: `标准 ${s.order}`, task, date: s.targetDate, text: s.description })),
  ]).filter((item) => item.date).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);
  return rows.map((item) => `<article class="compact-item"><strong>${item.task.code} / ${item.label}</strong><span>${item.date} / ${escapeHtml(item.text).slice(0, 80)}</span></article>`).join("") || emptyState("暂无近期截止事项");
}

function reviewFeedback(tasks) {
  const rows = tasks.filter((task) => ["已退回", "已通过", "待审核"].includes(task.reviewStatus)).slice(0, 8);
  return rows.map((task) => `<article class="compact-item"><strong>${task.code} ${tag(task.reviewStatus)}</strong><span>${task.updatedAt} / ${task.updatedBy}</span><p>${escapeHtml(task.updateHistory?.[0]?.note || task.taskName)}</p></article>`).join("") || emptyState("暂无审核反馈");
}

function bindDashboardDrilldowns() {
  $$("[data-filter-preset]").forEach((button) => button.addEventListener("click", () => applyPreset(button.dataset.filterPreset)));
  $$("[data-detail]").forEach((button) => button.addEventListener("click", () => openDetail(button.dataset.detail)));
  $$("[data-dept]").forEach((button) => button.addEventListener("click", () => {
    location.hash = "#tasks";
    setTimeout(() => {
      $("#filter-lead").value = button.dataset.dept;
      updateFilters();
    });
  }));
  $$("[data-chart-filter]").forEach((button) => button.addEventListener("click", () => {
    location.hash = "#tasks";
    setTimeout(() => {
      const target = button.dataset.chartFilter === "riskLevel" ? $("#filter-risk") : $("#filter-status");
      target.value = button.dataset.value;
      updateFilters();
    });
  }));
}

function applyPreset(preset) {
  if (preset === "review") {
    location.hash = "#review";
    return;
  }
  location.hash = "#tasks";
  setTimeout(() => {
    $$(".filters input, .filters select").forEach((item) => (item.value = ""));
    if (preset === "overdue") $("#filter-status").value = "已逾期";
    if (preset === "risk") $("#filter-risk").value = "高风险";
    if (preset === "exception") $("#filter-risk").value = "高风险";
    if (preset === "standard") $("#filter-standard-status").value = "未达标";
    if (preset === "measure-overdue") $("#filter-measure-status").value = "进行中";
    if (preset === "lead") $("#filter-lead").value = state.user.department;
    if (preset === "todo") $("#filter-measure-status").value = "进行中";
    updateFilters();
  });
}

function renderFilters() {
  const tasks = scopedTasks();
  fillSelect("#filter-section", "全部板块", unique(tasks.map((t) => t.businessSection)));
  fillSelect("#filter-lead", "全部牵头部门", unique(tasks.map((t) => t.leadDepartment)));
  fillSelect("#filter-collab", "全部协同部门", unique(tasks.flatMap((t) => t.collaboratorDepartments || [])));
  fillSelect("#filter-status", "全部状态", TASK_STATUSES);
  fillSelect("#filter-review", "全部审核状态", REVIEW_STATUSES);
  fillSelect("#filter-risk", "全部风险", RISK_LEVELS);
  fillSelect("#filter-priority", "全部优先级", PRIORITIES);
  fillSelect("#filter-year", "全部年份", ["2026", "2027", "2028", "2029", "2030"]);
  fillSelect("#filter-measure-status", "全部举措状态", TASK_STATUSES);
  fillSelect("#filter-standard-status", "全部标准状态", STANDARD_STATUSES);
}

function fillSelect(selector, all, values) {
  const el = $(selector);
  if (!el) return;
  el.innerHTML = `<option value="">${all}</option>` + values.filter(Boolean).map((v) => `<option value="${v}">${v}</option>`).join("");
}

function updateFilters() {
  state.filters = {
    keyword: $("#filter-keyword").value.trim(),
    section: $("#filter-section").value,
    lead: $("#filter-lead").value,
    collab: $("#filter-collab").value,
    status: $("#filter-status").value,
    review: $("#filter-review").value,
    risk: $("#filter-risk").value,
    priority: $("#filter-priority").value,
    year: $("#filter-year").value,
    overdue: $("#filter-overdue").value,
    measureStatus: $("#filter-measure-status").value,
    standardStatus: $("#filter-standard-status").value,
  };
  renderTasks();
}

function filteredTasks() {
  const f = state.filters;
  return scopedTasks().filter((task) => {
    if (state.routeView === "lead" && !canFillTask(state.user, task)) return false;
    if (state.routeView === "collaboration" && (canFillTask(state.user, task) || !task.measures.some((m) => canFillMeasure(state.user, task, m)))) return false;
    if (state.routeView === "progress" && !task.measures.some((m) => canFillMeasure(state.user, task, m))) return false;
    const hay = [task.code, task.taskName, task.businessSection, task.leadDepartment, ...task.collaboratorDepartments].join(" ");
    if (f.keyword && !hay.includes(f.keyword)) return false;
    if (f.section && task.businessSection !== f.section) return false;
    if (f.lead && task.leadDepartment !== f.lead) return false;
    if (f.collab && !(task.collaboratorDepartments || []).includes(f.collab)) return false;
    if (f.status && task.status !== f.status) return false;
    if (f.review && task.reviewStatus !== f.review) return false;
    if (f.risk && task.riskLevel !== f.risk) return false;
    if (f.priority && task.priority !== f.priority) return false;
    if (f.year && !String(task.implementationPeriod).includes(f.year)) return false;
    if (f.overdue === "yes" && task.status !== "已逾期") return false;
    if (f.measureStatus && !task.measures.some((m) => m.status === f.measureStatus)) return false;
    if (f.standardStatus && !task.completionStandards.some((s) => s.status === f.standardStatus)) return false;
    return true;
  });
}

function renderTasks() {
  const tasks = filteredTasks();
  $("#task-count").textContent = `共 ${tasks.length} 条任务`;
  $("#task-card-list").classList.toggle("hidden", state.taskView !== "card");
  $("#task-table-panel").classList.toggle("hidden", state.taskView !== "table");
  $("#task-card-list").innerHTML = tasks.map(taskCard).join("") || emptyState("暂无符合条件的任务");
  $("#task-table").innerHTML = table(["编号", "任务名称", "业务板块", "牵头部门", "状态", "风险", "进度", "举措", "标准", "截止", "最近更新", "操作"], tasks.map((task) => [
    `<span class="nowrap">${task.code}</span>`,
    `<span class="table-task-name" title="${escapeHtml(task.taskName)}">${escapeHtml(task.taskName)}</span>`,
    task.businessSection,
    task.leadDepartment,
    tag(task.status, "status"),
    tag(task.riskLevel, "risk"),
    `${task.progress}%`,
    `${doneMeasures(task)}/${task.measures.length}`,
    `${doneStandards(task)}/${task.completionStandards.length}`,
    task.endDate,
    task.updatedAt,
    taskActions(task),
  ]));
  bindTaskActions();
}

function taskCard(task) {
  return `<article class="task-card compact-task-card">
    <div class="task-card-head"><span class="tag code-tag">${task.code}</span><div>${tag(task.priority)} ${tag(task.status, "status")} ${tag(task.riskLevel, "risk")}</div></div>
    <h3>${escapeHtml(task.taskName)}</h3>
    <div class="task-line">${task.businessSection} / ${task.leadDepartment}</div>
    <div class="progress-line"><div class="progress-text"><span>总体进度</span><strong>${task.progress}%</strong></div><div class="progress"><i style="width:${task.progress}%"></i></div></div>
    <div class="task-meta compact-meta">
      <span>举措 ${doneMeasures(task)}/${task.measures.length}</span>
      <span>标准 ${doneStandards(task)}/${task.completionStandards.length}</span>
      <span>审核 ${task.reviewStatus}</span>
      <span>截止 ${task.endDate || "-"}</span>
    </div>
    <div class="task-actions">${taskActions(task)}</div>
  </article>`;
}

function taskActions(task) {
  if (isStrategyRole(state.user)) {
    const reviewButton = task.reviewStatus === "待审核" ? `<button class="primary" data-review-task="${task.id}" type="button">审核</button>` : "";
    return `<button class="secondary" data-detail="${task.id}" type="button">查看详情</button><button class="ghost" data-detail="${task.id}" type="button">查看填报</button>${reviewButton}`;
  }
  return `<button class="secondary" data-detail="${task.id}" type="button">查看详情</button><button class="primary" data-fill-task="${task.id}" type="button">填报任务</button>`;
}

function bindTaskActions() {
  $$("[data-detail]").forEach((button) => button.addEventListener("click", () => openDetail(button.dataset.detail)));
  $$("[data-fill-task]").forEach((button) => button.addEventListener("click", () => openFillWorkspace(getTask(button.dataset.fillTask))));
  $$("[data-review-task]").forEach((button) => button.addEventListener("click", () => {
    location.hash = "#review";
    setTimeout(() => {
      const task = getTask(button.dataset.reviewTask);
      if (task) toast(`已进入模拟审核：${task.code}`);
    });
  }));
}

function openDetail(id) {
  state.activeTaskId = id;
  setDetailTab("measures", false);
  const task = getActiveTask();
  $("#detail-code").textContent = `${task.code} / ${task.businessSection}`;
  $("#detail-title").textContent = task.taskName;
  $("#open-task-form").textContent = isStrategyRole(state.user) ? "模拟审核" : "进入填报";
  $("#detail-drawer").classList.add("open");
  $("#detail-drawer").setAttribute("aria-hidden", "false");
  renderDetailBody();
}

function closeDetail() {
  $("#detail-drawer").classList.remove("open");
  $("#detail-drawer").setAttribute("aria-hidden", "true");
}

function setDetailTab(tab, shouldRender = true) {
  state.activeTab = tab;
  $$(".tab").forEach((item) => item.classList.toggle("active", item.dataset.tab === tab));
  if (shouldRender) renderDetailBody();
}

function renderDetailBody() {
  const task = getActiveTask();
  const body = $("#detail-body");
  const summary = renderDetailSummary(task);
  let content = "";
  if (state.activeTab === "overview") content = renderOverview(task);
  if (state.activeTab === "measures") content = renderMeasures(task);
  if (state.activeTab === "standards") content = renderStandards(task);
  if (state.activeTab === "history") content = renderHistory(task);
  body.innerHTML = `${summary}${content}`;
  body.querySelectorAll("[data-fill-measure]").forEach((button) => button.addEventListener("click", () => openMeasureForm(task, button.dataset.fillMeasure)));
  body.querySelectorAll("[data-toggle-measure]").forEach((button) => button.addEventListener("click", () => {
    const row = body.querySelector(`[data-measure-detail="${button.dataset.toggleMeasure}"]`);
    row.classList.toggle("hidden");
    button.textContent = row.classList.contains("hidden") ? "展开" : "收起";
  }));
}

function renderDetailSummary(task) {
  return `<section class="detail-summary">
    <div><span>编号</span><strong>${task.code}</strong></div>
    <div><span>业务板块</span><strong>${task.businessSection}</strong></div>
    <div><span>牵头部门</span><strong>${task.leadDepartment}</strong></div>
    <div><span>协同部门</span><strong>${task.collaboratorDepartments.join("、") || "-"}</strong></div>
    <div><span>优先级</span><strong>${task.priority}</strong></div>
    <div><span>实施周期</span><strong>${task.implementationPeriod}</strong></div>
    <div><span>状态</span><strong>${tag(task.status, "status")}</strong></div>
    <div><span>进度</span><strong>${task.progress}%</strong></div>
    <div><span>风险</span><strong>${tag(task.riskLevel, "risk")}</strong></div>
    <div><span>审核</span><strong>${tag(task.reviewStatus)}</strong></div>
    <div><span>最近更新</span><strong>${task.updatedAt}</strong></div>
  </section>`;
}

function renderOverview(task) {
  const items = [
    ["任务目标", task.taskGoal],
    ["总体执行情况", task.currentPeriodSummary],
    ["关键成果", task.keyDeliverables],
    ["下一阶段计划", task.nextPlan],
    ["当前问题", task.issueDescription || "暂无"],
    ["风险说明", task.riskDescription || "暂无"],
    ["应对措施", task.responseMeasure || "暂无"],
    ["协调事项", task.coordinationRequest || "暂无"],
    ["待决策事项", task.decisionRequest || "暂无"],
    ["总体里程碑", task.milestones.map((m) => `${m.name}：${m.date} / ${m.status}`).join("；")],
  ];
  return `<section class="detail-grid overview-grid">${items.map(([k, v]) => `<div class="detail-box full"><span>${k}</span><strong>${escapeHtml(v || "-")}</strong></div>`).join("")}</section>`;
}

function renderMeasures(task) {
  return `<section class="measure-table">
    <div class="section-title"><h2>实施举措</h2><span>已填写 ${task.measures.filter((m) => m.reviewStatus !== "草稿").length}/${task.measures.length} 项举措</span></div>
    <div class="table-wrap"><table>${table(["序号", "举措原文", "责任/协同", "计划", "权重", "状态", "进度", "风险", "最近填报", "操作"], task.measures.map((m) => [
      m.order,
      `<strong>${escapeHtml(m.title)}</strong><p class="cell-text">${escapeHtml(m.rawText || m.description)}</p>`,
      `${m.ownerDepartment}<br><span class="muted">${(m.collaboratorDepartments || []).join("、") || "-"}</span>`,
      `${m.startDate || "-"}<br>${m.dueDate || "-"}`,
      `${m.weight}%`,
      tag(m.status, "status"),
      `${m.progress}%`,
      tag(m.riskLevel, "risk"),
      `${m.updatedAt || "-"}<br><span class="muted">${m.reviewStatus || "草稿"}</span>`,
      isStrategyRole(state.user)
        ? `<button class="ghost" data-toggle-measure="${m.id}" type="button">展开</button>`
        : `<button class="ghost" data-toggle-measure="${m.id}" type="button">展开</button> <button class="primary" data-fill-measure="${m.id}" type="button" ${canEditMeasure(state.user, task, m) ? "" : "disabled"}>填报</button>`,
    ]))}</table></div>
    ${task.measures.map((m) => `<article class="measure-detail hidden" data-measure-detail="${m.id}">
      <h3>${task.code} / 举措 ${m.order}</h3>
      <div class="detail-grid">
        ${detailBox("本期完成情况", m.currentPeriodSummary)}
        ${detailBox("已完成工作", m.completedWork)}
        ${detailBox("关键成果", m.keyDeliverables)}
        ${detailBox("下一阶段计划", m.nextPlan)}
        ${detailBox("预计完成日期", m.dueDate)}
        ${detailBox("问题描述", m.issueDescription || "暂无")}
        ${detailBox("风险描述", m.riskDescription || "暂无")}
        ${detailBox("应对措施", m.responseMeasure || "暂无")}
        ${detailBox("协调事项", m.coordinationRequest || "暂无")}
        ${detailBox("待决策事项", m.decisionRequest || "暂无")}
        ${detailBox("佐证材料", `${(m.evidenceFiles || []).length} 个`)}
        ${detailBox("填报记录", (m.updateHistory || []).map((h) => `${h.time} ${h.operator} ${h.action}`).join("；") || "暂无")}
      </div>
    </article>`).join("")}
  </section>`;
}

function renderStandards(task) {
  return `<section>
    <div class="section-title"><h2>完成标准</h2><span>${doneStandards(task)}/${task.completionStandards.length} 已达标</span></div>
    <div class="table-wrap"><table>${table(["序号", "标准原文", "分组", "类型", "目标/当前", "目标日期", "达成率", "必达", "状态", "关联举措", "验收说明"], task.completionStandards.map((s) => [
      s.order,
      escapeHtml(s.rawText || s.description),
      s.groupName || "-",
      s.type,
      `${formatValue(s.targetValue)} ${s.unit || ""}<br><span class="muted">${formatValue(s.currentValue)} ${s.unit || ""}</span>`,
      s.targetDate || "-",
      `${s.completionRate}%`,
      s.mandatory ? "是" : "否",
      tag(s.status),
      (s.linkedMeasureIds || []).join("、") || "-",
      escapeHtml(s.verificationNote || "暂无"),
    ]))}</table></div>
  </section>`;
}

function renderHistory(task) {
  const taskHistory = (task.updateHistory || []).map((h) => ({ scope: "任务整体", ...h }));
  const measureHistory = task.measures.flatMap((m) => (m.updateHistory || []).map((h) => ({ scope: `举措 ${m.order}`, ...h })));
  const rows = [...taskHistory, ...measureHistory].sort((a, b) => String(b.time).localeCompare(String(a.time)));
  return `<section><div class="section-title"><h2>填报和审核记录</h2><span>${rows.length} 条</span></div><div class="compact-list">${rows.map((h) => `<article class="compact-item"><strong>${h.scope} / ${h.action}</strong><span>${h.time} / ${h.operator}</span><p>${escapeHtml(h.note || "本地模拟记录")}</p></article>`).join("") || emptyState("暂无记录")}</div></section>`;
}

function detailBox(label, value) {
  return `<div class="detail-box full"><span>${label}</span><strong>${escapeHtml(value || "-")}</strong></div>`;
}

function openFillWorkspace(task) {
  if (isStrategyRole(state.user)) {
    location.hash = "#review";
    return;
  }
  if (!canEditTask(state.user, task) && !task.measures.some((m) => canEditMeasure(state.user, task, m))) return toast("当前演示角色没有可填报的举措。");
  const firstMeasure = task.measures.find((m) => canEditMeasure(state.user, task, m)) || task.measures[0];
  state.formContext = { type: "measure", taskId: task.id, measureId: firstMeasure.id };
  $("#form-context").textContent = `${task.code} / 已填写 ${task.measures.filter((m) => m.reviewStatus !== "草稿").length}/${task.measures.length} 项举措`;
  $("#form-title").textContent = "任务填报";
  $("#form-fields").innerHTML = fillWorkspaceHtml(task, firstMeasure.id);
  bindFillWorkspace(task);
  openForm();
}

function fillWorkspaceHtml(task, activeMeasureId) {
  return `<div class="fill-workspace">
    <aside class="fill-nav">
      <button class="fill-nav-item" data-fill-overall="${task.id}" type="button">任务总体填报</button>
      ${task.measures.map((m) => `<button class="fill-nav-item ${m.id === activeMeasureId ? "active" : ""}" data-fill-measure-nav="${m.id}" type="button">举措 ${m.order}<span>${m.progress}% / ${m.reviewStatus || "草稿"}</span></button>`).join("")}
      <button class="fill-nav-item" data-fill-standards="${task.id}" type="button">完成标准<span>${doneStandards(task)}/${task.completionStandards.length}</span></button>
    </aside>
    <section class="fill-editor" id="fill-editor">${measureFormHtml(task, task.measures.find((m) => m.id === activeMeasureId))}</section>
  </div>`;
}

function bindFillWorkspace(task) {
  $("#form-fields").querySelectorAll("[data-fill-measure-nav]").forEach((button) => button.addEventListener("click", () => {
    const measure = task.measures.find((m) => m.id === button.dataset.fillMeasureNav);
    state.formContext = { type: "measure", taskId: task.id, measureId: measure.id };
    $("#fill-editor").innerHTML = measureFormHtml(task, measure);
    $("#form-fields").querySelectorAll(".fill-nav-item").forEach((item) => item.classList.toggle("active", item === button));
    attachCharTips();
  }));
  $("#form-fields").querySelector("[data-fill-overall]").addEventListener("click", (event) => {
    state.formContext = { type: "task", taskId: task.id };
    $("#fill-editor").innerHTML = taskFormHtml(task);
    $("#form-fields").querySelectorAll(".fill-nav-item").forEach((item) => item.classList.toggle("active", item === event.currentTarget));
    attachCharTips();
  });
  $("#form-fields").querySelector("[data-fill-standards]").addEventListener("click", (event) => {
    $("#fill-editor").innerHTML = `<section class="form-section"><div class="section-title"><h2>完成标准</h2><span>验收项逐项展示</span></div>${renderStandards(task)}</section>`;
    $("#form-fields").querySelectorAll(".fill-nav-item").forEach((item) => item.classList.toggle("active", item === event.currentTarget));
  });
  attachCharTips();
}

function taskFormHtml(task) {
  return `<section class="form-section">
    <div class="section-title"><h2>任务整体填报</h2><span>综合汇总，不替代举措逐项填报</span></div>
    ${textarea("currentPeriodSummary", "本期综合进展", task.currentPeriodSummary, true)}
    ${textarea("keyDeliverables", "整体关键成果", task.keyDeliverables)}
    ${textarea("nextPlan", "整体下一阶段计划", task.nextPlan)}
    ${textarea("issueDescription", "整体问题", task.issueDescription)}
    ${textarea("riskDescription", "整体风险", task.riskDescription)}
    ${textarea("responseMeasure", "整体应对措施", task.responseMeasure)}
    ${textarea("coordinationRequest", "整体协调事项", task.coordinationRequest)}
    ${textarea("decisionRequest", "整体待决策事项", task.decisionRequest)}
  </section>`;
}

function measureFormHtml(task, measure) {
  if (!measure) return emptyState("暂无可填报举措");
  return `<section class="form-section">
    <div class="section-title"><h2>${task.code} / 举措 ${measure.order}</h2><span>${escapeHtml(measure.title)}</span></div>
    <p class="form-raw">${escapeHtml(measure.rawText || measure.description)}</p>
    <div class="form-grid">
      ${selectField("status", "举措状态", TASK_STATUSES, measure.status)}
      ${inputField("progress", "完成比例", measure.progress, "number", "min='0' max='100' required")}
      ${inputField("weight", "权重", measure.weight, "number", "min='0' max='100'")}
      ${inputField("dueDate", "预计完成日期", measure.dueDate, "month")}
    </div>
    ${textarea("currentPeriodSummary", "本期完成情况", measure.currentPeriodSummary, true)}
    ${textarea("completedWork", "已完成工作", measure.completedWork)}
    ${textarea("keyDeliverables", "关键成果", measure.keyDeliverables)}
    ${textarea("nextPlan", "下一阶段计划", measure.nextPlan)}
    ${textarea("issueDescription", "问题描述", measure.issueDescription)}
    ${selectField("riskLevel", "风险等级", RISK_LEVELS, measure.riskLevel)}
    ${textarea("riskDescription", "风险描述", measure.riskDescription)}
    ${textarea("responseMeasure", "应对措施", measure.responseMeasure)}
    ${textarea("coordinationRequest", "协调事项", measure.coordinationRequest)}
    ${textarea("decisionRequest", "待决策事项", measure.decisionRequest)}
    <label><span>佐证材料</span><input name="evidenceFiles" type="file" multiple><small class="muted">附件仅用于本地演示，刷新、清缓存或更换设备后可能丢失。</small></label>
  </section>`;
}

function openMeasureForm(task, measureId) {
  if (!canEditMeasure(state.user, task, task.measures.find((m) => m.id === measureId))) return toast("当前演示角色没有编辑该举措的权限。");
  state.formContext = { type: "measure", taskId: task.id, measureId };
  $("#form-context").textContent = `${task.code} / 举措 ${task.measures.find((m) => m.id === measureId).order}`;
  $("#form-title").textContent = "单项举措填报";
  $("#form-fields").innerHTML = measureFormHtml(task, task.measures.find((m) => m.id === measureId));
  openForm();
}

function openForm() {
  $("#form-drawer").classList.add("open");
  $("#form-drawer").setAttribute("aria-hidden", "false");
  attachCharTips();
}

function attachCharTips() {
  $$("#form-fields textarea").forEach((field) => {
    if (field.nextElementSibling?.classList.contains("char-tip")) return;
    field.insertAdjacentHTML("afterend", `<span class="char-tip">${field.value.length}/500</span>`);
    field.addEventListener("input", () => (field.nextElementSibling.textContent = `${field.value.length}/500`));
  });
}

function closeForm() {
  if ($("#form-drawer").classList.contains("open") && !confirm("确认离开填报？未保存内容将不会写入本地演示数据。")) return;
  closeFormNoConfirm();
}

function saveProgress(event) {
  event.preventDefault();
  const action = event.submitter.dataset.submitAction;
  const form = new FormData(event.currentTarget);
  const task = getTask(state.formContext.taskId);
  const changed = {};
  for (const [key, value] of form.entries()) {
    if (key !== "evidenceFiles") changed[key] = value;
  }
  if (state.formContext.type === "task") {
    Object.assign(task, changed);
  } else {
    const measure = task.measures.find((m) => m.id === state.formContext.measureId);
    const history = { time: now(), operator: state.user.roleName, action: action === "submit" ? "提交审核" : "保存草稿", note: `${task.code} / 举措 ${measure.order} 独立填报。` };
    Object.assign(measure, changed, {
      progress: clamp(Number(changed.progress || measure.progress), 0, 100),
      weight: Number(changed.weight || measure.weight),
      reviewStatus: action === "submit" ? "待审核" : "草稿",
      updatedBy: state.user.roleName,
      updatedAt: now(),
      updateHistory: [history, ...(measure.updateHistory || [])],
      evidenceFiles: [...(measure.evidenceFiles || []), ...($("#form-fields input[type=file]")?.files || [])].map((file) => ({
        name: file.name || file,
        type: file.type || "demo",
        size: file.size || 0,
        description: "本地演示登记",
        uploadedAt: now(),
      })),
    });
  }
  task.reviewStatus = action === "submit" ? "待审核" : "草稿";
  task.updatedAt = now();
  task.updatedBy = state.user.roleName;
  task.updateHistory.unshift({ time: now(), operator: state.user.roleName, action: action === "submit" ? "提交审核" : "保存草稿", note: "通过 PC 端本地 Demo 填报。" });
  state.data.logs.unshift({ time: now(), operator: state.user.roleName, object: task.code, action: task.updateHistory[0].action, note: task.taskName });
  recalcAllTasks();
  persistData();
  closeFormNoConfirm();
  renderActiveView(location.hash.replace("#", "") || "dashboard");
  if (state.activeTaskId) renderDetailBody();
  toast(action === "submit" ? "已提交模拟审核。" : "草稿已保存到本地。");
}

function closeFormNoConfirm() {
  $("#form-drawer").classList.remove("open");
  $("#form-drawer").setAttribute("aria-hidden", "true");
}

function renderReview() {
  const rows = (isStrategyRole(state.user) ? state.data.tasks : scopedTasks()).filter((t) => t.reviewStatus === "待审核" || t.reviewStatus === "已退回").slice(0, 80);
  $("#review-table").innerHTML = table(["任务", "填报部门", "审核状态", "完成比例", "风险", "最近修改", "审核操作"], rows.map((task) => [
    `${task.code} ${escapeHtml(task.taskName)}`,
    task.leadDepartment,
    tag(task.reviewStatus),
    `${task.progress}%`,
    tag(task.riskLevel, "risk"),
    `${task.updatedAt} / ${task.updatedBy}`,
    canReview(state.user) ? `<button class="primary" data-approve="${task.id}" type="button">通过</button> <button class="danger" data-reject="${task.id}" type="button">退回</button>` : "查看反馈",
  ]));
  $$("[data-approve]").forEach((btn) => btn.addEventListener("click", () => reviewTask(btn.dataset.approve, "已通过")));
  $$("[data-reject]").forEach((btn) => btn.addEventListener("click", () => reviewTask(btn.dataset.reject, "已退回")));
}

function reviewTask(id, status) {
  const task = getTask(id);
  task.reviewStatus = status;
  task.measures.forEach((measure) => {
    if (measure.reviewStatus === "待审核") measure.reviewStatus = status;
  });
  task.updatedAt = now();
  task.updatedBy = state.user.roleName;
  task.updateHistory.unshift({ time: now(), operator: state.user.roleName, action: status === "已通过" ? "审核通过" : "审核退回", note: "战略部门本地模拟审核流程。" });
  state.data.logs.unshift({ time: now(), operator: state.user.roleName, object: task.code, action: task.updateHistory[0].action, note: task.taskName });
  persistData();
  renderReview();
  toast(status === "已通过" ? "审核已通过。" : "审核已退回。");
}

function renderIndicators() {
  $("#indicator-table").innerHTML = table(["所属条线", "指标名称", "责任部门", "2026目标", "当前值", "达成率", "风险状态", "最近填报"], scopedIndicators().map((item) => [
    item.businessLine, item.name, item.department, formatValue(item.target2026), formatValue(item.currentValue), `${item.achievementRate || "-"}%`, tag(item.riskLevel, "risk"), item.updatedAt,
  ]));
}

function renderSystems() {
  const systems = isStrategyRole(state.user) ? state.data.systems : state.data.systems.filter((item) => isTaskRelevantToUser({ leadDepartment: item.leadDepartment, collaboratorDepartments: [], measures: [] }, state.user));
  $("#system-list").innerHTML = systems.map((item) => `<article class="task-card compact-task-card">
    <div class="task-card-head"><span class="tag">${item.id}</span>${tag(item.status, "status")}</div>
    <h3>${escapeHtml(item.name)}</h3><div class="task-meta"><span>牵头部门：${item.leadDepartment}</span><span>完成时间：${item.targetDate}</span></div>
    <div class="progress-line"><div class="progress-text"><span>建设进度</span><strong>${item.progress}%</strong></div><div class="progress"><i style="width:${item.progress}%"></i></div></div>
  </article>`).join("") || emptyState("暂无相关系统建设项目");
}

function renderReports() {
  $("#import-report").textContent = JSON.stringify(state.data.report, null, 2);
}

function exportReport(type) {
  const tasks = isStrategyRole(state.user) ? state.data.tasks : scopedTasks();
  if (type === "tasks") return exportTasks(tasks, "临商银行战略任务台账.csv");
  if (type === "measures") return exportRows(tasks.flatMap((t) => t.measures.map((m) => ({ task: t, ...m }))), "临商银行举措完成情况.csv", ["taskId", "title", "ownerDepartment", "status", "reviewStatus", "progress", "riskLevel", "dueDate"]);
  if (type === "standards") return exportRows(tasks.flatMap((t) => t.completionStandards.map((s) => ({ taskName: t.taskName, ...s }))), "临商银行完成标准达标情况.csv", ["taskId", "taskName", "description", "groupName", "type", "targetValue", "unit", "status", "completionRate"]);
  if (type === "departments") return exportRows(departmentStats(tasks), "临商银行部门任务台账.csv", ["name", "leadTaskCount", "progress", "delta", "overdue", "highRisk", "fillRate", "standardRate"]);
}

function exportTasks(tasks, filename) {
  exportRows(tasks.map((task) => ({
    code: task.code,
    taskName: task.taskName,
    businessSection: task.businessSection,
    leadDepartment: task.leadDepartment,
    collaboratorDepartments: task.collaboratorDepartments.join("、"),
    priority: task.priority,
    status: task.status,
    reviewStatus: task.reviewStatus,
    progress: task.progress,
    measureCount: task.measures.length,
    doneMeasureCount: doneMeasures(task),
    standardCount: task.completionStandards.length,
    doneStandardCount: doneStandards(task),
    riskLevel: task.riskLevel,
    nextDueDate: task.measures.map((m) => m.dueDate).filter(Boolean).sort()[0] || "",
    updatedAt: task.updatedAt,
  })), filename, ["code", "taskName", "businessSection", "leadDepartment", "collaboratorDepartments", "priority", "status", "reviewStatus", "progress", "measureCount", "doneMeasureCount", "standardCount", "doneStandardCount", "riskLevel", "nextDueDate", "updatedAt"]);
}

function exportRows(rows, filename, fields) {
  const csv = [fields.join(","), ...rows.map((row) => fields.map((field) => csvCell(row[field])).join(","))].join("\n");
  downloadBlob(filename, `\ufeff${csv}`, "text/csv;charset=utf-8");
}

function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  file.text().then((text) => {
    const imported = JSON.parse(text);
    if (!imported.tasks || !imported.indicators) throw new Error("JSON 缺少任务或指标数据。");
    state.data = { ...imported, version: STORAGE_VERSION };
    persistData();
    toast("已导入本地演示数据。");
    renderActiveView(location.hash.replace("#", "") || "dashboard");
  }).catch((error) => toast(error.message));
}

async function resetDemo() {
  if (!confirm("确认恢复演示数据？当前浏览器中的本地修改将被清除。")) return;
  localStorage.removeItem(DATA_KEY);
  state.data = persistData(await loadBaseData());
  renderFilters();
  renderActiveView(location.hash.replace("#", "") || "dashboard");
  toast("已恢复项目内置演示数据。");
}

function table(headers, rows) {
  return `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell ?? ""}</td>`).join("")}</tr>`).join("")}</tbody>`;
}

function textarea(name, label, value = "", required = false) {
  return `<label><span>${label}${required ? " *" : ""}</span><textarea name="${name}" maxlength="500" ${required ? "required" : ""}>${escapeHtml(value || "")}</textarea></label>`;
}

function inputField(name, label, value = "", type = "text", attrs = "") {
  return `<label><span>${label}</span><input name="${name}" type="${type}" value="${escapeHtml(value || "")}" ${attrs}></label>`;
}

function selectField(name, label, options, value) {
  return `<label><span>${label}</span><select name="${name}">${options.map((item) => `<option ${item === value ? "selected" : ""}>${item}</option>`).join("")}</select></label>`;
}

function tag(value, kind = "") {
  return `<span class="tag ${kind ? `${kind}-${value}` : ""}">${value || "-"}</span>`;
}

function emptyState(text) {
  return `<article class="compact-item"><strong>${text}</strong><span>${DEMO_NOTICE}</span></article>`;
}

function getTask(id) { return state.data.tasks.find((task) => task.id === id); }
function getActiveTask() { return getTask(state.activeTaskId); }
function doneMeasures(task) { return task.measures.filter((m) => m.progress >= 100 || m.status === "已完成").length; }
function doneStandards(task) { return task.completionStandards.filter((s) => s.status === "已达标").length; }
function percent(part, total) { return total ? Math.round(part / total * 100) : 0; }
function avg(values) { return values.length ? Math.round(values.reduce((a, b) => a + Number(b || 0), 0) / values.length) : 0; }
function unique(values) { return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN")); }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function now() { return new Date().toLocaleString("zh-CN", { hour12: false }); }
function isDueSoon(month) {
  if (!month) return false;
  const date = new Date(`${month}-28`);
  const diff = (date - TODAY) / 86400000;
  return diff >= 0 && diff <= 90;
}
function isOverdueMonth(month) {
  if (!month) return false;
  const date = new Date(`${month}-28`);
  return !Number.isNaN(date.getTime()) && date < TODAY;
}
function formatValue(value) { return value === "" || value === null || value === undefined ? "-" : value; }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char])); }
function csvCell(value) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }
function downloadJson(filename, data) { downloadBlob(filename, JSON.stringify(data, null, 2), "application/json;charset=utf-8"); }
function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2400);
}

bootstrap().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<main class="login-screen"><section class="login-card"><h1>页面初始化失败</h1><p>${error.message}</p></section></main>`;
});
