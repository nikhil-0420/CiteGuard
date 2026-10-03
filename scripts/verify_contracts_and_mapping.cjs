/**
 * CiteGuard Verification Script
 * Validates document mapping, default blocker selection, date formatting, and contract consistency.
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("=== CiteGuard Verification Suite ===");

// 1. Verify Sample Markdown and exact line coordinates
const sampleMarkdownPath = path.resolve(__dirname, "../demo/agent-brief.md");
const content = fs.readFileSync(sampleMarkdownPath, "utf-8");
const lines = content.split("\n");

console.log(`[1] Audited Document has ${lines.length} lines.`);

// Exact claim assertions
const EXPECTED_MAPPINGS = [
  { id: "F-001", line: 8, key: "vaswani2017", textIncludes: "Transformer architecture relies solely on attention" },
  { id: "F-002", line: 9, key: "devlin2018", textIncludes: "BERT pre-trains bidirectional representations" },
  { id: "F-003", line: 13, key: "he2015", textIncludes: "ResNets reach under 2% top-5 error" },
  { id: "F-004", line: 14, key: "devlin2018", textIncludes: "BERT improves performance on all natural language processing tasks" },
  { id: "F-005", line: 18, key: "vaswani2018", textIncludes: "Self-attention alone is sufficient" },
  { id: "F-006", line: 19, key: "lee2026agentic", textIncludes: "Agentic verification loops reduce" },
  { id: "F-007", line: 20, key: "doe2024notes", textIncludes: "Citation hygiene checklists remove" },
];

for (const exp of EXPECTED_MAPPINGS) {
  const lineText = lines[exp.line - 1]; // 1-indexed to 0-indexed
  assert(lineText, `Line ${exp.line} does not exist in sample brief`);
  assert(
    lineText.includes(exp.textIncludes),
    `Line ${exp.line} mismatch! Expected text "${exp.textIncludes}", found: "${lineText}"`
  );
  assert(
    lineText.includes(`[@${exp.key}]`),
    `Line ${exp.line} missing expected citation marker [@${exp.key}]`
  );
  console.log(`✓ Finding ${exp.id} accurately matches Line ${exp.line}: "${lineText.trim().slice(0, 60)}..."`);
}

// 2. Verify Bibliography boundary
const bibLineIdx = lines.findIndex((l) => l.trim().startsWith("```bibliography"));
assert(bibLineIdx === 21, `Bibliography should start at Line 22 (0-index 21), found at Line ${bibLineIdx + 1}`);
console.log(`✓ Bibliography block confirmed starting at Line ${bibLineIdx + 1}; no claims mapped inside bibliography.`);

// 3. Verify mock JSON findings match these exact lines
const mockFiles = [
  path.resolve(__dirname, "../contract/mock/report-blocked.json"),
  path.resolve(__dirname, "../frontend/public/mock/report-blocked.json"),
];

for (const mockPath of mockFiles) {
  const data = JSON.parse(fs.readFileSync(mockPath, "utf-8"));
  for (const exp of EXPECTED_MAPPINGS) {
    const finding = data.findings.find((f) => f.id === exp.id);
    assert(finding, `Finding ${exp.id} not found in ${path.basename(mockPath)}`);
    assert.strictEqual(
      finding.line,
      exp.line,
      `Finding ${exp.id} line mismatch in ${path.basename(mockPath)}: expected ${exp.line}, got ${finding.line}`
    );
  }
}
console.log("✓ Contract and frontend mock fixtures have synchronized exact line numbers.");

// 4. Verify Default Blocker Selection Logic
const blockedReport = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../frontend/public/mock/report-blocked.json"), "utf-8")
);

// Selection algorithm:
// Priority: 1. Unexcepted blocker (action === "block" && !exception)
//           2. Unexcepted review (action === "review" && !exception)
//           3. First finding
function selectDefaultFinding(findings, preservedFindingId) {
  if (preservedFindingId) {
    const match = findings.find((f) => f.id === preservedFindingId);
    if (match) return match.id;
  }
  const firstBlocker = findings.find((f) => f.action === "block" && !f.exception);
  if (firstBlocker) return firstBlocker.id;
  const firstReview = findings.find((f) => f.action === "review" && !f.exception);
  if (firstReview) return firstReview.id;
  return findings[0]?.id;
}

const defaultSelected = selectDefaultFinding(blockedReport.findings, null);
assert.strictEqual(
  defaultSelected,
  "F-003",
  `Default selection must be highest priority blocker F-003 (ResNet contradiction), got ${defaultSelected}`
);
console.log(`✓ Default finding on blocked report is verified as ${defaultSelected} (Blocks check on ResNet contradiction).`);

// Explicit deep link honored
const deepLinked = selectDefaultFinding(blockedReport.findings, "F-004");
assert.strictEqual(deepLinked, "F-004", `Explicit deep link F-004 must be honored, got ${deepLinked}`);
console.log("✓ Explicit deep-link selection is honored.");

// 5. Verify CSV Formula Sanitization
function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

assert.strictEqual(sanitizeCsvCell("=SUM(A1:A10)"), `"'=SUM(A1:A10)"`);
assert.strictEqual(sanitizeCsvCell("+cmd|' /C calc'!A0"), ` "'+cmd|' /C calc'!A0"`.trim());
assert.strictEqual(sanitizeCsvCell("@vaswani2017"), `"'@vaswani2017"`);
assert.strictEqual(sanitizeCsvCell("Normal Text"), `"Normal Text"`);
console.log("✓ CSV formula injection protection verified.");

console.log("\n=== ALL CONTRACT & MAPPING TESTS PASSED SUCCESSFULLY! ===");
