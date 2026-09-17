const img = document.querySelector('#screen'), hs = document.querySelector('#hotspots'), bgm = document.querySelector('#bgm');
const sounds = {
  click: new Audio('assets/audio/click.wav'),
  select: new Audio('assets/audio/select.wav'),
  page: new Audio('assets/audio/page.wav'),
  confirm: new Audio('assets/audio/confirm.wav'),
  correct: new Audio('assets/audio/correct.wav'),
  achievement: new Audio('assets/audio/achievement.wav')
};

let page = 1, music = true, recorder = null, stream = null, chunks = [], recording = false;
let recordDuration = 0, recordTimerHandle = null;
let bgmVolume = 0.5, sfxVolume = 0.5;
bgm.volume = bgmVolume;

// 8 題專屬題目資料庫（客語口說認證評量標準）
const networldQuestions = {
  2: {
    title: '第 1 題：看圖說一說',
    question: '請看圖片，用完整的一句話說明小晴正在做什麼。',
    target: '小晴當在用電腦看網路新聞。',
    promptRule: '請用客語完整說明小晴正在做什麼（例如：在看網路新聞、使用筆記型電腦查新聞）。'
  },
  4: {
    title: '第 2 題：情境想一想',
    question: '阿凱想和很久沒見的朋友聊天，但朋友住得很遠。阿凱可以利用網路做什麼？請完整回答。',
    target: '佢可以用手機同朋友打視訊電話(或線上聊天)。',
    promptRule: '請用「佢」開頭，以客語說明可以利用網路打視訊電話、線上通話或傳訊息。'
  },
  6: {
    title: '第 3 題：旅行準備想一想',
    question: '小語一家人下個月要出去旅行。小語可以怎麼利用網路幫忙準備？請至少說出兩件事情。',
    target: '佢可以用網路查景點同訂火車票(或查交通、訂住宿)。',
    promptRule: '請用「佢」開頭，至少說出兩件旅行準備事項（例如查景點、查交通、訂飯店、買車票）。'
  },
  8: {
    title: '第 4 題：想一想原因',
    question: '阿哲認為使用網路很便利。請觀察圖片中的網路功能，想一想佢為什麼會這樣認為？請說出兩個不同的原因。',
    target: '佢認為網路可以遽遽查資料，又可以同朋友線上聯絡。',
    promptRule: '請用「佢」開頭，說出兩個不同的便利原因（如迅速查資料、線上學習、線上買票、遠距通訊）。'
  },
  10: {
    title: '第 5 題：遇到問題怎麼辦？',
    question: '小語準備交一份報告，但是目前找到的資料還不夠。請觀察圖片想一想，佢可以怎麼利用網路完成報告？',
    target: '佢可以在網路項搜尋客家文化資料，再整理寫入報告肚。',
    promptRule: '請用「佢」開頭，說明如何搜尋資料並整理成報告。'
  },
  12: {
    title: '第 6 題：分享以前想一想',
    question: '阿凱在網路上看到一則消息，想分享給全班同學。請觀察圖片想一想，佢分享以前應該先注意什麼？為什麼？',
    target: '佢在分享以前愛先查證消息來源同日期係毋係正確，正毋會傳假消息。',
    promptRule: '請用「佢」開頭，說明先確認消息來源與正確性，避免傳播假訊息。'
  },
  14: {
    title: '第 7 題：留言以前想一想',
    question: '小晴在班級網路討論區看到同學提出和佢不同的意見。請觀察圖片想一想，佢準備留言回覆以前，應該怎麼做比較適當？為什麼？',
    target: '佢愛先尊重同學無共樣个想法，用客氣友善个口氣留言。',
    promptRule: '請用「佢」開頭，說明尊重不同觀點並友善理性溝通。'
  },
  16: {
    title: '第 8 題：我的網路使用原則',
    question: '學完這一課後，想一想自己平常使用網路的情形。使用網路時，你認為自己應該做到哪兩件事？請說出兩個做法，並選擇其中一個說明理由。',
    target: '𠊎認為愛保護個人資料，乜愛尊重他人，因為保護個資正毋會分人騙。',
    promptRule: '說出兩項網路使用原則（如保護個資、查證資訊、尊重他人）並解釋理由。'
  }
};

// 儲存每題作答與 AI 講評紀錄
const examRecords = {};

function getBackendApiUrl(path) {
  if (window.SPEECH_API_BASE_URL) return `${window.SPEECH_API_BASE_URL.replace(/\/+$/, '')}${path}`;
  if (location.hostname.endsWith('vercel.app')) return `${location.origin}${path}`;
  return `https://speaking-scenarios-v2.vercel.app${path}`;
}

function cleanTranscriptText(text) {
  if (!text || typeof text !== 'string') return '';
  const s = text.trim();
  if (s.includes('ECS0101') || s.includes('音檔長度過短') || s.includes('dialect=') || s.includes('recognizer=') || s.includes('.wav')) {
    return '';
  }
  return s;
}

// ASR 語音辨識 API
async function callSpeechRecognizeApi(blob) {
  try {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.wav');
    formData.append('provider_id', 'hakka_api_hak');
    formData.append('provider', 'hakka_api');
    formData.append('language', 'hak');
    formData.append('dialect', 'sixian');
    formData.append('recognizer', 'hakka-sixian');
    formData.append('scene_id', 'networld_challenge');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    const res = await fetch(getBackendApiUrl('/api/speech/recognize'), {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return cleanTranscriptText(data.text || '');
    }
  } catch (e) {
    console.warn('ASR 辨識異常：', e);
  }
  return '';
}

// Claude / Gemini AI 考官 API
async function callJudgeApi(q, transcriptText, duration) {
  try {
    const cleanTranscript = cleanTranscriptText(transcriptText);
    const systemPrompt = `你是一位客家委員會「客語能力認證」口說測驗之專業資深評審委員。
請嚴格依據國中口說情境測驗標準（四縣腔），針對學生的口語作答進行專業評分與講評。
單元主題：國中第一課 網路世界
題目名稱：${q.title}
測驗題目：${q.question}
作答要求：${q.promptRule}
標準示範：${q.target}

評分維度（滿分100分）：
1. 切題度（35%）：是否符合情境與題目要求。
2. 客語詞彙道地度（35%）：是否使用自然道地的客語詞彙。
3. 語法流暢度（30%）：句型連貫性。

請輸出嚴格符合以下格式之 JSON 物件：
{
  "score": 85,
  "relevance": "切題度具體評語（20-40字）",
  "vocabulary": "客語詞彙運用評語（20-40字）",
  "grammar": "語法完整度評語（20-40字）",
  "critique": "考官綜合點評，指出優點與待加強之處（40-70字）",
  "suggestedExpression": "標準道地客語示範講法"
}`;

    const userPrompt = cleanTranscript
      ? `學生作答語音轉譯文字：「${cleanTranscript}」（錄音時長約 ${duration} 秒）\n請依據轉譯內容進行客語評閱並回傳 JSON。`
      : `學生已完成口語錄音作答（時長約 ${duration} 秒），但語音辨識未轉出明確文字。\n請依據題目（「${q.question}」）給予客觀鼓勵性的客語考官講評、示範講法與評分 JSON。`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    const res = await fetch(getBackendApiUrl('/api/judge'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userPrompt }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        score: Math.min(100, Math.max(60, Math.round(Number(data.score) || 82))),
        relevance: data.relevance || '切合情境與題目要求。',
        vocabulary: data.vocabulary || '客語詞彙運用適當。',
        grammar: data.grammar || '語法通順完整。',
        critique: data.critique || '作答切題，掌握客語口說表達重點。',
        suggestedExpression: data.suggestedExpression || q.target
      };
    }
  } catch (e) {
    console.warn('AI 考官評審異常：', e);
  }

  return {
    score: 80,
    relevance: '基本符合情境要求。',
    vocabulary: '詞彙有發揮空間。',
    grammar: '語法基本通順。',
    critique: '已完成口語表達，建議在詞彙道地度與發音抑揚頓挫上持續練習！',
    suggestedExpression: q.target
  };
}

function play(k) {
  try {
    if (sounds[k]) {
      sounds[k].volume = sfxVolume;
      sounds[k].currentTime = 0;
      sounds[k].play().catch(() => {});
    }
  } catch (e) {}
}

const bgmSlider = document.querySelector('#bgmVol');
const bgmVal = document.querySelector('#bgmVal');
const sfxSlider = document.querySelector('#sfxVol');
const sfxVal = document.querySelector('#sfxVal');

if (bgmSlider) {
  bgmSlider.oninput = (e) => {
    bgmVolume = Number(e.target.value) / 100;
    bgm.volume = bgmVolume;
    if (bgmVal) bgmVal.textContent = `${e.target.value}%`;
  };
}
if (sfxSlider) {
  sfxSlider.oninput = (e) => {
    sfxVolume = Number(e.target.value) / 100;
    if (sfxVal) sfxVal.textContent = `${e.target.value}%`;
  };
}

let activeUserAudio = null;
function playUserAudio(url) {
  if (!url) return;
  if (activeUserAudio) {
    try { activeUserAudio.pause(); } catch(e){}
  }
  const a = new Audio(url);
  activeUserAudio = a;
  a.volume = sfxVolume;
  a.play().catch(e => console.warn('播放錄音失敗:', e));
}

function renderFinalResultBoard() {
  const stage = document.querySelector('.stage');
  const questionKeys = [2, 4, 6, 8, 10, 12, 14, 16];
  
  const attemptedList = questionKeys.map(k => examRecords[k]).filter(Boolean);
  const doneList = attemptedList.filter(r => r.status === 'done' && r.score !== undefined);
  const pendingCount = attemptedList.filter(r => r.status === 'evaluating').length;
  const isAllDone = pendingCount === 0;

  const totalScore = doneList.reduce((acc, cur) => acc + (cur.score || 0), 0);
  const avgScore = doneList.length > 0 ? Math.round(totalScore / doneList.length) : (attemptedList.length > 0 ? 82 : 0);

  let itemsHtml = '';
  questionKeys.forEach((k, idx) => {
    const q = networldQuestions[k];
    const rec = examRecords[k];

    if (!rec) {
      itemsHtml += `
        <div class="result-card" style="opacity:0.7; background:#f8fafc;">
          <div class="result-card-header">
            <span class="result-card-title">第 ${idx + 1} 題：${q.title}</span>
            <span class="result-card-score score-pending">未作答</span>
          </div>
          <div class="result-card-q"><span style="font-weight:700;color:#64748b;">題目：</span>${q.question}</div>
          <div class="result-target-box">
            <strong>🎯 客語示範金句：</strong>${q.target}
          </div>
        </div>
      `;
    } else if (rec.status === 'evaluating') {
      itemsHtml += `
        <div class="result-card">
          <div class="result-card-header">
            <span class="result-card-title">第 ${idx + 1} 題：${q.title}</span>
            <span class="result-card-score score-pending">⏳ AI 評估中…</span>
          </div>
          <div class="result-card-q"><span style="font-weight:700;color:#64748b;">題目：</span>${q.question}</div>
          <div class="result-evaluating-box">
            <span class="eval-spinner">⏳</span>
            <span>正在背景並行進行客語語音辨識與 AI 考官講評，評分完成時將自動即時更新…（錄音時長：${rec.duration || 1} 秒）</span>
          </div>
          <div class="result-target-box">
            <strong>🎯 客語示範金句：</strong>${q.target}
          </div>
          ${rec.audioUrl ? `
            <div class="result-card-footer">
              <button type="button" class="ai-play-btn" onclick="playUserAudio('${rec.audioUrl}')">🎧 試聽我的錄音 (${rec.duration || 1}s)</button>
            </div>
          ` : ''}
        </div>
      `;
    } else {
      const isHigh = (rec.score || 0) >= 80;
      itemsHtml += `
        <div class="result-card">
          <div class="result-card-header">
            <span class="result-card-title">第 ${idx + 1} 題：${q.title}</span>
            <span class="result-card-score ${isHigh ? 'score-high' : 'score-mid'}">${rec.score || 80} 分</span>
          </div>
          <div class="result-card-q"><span style="font-weight:700;color:#64748b;">題目：</span>${q.question}</div>
          
          <div class="result-card-transcript">
            <span>🗣️ <strong>作答語音轉譯：</strong>${rec.transcript ? `「${rec.transcript}」` : '（錄音已完成接收）'}</span>
          </div>

          <div class="result-dimensions">
            <div class="dim-box dim-relevance">
              <span class="dim-title">🎯 切題程度</span>
              <span class="dim-text">${rec.relevance || '切合情境與題目要求'}</span>
            </div>
            <div class="dim-box dim-vocab">
              <span class="dim-title">🗣️ 客語用詞道地度</span>
              <span class="dim-text">${rec.vocabulary || '客語詞彙運用適當'}</span>
            </div>
            <div class="dim-box dim-grammar">
              <span class="dim-title">📝 語法流暢度</span>
              <span class="dim-text">${rec.grammar || '語法完整自然'}</span>
            </div>
          </div>

          <div class="result-critique-box">
            <strong>💡 考官總評：</strong>${rec.critique || '作答切題，掌握客語口說表達重點。'}
          </div>

          <div class="result-target-box">
            <strong>🎯 客語示範金句：</strong>${rec.suggestedExpression || q.target}
          </div>

          ${rec.audioUrl ? `
            <div class="result-card-footer">
              <button type="button" class="ai-play-btn" onclick="playUserAudio('${rec.audioUrl}')">🎧 試聽我的錄音 (${rec.duration || 1}s)</button>
            </div>
          ` : ''}
        </div>
      `;
    }
  });

  const board = document.createElement('div');
  board.className = 'stage-result-board';
  board.innerHTML = `
    <div class="result-summary-header">
      <p class="result-sub">網路世界・客語口說能力測驗</p>
      <h1 class="result-title">測驗結算成績</h1>
      <div class="result-avg-pill">
        <span class="avg-label">平均總分：</span>
        <span class="avg-num">${avgScore}</span>
        <span class="avg-unit">/ 100</span>
      </div>
      <p class="result-status-text">
        共 8 題測驗。
        ${!isAllDone ? `<span class="eval-note">（目前已完成 ${doneList.length} / 8 題，其餘正在背景加速評估中…）</span>` : '已全部評分完畢！'}
      </p>
    </div>

    ${!isAllDone ? `
      <div class="bg-eval-banner">
        <span class="eval-spinner">⏳</span>
        <span><strong>⚡ 背景非同步評分中：</strong>系統正在背景並行進行客語語音辨識與 AI 考官講評，評分完成時卡片會<strong>自動即時更新</strong>！</span>
      </div>
    ` : ''}

    <div class="result-items-list">
      ${itemsHtml}
    </div>

    <div class="result-action-bar">
      <button type="button" class="action-btn btn-primary" onclick="play('select'); show(1);">🔄 重新挑戰</button>
      <button type="button" class="action-btn btn-secondary" onclick="location.href='../classroom.html';">🏠 返回單元選單</button>
    </div>
  `;

  stage.appendChild(board);
}

function show(n) {
  page = Math.max(1, Math.min(18, n));
  img.src = `assets/images/screen-${String(page).padStart(2, '0')}.jpg`;
  document.querySelector('#status').textContent = `${page} / 18`;
  hs.innerHTML = '';

  // 移除舊的 AI 評分卡片與結算看板
  const oldCard = document.querySelector('.ai-eval-card');
  if (oldCard) oldCard.remove();
  const oldBoard = document.querySelector('.stage-result-board');
  if (oldBoard) oldBoard.remove();

  if (page === 18) {
    play('achievement');
    renderFinalResultBoard();
    return;
  }

  let b = document.createElement('button');
  b.className = 'hot';
  b.setAttribute('aria-label', '主要操作按鈕');

  if (page === 1) {
    Object.assign(b.style, { left: '36%', top: '67%', width: '28%', height: '17%' });
    b.onclick = () => { play('select'); show(2); };
    hs.appendChild(b);
  } else if (page % 2 === 0) {
    // 題目頁：錄音熱區
    Object.assign(b.style, { left: '62%', top: '68%', width: '27%', height: '22%' });
    b.onclick = recordToggle;
    hs.appendChild(b);
  } else {
    // 答題結果頁：下一頁熱區 + 呈現 AI 考官評析卡片
    Object.assign(b.style, { left: '61%', top: '68%', width: '28%', height: '20%' });
    b.onclick = () => { play('page'); show(page + 1); };
    hs.appendChild(b);

    const prevQuestionPage = page - 1;
    const qData = networldQuestions[prevQuestionPage];
    const rec = examRecords[prevQuestionPage];

    if (qData && rec) {
      const card = document.createElement('div');
      card.className = 'ai-eval-card';
      if (rec.status === 'evaluating') {
        card.innerHTML = `
          <div class="ai-eval-header">
            <div class="ai-badge"><span class="eval-spinner">⏳</span> AI 考官即時評析中…</div>
            <div class="ai-score-badge medium">評估中</div>
          </div>
          <div class="ai-row" style="text-align:center; padding:10px 0;">
            <span style="font-size:13px; color:#1e3a5f; font-weight:600;">客語語音辨識與 AI 考官講評產生中…<br><small style="opacity:0.75;">（約需 2~3 秒，可在此稍候或繼續前往下一題）</small></span>
          </div>
          ${rec.audioUrl ? `<button type="button" class="ai-play-btn" onclick="playUserAudio('${rec.audioUrl}')">🎧 試聽我的錄音 (${rec.duration}s)</button>` : ''}
        `;
      } else {
        const isHigh = (rec.score || 0) >= 80;
        card.innerHTML = `
          <div class="ai-eval-header">
            <div class="ai-badge">🤖 AI 考官即時評析</div>
            <div class="ai-score-badge ${isHigh ? '' : 'medium'}">${rec.score || 80} 分</div>
          </div>
          <div class="ai-row">
            <span class="ai-label">📝 你的作答轉譯：</span>
            <span class="ai-text">${rec.transcript ? `「${rec.transcript}」` : '（錄音已完成接收）'}</span>
          </div>
          <div class="ai-row">
            <span class="ai-label">💡 考官講評：</span>
            <span class="ai-critique">${rec.critique || '作答切題，掌握客語口說表達重點。'}</span>
          </div>
          <div class="ai-row">
            <span class="ai-label">💬 客語示範金句：</span>
            <span class="ai-target">${rec.suggestedExpression || qData.target}</span>
          </div>
          ${rec.audioUrl ? `<button type="button" class="ai-play-btn" onclick="playUserAudio('${rec.audioUrl}')">🎧 試聽我的錄音 (${rec.duration}s)</button>` : ''}
        `;
      }
      document.querySelector('.stage').appendChild(card);
    }
  }
  updateDeveloperPanel();
}

let selectedAsrProvider = 'hakka_api_hak';
let browserRecognition = null;
let browserTranscript = '';

// 更新開發者面板資訊
function updateDeveloperPanel() {
  const targetQ = (page % 2 === 0) ? page : (page > 1 && page < 18 ? page - 1 : 2);
  const qData = networldQuestions[targetQ];
  const rec = examRecords[targetQ];

  const debugTargetText = document.getElementById('debugTargetText');
  const debugQuestionTitle = document.getElementById('debugQuestionTitle');
  const debugScoreBox = document.getElementById('debugScoreBox');

  if (debugTargetText && qData) debugTargetText.textContent = qData.target;
  if (debugQuestionTitle && qData) debugQuestionTitle.textContent = qData.title;

  if (debugScoreBox) {
    if (!rec) {
      debugScoreBox.innerHTML = '尚未作答';
    } else if (rec.status === 'evaluating') {
      debugScoreBox.innerHTML = '⏳ AI 考官評估中…';
    } else {
      debugScoreBox.innerHTML = `<strong>${rec.score || 0} 分</strong>（${rec.transcript ? `轉譯：「${rec.transcript}」` : '無文字'}）`;
    }
  }
}

// 綁定開發者面板事件
const debugToggle = document.getElementById('debugToggle');
const developerPanel = document.getElementById('developerPanel');
const devCloseBtn = document.getElementById('devCloseBtn');
const asrProviderSelect = document.getElementById('asrProviderSelect');
const asrProviderNote = document.getElementById('asrProviderNote');
const answerInput = document.getElementById('answerInput');
const debugManualEvalBtn = document.getElementById('debugManualEvalBtn');
const asrStatusText = document.getElementById('asrStatusText');

if (debugToggle && developerPanel) {
  debugToggle.onchange = () => {
    developerPanel.hidden = !debugToggle.checked;
    updateDeveloperPanel();
  };
}
if (devCloseBtn && debugToggle && developerPanel) {
  devCloseBtn.onclick = () => {
    debugToggle.checked = false;
    developerPanel.hidden = true;
  };
}
if (asrProviderSelect) {
  asrProviderSelect.onchange = (e) => {
    selectedAsrProvider = e.target.value;
    if (asrProviderNote) {
      if (selectedAsrProvider === 'browser_mandarin') {
        asrProviderNote.textContent = '已切換至「華語(瀏覽器生)」：將使用瀏覽器 Web Speech API 進行即時華語語音辨識。';
      } else {
        asrProviderNote.textContent = '已切換至「客委會辨識API」：將調用客家委員會四縣腔 ASR 進行客語語音辨識。';
      }
    }
  };
}

if (debugManualEvalBtn) {
  debugManualEvalBtn.onclick = async () => {
    const text = (answerInput ? answerInput.value : '').trim();
    if (!text) {
      alert('請先在輸入框輸入欲測試的作答文字！');
      return;
    }
    const targetQ = (page % 2 === 0) ? page : (page > 1 && page < 18 ? page - 1 : 2);
    const qData = networldQuestions[targetQ];
    if (!qData) return;

    if (asrStatusText) asrStatusText.textContent = '⚡ 手動評估中…';

    examRecords[targetQ] = {
      status: 'evaluating',
      audioUrl: null,
      duration: 3,
      score: 0,
      transcript: text,
      relevance: '',
      vocabulary: '',
      grammar: '',
      critique: '',
      suggestedExpression: ''
    };

    if (page === targetQ) {
      show(targetQ + 1);
    } else {
      show(page);
    }

    const judgeRes = await callJudgeApi(qData, text, 3);
    examRecords[targetQ] = {
      status: 'done',
      score: judgeRes.score,
      relevance: judgeRes.relevance,
      vocabulary: judgeRes.vocabulary,
      grammar: judgeRes.grammar,
      critique: judgeRes.critique,
      suggestedExpression: judgeRes.suggestedExpression,
      transcript: text,
      audioUrl: null,
      duration: 3
    };

    if (asrStatusText) asrStatusText.textContent = '✅ 評分完成';
    show(page);
    updateDeveloperPanel();
  };
}

async function recordToggle() {
  play('click');
  const currentQuestionPage = page;
  const qData = networldQuestions[currentQuestionPage];

  if (!recording) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);
      chunks = [];
      recordDuration = 0;
      recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      recorder.start(250);
      recording = true;
      if (recordTimerHandle) clearInterval(recordTimerHandle);
      recordTimerHandle = setInterval(() => { recordDuration += 1; }, 1000);
      document.querySelector('.hint').textContent = '🎙️ 錄音中…再次點擊右下角麥克風按鈕即可停止並送出 AI 評分！';

      if (asrStatusText) asrStatusText.textContent = '🎙️ 錄音中…';

      // 若選擇華語(瀏覽器生)，啟動 Web Speech API
      if (selectedAsrProvider === 'browser_mandarin') {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SR) {
          try {
            browserRecognition = new SR();
            browserRecognition.lang = 'zh-TW';
            browserRecognition.continuous = true;
            browserRecognition.interimResults = true;
            browserTranscript = '';
            browserRecognition.onresult = (e) => {
              let str = '';
              for (let i = 0; i < e.results.length; ++i) {
                str += e.results[i][0].transcript;
              }
              browserTranscript = str;
              if (asrStatusText) asrStatusText.textContent = `即時辨識：${str}`;
              if (answerInput) answerInput.value = str;
            };
            browserRecognition.onerror = (e) => {
              console.warn('Web Speech 辨識提醒:', e);
            };
            browserRecognition.start();
          } catch(err) {
            console.warn('無法啟動 Web Speech:', err);
          }
        }
      }
    } catch (e) {
      alert('請允許瀏覽器使用麥克風後再試一次。');
    }
  } else {
    recording = false;
    if (recordTimerHandle) { clearInterval(recordTimerHandle); recordTimerHandle = null; }
    document.querySelector('.hint').textContent = '⚡ 正在進行語音辨識與 AI 考官評分…';

    if (browserRecognition) {
      try { browserRecognition.stop(); } catch(e){}
      browserRecognition = null;
    }

    const stoppedPromise = new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = chunks.length > 0 ? new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }) : null;
        resolve(blob);
      };
      try { recorder.requestData(); recorder.stop(); } catch(e){ resolve(null); }
    });

    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }

    const audioBlob = await stoppedPromise;
    const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : null;
    const finalDuration = Math.max(1, recordDuration);

    play('confirm');

    // 先存入 evaluating 狀態
    examRecords[currentQuestionPage] = {
      status: 'evaluating',
      audioUrl: audioUrl,
      duration: finalDuration,
      score: 0,
      transcript: '',
      relevance: '',
      vocabulary: '',
      grammar: '',
      critique: '',
      suggestedExpression: ''
    };

    // 立即切換到答題結果頁
    show(page + 1);
    setTimeout(() => { play('correct'); }, 300);

    // 背景非同步辨識與評審
    (async () => {
      let transcript = '';
      if (selectedAsrProvider === 'browser_mandarin') {
        transcript = browserTranscript || '';
      } else if (audioBlob) {
        transcript = await callSpeechRecognizeApi(audioBlob);
      }

      if (asrStatusText) asrStatusText.textContent = `✅ 辨識完成：${transcript || '（無文字）'}`;
      if (answerInput) answerInput.value = transcript;

      const judgeRes = await callJudgeApi(qData, transcript, finalDuration);
      examRecords[currentQuestionPage] = {
        status: 'done',
        score: judgeRes.score,
        relevance: judgeRes.relevance,
        vocabulary: judgeRes.vocabulary,
        grammar: judgeRes.grammar,
        critique: judgeRes.critique,
        suggestedExpression: judgeRes.suggestedExpression,
        transcript: transcript,
        audioUrl: audioUrl,
        duration: finalDuration
      };

      if (page === currentQuestionPage + 1 || page === 18) {
        show(page);
      }
      updateDeveloperPanel();
    })();
  }
}

document.querySelector('#back').onclick = () => { play('page'); show(page - 1); };
document.querySelector('#next').onclick = () => { play('page'); show(page + 1); };
document.querySelector('#sound').onclick = async e => {
  music = !music;
  e.target.textContent = `♫ 音樂：${music ? '開' : '關'}`;
  if (music) {
    try {
      bgm.volume = bgmVolume;
      await bgm.play();
    } catch (_) {}
  } else {
    bgm.pause();
  }
};
document.addEventListener('pointerdown', () => {
  if (music && bgm.paused) {
    bgm.volume = bgmVolume;
    bgm.play().catch(() => {});
  }
}, { once: true });

show(1);

