import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ROLES } from "../shared/constants/enums.mjs";
import { splitNumberedText, splitStandardsText, extractTargetMeta } from "../shared/utils/parsers.mjs";
import { calculateTaskProgress, canEditMeasure, canEditTask, canFillMeasure, canFillTask, canReview, deriveTaskStatus, isDepartmentRole, isStrategyRole, measureWeightWarning } from "../shared/utils/rules.mjs";

const tasks = JSON.parse(readFileSync(new URL("../public/data/tasks.json", import.meta.url), "utf-8"));
const report = JSON.parse(readFileSync(new URL("../public/data/import-report.json", import.meta.url), "utf-8"));

const parsed = splitNumberedText("1、第一项\n补充说明\n2. 第二项");
assert.equal(parsed.length, 2, "多编号举措应拆成两项");
assert.match(parsed[0].description, /补充说明/, "同一编号下多行应合并");
assert.equal(splitNumberedText("无编号的一整段内容").length, 1, "无编号文本应整体保留");
const grouped = splitStandardsText("票据中心：\n1. 票据规模112亿元（2030.12）");
assert.equal(grouped[0].groupName, "票据中心", "完成标准分组不能被误识别成普通标准");

const meta = extractTargetMeta("完成贷款规模1114亿元（2030.12）");
assert.equal(meta.targetValue, 1114, "应识别目标值");
assert.equal(meta.unit, "亿元", "应识别单位");
assert.equal(meta.targetDate, "2030-12", "应识别目标日期");

assert.equal(calculateTaskProgress([{ progress: 50, weight: 40 }, { progress: 100, weight: 60 }]), 80, "加权进度计算错误");
assert.equal(calculateTaskProgress([{ progress: 50 }, { progress: 100 }]), 75, "等权进度计算错误");
assert.ok(measureWeightWarning([{ weight: 30 }, { weight: 30 }]).includes("60%"), "权重不足 100% 应提示");

assert.equal(deriveTaskStatus({
  status: "进行中",
  endDate: "2030-12",
  measures: [{ progress: 100, status: "已完成" }],
  completionStandards: [{ mandatory: true, status: "待确认" }],
}, new Date("2026-07-15")), "待验收", "举措完成但必达标准未达标应为待验收");

assert.equal(deriveTaskStatus({
  status: "进行中",
  endDate: "2026-01",
  measures: [{ progress: 50, status: "进行中" }],
  completionStandards: [{ mandatory: true, status: "进行中" }],
}, new Date("2026-07-15")), "已逾期", "超过截止日期且未完成应逾期");

assert.equal(canReview(ROLES.find((role) => role.account === "strategy")), true, "战略部门应可模拟审核");
assert.equal(isStrategyRole(ROLES.find((role) => role.account === "strategy")), true, "战略部门角色识别失败");
assert.equal(isDepartmentRole(ROLES.find((role) => role.account === "corporate")), true, "业务部门角色识别失败");
assert.equal(canEditMeasure(ROLES.find((role) => role.account === "digital"), { leadDepartment: "公司业务部" }, { ownerDepartment: "公司业务部", collaboratorDepartments: ["数字金融部"] }), true, "协同部门应可编辑分配举措");
assert.equal(canEditTask(ROLES.find((role) => role.account === "strategy"), { leadDepartment: "战略发展部" }), false, "战略部门不得作为任务填报执行人");
assert.equal(canFillTask(ROLES.find((role) => role.account === "strategy"), { leadDepartment: "战略发展部" }), false, "战略部门不得填报任务");
assert.equal(canFillMeasure(ROLES.find((role) => role.account === "strategy"), { leadDepartment: "公司业务部" }, { ownerDepartment: "公司业务部" }), false, "战略部门不得填报举措");
assert.equal(canFillTask(ROLES.find((role) => role.account === "corporate"), { leadDepartment: "公司业务部" }), true, "牵头业务部门应可填报任务");
assert.equal(ROLES.length, 12, "登录角色必须为十二类部门角色");
for (const forbidden of ["管理员", "审核人员", "查看人员", "普通用户", "牵头用户", "协同用户"]) {
  assert.equal(ROLES.some((role) => role.roleName === forbidden || role.role === forbidden), false, `不得展示自创角色：${forbidden}`);
}

assert.equal(report.importedTaskCount, tasks.length, "导入报告任务数应与任务文件一致");
assert.equal(new Set(tasks.map((task) => task.id)).size, tasks.length, "任务 id 不应重复覆盖");
assert.ok(tasks.every((task) => Array.isArray(task.measures) && task.measures.length >= 1), "每个任务至少应保留一项举措");
assert.ok(tasks.every((task) => Array.isArray(task.completionStandards) && task.completionStandards.length >= 1), "每个任务至少应保留一项完成标准");

const expectedCounts = {
  "GS-03": [3, 2],
  "GS-09": [8, 8],
  "GS-01": [1, 5],
  "GS-05": [4, 3],
};
for (const [code, [measureCount, standardCount]] of Object.entries(expectedCounts)) {
  const task = tasks.find((item) => item.code === code);
  assert.ok(task, `${code} 必须存在`);
  assert.equal(task.measures.length, measureCount, `${code} 举措数量应为 ${measureCount}`);
  assert.equal(task.completionStandards.length, standardCount, `${code} 完成标准数量应为 ${standardCount}`);
}
const gs01 = tasks.find((item) => item.code === "GS-01");
assert.ok(gs01.completionStandards.some((item) => item.groupName === "票据中心"), "GS-01 必须保留“票据中心”完成标准分组");

console.log("测试通过：十二角色、解析、进度、状态、权限、典型任务拆解和本地导入数据均符合演示规则。");
