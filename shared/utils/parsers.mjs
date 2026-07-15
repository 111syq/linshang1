const numberPrefix = /^(?:\s*(?:\d+[\.\、．)]|[（(]\d+[）)]|[一二三四五六七八九十]+[、.．]))\s*/;

export function splitNumberedText(text = "") {
  const source = String(text || "").replace(/\r/g, "").trim();
  if (!source) return [];
  const lines = source.split("\n").map((line) => line.trim()).filter(Boolean);
  const items = [];

  for (const line of lines) {
    if (numberPrefix.test(line)) {
      const clean = line.replace(numberPrefix, "").trim();
      items.push({ title: firstSentence(clean), description: clean, rawText: line });
    } else if (items.length) {
      const last = items[items.length - 1];
      last.description = `${last.description}\n${line}`.trim();
      last.rawText = `${last.rawText}\n${line}`.trim();
    } else {
      items.push({ title: firstSentence(line), description: line, rawText: line });
    }
  }

  return items.length ? items : [{ title: firstSentence(source), description: source, rawText: source }];
}

export function splitStandardsText(text = "") {
  const source = String(text || "").replace(/\r/g, "").trim();
  if (!source) return [];
  const lines = source.split("\n").map((line) => line.trim()).filter(Boolean);
  const items = [];
  let groupName = "";

  for (const line of lines) {
    if (!numberPrefix.test(line) && /[:：]$/.test(line)) {
      groupName = line.replace(/[:：]$/, "").trim();
      continue;
    }
    if (numberPrefix.test(line)) {
      const clean = line.replace(numberPrefix, "").trim();
      items.push({ groupName, title: firstSentence(clean), description: clean, rawText: line });
    } else if (items.length) {
      const last = items[items.length - 1];
      last.description = `${last.description}\n${line}`.trim();
      last.rawText = `${last.rawText}\n${line}`.trim();
    } else {
      items.push({ groupName, title: firstSentence(line), description: line, rawText: line });
    }
  }

  return items.length ? items : [{ groupName, title: firstSentence(source), description: source, rawText: source }];
}

export function inferStandardType(text = "") {
  const value = String(text);
  if (/[0-9０-９]+(?:\.\d+)?\s*(亿元|万元|户|%|％|条|个|项|人|万户)/.test(value)) return "定量指标";
  if (/制度|机制|办法|规则|方案|流程|政策/.test(value)) return "制度或方案";
  if (/上线|系统|平台/.test(value)) return "系统上线";
  if (/产品|服务体系|产品体系/.test(value)) return "产品上线";
  if (/团队|人员|岗位|人才|队伍/.test(value)) return "队伍建设";
  if (/覆盖|全覆盖|落地|推广/.test(value)) return "业务覆盖";
  if (/20\d{2}[.年-]\d{1,2}|阶段|年度/.test(value)) return "里程碑";
  return "其他";
}

export function extractTargetMeta(text = "") {
  const value = String(text);
  const dateMatch = value.match(/20\d{2}[.年-]\d{1,2}/);
  const numberMatch = value.match(/([0-9]+(?:\.[0-9]+)?)\s*(亿元|万元|万户|户|%|％|条|个|项|人)?/);
  return {
    targetDate: dateMatch ? normalizeMonth(dateMatch[0]) : "",
    targetValue: numberMatch ? Number(numberMatch[1]) : "",
    unit: numberMatch?.[2] || "",
  };
}

export function normalizeMonth(input) {
  if (input === null || input === undefined || input === "") return "";
  const raw = String(input).trim().replace("年", ".").replace("-", ".").replace("月", "");
  const match = raw.match(/(20\d{2})[.](\d{1,2})/);
  if (!match) return raw;
  return `${match[1]}-${match[2].padStart(2, "0")}`;
}

function firstSentence(text = "") {
  const clean = String(text || "").trim();
  const end = clean.search(/[。；;]\s*/);
  const first = end > 0 ? clean.slice(0, end + 1) : clean;
  return first.length > 42 ? `${first.slice(0, 42)}...` : first;
}
