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
        critique: data.critique || '作答切題，掌握客語口說表達重點。',
        suggestedExpression: data.suggestedExpression || q.target
      };
    }
  } catch (e) {
    console.warn('AI 考官評審異常：', e);
  }

  return {
    score: 80,
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

function show(n) {
  page = Math.max(1, Math.min(18, n));
  img.src = `assets/images/screen-${String(page).padStart(2, '0')}.jpg`;
  document.querySelector('#status').textContent = `${page} / 18`;
  hs.innerHTML = '';

  // 移除舊的 AI 評分卡片
  const oldCard = document.querySelector('.ai-eval-card');
  if (oldCard) oldCard.remove();

  if (page === 18) {
    let b = document.createElement('button');
    b.className = 'restart';
    b.textContent = '重新挑戰';
    b.onclick = () => { play('select'); show(1); };
    hs.appendChild(b);

    let ret = document.createElement('button');
    ret.className = 'restart';
    ret.style.bottom = '1.8%';
    ret.style.background = '#2f946f';
    ret.style.fontSize = 'clamp(14px,1.5vw,22px)';
    ret.textContent = '返回選單';
    ret.onclick = () => { location.href = '../classroom.html'; };
    hs.appendChild(ret);

    play('achievement');
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
          <span class="ai-critique">${rec.critique || '作答表現良好！'}</span>
        </div>
        <div class="ai-row">
          <span class="ai-label">💬 客語示範金句：</span>
          <span class="ai-target">${rec.suggestedExpression || qData.target}</span>
        </div>
        ${rec.audioUrl ? `<button type="button" class="ai-play-btn" onclick="playUserAudio('${rec.audioUrl}')">🎧 試聽我的錄音 (${rec.duration}s)</button>` : ''}
      `;
      document.querySelector('.stage').appendChild(card);
    }
  }
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
    } catch (e) {
      alert('請允許瀏覽器使用麥克風後再試一次。');
    }
  } else {
    recording = false;
    if (recordTimerHandle) { clearInterval(recordTimerHandle); recordTimerHandle = null; }
    document.querySelector('.hint').textContent = '⚡ 正在進行客語語音辨識與 AI 考官評分…';

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

    // 立即切換到答題結果頁，同時背景非同步評審
    show(page + 1);
    setTimeout(() => { play('correct'); }, 300);

    // 背景呼叫真實 ASR + AI 評審
    if (audioBlob && qData) {
      const transcript = await callSpeechRecognizeApi(audioBlob);
      const judgeRes = await callJudgeApi(qData, transcript, finalDuration);

      examRecords[currentQuestionPage] = {
        score: judgeRes.score,
        critique: judgeRes.critique,
        suggestedExpression: judgeRes.suggestedExpression,
        transcript: transcript,
        audioUrl: audioUrl,
        duration: finalDuration
      };

      // 若使用者仍停留在該結果頁，刷新 AI 卡片
      if (page === currentQuestionPage + 1) {
        show(page);
      }
    }
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
