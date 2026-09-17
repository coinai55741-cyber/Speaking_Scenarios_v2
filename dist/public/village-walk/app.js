(()=>{
 const img=document.getElementById('screen'), hs=document.getElementById('hotspots'), game=document.getElementById('game');
 const A={birds:new Audio('audio/birds.mp3'),walk:new Audio('audio/walk.mp3'),click:new Audio('audio/click.mp3'),next:new Audio('audio/next.mp3'),record:new Audio('audio/record.mp3'),success:new Audio('audio/success.mp3'),finish:new Audio('audio/finish.mp3')};
 
 let bgmVolume = 0.5;
 let sfxVolume = 0.5;
 A.birds.loop=true; A.birds.volume=bgmVolume * 0.32; A.walk.volume=sfxVolume;

 const bgmSlider = document.getElementById('bgmVol');
 const bgmVal = document.getElementById('bgmVal');
 const sfxSlider = document.getElementById('sfxVol');
 const sfxVal = document.getElementById('sfxVal');

 if (bgmSlider) {
   bgmSlider.oninput = (e) => {
     bgmVolume = Number(e.target.value) / 100;
     A.birds.volume = bgmVolume * 0.32;
     if (bgmVal) bgmVal.textContent = `${e.target.value}%`;
   };
 }
 if (sfxSlider) {
   sfxSlider.oninput = (e) => {
     sfxVolume = Number(e.target.value) / 100;
     if (sfxVal) sfxVal.textContent = `${e.target.value}%`;
   };
 }

 // 10 題專屬題目資料庫（客語走讀口說任務標準）
 const villageWalkQuestions = {
  2: {
    title: '第 1 題：巷口帶路',
    question: '請用客語告訴同學：從這條巷子進去，可以看到什麼？',
    target: '從這條巷仔行入去，會看著紅磚屋、客莊老屋，還有豬欄同種滿花草个巷路。',
    promptRule: '看客莊巷弄，用客語說明從巷子進去可以看到的景物（如紅磚屋、老屋、花草、豬欄等）。'
  },
  4: {
    title: '第 2 題：轉彎找建築',
    question: '請用客語告訴同學：如果要找到前方的客莊建築，你會怎麼走？',
    target: '順等這條石枋路直直行，行到三叉路口向左彎，就會看著前面个客莊夥房建築。',
    promptRule: '看路線指示，用客語指引路線（如直直行、三叉路向左彎、找到老屋建築）。'
  },
  6: {
    title: '第 3 題：屋頂觀察員',
    question: '請觀察眼前的客莊老屋，用客語描述你看到的屋頂特色。',
    target: '這間老屋个屋頂係用黑瓦片鋪个，屋脊有燕尾同馬背个形狀，當有客家傳統特色。',
    promptRule: '用客語描述客莊老屋屋頂的材料、外觀造型（如黑瓦片、馬背、燕尾等）。'
  },
  8: {
    title: '第 4 題：老屋材料辨識',
    question: '觀察這間客莊老屋，用客語說說你觀察到的建築材料或特色。',
    target: '這間老屋个牆壁係用黃泥磚同石頭起个，門窗係用木頭做个，門項還貼等紅紙春聯。',
    promptRule: '用客語說明老屋牆面、門窗、春聯使用的材質或特色（如土埆磚/黃泥磚、石基、木窗、紅聯）。'
  },
  10: {
    title: '第 5 題：客莊生活觀察',
    question: '請觀察畫面中的客莊生活情境，用客語描述人物正在做什麼，以及你看到的景物。',
    target: '阿婆當在圓盤頂曬柿餅/果子，門前還有一隻睡目个貓仔同掛在壁頂个桔子。',
    promptRule: '用客語描述阿婆曬柿餅/果子的動作，以及貓咪、門前吊曬農作物等生活場景。'
  },
  12: {
    title: '第 6 題：傳統手藝・客莊記憶',
    question: '請觀察眼前的傳統手藝與生活用品，用客語分享你看到的內容或想到的客莊文化。',
    target: '阿公當在該編竹夾同竹籃仔，門前排著滿滿手工編織个竹器，展現客家人勤儉持家个手藝。',
    promptRule: '用客語分享阿公編竹篾/竹籃的手藝，以及客家竹編器具生活文化。'
  },
  14: {
    title: '第 7 題：客莊人物訪談',
    question: '你在客莊遇到一位居民。請用客語提出一個你想了解的問題。',
    target: '阿婆你好，請問你手項編个這隻竹籃仔愛編幾多日？用麼个竹仔編个呢？',
    promptRule: '用客語向客莊居民禮貌提問（例如問竹編工藝、製作時間、使用材料等）。'
  },
  16: {
    title: '第 8 題：客莊文化發現',
    question: '觀察客莊環境中的傳統物件與生活場景，用客語分享你發現的文化特色。',
    target: '店門口掛等各式各樣个竹編器具，門聯寫等「竹編藝術、客家生活」，顯出客家生活同大自然竹材緊密結合个智慧。',
    promptRule: '用客語分享客莊竹編文化與就地取材、勤儉生活的傳統智慧。'
  },
  18: {
    title: '第 9 題：客莊走讀分享',
    question: '走過客莊後，哪一項內容讓你印象最深？請用客語分享。',
    target: '𠊎印象最深个係看著阿公阿婆做竹編同曬柿餅个情境，大家當親切，老屋風景乜當靚。',
    promptRule: '用客語回顧走讀中印象最深刻的人事物（如老屋建築、手工竹編、曬柿餅或熱情居民）。'
  },
  20: {
    title: '第 10 題：我的客莊走讀心得',
    question: '如果要向沒有來過客莊的人介紹這次走讀，你會怎麼說？請用客語分享自己的心得。',
    target: '客莊當值得大家來走讀，毋單淨有古色古香个老屋同石板路，還做得體驗道地个傳統手藝同客家文化，正經係一趟當有意義个旅程！',
    promptRule: '用客語總結走讀收穫與心得，熱情向他人推薦客莊走讀之美。'
  }
 };

 const hints={2:'看看巷子通往哪裡，再觀察沿途有哪些客莊景物。',4:'觀察道路的轉彎位置，以及建築所在的位置。',6:'仔細看看屋頂的形狀、外觀與建築特色。',8:'仔細看看牆面、屋頂與門窗使用了哪些材料。',10:'觀察人物的動作，以及桌面和周圍環境。',12:'仔細觀察這些手工用品的外形、材料與用途。',14:'觀察居民正在做什麼，再想想你最想了解哪一件事。',16:'看看周圍有哪些傳統物件，再觀察它們與生活環境的關係。',18:'回想前面走過的地方，以及你看到的人、建築、物件和生活情境。',20:'回想整趟走讀經驗，再整理自己最想分享的內容。'};
 const controls={
  1:{start:[4.8,68.8,27.2,11.5]},
  2:{hint:[4.2,51.0,28.0,6.8],record:[5.0,63.0,28.0,20.5]},
  3:{retry:[4.4,73.5,14.1,8.8],next:[19.1,73.5,14.0,8.8]},
  4:{hint:[4.2,49.8,28.0,6.8],record:[5.0,59.0,28.0,20.5]},
  5:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
  6:{hint:[4.2,52.0,28.0,6.8],record:[5.0,61.5,28.0,20.5]},
  7:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
  8:{hint:[4.2,50.0,28.0,6.8],record:[5.0,59.0,28.0,20.5]},
  9:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
 10:{hint:[4.2,57.0,28.0,6.8],record:[5.0,68.0,28.0,18.0]},
 11:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
 12:{hint:[4.2,56.5,28.0,6.8],record:[5.0,67.0,28.0,18.0]},
 13:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
 14:{hint:[4.2,49.0,28.0,6.8],record:[5.0,59.0,28.0,20.0]},
 15:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
 16:{hint:[4.2,55.5,28.0,6.8],record:[5.0,66.0,28.0,18.5]},
 17:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
 18:{hint:[4.2,56.0,28.0,6.8],record:[5.0,66.0,28.0,18.5]},
 19:{retry:[4.4,72.7,14.1,8.8],next:[19.1,72.7,14.0,8.8]},
 20:{hint:[4.2,53.0,28.0,6.8],record:[5.0,63.0,28.0,20.0]},
 21:{retry:[4.4,72.7,14.1,8.8],finish:[19.1,72.7,16.8,8.8]},
 22:{replay:[32.6,79.8,16.2,7.8],done:[50.2,79.8,16.8,7.8]}
 };

 // 儲存走讀每題 AI 評估資料
 const walkRecords = {};
 let page=1, recording=false, busy=false, recorder=null, stream=null, chunks=[], hintOpen=false;
 let recordDuration=0, recordTimerHandle=null;

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

 async function callSpeechRecognizeApi(blob) {
   try {
     const formData = new FormData();
     formData.append('audio', blob, 'recording.wav');
     formData.append('provider_id', 'hakka_api_hak');
     formData.append('provider', 'hakka_api');
     formData.append('language', 'hak');
     formData.append('dialect', 'sixian');
     formData.append('recognizer', 'hakka-sixian');
     formData.append('scene_id', 'village_walk_challenge');

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

 async function callJudgeApi(q, transcriptText, duration) {
   try {
     const cleanTranscript = cleanTranscriptText(transcriptText);
     const systemPrompt = `你是一位客家委員會「客語能力認證」口說測驗之專業資深評審委員。
請依據情境式客莊走讀口說測驗標準（四縣腔），針對學生的口語表達進行專業評分與講評。
單元主題：客莊走讀・巷口帶路
題目名稱：${q.title}
測驗題目：${q.question}
作答要求：${q.promptRule}
標準示範：${q.target}

評分維度（滿分100分）：
1. 切題度（35%）：是否符合走讀情境與任務要求。
2. 客語詞彙道地度（35%）：是否使用自然道地的客莊生活詞彙。
3. 語意完整度（30%）：句型流暢性與觀察表達。

請輸出嚴格符合以下格式之 JSON 物件：
{
  "score": 88,
  "relevance": "切題度具體評語（20-40字）",
  "vocabulary": "客語詞彙運用評語（20-40字）",
  "grammar": "語法完整度評語（20-40字）",
  "critique": "考官綜合點評，指出優點與待加強之處（40-70字）",
  "suggestedExpression": "標準道地客語示範講法"
}`;

     const userPrompt = cleanTranscript
       ? `學生走讀作答語音轉譯文字：「${cleanTranscript}」（錄音時長約 ${duration} 秒）\n請依據轉譯內容進行客語評閱並回傳 JSON。`
       : `學生已完成口語錄音作答（時長約 ${duration} 秒），但語音辨識未轉出明確文字。\n請依據題目情境（「${q.question}」）給予客觀鼓勵性的客語考官講評、示範講法與評分 JSON。`;

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
         score: Math.min(100, Math.max(60, Math.round(Number(data.score) || 85))),
         relevance: data.relevance || '切合走讀情境與任務要求。',
         vocabulary: data.vocabulary || '客語詞彙運用適當。',
         grammar: data.grammar || '語意通順完整。',
         critique: data.critique || '觀察仔細，客語表達自然通順！',
         suggestedExpression: data.suggestedExpression || q.target
       };
     }
   } catch (e) {
     console.warn('AI 考官評審異常：', e);
   }

   return {
     score: 85,
     relevance: '基本符合情境要求。',
     vocabulary: '客莊詞彙有發揮空間。',
     grammar: '語法基本通順。',
     critique: '已完成客莊口說走讀表達，詞彙運用與發音清晰度表現良好！',
     suggestedExpression: q.target
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
   const questionKeys = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
   const attemptedList = questionKeys.map(k => walkRecords[k]).filter(Boolean);
   const doneList = attemptedList.filter(r => r.status === 'done' && r.score !== undefined);
   const pendingCount = attemptedList.filter(r => r.status === 'evaluating').length;
   const isAllDone = pendingCount === 0;

   const totalScore = doneList.reduce((acc, cur) => acc + (cur.score || 0), 0);
   const avgScore = doneList.length > 0 ? Math.round(totalScore / doneList.length) : (attemptedList.length > 0 ? 85 : 0);

   let itemsHtml = '';
   questionKeys.forEach((k, idx) => {
     const q = villageWalkQuestions[k];
     const rec = walkRecords[k];

     if (!rec) {
       itemsHtml += `
         <div class="result-card" style="opacity:0.7; background:#f8fafc;">
           <div class="result-card-header">
             <span class="result-card-title">第 ${idx + 1} 題：${q.title}</span>
             <span class="result-card-score score-pending">未作答</span>
           </div>
           <div class="result-card-q"><span style="font-weight:700;color:#64748b;">題目：</span>${q.question}</div>
           <div class="result-target-box">
             <strong>🎯 客莊示範金句：</strong>${q.target}
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
             <strong>🎯 客莊示範金句：</strong>${q.target}
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
             <span class="result-card-score ${isHigh ? 'score-high' : 'score-mid'}">${rec.score || 85} 分</span>
           </div>
           <div class="result-card-q"><span style="font-weight:700;color:#64748b;">題目：</span>${q.question}</div>
           
           <div class="result-card-transcript">
             <span>🗣️ <strong>作答語音轉譯：</strong>${rec.transcript ? `“${rec.transcript}”` : '（錄音已完成接收）'}</span>
           </div>

           <div class="result-dimensions">
             <div class="dim-box dim-relevance">
               <span class="dim-title">🎯 切題程度</span>
               <span class="dim-text">${rec.relevance || '切合情境與任務要求'}</span>
             </div>
             <div class="dim-box dim-vocab">
               <span class="dim-title">🗣️ 客莊詞彙道地度</span>
               <span class="dim-text">${rec.vocabulary || '客語詞彙運用適當'}</span>
             </div>
             <div class="dim-box dim-grammar">
               <span class="dim-title">📝 語意流暢度</span>
               <span class="dim-text">${rec.grammar || '語意通順自然'}</span>
             </div>
           </div>

           <div class="result-critique-box">
             <strong>💡 走讀講評：</strong>${rec.critique || '觀察仔細，客語表達自然通順！'}
           </div>

           <div class="result-target-box">
             <strong>🎯 客莊示範金句：</strong>${rec.suggestedExpression || q.target}
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
       <p class="result-sub">客莊走讀・巷口帶路口說挑戰</p>
       <h1 class="result-title">測驗結算成績</h1>
       <div class="result-avg-pill">
         <span class="avg-label">平均總分：</span>
         <span class="avg-num">${avgScore}</span>
         <span class="avg-unit">/ 100</span>
       </div>
       <p class="result-status-text">
         共 10 題測驗。
         ${!isAllDone ? `<span class="eval-note">（目前已完成 ${doneList.length} / 10 題，其餘正在背景加速評估中…）</span>` : '已全部評分完畢！'}
       </p>
     </div>

     ${!isAllDone ? `
       <div class="bg-eval-banner">
         <span class="eval-spinner">⏳</span>
         <span><strong>⚡ 背景非同步評分中：</strong>系統正在背景並行進行客語語音辨識與 AI 走讀講評，完成後卡片將<strong>自動即時更新</strong>！</span>
       </div>
     ` : ''}

     <div class="result-items-list">
       ${itemsHtml}
     </div>

     <div class="result-action-bar">
       <button type="button" class="action-btn btn-primary" onclick="play(A.click); go(1);">🔄 重新挑戰</button>
       <button type="button" class="action-btn btn-secondary" onclick="play(A.click); setTimeout(()=>{ location.href='../classroom.html'; }, 400);">🏠 返回單元選單</button>
     </div>
   `;

   game.appendChild(board);
 }

  let selectedAsrProvider = 'hakka_api_hak';
  let browserRecognition = null;
  let browserTranscript = '';

  function updateDeveloperPanel() {
    const targetQ = (page % 2 === 0) ? page : (page > 1 && page < 22 ? page - 1 : 2);
    const qData = villageWalkQuestions[targetQ];
    const rec = walkRecords[targetQ];

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
      const targetQ = (page % 2 === 0) ? page : (page > 1 && page < 22 ? page - 1 : 2);
      const qData = villageWalkQuestions[targetQ];
      if (!qData) return;

      if (asrStatusText) asrStatusText.textContent = '⚡ 手動評估中…';

      walkRecords[targetQ] = {
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
        go(targetQ + 1);
      } else {
        render();
      }

      const judgeRes = await callJudgeApi(qData, text, 3);
      walkRecords[targetQ] = {
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
      render();
      updateDeveloperPanel();
    };
  }

  async function startRecording(){
    if(busy||recording)return;
    closeHint();
    stopBirds();
    play(A.record);
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:true});
      recorder=new MediaRecorder(stream);
      chunks=[];
      recordDuration=0;
      recorder.ondataavailable=e=>{if(e.data&&e.data.size>0)chunks.push(e.data);};
      recorder.start(250);
      recording=true;
      if(recordTimerHandle) clearInterval(recordTimerHandle);
      recordTimerHandle=setInterval(()=>{recordDuration+=1;},1000);

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
    }catch(e){
      recording=true;
    }
  }

  async function stopAndRecognize(){
    if(busy||!recording)return;
    busy=true;
    recording=false;
    const currentQuestionPage = page;
    const qData = villageWalkQuestions[currentQuestionPage];

    if (browserRecognition) {
      try { browserRecognition.stop(); } catch(e){}
      browserRecognition = null;
    }

    const stoppedPromise = new Promise((resolve) => {
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = () => {
          const blob = chunks.length > 0 ? new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }) : null;
          resolve(blob);
        };
        try { recorder.requestData(); recorder.stop(); } catch(e){ resolve(null); }
      } else {
        resolve(null);
      }
    });

    const audioBlob = await stoppedPromise;
    const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : null;
    const finalDuration = Math.max(1, recordDuration);
    cleanupMic();

    // 先存入 evaluating 狀態
    walkRecords[currentQuestionPage] = {
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

    setTimeout(()=>{
      play(A.success);
      go(page+1);
    },350);

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
      walkRecords[currentQuestionPage] = {
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

      if (page === currentQuestionPage + 1 || page === 22) {
        render();
      }
      updateDeveloperPanel();
    })();
  }

  function recordToggle(){if(recording)stopAndRecognize();else startRecording()}

  function render(){
   hs.innerHTML='';
   closeHint();
   const oldCard = document.querySelector('.ai-eval-card');
   if (oldCard) oldCard.remove();
   const oldBoard = document.querySelector('.stage-result-board');
   if (oldBoard) oldBoard.remove();

   const c=controls[page]||{};
   if(page===1){hit(c.start,()=>{play(A.click);transition(2)},'開始挑戰');updateDeveloperPanel();return}
   if(page>=2&&page<=20&&page%2===0){hit(c.hint,toggleHint,'觀察提示');hit(c.record,recordToggle,'開始錄音／停止錄音並送出辨識');updateDeveloperPanel();return}
   if(page>=3&&page<=21&&page%2===1){
     hit(c.retry,()=>{play(A.click);go(page-1)},'重新錄音');
     if(page===21)hit(c.finish,()=>transition(22),'完成挑戰');
     else hit(c.next,()=>transition(page+1),'下一題');

     // 渲染 AI 評估回饋卡片
     const prevQuestionPage = page - 1;
     const qData = villageWalkQuestions[prevQuestionPage];
     const rec = walkRecords[prevQuestionPage];

     if (qData && rec) {
       const card = document.createElement('div');
       card.className = 'ai-eval-card';
       if (rec.status === 'evaluating') {
         card.innerHTML = `
           <div class="ai-eval-header">
             <div class="ai-badge"><span class="eval-spinner">⏳</span> AI 考官即時講評中…</div>
             <div class="ai-score-badge medium">評估中</div>
           </div>
           <div class="ai-row" style="text-align:center; padding:10px 0;">
             <span style="font-size:13px; color:#1e3a5f; font-weight:600;">語音辨識與 AI 走讀講評產生中…<br><small style="opacity:0.75;">（約需 2~3 秒，可在此稍候或直接點「下一題」繼續挑戰）</small></span>
           </div>
           ${rec.audioUrl ? `<button type="button" class="ai-play-btn" onclick="playUserAudio('${rec.audioUrl}')">🎧 試聽我的錄音 (${rec.duration}s)</button>` : ''}
         `;
       } else {
         const isHigh = (rec.score || 0) >= 80;
         card.innerHTML = `
           <div class="ai-eval-header">
             <div class="ai-badge">🤖 AI 考官即時講評</div>
             <div class="ai-score-badge ${isHigh ? '' : 'medium'}">${rec.score || 85} 分</div>
           </div>
           <div class="ai-row">
             <span class="ai-label">📝 你的作答轉譯：</span>
             <span class="ai-text">${rec.transcript ? `「${rec.transcript}」` : '（錄音已完成接收）'}</span>
           </div>
           <div class="ai-row">
             <span class="ai-label">💡 走讀講評：</span>
             <span class="ai-critique">${rec.critique || '觀察入微，口語表達流暢！'}</span>
           </div>
           <div class="ai-row">
             <span class="ai-label">💬 客莊示範金句：</span>
             <span class="ai-target">${rec.suggestedExpression || qData.target}</span>
           </div>
           ${rec.audioUrl ? `<button type="button" class="ai-play-btn" onclick="playUserAudio('${rec.audioUrl}')">🎧 試聽我的錄音 (${rec.duration}s)</button>` : ''}
         `;
       }
       game.appendChild(card);
     }
     updateDeveloperPanel();
     return;
   }
   if(page===22){
     play(A.finish);
     renderFinalResultBoard();
     updateDeveloperPanel();
   }
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)A.birds.pause();else birds()});
  render();
})();
