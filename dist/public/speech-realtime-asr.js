(function () {
  "use strict";

  function downsample(buffer, fromRate, toRate = 16000) {
    const ratio = fromRate / toRate;
    const length = Math.floor(buffer.length / ratio);
    const output = new Int16Array(length);
    for (let i = 0; i < length; i += 1) {
      const position = i * ratio;
      const left = Math.floor(position);
      const right = Math.min(buffer.length - 1, left + 1);
      const mix = position - left;
      const value = buffer[left] * (1 - mix) + buffer[right] * mix;
      const sample = Math.max(-1, Math.min(1, value));
      output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return output;
  }

  function createSession(options = {}) {
    let ws = null;
    let audioContext = null;
    let sourceNode = null;
    let processorNode = null;
    let ready = false;
    let closed = false;
    let pending = [];
    let segments = {};

    const onTranscript = typeof options.onTranscript === "function" ? options.onTranscript : () => {};
    const onFinal = typeof options.onFinal === "function" ? options.onFinal : () => {};
    const onError = typeof options.onError === "function" ? options.onError : () => {};

    function currentText() {
      return Object.keys(segments)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => segments[key])
        .join("")
        .trim();
    }

    let ownedStream = null;
    function stopAudio() {
      try { if (processorNode) processorNode.disconnect(); } catch (error) {}
      try { if (sourceNode) sourceNode.disconnect(); } catch (error) {}
      processorNode = null;
      sourceNode = null;
      if (ownedStream) {
        try { ownedStream.getTracks().forEach(t => t.stop()); } catch (e) {}
        ownedStream = null;
      }
    }

    function finish() {
      if (closed) return;
      closed = true;
      stopAudio();
      try { if (audioContext) audioContext.close(); } catch (error) {}
      audioContext = null;
      try { if (ws) ws.close(); } catch (error) {}
      ws = null;
      onFinal(currentText());
    }

    const targetLanguage = options.language || window.CURRENT_ASR_LANGUAGE || (function(){ try { return localStorage.getItem("speakingDemoAsrLanguage"); }catch(e){ return null; } })() || "hak";

    async function start(stream) {
      closed = false;
      ready = false;
      pending = [];
      segments = {};

      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              sampleRate: { ideal: 16000 },
              echoCancellation: true,
              noiseSuppression: true
            }
          });
          ownedStream = stream;
        } catch (err) {
          onError("麥克風無法啟用（未取得權限）");
          return false;
        }
      }

      let ticketPayload = null;
      const primaryUrl = window.SPEECH_API?.realtimeTicketUrl?.() || "http://localhost:5000/ticket";
      const fallbackUrl = "https://speaking-scenarios-v2.vercel.app/ticket";

      async function getTicket(url) {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: targetLanguage })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!data?.url || !data?.ticket) throw new Error(data?.error || "無效辨識票券");
        return data;
      }

      try {
        ticketPayload = await getTicket(primaryUrl);
      } catch (error) {
        if (primaryUrl !== fallbackUrl) {
          try {
            ticketPayload = await getTicket(fallbackUrl);
          } catch (fallbackError) {
            onError(fallbackError.message || "無法取得即時辨識票券");
            return false;
          }
        } else {
          onError(error.message || "無法取得即時辨識票券");
          return false;
        }
      }

      const query = `?ticket=${encodeURIComponent(ticketPayload.ticket)}&type=raw&rate=16000&channel=1&charactersToNumbers=0&noSpeechTimeout=20`;
      try {
        ws = new WebSocket(ticketPayload.url + query);
      } catch (error) {
        onError("無法建立即時辨識連線");
        return false;
      }

      ws.binaryType = "arraybuffer";
      ws.onmessage = (event) => {
        let payload = null;
        try { payload = JSON.parse(event.data); } catch (error) { return; }
        const code = Number(payload.code || 0);
        if (code === 180) {
          ready = true;
          pending.forEach((chunk) => { try { ws.send(chunk); } catch (error) {} });
          pending = [];
          return;
        }
        if (code === 200 && Array.isArray(payload.result)) {
          payload.result.forEach((item) => {
            if (item?.transcript) segments[item.segment ?? 0] = item.transcript;
          });
          onTranscript(currentText(), payload);
        }
        if (code === 204 || payload.end === 1) finish();
        if (code >= 400) {
          onError(payload.message ? `辨識服務回應：${payload.message}` : `辨識服務代碼 ${code}`);
          finish();
        }
      };
      ws.onerror = () => { if (!closed) onError("語音串流連線中斷"); };
      ws.onclose = () => { if (!closed) finish(); };

      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === "suspended") {
        try { await audioContext.resume(); } catch (e) {}
      }
      sourceNode = audioContext.createMediaStreamSource(stream);
      processorNode = audioContext.createScriptProcessor(4096, 1, 1);
      processorNode.onaudioprocess = (event) => {
        if (!ws || ws.readyState > 1 || closed) return;
        const pcm = downsample(event.inputBuffer.getChannelData(0), audioContext.sampleRate);
        if (ready) {
          try { ws.send(pcm.buffer); } catch (error) {}
        } else if (pending.length < 80) {
          pending.push(pcm.buffer);
        }
      };
      sourceNode.connect(processorNode);
      processorNode.connect(audioContext.destination);
      return true;
    }

    function stop() {
      stopAudio();
      if (ws && ws.readyState === 1) {
        try { ws.send("EOS"); } catch (error) {}
        setTimeout(() => {
          if (!closed) finish();
        }, 1200);
      } else {
        finish();
      }
    }

    function abort() {
      closed = true;
      stopAudio();
      try { if (audioContext) audioContext.close(); } catch (error) {}
      audioContext = null;
      try { if (ws) ws.close(); } catch (error) {}
      ws = null;
    }

    return { start, stop, abort, text: currentText };
  }

  window.CURRENT_ASR_LANGUAGE = "hak";

  function setLanguage(lang) {
    window.CURRENT_ASR_LANGUAGE = lang === "zh" ? "zh" : "hak";
  }

  function getLanguage() {
    return window.CURRENT_ASR_LANGUAGE === "zh" ? "zh" : "hak";
  }

  window.HAKKA_REALTIME_ASR = { createSession, setLanguage, getLanguage };
}());
