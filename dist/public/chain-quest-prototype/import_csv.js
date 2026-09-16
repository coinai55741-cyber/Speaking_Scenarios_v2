const fs = require('fs');
const path = require('path');

const csvPath = 'd:/Yezi/G_project/S2_mission_game/count/chain-quest-prototype/scenarios_spec.csv';
const appJsPath1 = 'd:/Yezi/G_project/S2_mission_game/count/chain-quest-prototype/app.js';
const appJsPath2 = 'd:/Yezi/G_project/Speaking_Scenarios/demo_v2/chain-quest-prototype/app.js';

if (!fs.existsSync(csvPath)) {
  console.error('CSV file not found:', csvPath);
  process.exit(1);
}

// Simple CSV parser supporting quotes
function parseCsv(content) {
  // Remove BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  const lines = [];
  let row = [];
  let inQuotes = false;
  let curVal = '';

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        curVal += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        curVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(curVal.trim());
        curVal = '';
      } else if (char === '\r') {
        // ignore or check next \n
      } else if (char === '\n') {
        row.push(curVal.trim());
        if (row.some(c => c.length > 0)) {
          lines.push(row);
        }
        row = [];
        curVal = '';
      } else {
        curVal += char;
      }
    }
  }
  if (curVal.length > 0 || row.length > 0) {
    row.push(curVal.trim());
    if (row.some(c => c.length > 0)) {
      lines.push(row);
    }
  }
  return lines;
}

const csvRaw = fs.readFileSync(csvPath, 'utf8');
const parsed = parseCsv(csvRaw);

const headers = parsed[0];
const dataRows = parsed.slice(1);

console.log(`Parsed ${dataRows.length} rows from CSV`);

// Read current app.js
const appJsContent = fs.readFileSync(appJsPath1, 'utf8');
const match = appJsContent.match(/const SCENARIOS_DATA = (\{[\s\S]*?\n\};)/);
if (!match) {
  console.error('SCENARIOS_DATA not found in app.js');
  process.exit(1);
}

const sandbox = {};
const fn = new Function('sandbox', 'sandbox.SCENARIOS_DATA = ' + match[1]);
fn(sandbox);
const scenarios = sandbox.SCENARIOS_DATA;

// Update scenarios with CSV data
for (const r of dataRows) {
  const [
    scenarioKey,
    scenarioTitle,
    stepIndexStr,
    stepTitle,
    locationTag,
    storyPrompt,
    targetHakka,
    targetMandarin,
    keywordsStr,
    altKeywordsStr,
    npcRole,
    npcAvatar,
    npcSuccessResponse,
    npcRetryResponse
  ] = r;

  const stepIndex = parseInt(stepIndexStr, 10);
  if (!scenarios[scenarioKey]) continue;

  const sc = scenarios[scenarioKey];
  const step = sc.steps.find(s => s.stepIndex === stepIndex);
  if (!step) continue;

  if (stepTitle) step.title = stepTitle;
  if (locationTag) step.locationTag = locationTag;
  if (storyPrompt) step.storyPrompt = storyPrompt;
  if (targetHakka) step.targetHakka = targetHakka;
  if (targetMandarin) step.targetMandarin = targetMandarin;
  if (keywordsStr) step.keywords = keywordsStr.split(/[、,，]+/).map(s => s.trim()).filter(Boolean);
  if (altKeywordsStr) step.altKeywords = altKeywordsStr.split(/[、,，]+/).map(s => s.trim()).filter(Boolean);
  if (npcRole) step.npcRole = npcRole;
  if (npcAvatar) step.npcAvatar = npcAvatar;
  if (npcSuccessResponse) step.npcSuccessResponse = npcSuccessResponse;
  if (npcRetryResponse) step.npcRetryResponse = npcRetryResponse;
}

// Generate new app.js
const newScenariosJson = JSON.stringify(scenarios, null, 2);
const updatedAppJs = appJsContent.replace(
  /const SCENARIOS_DATA = \{[\s\S]*?\n\};/,
  'const SCENARIOS_DATA = ' + newScenariosJson + ';'
);

fs.writeFileSync(appJsPath1, updatedAppJs, 'utf8');
fs.writeFileSync(appJsPath2, updatedAppJs, 'utf8');
console.log('Successfully updated app.js in both directories from CSV!');
