const fs = require('fs');
const path = require('path');

const appJsPath = 'd:/Yezi/G_project/S2_mission_game/count/chain-quest-prototype/app.js';
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

const match = appJsContent.match(/const SCENARIOS_DATA = (\{[\s\S]*?\n\};)/);
if (!match) {
  console.error('SCENARIOS_DATA not found');
  process.exit(1);
}

const sandbox = {};
const fn = new Function('sandbox', 'sandbox.SCENARIOS_DATA = ' + match[1]);
fn(sandbox);
const data = sandbox.SCENARIOS_DATA;

const headers = [
  '情境ID',
  '情境名稱',
  '關卡序號',
  '關卡名稱',
  '地點標籤',
  '情境引導語(題目故事)',
  '目標客語句',
  '華語對照',
  '判定關鍵詞(必中)',
  '備用關鍵詞',
  'NPC角色',
  'NPC頭像',
  '通關NPC回應',
  '重試引導提示'
];

function escapeCsv(str) {
  if (str === null || str === undefined) return '""';
  const s = String(str).replace(/\r\n/g, ' ').replace(/\n/g, ' ');
  return '"' + s.replace(/"/g, '""') + '"';
}

const rows = [headers.map(escapeCsv).join(',')];

for (const [scenarioKey, sc] of Object.entries(data)) {
  for (const step of sc.steps) {
    const row = [
      scenarioKey,
      sc.title,
      step.stepIndex,
      step.title,
      step.locationTag || '',
      step.storyPrompt || '',
      step.targetHakka || '',
      step.targetMandarin || '',
      (step.keywords || []).join('、'),
      (step.altKeywords || []).join('、'),
      step.npcRole || '',
      step.npcAvatar || '',
      step.npcSuccessResponse || '',
      step.npcRetryResponse || ''
    ];
    rows.push(row.map(escapeCsv).join(','));
  }
}

// Add UTF-8 BOM so Excel opens with proper Traditional Chinese characters
const bom = '\uFEFF';
const csvContent = bom + rows.join('\r\n');

const outPath1 = 'd:/Yezi/G_project/S2_mission_game/count/chain-quest-prototype/scenarios_spec.csv';
const outPath2 = 'd:/Yezi/G_project/Speaking_Scenarios/demo_v2/chain-quest-prototype/scenarios_spec.csv';

fs.writeFileSync(outPath1, csvContent, 'utf8');
fs.writeFileSync(outPath2, csvContent, 'utf8');
console.log('Successfully generated scenarios_spec.csv in both directories');
