const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

const match = appJsContent.match(/const SCENARIOS_GRAPH = (\{[\s\S]*?\n\};\n\n\/\/ ===)/);
if (!match) {
  console.error('SCENARIOS_GRAPH not found in app.js');
  process.exit(1);
}

const sandbox = {};
const fn = new Function('sandbox', 'sandbox.SCENARIOS_GRAPH = ' + match[1].replace(/\n\n\/\/ ===$/, ''));
fn(sandbox);
const graph = sandbox.SCENARIOS_GRAPH;

const headers = [
  '情境ID',
  '情境名稱',
  '情境目標(客語)',
  '情境目標(華語)',
  '節點ID',
  '節點標題',
  '節點類型',
  '地點標籤',
  '客語引導語(題目)',
  '華語引導語(題目)',
  '目標客語句',
  '目標華語句',
  '客語關鍵詞',
  '華語關鍵詞',
  'NPC角色',
  'NPC頭像',
  '通關NPC回應',
  '華語通關回應',
  '重試NPC回應',
  '華語重試回應'
];

function escapeCsv(str) {
  if (str === null || str === undefined) return '""';
  const s = String(str).replace(/\r\n/g, ' ').replace(/\n/g, ' ');
  return '"' + s.replace(/"/g, '""') + '"';
}

const rows = [headers.map(escapeCsv).join(',')];

for (const [scenarioKey, sc] of Object.entries(graph)) {
  for (const [nodeKey, node] of Object.entries(sc.nodes || {})) {
    if (node.items) {
      // 收集任務子項目
      for (const it of node.items) {
        const row = [
          scenarioKey,
          sc.title,
          sc.objective || '',
          sc.mandarinObjective || '',
          it.id,
          `${node.title} - ${it.name}`,
          '背包收集項目',
          it.locationTag || node.locationTag || '',
          it.storyPrompt || '',
          it.mandarinStoryPrompt || it.storyPrompt || '',
          it.targetHakka || '',
          it.targetMandarin || '',
          (it.keywords || []).join('、'),
          (it.mandarinKeywords || []).join('、'),
          it.npcRole || node.npcRole || '',
          it.npcAvatar || node.npcAvatar || '',
          it.npcSuccessResponse || '',
          it.mandarinNpcSuccessResponse || it.npcSuccessResponse || '',
          it.npcRetryResponse || '',
          it.mandarinNpcRetryResponse || it.npcRetryResponse || ''
        ];
        rows.push(row.map(escapeCsv).join(','));
      }
    } else {
      const row = [
        scenarioKey,
        sc.title,
        sc.objective || '',
        sc.mandarinObjective || '',
        node.id || nodeKey,
        node.title,
        node.nodeType || '主線',
        node.locationTag || '',
        node.storyPrompt || '',
        node.mandarinStoryPrompt || node.storyPrompt || '',
        node.targetHakka || '',
        node.targetMandarin || '',
        (node.keywords || []).join('、'),
        (node.mandarinKeywords || []).join('、'),
        node.npcRole || '',
        node.npcAvatar || '',
        node.npcSuccessResponse || '',
        node.mandarinNpcSuccessResponse || node.npcSuccessResponse || '',
        node.npcRetryResponse || '',
        node.mandarinNpcRetryResponse || node.npcRetryResponse || ''
      ];
      rows.push(row.map(escapeCsv).join(','));
    }
  }
}

const outPath = path.join(__dirname, 'scenarios_spec.csv');
fs.writeFileSync(outPath, '\uFEFF' + rows.join('\r\n'), 'utf8');
console.log(`Successfully exported ${rows.length - 1} node specifications to ${outPath}`);
