(() => {
  'use strict';
  const lesson = window.READING_LESSON;
  const $ = id => document.getElementById(id);
  const answers = lesson.passages.map(() => ({ blob: null, url: '', transcript: '', completed: false, seconds: 0 }));
  let current = 0, phase = 'ready', recorder = null, stream = null, timer = null, started = 0;
  let request = null, generation = 0, leaving = false;
  const diagnostics = new WeakMap();
  const diagnostic = () => {
    const answer = answers[current];
    if (!diagnostics.has(answer)) diagnostics.set(answer, { status: '尚未送出', draft: '', tested: false });
    return diagnostics.get(answer);
  };
  function recognitionMode() {
    if ($('asrProviderSelect')?.value === 'taiwan_tongues_zh') return 'file';
    return $('recognitionModeSelect') ? $('recognitionModeSelect').value : 'realtime';
  }
  function developerAnswerLines() {
    const passage = lesson.passages[current];
    return $('asrProviderSelect').value === 'taiwan_tongues_zh' ? passage.mandarinLines : passage.lines;
  }
  function updateDeveloperMode() {
    const enabled = Boolean($('debugToggle').checked);
    $('developerPanel').hidden = !enabled;
    $('debugToggle').setAttribute('aria-expanded', String(enabled));
    const answer = answers[current], info = diagnostic();
    const targetMandarin = $('asrProviderSelect').value === 'taiwan_tongues_zh';
    $('answerLabel').textContent = targetMandarin ? '標準答案（華語）' : '標準答案（四縣腔）';
    $('sentenceText').textContent = developerAnswerLines().join('\n');
    $('sentenceText').setAttribute('lang', targetMandarin ? 'zh-Hant' : 'hak');
    $('debugComparison').setAttribute('lang', targetMandarin ? 'zh-Hant' : 'hak');
    $('answerInput').setAttribute('lang', targetMandarin ? 'zh-Hant' : 'hak');
    $('asrStatus').textContent = info.status;
    $('debugRecording').textContent = answer.blob ? `${answer.blob.type} · ${Math.ceil(answer.blob.size / 1024)} KB · ${answer.seconds} 秒` : '尚未錄音';
    $('debugEndpoint').textContent = `API：${endpoint() || '未設定'}`;
    $('answerInput').value = info.draft;
    $('answerInput').disabled = busy();
    $('asrProviderSelect').disabled = busy();
    const mandarin = $('asrProviderSelect').value === 'taiwan_tongues_zh';
    if (mandarin) $('recognitionModeSelect').value = 'file';
    $('recognitionModeSelect').disabled = busy() || mandarin;
    $('recognitionModeNote').textContent = mandarin ? '華語測試僅支援檔案辨識。' : recognitionMode() === 'realtime' ? '預設使用客委會即時串流（WebSocket）辨識。' : '按「送出朗讀」後上傳完整音檔，以檔案辨識取得結果。';
    $('debugCompareBtn').disabled = busy() || !info.draft.trim();
    $('debugComparison').replaceChildren();
    $('debugMatch').textContent = '尚未比對';
    if (info.tested) {
      const result = alignText(developerAnswerLines(), info.draft);
      $('debugMatch').textContent = `文字命中 ${result.matchCount}／${result.totalSpoken} 字（不代表發音正確率）`;
      renderComparison($('debugComparison'), result);
    }
  }
  const phaseNames = { ready: '準備朗讀', requesting: '開啟麥克風', recording: '正在朗讀', stopping: '整理錄音', preview: '聽聽自己', submitting: '正在送出', feedback: '本段完成' };
  const busy = () => ['requesting', 'recording', 'stopping', 'submitting'].includes(phase);
  const stopTracks = () => { stream?.getTracks().forEach(track => track.stop()); stream = null; };
  const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const status = text => { $('status').textContent = text; };
  const release = answer => { if (answer.url) URL.revokeObjectURL(answer.url); };
  const isPunctuation = c => /[\s\p{P}\p{S}]/u.test(c);

  // Align recognized text to target with punctuation and line structure preserved.
  function alignText(targetLines, transcript) {
    const lines = Array.isArray(targetLines) ? targetLines : [String(targetLines || '')];
    const structured = lines.map(line => {
      return Array.from(line).map(char => ({
        char,
        isPunct: isPunctuation(char),
        matched: false
      }));
    });

    const spokenList = [];
    structured.forEach((lineTokens, lIdx) => {
      lineTokens.forEach((token, tIdx) => {
        if (!token.isPunct) {
          spokenList.push({ token, lIdx, tIdx, char: token.char });
        }
      });
    });

    const transClean = Array.from(String(transcript || '').normalize('NFC').replace(/[\s\p{P}\p{S}]/gu, ''));
    const n = spokenList.length, m = transClean.length;

    const rows = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        rows[i][j] = spokenList[i - 1].char === transClean[j - 1]
          ? rows[i - 1][j - 1] + 1
          : Math.max(rows[i - 1][j], rows[i][j - 1]);
      }
    }

    let i = n, j = m;
    let matchCount = 0;
    while (i > 0 && j > 0) {
      if (spokenList[i - 1].char === transClean[j - 1]) {
        spokenList[i - 1].token.matched = true;
        matchCount++;
        i--;
        j--;
      } else if (rows[i - 1][j] >= rows[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return {
      structured,
      matchCount,
      totalSpoken: n,
      identical: (matchCount === n) && (n === m)
    };
  }

  function renderComparison(container, result) {
    container.replaceChildren();
    result.structured.forEach(lineTokens => {
      const p = document.createElement('p');
      p.className = 'comparison-line';
      lineTokens.forEach(item => {
        const span = document.createElement('span');
        if (item.isPunct) {
          span.className = 'char-punct';
        } else if (item.matched) {
          span.className = 'char-hit';
        } else {
          span.className = 'char-miss';
        }
        span.textContent = item.char;
        p.appendChild(span);
      });
      container.appendChild(p);
    });
  }

  function setPhase(next, message) {
    phase = next;
    $('phaseLabel').textContent = phaseNames[next];
    $('recordBtn').hidden = !['ready', 'requesting', 'recording', 'stopping'].includes(next);
    $('recordBtn').disabled = ['requesting', 'stopping'].includes(next);
    $('recordBtn').textContent = next === 'recording' ? '完成朗讀' : next === 'requesting' ? '正在開啟麥克風…' : next === 'stopping' ? '整理錄音…' : '開始朗讀';
    $('liveRecording').hidden = next !== 'recording';
    $('retryBtn').hidden = !['preview', 'feedback'].includes(next);
    $('submitBtn').hidden = next !== 'preview';
    $('cancelBtn').hidden = next !== 'submitting';
    $('audioPreview').hidden = !answers[current].url || ['ready', 'requesting', 'recording', 'stopping'].includes(next);
    $('feedbackPanel').hidden = next !== 'feedback';
    document.querySelector('[data-dialect="sixian"]').disabled = busy();
    const firstIncomplete = answers.findIndex(answer => !answer.completed);
    $('passageSteps').querySelectorAll('button').forEach((button, index) => {
      button.disabled = busy() || (firstIncomplete !== -1 && index > firstIncomplete);
      button.classList.toggle('is-active', index === current);
      button.setAttribute('aria-current', index === current ? 'step' : 'false');
      button.textContent = `${answers[index].completed ? '✓' : index + 1} ${lesson.passages[index].title}`;
    });
    if (message) status(message);
    updateDeveloperMode();
  }

  function showFeedback() {
    const answer = answers[current];
    const result = alignText(lesson.passages[current].lines, answer.transcript);
    $('feedbackText').textContent = result.identical ? '辨識文字與本段課文一致。聽聽自己的朗讀，再繼續下一段。' : '看看標示的地方（綠色為吻合，紅色為未辨識出），按播放重聽自己的朗讀，重新讀一次試試吧！';
    renderComparison($('passageText'), result);
    $('transcript').textContent = answer.transcript || '（無辨識文字）';
    $('liveTranscriptBox').hidden = false;
    $('nextBtn').textContent = current === answers.length - 1 ? '完成任務 →' : '下一段 →';
  }

  function render(focus = true) {
    $('audioPreview').pause();
    const passage = lesson.passages[current], answer = answers[current];
    $('sceneImage').src = passage.image;
    $('sceneImage').alt = `〈${lesson.title}〉第 ${passage.pages[0]} 頁插圖`;
    $('sceneCaption').textContent = `本段取自教材第 ${passage.pages.join('、')} 頁`;
    $('passageCount').textContent = `第 ${current + 1} 段／共 ${answers.length} 段`;
    $('passageTitle').textContent = passage.title;
    if (answer.completed) {
      showFeedback();
    } else {
      $('passageText').replaceChildren(...passage.lines.map(line => { const p = document.createElement('p'); p.textContent = line; return p; }));
      $('liveTranscriptBox').hidden = true;
    }
    if (answer.url) $('audioPreview').src = answer.url;
    else { $('audioPreview').removeAttribute('src'); $('audioPreview').load(); }
    setPhase(answer.completed ? 'feedback' : answer.url ? 'preview' : 'ready', answer.completed ? '已保留這段的朗讀與結果。' : answer.url ? '已錄好，可以先聽聽看，再送出朗讀。' : '準備好再開始，不用急。');
    if (focus) $('passageTitle').focus();
  }

  async function startRecording() {
    if (phase !== 'ready') return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      status('目前無法錄音，請用支援麥克風的瀏覽器，並透過安全連線開啟本頁。'); return;
    }
    $('audioPreview').pause();
    setPhase('requesting', '請允許使用麥克風。');
    const token = ++generation;
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (token !== generation || leaving) { acquired.getTracks().forEach(track => track.stop()); return; }
      stream = acquired;
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
      const activeRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorder = activeRecorder;
      const chunks = [], index = current;
      let failed = false;
      activeRecorder.addEventListener('dataavailable', event => { if (event.data.size) chunks.push(event.data); });
      activeRecorder.addEventListener('error', () => {
        failed = true; clearInterval(timer); stopTracks();
        setPhase('ready', '錄音中斷了，請重新朗讀。');
      });
      activeRecorder.addEventListener('stop', () => {
        clearInterval(timer); stopTracks(); recorder = null;
        if (failed || leaving || token !== generation) return;
        const blob = new Blob(chunks, { type: activeRecorder.mimeType || mime || 'audio/webm' });
        if (!blob.size) { setPhase('ready', '沒有收到錄音，請確認麥克風後再試一次。'); return; }
        release(answers[index]);
        answers[index] = { blob, url: URL.createObjectURL(blob), transcript: '', completed: false, seconds: Math.max(1, Math.round((Date.now() - started) / 1000)) };
        render(false);
        $('submitBtn').focus();
      });
      activeRecorder.start();
      started = Date.now();
      $('recordTime').textContent = '00:00';
      setPhase('recording', '照自己的速度朗讀，讀完按「完成朗讀」。');
      timer = setInterval(() => {
        const seconds = Math.floor((Date.now() - started) / 1000);
        $('recordTime').textContent = formatTime(seconds);
        if (seconds >= 180) stopRecording();
      }, 250);
    } catch (error) {
      if (token !== generation || leaving) return;
      clearInterval(timer); stopTracks(); recorder = null;
      setPhase('ready', error.name === 'NotAllowedError' ? '麥克風尚未開啟。請允許麥克風權限，再按「開始朗讀」。' : '無法使用麥克風，請確認已連接，且沒有被其他程式占用。');
    }
  }

  function stopRecording() {
    if (phase !== 'recording' || recorder?.state !== 'recording') return;
    setPhase('stopping', '正在整理你的錄音…');
    recorder.stop();
    clearInterval(timer);
  }

  function endpoint() {
    const api = window.SPEECH_API;
    let saved;
    try { saved = localStorage.getItem(api.storageKey); } catch { /* Browser storage may be disabled. */ }
    const supplied = new URLSearchParams(location.search).get('asr');
    return [supplied, saved, api.endpoint()].find(value => value && api.isAllowedEndpoint(value));
  }

  async function submit() {
    const answer = answers[current];
    if (phase !== 'preview' || !answer.blob) return;
    const providerId = $('debugToggle').checked && $('asrProviderSelect').value === 'taiwan_tongues_zh' ? 'taiwan_tongues_zh' : 'hakka_api_hak';
    const isHakka = providerId === 'hakka_api_hak';
    const mode = recognitionMode();
    const modeLabel = mode === 'realtime' ? 'WebSocket 串流辨識' : '檔案辨識';
    diagnostic().status = `${isHakka ? '客語' : '華語測試'}${modeLabel}中`;
    $('audioPreview').pause();
    setPhase('submitting', '正在整理你的朗讀結果，請稍等。');
    const controller = new AbortController();
    request = controller;
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
      const url = endpoint();
      if (!url) throw new Error('endpoint');
      const form = new FormData();
      const extension = answer.blob.type.includes('mp4') ? 'm4a' : answer.blob.type.includes('ogg') ? 'ogg' : 'webm';
      form.append('audio', answer.blob, `reading-${current + 1}.${extension}`);
      Object.entries({ provider_id: providerId, provider: isHakka ? 'hakka_api' : 'taiwan_tongues', language: isHakka ? 'hak' : 'zh', dialect: lesson.dialect, recognizer: isHakka ? `hakka-${lesson.dialect}` : 'mandarin', scene_id: lesson.id, recognition_mode: mode }).forEach(([key, value]) => form.append(key, value));
      const response = await fetch(url, { method: 'POST', body: form, signal: controller.signal });
      if (!response.ok) throw new Error('service');
      const payload = await response.json();
      const result = window.SPEECH_API.normalizeResponse(payload);
      if (request !== controller || leaving) return;
      if (payload.status === 'not_enabled' || payload.error || result.ok === false || !result.text || result.text.length > 4000) throw new Error('recognition');
      Object.assign(diagnostic(), { draft: result.text, tested: true, status: isHakka ? `客語${modeLabel}完成` : '華語測試完成（未計入學生作答）' });
      if (!isHakka) {
        setPhase('preview', '開發測試完成。請切回客語，再送出朗讀。');
        return;
      }
      answer.transcript = result.text;
      answer.completed = true;
      showFeedback();
      setPhase('feedback', '本段朗讀已送出，可以聽聽自己的聲音。');
      $('nextBtn').focus();
    } catch (error) {
      if (request !== controller || leaving) return;
      diagnostic().status = error.name === 'AbortError' ? '辨識逾時，錄音已保留' : '辨識失敗或沒有文字，錄音已保留';
      setPhase('preview', '這次沒有取得辨識結果，錄音還在。請稍後重新送出，或重新朗讀。');
    } finally {
      clearTimeout(timeout);
      if (request === controller) request = null;
    }
  }

  function showSummary() {
    if (!answers.every(answer => answer.completed)) return;
    $('audioPreview').pause();
    $('readingMission').hidden = true;
    $('readingSummary').hidden = false;
    $('summaryList').replaceChildren(...answers.map((answer, index) => {
      const article = document.createElement('article');
      article.className = 'summary-item';

      const title = document.createElement('h3');
      title.textContent = `✓ 第 ${index + 1} 段：${lesson.passages[index].title}`;

      const alignResult = alignText(lesson.passages[index].lines, answer.transcript);
      const stats = document.createElement('p');
      stats.className = 'summary-match-stats';
      stats.textContent = `文字命中 ${alignResult.matchCount}／${alignResult.totalSpoken} 字`;

      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = answer.url;
      audio.setAttribute('aria-label', `重聽${lesson.passages[index].title}`);

      const details = document.createElement('details');
      details.className = 'summary-comparison-details';
      const summary = document.createElement('summary');
      summary.textContent = '查看本段文字比對';

      const compDiv = document.createElement('div');
      compDiv.className = 'comparison-display';
      compDiv.setAttribute('lang', 'hak');
      renderComparison(compDiv, alignResult);

      const transcriptNote = document.createElement('p');
      transcriptNote.className = 'small-note';
      transcriptNote.textContent = '辨識文字';

      const transcriptText = document.createElement('p');
      transcriptText.className = 'summary-transcript';
      transcriptText.setAttribute('lang', 'hak');
      transcriptText.textContent = answer.transcript || '（無辨識文字）';

      details.append(summary, compDiv, transcriptNote, transcriptText);
      article.append(title, stats, audio, details);
      return article;
    }));
    $('summaryTitle').focus();
  }
  function pauseAll() { document.querySelectorAll('audio').forEach(audio => audio.pause()); }

  lesson.passages.forEach((passage, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'step';
    button.addEventListener('click', () => { if (!button.disabled && !busy()) { current = index; render(); } });
    $('passageSteps').append(button);
  });
  $('introImage').src = lesson.passages[0].image;
  $('debugToggle').addEventListener('change', updateDeveloperMode);
  $('asrProviderSelect').addEventListener('change', updateDeveloperMode);
  $('recognitionModeSelect').addEventListener('change', updateDeveloperMode);
  $('answerInput').addEventListener('input', () => {
    diagnostic().draft = $('answerInput').value.slice(0, 4000);
    diagnostic().tested = false;
    $('debugMatch').textContent = '文字已修改，請重新測試比對';
    $('debugComparison').replaceChildren();
    $('debugCompareBtn').disabled = busy() || !$('answerInput').value.trim();
  });
  $('debugCompareBtn').addEventListener('click', () => {
    if (!$('debugToggle').checked || busy() || !diagnostic().draft.trim()) return;
    diagnostic().tested = true; updateDeveloperMode();
  });
  $('storyStartBtn').addEventListener('click', () => {
    $('readingIntro').hidden = true; $('readingMission').hidden = false;
    $('readingMission').classList.add('is-entering'); render();
  });
  $('recordBtn').addEventListener('click', () => phase === 'recording' ? stopRecording() : startRecording());
  $('retryBtn').addEventListener('click', () => {
    if (busy()) return;
    if (answers[current].completed && !window.confirm('要清除這一段的錄音，重新朗讀嗎？其他段落會保留。')) return;
    pauseAll();
    const end = current + 1;
    for (let i = current; i < end; i++) { release(answers[i]); answers[i] = { blob: null, url: '', transcript: '', completed: false, seconds: 0 }; }
    render(false); $('recordBtn').focus();
  });
  $('submitBtn').addEventListener('click', submit);
  $('cancelBtn').addEventListener('click', () => {
    const pending = request; request = null; pending?.abort();
    diagnostic().status = '已取消送出';
    setPhase('preview', '已取消送出，錄音還在，可以重聽或再送一次。');
  });
  $('nextBtn').addEventListener('click', () => {
    if (!answers[current].completed) return;
    if (current < answers.length - 1) { current++; render(); } else showSummary();
  });
  $('reviewStoryBtn')?.addEventListener('click', () => {
    pauseAll();
    current = 0;
    $('readingSummary').hidden = true;
    $('readingMission').hidden = false;
    render();
  });
  $('restartBtn').addEventListener('click', () => {
    if (!window.confirm('要清除這次錄音，重新開始嗎？')) return;
    pauseAll(); answers.forEach((answer, index) => { release(answer); answers[index] = { blob: null, url: '', transcript: '', completed: false, seconds: 0 }; });
    $('summaryList').replaceChildren(); current = 0; $('readingSummary').hidden = true; $('readingIntro').hidden = false;
    $('storyStartBtn').focus(); render(false);
  });
  window.addEventListener('beforeunload', event => {
    if (busy() || answers.some(answer => answer.blob)) { event.preventDefault(); event.returnValue = ''; }
  });
  window.addEventListener('pagehide', () => {
    leaving = true; generation++; request?.abort(); clearInterval(timer);
    if (recorder?.state === 'recording') recorder.stop();
    stopTracks(); pauseAll();
  });
  window.addEventListener('pageshow', event => {
    leaving = false;
    if (event.persisted && busy()) render(false);
  });
  document.addEventListener('play', event => {
    if (event.target.tagName === 'AUDIO') document.querySelectorAll('audio').forEach(audio => { if (audio !== event.target) audio.pause(); });
  }, true);
  render(false);
})();

