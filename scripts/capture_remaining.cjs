const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const artifactDir = "C:\\Users\\ACER.DESKTOP-R4G9UL6\\.gemini\\antigravity-ide\\brain\\32fdd7f6-70bb-43c1-a588-bf3799644ada";

const screens = [
  { name: "40_sources_library_1440x900.png", url: "http://127.0.0.1:5173/app/sources", width: 1440, height: 900 },
  { name: "41_new_audit_page_1440x900.png", url: "http://127.0.0.1:5173/app/audits/new", width: 1440, height: 900 },
  { name: "42_policies_page_1440x900.png", url: "http://127.0.0.1:5173/app/policies", width: 1440, height: 900 },
  { name: "43_eval_results_page_1440x900.png", url: "http://127.0.0.1:5173/app/results", width: 1440, height: 900 },
  { name: "44_settings_page_1440x900.png", url: "http://127.0.0.1:5173/app/settings", width: 1440, height: 900 },
  { name: "45_methodology_page_1440x900.png", url: "http://127.0.0.1:5173/methodology", width: 1440, height: 900 },
];

for (const s of screens) {
  const targetPath = path.join(artifactDir, s.name);
  const tempProfile = path.join("E:\\temp", `profile_${Date.now()}`);
  console.log(`Capturing ${s.name}...`);
  try {
    const cmd = `cmd /c "start /wait "" "${chromePath}" --headless --disable-gpu --user-data-dir="${tempProfile}" --virtual-time-budget=2000 --window-size=${s.width},${s.height} --screenshot="${targetPath}" "${s.url}""`;
    execSync(cmd, { stdio: "ignore" });
    if (fs.existsSync(targetPath)) {
      console.log(`✓ Saved: ${s.name} (${fs.statSync(targetPath).size} bytes)`);
    } else {
      console.error(`✗ File not created: ${s.name}`);
    }
  } catch (err) {
    console.error(`Error capturing ${s.name}:`, err.message);
  }
}

console.log("Remaining captures complete.");
