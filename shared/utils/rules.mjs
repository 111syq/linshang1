import { RISK_LEVELS, TASK_STATUSES } from "../constants/enums.mjs";

export function calculateTaskProgress(measures = []) {
  if (!measures.length) return 0;
  const rawWeight = measures.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  const useEqualWeight = rawWeight <= 0;
  const weighted = measures.reduce((sum, item) => {
    const weight = useEqualWeight ? 100 / measures.length : Number(item.weight || 0);
    return sum + Number(item.progress || 0) * weight;
  }, 0);
  return Math.round(weighted / (useEqualWeight ? 100 : rawWeight));
}

export function measureWeightWarning(measures = []) {
  if (!measures.length) return "";
  const total = measures.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  if (total === 0) return "";
  return Math.round(total) === 100 ? "" : `当前举措权重合计为 ${Math.round(total)}%，建议调整为 100%。`;
}

export function deriveTaskStatus(task, today = new Date()) {
  const measures = task.measures || [];
  const mandatoryStandards = (task.completionStandards || []).filter((item) => item.mandatory !== false);
  const allMeasuresDone = measures.length > 0 && measures.every((item) => Number(item.progress || 0) >= 100 || item.status === "已完成");
  const allStandardsDone = mandatoryStandards.length === 0 || mandatoryStandards.every((item) => item.status === "已达标");
  const end = task.endDate ? new Date(task.endDate) : null;
  if (task.status === "已暂停") return "已暂停";
  if (allMeasuresDone && allStandardsDone) return "已完成";
  if (allMeasuresDone && !allStandardsDone) return "待验收";
  if (end && !Number.isNaN(end.getTime()) && end < today) return "已逾期";
  return TASK_STATUSES.includes(task.status) ? task.status : "进行中";
}

export function deriveRisk(task) {
  const measureRisks = (task.measures || []).map((item) => item.riskLevel).filter(Boolean);
  const levels = [task.riskLevel, ...measureRisks].filter(Boolean);
  return levels.sort((a, b) => RISK_LEVELS.indexOf(b) - RISK_LEVELS.indexOf(a))[0] || "无风险";
}

export function isStrategyRole(user) {
  return user?.roleCode === "strategy" || user?.roleName === "战略部门" || user?.role === "战略部门";
}

export function isDepartmentRole(user) {
  return Boolean(user) && !isStrategyRole(user);
}

export function canViewAllTasks(user) {
  return isStrategyRole(user);
}

export function canViewDepartmentDashboard(user) {
  return isDepartmentRole(user);
}

export function roleDepartments(user) {
  return Array.isArray(user?.departments) && user.departments.length ? user.departments : [user?.department].filter(Boolean);
}

export function departmentMatches(value = "", user) {
  if (isStrategyRole(user)) return true;
  const text = String(value || "");
  return roleDepartments(user).some((dept) => text.includes(dept) || dept.includes(text));
}

export function isTaskRelevantToUser(task, user) {
  if (!user) return false;
  if (isStrategyRole(user)) return true;
  const depts = [
    task.leadDepartment,
    ...(task.collaboratorDepartments || []),
    ...(task.measures || []).flatMap((measure) => [measure.ownerDepartment, ...(measure.collaboratorDepartments || [])]),
  ];
  return depts.some((dept) => departmentMatches(dept, user));
}

export function isIndicatorRelevantToUser(indicator, user) {
  if (!user) return false;
  if (isStrategyRole(user)) return true;
  return departmentMatches(indicator.department, user);
}

export function canEditTask(user, task) {
  if (!user) return false;
  if (isStrategyRole(user)) return false;
  return departmentMatches(task.leadDepartment, user);
}

export function canEditMeasure(user, task, measure) {
  if (!user || isStrategyRole(user)) return false;
  if (canEditTask(user, task)) return true;
  return departmentMatches(measure.ownerDepartment, user) || (measure.collaboratorDepartments || []).some((dept) => departmentMatches(dept, user));
}

export function canReview(user) {
  return isStrategyRole(user);
}

export function canFillTask(user, task) {
  return canEditTask(user, task);
}

export function canFillMeasure(user, task, measure) {
  return canEditMeasure(user, task, measure);
}
