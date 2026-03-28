import { OPTIMIZE_KEYWORDS } from "./mock-data";

const HARD = [
  "SQL",
  "Power BI",
  "SAP",
  "Agile",
  "Jira",
  "ERP",
  "data modeling",
  "financial reporting",
  "S/4HANA",
  "BRDs",
];
const SOFT = [
  "stakeholder",
  "communication",
  "leadership",
  "collaboration",
  "negotiation",
  "presentation",
  "adaptability",
];

export function scoreOptimizeAts(cv: string, jd: string): number {
  const text = `${cv}\n${jd}`.toLowerCase();
  let hits = 0;
  for (const k of OPTIMIZE_KEYWORDS) {
    if (text.includes(k.toLowerCase())) hits += 1;
  }
  const len = Math.min(cv.length / 400, 18);
  return Math.min(99, Math.round(38 + hits * 7 + len));
}

function stripToken(t: string) {
  return t.replace(/^[("'`]+|[.,;:!?)]+$/g, "").toLowerCase();
}

export function classifyToken(token: string): "hard" | "soft" | null {
  const t = stripToken(token);
  if (!t) return null;
  if (HARD.some((h) => t.includes(h.toLowerCase()))) return "hard";
  if (SOFT.some((s) => t.includes(s.toLowerCase()))) return "soft";
  return null;
}
