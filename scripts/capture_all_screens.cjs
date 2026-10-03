const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const artifactDir = "C:\\Users\\ACER.DESKTOP-R4G9UL6\\.gemini\\antigravity-ide\\brain\\32fdd7f6-70bb-43c1-a588-bf3799644ada";

const screens = [
  // Landing Page at 3 Desktop Resolutions
  { name: "30_hero_landing_1440x900.png", url: "http://127.0.0.1:5173/", width: 1440, height: 900 },
  { name: "31_hero_landing_1920x1080.png", url: "http://127.0.0.1:5173/", width: 1920, height: 1080 },
  { name: "32_hero_landing_1280x720.png", url: "http://127.0.0.1:5173/", width: 1280, height: 720 },

  // Standalone Login Page
  { name: "33_login_page_1440x900.png", url: "http://127.0.0.1:5173/login", width: 1440, height: 900 },

  // Operational Dashboard at /app
  { name: "34_dashboard_overview_1440x900.png", url: "http://127.0.0.1:5173/app", width: 1440, height: 900 },
  { name: "35_dashboard_1280x720.png", url: "http://127.0.0.1:5173/app", width: 1280, height: 720 },

  // Audit Workspace (/demo/audits/blocked) - Verifying F-003 blocker default selection!
  { name: "36_audit_workspace_blocked_1440x900.png", url: "http://127.0.0.1:5173/demo/audits/blocked", width: 1440, height: 900 },
  { name: "37_audit_workspace_blocked_1920x1080.png", url: "http://127.0.0.1:5173/demo/audits/blocked", width: 1920, height: 1080 },
  { name: "38_audit_workspace_deep_linked_F004.png", url: "http://127.0.0.1:5173/demo/audits/blocked?finding=F-004", width: 1440, height: 900 },

  // Review Queue
  { name: "39_review_queue_1440x900.png", url: "http://127.0.0.1:5173/app/reviews", width: 1440, height: 900 },

  // Sources Library
  { name: "40_sources_library_1440x900.png", url: "http://127.0.0.1:5173/app/sources", width: 1440, height: 900 },

  // New Audit Form
  { name: "41_new_audit_page_1440x900.png", url: "http://127.0.0.1:5173/app/audits/new", width: 1440, height: 900 },

  // Policy Rules
  { name: "42_policies_page_1440x900.png", url: "http://127.0.0.1:5173/app/policies", width: 1440, height: 900 },

  // Evaluation Results
  { name: "43_eval_results_page_1440x900.png", url: "http://127.0.0.1:5173/app/results", width: 1440, height: 900 },

  // Settings & Integrations
  { name: "44_settings_page_1440x900.png", url: "http://127.0.0.1:5173/app/settings", width: 1440, height: 900 },

  // Methodology
  { name: "45_methodology_page_1440x900.png", url: "http://127.0.0.1:5173/methodology", width: 1440, height: 900 },
];

console.log(`Starting automated capture of ${screens.length} desktop views...`);

for (const s of screens) {
  const targetPath = path.join(artifactDir, s.name);
  console.log(`Capturing ${s.name} at ${s.width}x${s.height}...`);
  try {
    const cmd = `"${chromePath}" --headless=new --disable-gpu --virtual-time-budget=2000 --window-size=${s.width},${s.height} --screenshot="${targetPath}" "${s.url}"`;
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

console.log("All captures completed.");
