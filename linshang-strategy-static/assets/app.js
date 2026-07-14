const accounts = [
  { id: "strategy", name: "战略部门", department: "战略部门", type: "strategy", desc: "全行战略驾驶舱与统筹管理视角" },
  { id: "company", name: "公司业务部门", department: "公司业务部门", type: "department", desc: "对公战略任务牵头部门" },
  { id: "retail", name: "零售金融部门", department: "零售金融部门", type: "department", desc: "零售与财富管理任务牵头部门" },
  { id: "inclusive", name: "普惠金融部门", department: "普惠金融部门", type: "department", desc: "普惠客群和小微业务任务牵头部门" },
  { id: "market", name: "金融市场部门", department: "金融市场部门", type: "department", desc: "金融市场与同业协同任务部门" },
  { id: "risk", name: "风险合规部门", department: "风险合规部门", type: "department", desc: "风险、合规、内控相关任务部门" },
  { id: "digital", name: "数字科技部门", department: "数字科技部门", type: "department", desc: "数字化和科技建设任务部门" },
  { id: "finance", name: "计划财务部门", department: "计划财务部门", type: "department", desc: "计划、预算、资源配置相关任务部门" },
  { id: "hr", name: "人力资源部门", department: "人力资源部门", type: "department", desc: "组织、人才、绩效相关任务部门" },
  { id: "governance", name: "公司治理与综合管理部门", department: "公司治理与综合管理部门", type: "department", desc: "治理、综合协调和行政保障部门" },
  { id: "audit", name: "监督审计部门", department: "监督审计部门", type: "department", desc: "监督、审计和整改跟踪部门" },
  { id: "branch", name: "分支机构", department: "分支机构", type: "department", desc: "分支机构执行与反馈视角" }
];

const defaultTasks = [
  task("GS.01", "对公客户精细化运营与价值深耕", "公司业务", "公司业务部门", "进行中", "高", "中", "进度滞后", 42, 55, "2026-12-31", "本期未更新", ["数字科技部门", "风险合规部门"], "客户分级分类、精细化管理、强化战略客户维护，提升客户贡献度。", "完善重点客户清单，形成标准化维护机制。"),
  task("GS.02", "对公产品标准化焕新与迭代提速", "公司业务", "公司业务部门", "进行中", "中", "低", "正常", 48, 45, "2027-06-30", "草稿", ["数字科技部门"], "建立标准化产品体系，提升产品迭代效率。", "推进产品目录、准入规则和运营看板建设。"),
  task("GS.03", "投行业务综合赋能", "公司业务", "公司业务部门", "待启动", "中", "中", "临期", 8, 25, "2026-08-20", "本期未更新", ["金融市场部门"], "提升投行业务综合服务能力，完善重点项目储备。", "建立重点客户项目池和过程跟踪机制。"),
  task("RF.01", "零售客户分层经营体系建设", "零售金融", "零售金融部门", "进行中", "高", "低", "正常", 58, 50, "2027-03-31", "已提交", ["数字科技部门"], "构建零售客户标签、分层、触达、转化闭环。", "扩大试点客群并优化触达策略。"),
  task("RF.02", "财富管理能力提升", "零售金融", "零售金融部门", "进行中", "中", "中", "进度滞后", 34, 52, "2026-11-30", "已退回", ["风险合规部门"], "完善财富产品体系和客户陪伴机制。", "补充风险揭示材料，完善产品适配流程。"),
  task("PH.01", "普惠客群批量获客与场景经营", "普惠金融", "普惠金融部门", "进行中", "高", "中", "正常", 46, 44, "2026-12-31", "已提交", ["分支机构", "数字科技部门"], "提升小微客户覆盖和场景化经营能力。", "推进重点商圈和园区名单确认。"),
  task("FM.01", "金融市场业务协同服务提升", "金融市场", "金融市场部门", "待启动", "中", "低", "正常", 12, 18, "2027-03-31", "本期未更新", ["公司业务部门"], "强化金融市场业务对客户综合服务的支撑。", "完善协同服务清单。"),
  task("RK.01", "全面风险预警机制完善", "风险合规", "风险合规部门", "进行中", "高", "高", "逾期", 28, 70, "2026-06-30", "本期未更新", ["公司业务部门", "数字科技部门"], "完善重点业务风险监测、预警和闭环处置机制。", "补齐预警指标口径并明确闭环责任。"),
  task("DT.01", "数字渠道体验升级", "数字科技", "数字科技部门", "进行中", "高", "低", "正常", 63, 60, "2026-10-31", "审核通过", ["零售金融部门", "公司业务部门"], "提升手机银行、线上运营和数据触达能力。", "推进关键旅程体验优化和数据看板上线。"),
  task("DT.02", "战略执行管理平台建设", "数字科技", "数字科技部门", "进行中", "高", "中", "正常", 51, 50, "2026-12-31", "已提交", ["战略部门"], "建设战略任务、指标、项目和风险一体化管理平台。", "完善权限、报表和驾驶舱展示。"),
  task("FN.01", "资源配置与预算联动机制优化", "计划财务", "计划财务部门", "进行中", "中", "低", "正常", 44, 42, "2027-06-30", "草稿", ["战略部门"], "推动战略任务、预算资源和经营计划联动。", "形成资源配置规则建议稿。"),
  task("HR.01", "战略人才梯队建设", "人力资源", "人力资源部门", "进行中", "中", "中", "临期", 30, 46, "2026-09-30", "本期未更新", ["分支机构"], "建设关键岗位人才梯队和战略能力提升机制。", "梳理关键岗位和培养对象清单。"),
  task("GV.01", "公司治理与综合协同效率提升", "公司治理", "公司治理与综合管理部门", "进行中", "中", "低", "正常", 40, 38, "2027-01-31", "已提交", ["战略部门"], "完善治理议题、会议督办和综合协调机制。", "推进督办事项闭环展示。"),
  task("AU.01", "战略执行监督审计机制建设", "监督审计", "监督审计部门", "待启动", "中", "低", "正常", 6, 12, "2027-06-30", "本期未更新", ["风险合规部门"], "建立战略执行过程监督、审计和整改跟踪机制。", "制定年度监督审计重点。"),
  task("BR.01", "分支机构战略任务落地反馈机制", "分支机构", "分支机构", "进行中", "高", "中", "进度滞后", 32, 55, "2026-12-31", "已退回", ["公司业务部门", "零售金融部门"], "推动分支机构承接全行战略任务并形成反馈闭环。", "补充分支机构差异化执行清单。")
];

const kpis = [
  kpi("公司业务", "对公客户贡献度", "公司业务部门", 100, 62, "低于序时进度"),
  kpi("公司业务", "标准化产品覆盖率", "公司业务部门", 85, 41, "严重滞后"),
  kpi("零售金融", "零售活跃客户数", "零售金融部门", 120, 86, "正常推进"),
  kpi("普惠金融", "普惠客户覆盖率", "普惠金融部门", 90, 54, "低于序时进度"),
  kpi("金融市场", "协同服务项目数", "金融市场部门", 60, 31, "低于序时进度"),
  kpi("风险合规", "风险预警闭环率", "风险合规部门", 95, 48, "严重滞后"),
  kpi("数字科技", "线上交易替代率", "数字科技部门", 75, 61, "正常推进"),
  kpi("计划财务", "资源配置联动覆盖率", "计划财务部门", 80, 47, "低于序时进度"),
  kpi("人力资源", "关键岗位梯队覆盖率", "人力资源部门", 85, 39, "严重滞后"),
  kpi("公司治理", "督办事项按期闭环率", "公司治理与综合管理部门", 92, 74, "正常推进"),
  kpi("监督审计", "整改事项闭环率", "监督审计部门", 95, 69, "低于序时进度"),
  kpi("分支机构", "战略任务承接率", "分支机构", 100, 72, "正常推进")
];

let tasks = loadTasks();
let currentUser = null;
const state = { view: "strategy", selectedTaskCode: "GS.01" };
const monthlyCompletion = [
  ["1月", 18],
  ["2月", 24],
  ["3月", 31],
  ["4月", 39],
  ["5月", 46],
  ["6月", 52]
];
const monthlyKpiOpen = [
  ["1月", 15],
  ["2月", 14],
  ["3月", 13],
  ["4月", 11],
  ["5月", 10],
  ["6月", 9]
];
const coordinationIssues = [
  ["数字渠道体验升级", "数字科技部门", "零售金融部门、公司业务部门", "客户旅程数据口径需统一", "本周内确认统一口径"],
  ["普惠客群批量获客与场景经营", "普惠金融部门", "分支机构、数字科技部门", "商圈名单和线上触达规则需协同", "提交协同方案"],
  ["全面风险预警机制完善", "风险合规部门", "公司业务部门、数字科技部门", "预警指标口径与系统取数存在差异", "召开专项协调会"]
];
const decisionIssues = [
  ["财富管理能力提升", "零售金融部门", "产品准入边界和风险揭示材料需决策", "本月经营管理会"],
  ["资源配置与预算联动机制优化", "计划财务部门", "战略项目资源倾斜比例需明确", "预算专题会"],
  ["战略执行管理平台建设", "数字科技部门", "平台二期范围和上线节奏需确认", "战略专题会"]
];
const systemProjects = [
  ["战略执行管理平台一期", "数字科技部门", 68, "进行中", "任务、指标、风险看板已完成联调"],
  ["战略驾驶舱移动端适配", "数字科技部门", 42, "进行中", "移动端指标卡片和审批列表开发中"],
  ["报表导出与留痕模块", "数字科技部门", 35, "临期", "导出模板和操作记录联调中"]
];
const notices = [
  ["公司业务部门", "GS.01 本期未更新", "建议今日内补充二季度进展"],
  ["风险合规部门", "RK.01 逾期且高风险", "请提交风险说明和应对措施"],
  ["人力资源部门", "HR.01 临期", "请补充里程碑完成情况"]
];
const operationLogs = [
  ["2026-07-14 13:20", "战略部门", "RF.02", "退回", "风险揭示材料不完整，退回补充"],
  ["2026-07-14 11:40", "战略部门", "DT.01", "审核通过", "本期成果材料完整"],
  ["2026-07-13 17:05", "公司业务部门", "GS.02", "修改", "更新下一阶段计划"],
  ["2026-07-13 15:32", "战略部门", "全行任务清单", "导出", "导出当前筛选结果"]
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function task(code, name, line, department, status, priority, risk, health, progress, plan, due, reportStatus, collaborators, objective, next) {
  return {
    code,
    name,
    line,
    department,
    status,
    priority,
    risk,
    health,
    progress,
    plan,
    due,
    reportStatus,
    collaborators,
    objective,
    next,
    milestones: ["阶段目标确认", "任务推进实施", "成果验收归档"]
  };
}

function kpi(line, name, department, target, actual, status) {
  const unit = name.includes("客户") ? "万户" : name.includes("项目") ? "项" : "%";
  const sequenceTarget = Math.round(target * 0.62);
  const delta = actual - sequenceTarget;
  const change = status === "正常推进" ? "+4" : status === "低于序时进度" ? "-2" : "-6";
  return {
    line,
    name,
    department,
    target,
    actual,
    status,
    unit,
    sequenceTarget,
    delta,
    change,
    asOf: "2026-06-30",
    lastReport: "2026-07-05 17:30"
  };
}

function loadTasks() {
  const saved = localStorage.getItem("linshang-static-tasks");
  return saved ? JSON.parse(saved) : structuredClone(defaultTasks);
}

function saveTasks() {
  localStorage.setItem("linshang-static-tasks", JSON.stringify(tasks));
}

function rate(item) {
  return Math.round((item.actual / item.target) * 100);
}

function statusClass(value) {
  if (["已完成", "审核通过", "正常", "低", "正常推进"].includes(value)) return "green";
  if (["进行中", "已提交"].includes(value)) return "blue";
  if (["中", "临期", "草稿", "低于序时进度"].includes(value)) return "orange";
  if (["高", "逾期", "已退回", "严重滞后", "进度滞后"].includes(value)) return "red";
  return "";
}

function statusPill(value) {
  return `<span class="status ${statusClass(value)}">${value}</span>`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function departmentRows() {
  return accounts
    .filter((item) => item.type === "department")
    .map((account) => {
      const owned = tasks.filter((taskItem) => taskItem.department === account.department);
      const reported = owned.filter((taskItem) => taskItem.reportStatus !== "本期未更新").length;
      const average = owned.length ? Math.round(owned.reduce((sum, item) => sum + item.progress, 0) / owned.length) : 0;
      return {
        name: account.department,
        owned: owned.length,
        completed: owned.filter((item) => item.status === "已完成").length,
        average,
        reportRate: owned.length ? Math.round((reported / owned.length) * 100) : 0,
        unreported: owned.filter((item) => item.reportStatus === "本期未更新").length,
        returned: owned.filter((item) => item.reportStatus === "已退回").length,
        overdue: owned.filter((item) => item.health === "逾期").length,
        highRisk: owned.filter((item) => item.risk === "高").length,
        incompleteKpi: kpis.filter((item) => item.department === account.department && rate(item) < 100).length
      };
    });
}

function initLogin() {
  $("#login-account").innerHTML = accounts.map((item) => `<option value="${item.id}">${item.name}</option>`).join("");
  $("#account-list").innerHTML = accounts
    .map((item) => `<button type="button" class="account-button" data-account="${item.id}"><strong>${item.name}</strong><span>${item.desc}</span></button>`)
    .join("");
  $("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    login($("#login-account").value);
  });
  $("#account-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-account]");
    if (!button) return;
    $("#login-account").value = button.dataset.account;
    login(button.dataset.account);
  });
}

function login(accountId) {
  currentUser = accounts.find((item) => item.id === accountId) || accounts[0];
  $("#login-screen").classList.add("is-hidden");
  $("#app-shell").classList.remove("is-hidden");
  $("#user-name").textContent = currentUser.name;
  $("#user-meta").textContent = currentUser.type === "strategy" ? "全行战略驾驶舱" : `${currentUser.department}工作台`;
  renderNav();
  renderAll();
  setView(currentUser.type === "strategy" ? "strategy" : "workbench");
}

function logout() {
  currentUser = null;
  $("#app-shell").classList.add("is-hidden");
  $("#login-screen").classList.remove("is-hidden");
  window.location.hash = "";
}

function navForUser() {
  if (!currentUser || currentUser.type === "strategy") {
    return [
      ["strategy", "战略执行驾驶舱"],
      ["tasks", "全部战略任务"],
      ["review", "进度审核"],
      ["fill-monitor", "部门填报监控"],
      ["kpis", "考核指标"],
      ["risk", "风险预警"],
      ["coordination", "待协调事项"],
      ["decision", "待决策事项"],
      ["system-projects", "系统建设项目"],
      ["notices", "通知与催办"],
      ["logs", "操作记录"],
      ["reports", "汇报与导出"]
    ];
  }
  return [
    ["workbench", "部门工作台"],
    ["lead", "由我牵头"],
    ["collaboration", "我的协同任务"],
    ["progress", "进度填报"],
    ["kpis", "相关指标"],
    ["reports", "任务导出"]
  ];
}

function renderNav() {
  $("#main-nav").innerHTML = navForUser()
    .map(([view, label], index) => `<button class="nav-item ${index === 0 ? "active" : ""}" data-view="${view}" type="button">${label}</button>`)
    .join("");
}

function setView(view) {
  if (!currentUser) return;
  if (currentUser.type === "strategy" && ["workbench", "lead", "collaboration", "progress"].includes(view)) view = "strategy";
  if (currentUser.type !== "strategy" && ["strategy", "review", "fill-monitor", "risk", "coordination", "decision", "system-projects", "notices", "logs"].includes(view)) view = "workbench";
  state.view = view;
  $$(".view").forEach((item) => item.classList.toggle("active", item.id === `view-${view}`));
  $$(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  const panel = $(`#view-${view}`);
  $("#page-title").textContent = view === "workbench" ? `${currentUser.department}工作台` : panel.dataset.title;
  $("#page-subtitle").textContent = view === "workbench" ? "查看由我牵头、我的协同任务和进度填报事项" : panel.dataset.subtitle;
  window.location.hash = view;
  renderTasks();
}

function visibleTasks() {
  if (!currentUser || currentUser.type === "strategy") return tasks;
  return tasks.filter((item) => item.department === currentUser.department || item.collaborators.includes(currentUser.department));
}

function leadTasks() {
  if (!currentUser || currentUser.type === "strategy") return [];
  return tasks.filter((item) => item.department === currentUser.department);
}

function collabTasks() {
  if (!currentUser || currentUser.type === "strategy") return [];
  return tasks.filter((item) => item.collaborators.includes(currentUser.department));
}

function renderSummary() {
  const total = tasks.length;
  const reported = tasks.filter((item) => item.reportStatus !== "本期未更新").length;
  const high = tasks.filter((item) => item.priority === "高");
  const averageProgress = Math.round(tasks.reduce((sum, item) => sum + item.progress, 0) / total);
  const cards = [
    ["战略任务总数", total],
    ["总体完成率", `${averageProgress}%`],
    ["高优先级完成率", `${Math.round(high.reduce((sum, item) => sum + item.progress, 0) / high.length)}%`],
    ["本期填报率", `${Math.round((reported / total) * 100)}%`]
  ];
  $("#summary-cards").innerHTML = cards.map(([label, value]) => `<button class="compact-stat" type="button" data-jump="tasks"><small>${label}</small><strong>${value}</strong></button>`).join("");
}

function renderExceptions() {
  const exceptions = [
    ["逾期任务", tasks.filter((item) => item.health === "逾期").length],
    ["进度滞后任务", tasks.filter((item) => item.health === "进度滞后").length],
    ["高风险任务", tasks.filter((item) => item.risk === "高").length],
    ["未完成指标", kpis.filter((item) => item.actual < item.sequenceTarget).length]
  ];
  $("#exception-cards").innerHTML = exceptions.map(([label, value], index) => `<button class="exception-card ${value ? (index === 0 || index === 2 ? "danger" : "warning") : ""}" type="button" data-jump="${label.includes("指标") ? "kpis" : "risk"}"><span>${label}</span><strong>${value}</strong></button>`).join("");
}

function renderKpis() {
  const sorted = [...kpis].sort((a, b) => a.delta - b.delta);
  const expandedRows = sorted.map((item) => `<tr><td>${item.name}</td><td>${item.unit}</td><td>${item.department}</td><td>${item.asOf}</td><td>${item.sequenceTarget}</td><td>${item.actual}</td><td>${item.target}</td><td>${item.delta}</td><td>${rate(item)}%</td><td>${item.change}</td><td>${statusPill(item.status)}</td><td>${item.lastReport}</td></tr>`).join("");
  const simpleRows = sorted
    .filter((item) => currentUser?.type === "strategy" || item.department === currentUser.department)
    .map((item) => `<tr><td>${item.line}</td><td>${item.name}</td><td>${item.department}</td><td>${item.target}</td><td>${item.actual}</td><td>${rate(item)}%</td><td>${statusPill(item.status)}</td></tr>`)
    .join("");
  $("#kpi-rank").innerHTML = expandedRows;
  $("#kpi-table").innerHTML = simpleRows;
}

function taskCard(item, compact = false) {
  const canFill = currentUser?.type !== "strategy";
  return `
    <article class="task-card">
      <div class="task-card-head">
        <div>
          <div class="task-code">${item.code}</div>
          <div class="task-title">${item.name}</div>
          <div class="task-meta">${item.line} · ${item.department} · 协同：${item.collaborators.join("、") || "-"}</div>
        </div>
        <div>${statusPill(item.health)}</div>
      </div>
      <p class="task-meta">${item.objective}</p>
      <div class="progress-line">
        <div class="track"><div class="bar" style="width:${item.progress}%"></div></div>
        <strong>${item.progress}% / 计划 ${item.plan}%</strong>
      </div>
      ${compact ? "" : `<div class="task-meta">填报状态：${statusPill(item.reportStatus)}　截止：${item.due}</div>`}
      <div class="task-actions">
        <button class="ghost-button" type="button" data-detail="${item.code}">查看</button>
        <button class="ghost-button" type="button" data-edit="${item.code}">编辑</button>
        <button class="secondary-button" type="button" data-export-task="${item.code}">导出</button>
        ${canFill ? `<button class="primary-button" type="button" data-progress="${item.code}">填报进度</button>` : ""}
      </div>
    </article>
  `;
}

function renderTasks() {
  const keyword = $("#task-search").value.trim();
  const status = $("#task-status").value;
  const risk = $("#task-risk").value;
  const filtered = visibleTasks().filter((item) => {
    const keywordHit = !keyword || [item.code, item.name, item.department, item.line].some((text) => text.includes(keyword));
    return keywordHit && (!status || item.status === status) && (!risk || item.risk === risk);
  });
  $("#task-list").innerHTML = filtered.map((item) => taskCard(item)).join("") || `<section class="panel">没有符合条件的任务。</section>`;
}

function renderWorkbench() {
  if (!currentUser || currentUser.type === "strategy") return;
  const lead = leadTasks();
  const collab = collabTasks();
  const stats = [
    ["本部门牵头任务", lead.length],
    ["我的协同任务", collab.length],
    ["待启动", lead.filter((item) => item.status === "待启动").length],
    ["进行中", lead.filter((item) => item.status === "进行中").length],
    ["本周期需更新", lead.filter((item) => item.reportStatus === "本期未更新").length],
    ["草稿", lead.filter((item) => item.reportStatus === "草稿").length],
    ["已提交", lead.filter((item) => item.reportStatus === "已提交").length],
    ["被退回", lead.filter((item) => item.reportStatus === "已退回").length]
  ];
  $("#department-cards").innerHTML = stats.map(([label, value]) => `<div class="compact-stat"><small>${label}</small><strong>${value}</strong></div>`).join("");
  $("#lead-count-label").textContent = `${lead.length} 项`;
  $("#collab-count-label").textContent = `${collab.length} 项`;
  $("#lead-task-list").innerHTML = lead.map((item) => taskCard(item)).join("") || `<p class="empty-text">当前部门暂无牵头任务。</p>`;
  $("#collab-task-list").innerHTML = collab.map((item) => taskCard(item, true)).join("") || `<p class="empty-text">当前部门暂无协同任务。</p>`;
  $("#lead-page-list").innerHTML = lead.map((item) => taskCard(item)).join("") || `<section class="panel">当前部门暂无牵头任务。</section>`;
  $("#collaboration-page-list").innerHTML = collab.map((item) => taskCard(item)).join("") || `<section class="panel">当前部门暂无协同任务。</section>`;
}

function renderKeyTasks() {
  const keyTasks = tasks.filter((item) => item.priority === "高" || item.health !== "正常").slice(0, 8);
  $("#key-task-list").innerHTML = keyTasks.map((item) => taskCard(item, true)).join("");
}

function renderDepartments() {
  $("#department-table").innerHTML = departmentRows().map((item) => `<tr><td>${item.name}</td><td>${item.owned}</td><td>${item.completed}</td><td>${item.average}%</td><td>${item.overdue}</td><td>${item.highRisk}</td><td>${item.reportRate}%</td><td>${item.returned}</td><td>${item.incompleteKpi}</td></tr>`).join("");
}

function renderTrends() {
  const values = [
    ["任务总体完成率", Math.round(tasks.reduce((sum, item) => sum + item.progress, 0) / tasks.length)],
    ["KPI平均达成率", Math.round(kpis.reduce((sum, item) => sum + rate(item), 0) / kpis.length)],
    ["部门填报率", Math.round((tasks.filter((item) => item.reportStatus !== "本期未更新").length / tasks.length) * 100)],
    ["逾期任务控制率", 86]
  ];
  $("#trend-list").innerHTML = values.map(([label, value]) => `<div class="trend-row"><div class="trend-label"><span>${label}</span><span>${value}%</span></div><div class="track"><div class="bar" style="width:${value}%"></div></div></div>`).join("");
}

function renderCharts() {
  $("#completion-trend").innerHTML = monthlyCompletion.map(([label, value]) => `<div class="chart-bar"><div class="chart-column" style="height:${value}%"></div><strong>${value}%</strong><span>${label}</span></div>`).join("");
  const maxKpi = Math.max(...monthlyKpiOpen.map((item) => item[1]));
  $("#kpi-trend").innerHTML = monthlyKpiOpen.map(([label, value]) => `<div class="chart-bar"><div class="chart-column warning" style="height:${Math.round((value / maxKpi) * 100)}%"></div><strong>${value}</strong><span>${label}</span></div>`).join("");
  $("#department-compare").innerHTML = departmentRows().map((item) => `
    <div class="compare-row">
      <strong>${item.name}</strong>
      <div class="compare-bars">
        <div><span>完成率 ${item.average}%</span><div class="track"><div class="bar" style="width:${item.average}%"></div></div></div>
        <div><span>填报率 ${item.reportRate}%</span><div class="track"><div class="bar muted-bar" style="width:${item.reportRate}%"></div></div></div>
      </div>
    </div>
  `).join("");
}

function renderStrategyManagement() {
  const rows = departmentRows();
  const submittedTasks = tasks.filter((item) => ["已提交", "已退回", "审核通过"].includes(item.reportStatus));
  $("#review-table").innerHTML = submittedTasks.map((item) => `<tr><td>${item.code} ${item.name}</td><td>${item.department}</td><td>${statusPill(item.reportStatus)}</td><td>${item.progress}%</td><td>${item.risk}风险</td><td><button class="ghost-button" type="button" data-detail="${item.code}">查看</button> <button class="secondary-button" type="button" data-approve="${item.code}">通过</button> <button class="ghost-button" type="button" data-return="${item.code}">退回</button></td></tr>`).join("");
  const fillCards = [
    ["应填报部门", rows.length],
    ["未填部门", rows.filter((item) => item.unreported > 0).length],
    ["被退回部门", rows.filter((item) => item.returned > 0).length],
    ["平均填报率", `${Math.round(rows.reduce((sum, item) => sum + item.reportRate, 0) / rows.length)}%`]
  ];
  $("#fill-monitor-cards").innerHTML = fillCards.map(([label, value]) => `<div class="compact-stat"><small>${label}</small><strong>${value}</strong></div>`).join("");
  $("#fill-monitor-table").innerHTML = rows.map((item) => `<tr><td>${item.name}</td><td>${item.owned}</td><td>${item.owned - item.unreported}</td><td>${item.unreported}</td><td>${item.returned}</td><td>${item.reportRate}%</td></tr>`).join("");
  const riskTasks = tasks.filter((item) => item.health !== "正常" || item.risk === "高");
  $("#risk-task-list").innerHTML = riskTasks.map((item) => taskCard(item)).join("");
  $("#coordination-list").innerHTML = coordinationIssues.map(([taskName, lead, departments, issue, action]) => issueCard(taskName, lead, departments, issue, action)).join("");
  $("#decision-list").innerHTML = decisionIssues.map(([taskName, department, issue, meeting]) => issueCard(taskName, department, "战略部门", issue, `建议提交：${meeting}`)).join("");
  $("#system-project-list").innerHTML = systemProjects.map(([name, department, progress, health, note]) => `
    <article class="task-card">
      <div class="task-card-head"><div><div class="task-code">${department}</div><div class="task-title">${name}</div><div class="task-meta">${note}</div></div>${statusPill(health)}</div>
      <div class="progress-line"><div class="track"><div class="bar" style="width:${progress}%"></div></div><strong>${progress}%</strong></div>
    </article>
  `).join("");
  $("#notice-list").innerHTML = notices.map(([department, subject, content]) => issueCard(subject, department, "系统催办", content, "发送催办")).join("");
  $("#operation-log-table").innerHTML = operationLogs.map((item) => `<tr><td>${item[0]}</td><td>${item[1]}</td><td>${item[2]}</td><td>${item[3]}</td><td>${item[4]}</td></tr>`).join("");
}

function issueCard(title, lead, departments, issue, action) {
  return `
    <article class="issue-card">
      <div>
        <div class="task-title">${title}</div>
        <div class="task-meta">牵头：${lead} · 相关方：${departments}</div>
      </div>
      <p>${issue}</p>
      <button class="secondary-button" type="button" data-notice="${title}">${action}</button>
    </article>
  `;
}

function renderProgress() {
  const item = tasks.find((taskItem) => taskItem.code === state.selectedTaskCode) || visibleTasks()[0] || tasks[0];
  const report = item.progressReport || {};
  state.selectedTaskCode = item.code;
  $("#progress-summary").innerHTML = [
    ["任务编号", item.code],
    ["任务名称", item.name],
    ["牵头部门", item.department],
    ["当前状态", item.status],
    ["当前完成比例", `${item.progress}%`],
    ["计划完成比例", `${item.plan}%`],
    ["当前风险", `${item.risk} · ${item.health}`],
    ["填报周期", "2026年三季度"]
  ].map(([label, value]) => `<div class="field"><small>${label}</small><strong>${value}</strong></div>`).join("");
  $("#milestone-list").innerHTML = item.milestones.map((text, index) => `<label class="milestone-card"><span>${text}</span><input type="checkbox" ${index === 0 ? "checked" : ""} /> 本期完成</label>`).join("");
  $("#progress-percent").value = item.progress;
  $("#percent-label").textContent = `${item.progress}%`;
  $("#progress-form").currentCompletion.value = item.objective;
  $("#progress-form").keyAchievements.value = report.keyAchievements || "形成阶段性推进台账，完成关键事项确认。";
  $("#progress-form").completedWork.value = report.completedWork || "已完成任务拆解、责任确认和阶段性材料整理。";
  $("#progress-form").nextPlan.value = item.next;
  $("#progress-form").expectedDate.value = report.expectedDate || item.due;
  $("#progress-form").issues.value = report.issues || (item.health === "正常" ? "暂无重大问题。" : "需关注进度偏差和协同反馈时效。");
  $("#progress-form").riskLevel.value = item.risk;
  $("#progress-form").riskDescription.value = report.riskDescription || `${item.risk}风险，当前状态为${item.health}。`;
  $("#progress-form").mitigation.value = report.mitigation || "明确责任人和时间表，按周跟踪关键节点。";
  $("#progress-form").coordinationNeeds.value = report.coordinationNeeds || (item.collaborators.length ? `需${item.collaborators.join("、")}协同确认。` : "暂无需协调事项。");
  $("#progress-form").decisionNeeds.value = report.decisionNeeds || "暂无需提交决策事项。";
}

function renderAll() {
  renderSummary();
  renderExceptions();
  renderKpis();
  renderTasks();
  renderWorkbench();
  renderKeyTasks();
  renderDepartments();
  renderTrends();
  renderCharts();
  renderStrategyManagement();
  renderProgress();
}

function openDetail(code) {
  const item = tasks.find((taskItem) => taskItem.code === code);
  if (!item) return;
  $("#dialog-title").textContent = `${item.code} · ${item.name}`;
  $("#dialog-body").innerHTML = `
    <p><strong>业务板块：</strong>${item.line}</p>
    <p><strong>牵头部门：</strong>${item.department}</p>
    <p><strong>协同部门：</strong>${item.collaborators.join("、") || "-"}</p>
    <p><strong>任务目标：</strong>${item.objective}</p>
    <p><strong>下一步计划：</strong>${item.next}</p>
    <p><strong>风险状态：</strong>${item.risk}风险 · ${item.health}</p>
  `;
  $("#detail-dialog").showModal();
}

function openEdit(code) {
  const item = tasks.find((taskItem) => taskItem.code === code);
  if (!item) return;
  const form = $("#edit-form");
  form.code.value = item.code;
  form.name.value = item.name;
  form.status.value = item.status;
  form.progress.value = item.progress;
  form.risk.value = item.risk;
  form.next.value = item.next;
  $("#edit-dialog").showModal();
}

function exportTask(code) {
  const item = tasks.find((taskItem) => taskItem.code === code);
  if (!item) return;
  downloadJson(`${item.code}-任务卡.json`, item);
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  $("#logout-button").addEventListener("click", logout);
  $("#notice-button").addEventListener("click", () => showToast("当前共有3项临期/逾期事项需要关注"));
  $("#period-select").addEventListener("change", (event) => {
    $("#current-period").textContent = event.target.value;
    showToast(`已切换到${event.target.value}`);
  });
  $("#refresh-data").addEventListener("click", () => {
    const now = new Date();
    const text = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    $("#refresh-time").textContent = text;
    showToast("驾驶舱数据已刷新");
  });
  $("#export-page").addEventListener("click", () => downloadJson("当前页数据.json", { view: state.view, user: currentUser, tasks: visibleTasks(), kpis }));
  $("#download-json").addEventListener("click", () => downloadJson("临商银行战略任务静态数据.json", { tasks, kpis, departments: departmentRows() }));
  $("#close-dialog").addEventListener("click", () => $("#detail-dialog").close());
  $("#close-edit").addEventListener("click", () => $("#edit-dialog").close());
  $("#main-nav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (button) setView(button.dataset.view);
  });
  document.body.addEventListener("click", (event) => {
    const detail = event.target.closest("[data-detail]");
    const edit = event.target.closest("[data-edit]");
    const exportButton = event.target.closest("[data-export-task]");
    const progress = event.target.closest("[data-progress]");
    const jump = event.target.closest("[data-jump]");
    const approve = event.target.closest("[data-approve]");
    const returnButton = event.target.closest("[data-return]");
    const notice = event.target.closest("[data-notice]");
    if (detail) openDetail(detail.dataset.detail);
    if (edit) openEdit(edit.dataset.edit);
    if (exportButton) exportTask(exportButton.dataset.exportTask);
    if (progress) {
      state.selectedTaskCode = progress.dataset.progress;
      renderProgress();
      setView("progress");
    }
    if (jump) setView(jump.dataset.jump);
    if (approve) updateReviewStatus(approve.dataset.approve, "审核通过");
    if (returnButton) updateReviewStatus(returnButton.dataset.return, "已退回");
    if (notice) showToast(`已生成催办：${notice.dataset.notice}`);
  });
  ["task-search", "task-status", "task-risk"].forEach((id) => $(`#${id}`).addEventListener("input", renderTasks));
  $("#clear-filter").addEventListener("click", () => {
    $("#task-search").value = "";
    $("#task-status").value = "";
    $("#task-risk").value = "";
    renderTasks();
  });
  $("#progress-percent").addEventListener("input", (event) => {
    $("#percent-label").textContent = `${event.target.value}%`;
  });
  $("#progress-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const item = tasks.find((taskItem) => taskItem.code === state.selectedTaskCode);
    if (!item) return;
    item.progress = Number($("#progress-percent").value);
    item.reportStatus = event.submitter.dataset.action === "submit" ? "已提交" : "草稿";
    item.risk = $("#progress-form").riskLevel.value;
    item.next = $("#progress-form").nextPlan.value;
    item.due = $("#progress-form").expectedDate.value;
    item.progressReport = {
      currentCompletion: $("#progress-form").currentCompletion.value,
      keyAchievements: $("#progress-form").keyAchievements.value,
      completedWork: $("#progress-form").completedWork.value,
      nextPlan: $("#progress-form").nextPlan.value,
      expectedDate: $("#progress-form").expectedDate.value,
      issues: $("#progress-form").issues.value,
      riskLevel: $("#progress-form").riskLevel.value,
      riskDescription: $("#progress-form").riskDescription.value,
      mitigation: $("#progress-form").mitigation.value,
      coordinationNeeds: $("#progress-form").coordinationNeeds.value,
      decisionNeeds: $("#progress-form").decisionNeeds.value,
      attachments: [...$("#progress-form").attachments.files].map((file) => file.name)
    };
    saveTasks();
    renderAll();
    showToast(event.submitter.dataset.action === "submit" ? "已提交审核" : "草稿已保存");
  });
  $("#edit-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const item = tasks.find((taskItem) => taskItem.code === form.code.value);
    if (!item) return;
    item.name = form.name.value;
    item.status = form.status.value;
    item.progress = Number(form.progress.value);
    item.risk = form.risk.value;
    item.next = form.next.value;
    saveTasks();
    renderAll();
    $("#edit-dialog").close();
    showToast("任务卡已更新");
  });
}

function updateReviewStatus(code, status) {
  const item = tasks.find((taskItem) => taskItem.code === code);
  if (!item) return;
  item.reportStatus = status;
  operationLogs.unshift([
    $("#refresh-time").textContent,
    "战略部门",
    code,
    status,
    status === "审核通过" ? "本期填报已审核通过" : "填报内容需补充完善"
  ]);
  saveTasks();
  renderAll();
  showToast(`${code} 已${status}`);
}

function init() {
  initLogin();
  bindEvents();
}

init();
