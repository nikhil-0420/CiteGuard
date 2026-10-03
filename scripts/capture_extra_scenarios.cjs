const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const artifactDir = "C:\\Users\\ACER.DESKTOP-R4G9UL6\\.gemini\\antigravity-ide\\brain\\32fdd7f6-70bb-43c1-a588-bf3799644ada";

const screens = [
  { name: "46_dashboard_filtered_blocked_1440x900.png", url: "http://127.0.0.1:5173/app?outcome=blocked", width: 1440, height: 900 },
  { name: "47_audit_workspace_doc_rendered_1440x900.png", url: "http://127.0.0.1:5173/demo/audits/blocked?tab=document", width: 1440, height: 900 },
  { name: "48_audit_workspace_doc_raw_1440x900.png", url: "http://127.0.0.1:5173/demo/audits/blocked?tab=document&mode=raw", width: 1440, height: 900 },
  { name: "49_command_palette_open_1440x900.png", url: "http://127.0.0.1:5173/app?cmd=1", width: 1440, height: 900 },
  { name: "50_dashboard_period_7d_1440x900.png", url: "http://127.0.0.1:5173/app?period=7d", width: 1440, height: 900 },
];

for (const s of screens) {
  const targetPath = path.join(artifactDir, s.name);
  const tempProfile = path.join("E:\\temp", `profile_${Date.now()}_${Math.floor(Math.random()*1000)}`);
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

console.log("Extra captures complete.");
