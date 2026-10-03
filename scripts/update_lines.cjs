const fs = require('fs');
const path = require('path');

const lineMap = {
  'F-001': 8,
  'F-002': 9,
  'F-003': 13,
  'F-004': 14,
  'F-005': 18,
  'F-006': 19,
  'F-007': 20,
};

const dirs = [
  path.join(__dirname, '..', 'contract', 'mock'),
  path.join(__dirname, '..', 'frontend', 'public', 'mock'),
];

for (const dir of dirs) {
  const files = ['report-blocked.json', 'report-pending.json', 'report-passed.json'];
  for (const f of files) {
    const fullPath = path.join(dir, f);
    if (!fs.existsSync(fullPath)) continue;
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    if (Array.isArray(data.findings)) {
      for (const finding of data.findings) {
        if (lineMap[finding.id]) {
          finding.line = lineMap[finding.id];
        }
      }
    }
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n');
    console.log(`Updated lines in ${fullPath}`);
  }
}
