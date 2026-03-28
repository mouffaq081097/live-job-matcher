import type { CvDocumentPayload } from "./cv-document";
import type { SkillCategory, ExperienceEntry } from "./cv-content";

// Common stop words to exclude from description keyword extraction
const STOP_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "her",
  "was", "one", "our", "out", "day", "get", "has", "him", "his", "how",
  "its", "may", "new", "now", "old", "see", "two", "who", "did", "let",
  "put", "say", "she", "too", "use", "with", "this", "that", "have",
  "from", "they", "will", "been", "when", "what", "more", "able", "also",
  "each", "into", "must", "over", "such", "than", "them", "well", "were",
  "your", "work", "team", "role", "year", "years", "experience", "skills",
  "strong", "good", "great", "excellent", "ability", "knowledge", "using",
  "including", "required", "preferred", "plus", "ability",
]);

/**
 * Extracts all keywords from a CV payload (skills, job titles, profile title).
 * Returns lowercased, deduped array.
 */
export function extractCvKeywords(payload: CvDocumentPayload): string[] {
  const keywords = new Set<string>();

  for (const blockId of payload.blockIds) {
    const block = payload.blocks[blockId];
    if (!block?.content) continue;

    if (block.content.type === "skills") {
      const categories = block.content.data as SkillCategory[];
      for (const cat of categories) {
        for (const skill of cat.skills) {
          const s = skill.trim();
          if (s) keywords.add(s.toLowerCase());
        }
      }
    }

    if (block.content.type === "experience") {
      const entries = block.content.data as ExperienceEntry[];
      for (const entry of entries) {
        if (entry.title?.trim()) keywords.add(entry.title.trim().toLowerCase());
      }
    }

    if (block.content.type === "profile") {
      const data = block.content.data as { jobTitle?: string };
      if (data.jobTitle?.trim()) keywords.add(data.jobTitle.trim().toLowerCase());
    }
  }

  return Array.from(keywords);
}

/**
 * Extracts simple keyword tokens from a raw text string.
 * Used as fallback when requirements[] is empty.
 */
function extractTokens(text: string, cap = 40): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];
  // Split on non-alphanumeric (keep hyphens inside words like "full-stack")
  for (const word of text.split(/[^a-zA-Z0-9\-+#.]+/)) {
    const w = word.trim().toLowerCase().replace(/^[-+]+|[-+]+$/g, "");
    if (w.length >= 3 && !STOP_WORDS.has(w) && !seen.has(w)) {
      seen.add(w);
      tokens.push(w);
      if (tokens.length >= cap) break;
    }
  }
  return tokens;
}

/**
 * Checks whether a CV keyword matches a target keyword.
 * Handles "react" ↔ "react.js", "node" ↔ "node.js", etc.
 */
function isMatch(cvKw: string, target: string): boolean {
  const cv = cvKw.toLowerCase();
  const tgt = target.toLowerCase();
  if (cv === tgt) return true;
  // Substring containment in either direction
  if (cv.includes(tgt) || tgt.includes(cv)) return true;
  // Strip common suffixes: .js, .ts, +, #
  const strip = (s: string) => s.replace(/[.+#].*$/, "").replace(/js$/, "").replace(/ts$/, "");
  return strip(cv) === strip(tgt);
}

export interface JobMatchResult {
  score: number;
  matched: string[];
  missing: string[];
}

/**
 * Compares CV keywords against a job's requirements or description.
 * Returns a 0–100 score + matched/missing arrays (using original casing from target).
 */
export function calculateJobMatch(
  cvKeywords: string[],
  jobRequirements: string[],
  jobDescription: string,
): JobMatchResult {
  const targets: string[] =
    jobRequirements.length > 0
      ? jobRequirements
      : extractTokens(jobDescription, 40);

  if (targets.length === 0) return { score: 0, matched: [], missing: [] };

  const matched: string[] = [];
  const missing: string[] = [];

  for (const target of targets) {
    const hit = cvKeywords.some((kw) => isMatch(kw, target));
    if (hit) matched.push(target);
    else missing.push(target);
  }

  const score = Math.round((matched.length / targets.length) * 100);
  return { score, matched, missing };
}
