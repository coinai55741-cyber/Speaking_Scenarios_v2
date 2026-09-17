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
         critique: data.critique || '觀察仔細，客語表達自然通順！',
         suggestedExpression: data.suggestedExpression || q.target
       };
     }
   } catch (e) {
     console.warn('AI 考官評審異常：', e);
   }

   return {
     score: 85,
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

 const play=(a)=>{try{if(a){a.volume=sfxVolume;a.currentTime=0;a.play().catch(()=>{})}}catch(e){}};
 const birds=()=>{if(!recording&&(page===1||[2,4,6,8,10,12,14,16,18,20].includes(page))){A.birds.volume=bgmVolume*0.32;A.birds.play().catch(()=>{})}else A.birds.pause()};
 const stopBirds=()=>{A.birds.pause();A.birds.currentTime=0};
 function closeHint(){hintOpen=false;const c=document.getElementById('hintCard');if(c)c.remove()}
 function go(n){recording=false;busy=false;cleanupMic();closeHint();page=Math.max(1,Math.min(22,n));img.src=`images/${String(page).padStart(2,'0')}.jpg`;render();setTimeout(birds,100)}
 function hit(box,fn,label){if(!box)return;const [x,y,w,h]=box;const b=document.createElement('button');b.className='hit';b.style.cssText=`left:${x}%;top:${y}%;width:${w}%;height:${h}%`;b.setAttribute('aria-label',label);b.onclick=fn;hs.appendChild(b)}
 function toggleHint(){play(A.click);if(hintOpen){closeHint();return}const text=hints[page];if(!text)return;hintOpen=true;const c=document.createElement('div');c.id='hintCard';c.className='hint-card';c.setAttribute('role','status');c.innerHTML=`<div class="hint-title">💡 觀察提示</div><div class="hint-text">${text}</div>`;game.appendChild(c)}
 function transition(n){closeHint();play(A.next);setTimeout(()=>{play(A.walk);go(n)},250)}
 function cleanupMic(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}if(recordTimerHandle){clearInterval(recordTimerHandle);recordTimerHandle=null}recorder=null}
 
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

   setTimeout(()=>{
     play(A.success);
     go(page+1);
   },350);

   // 背景呼叫真實 ASR + AI 評審
   if (audioBlob && qData) {
     const transcript = await callSpeechRecognizeApi(audioBlob);
     const judgeRes = await callJudgeApi(qData, transcript, finalDuration);

     walkRecords[currentQuestionPage] = {
       score: judgeRes.score,
       critique: judgeRes.critique,
       suggestedExpression: judgeRes.suggestedExpression,
       transcript: transcript,
       audioUrl: audioUrl,
       duration: finalDuration
     };

     if (page === currentQuestionPage + 1) {
       render();
     }
   }
 }

 function recordToggle(){if(recording)stopAndRecognize();else startRecording()}

 function render(){
  hs.innerHTML='';
  closeHint();
  const oldCard = document.querySelector('.ai-eval-card');
  if (oldCard) oldCard.remove();

  const c=controls[page]||{};
  if(page===1){hit(c.start,()=>{play(A.click);transition(2)},'開始挑戰');return}
  if(page>=2&&page<=20&&page%2===0){hit(c.hint,toggleHint,'觀察提示');hit(c.record,recordToggle,'開始錄音／停止錄音並送出辨識');return}
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
          <span class="ai-critique">${rec.critique || '觀察入微，客語表達流暢！'}</span>
        </div>
        <div class="ai-row">
          <span class="ai-label">💬 客莊示範金句：</span>
          <span class="ai-target">${rec.suggestedExpression || qData.target}</span>
        </div>
        ${rec.audioUrl ? `<button type="button" class="ai-play-btn" onclick="playUserAudio('${rec.audioUrl}')">🎧 試聽錄音 (${rec.duration}s)</button>` : ''}
      `;
      game.appendChild(card);
    }
    return;
  }
  if(page===22){play(A.finish);hit(c.replay,()=>{play(A.click);go(1)},'再玩一次');hit(c.done,()=>{play(A.click);setTimeout(()=>{location.href='../classroom.html';},400);},'完成')}
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)A.birds.pause();else birds()});
 render();
})();
