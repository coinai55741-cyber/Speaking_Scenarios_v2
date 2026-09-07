(function () {
  const DEFAULT_BASE_URL = "http://localhost:5000";
  const ENDPOINTS = {
    recognize: "/api/speech/recognize",
    legacyRecognize: "/recognize",
    legacyTranscribe: "/transcribe"
  };

  const RECOGNITION_MODES = {
    file: { id: "file", label: "錄完判斷（檔案辨識）" },
    realtime: { id: "realtime", label: "即時辨識 WebSocket" }
  };

  const PROVIDERS = {
    mandarinLocal: {
      id: "taiwan_tongues_zh",
      provider: "taiwan_tongues",
      language: "zh",
      recognizer: "mandarin",
      label: "Taiwan-Tongues-ASR-CE（華語 v2）"
    },
    hakkaApi: {
      id: "hakka_api_hak",
      provider: "hakka_api",
      language: "hak",
      recognizerPrefix: "hakka",
      label: "客委會 API（客語預留）"
    }
  };

  function baseUrl() {
    return window.SPEECH_API_BASE_URL || DEFAULT_BASE_URL;
  }

  function endpoint(path = ENDPOINTS.recognize) {
    return `${baseUrl()}${path}`;
  }

  function isAllowedEndpoint(value) {
    try {
      const url = new URL(value);
      const allowedLocal = url.hostname === "127.0.0.1" || url.hostname === "localhost";
      const allowedTunnel = url.hostname.endsWith(".trycloudflare.com") || url.hostname.endsWith(".ngrok-free.app") || url.hostname.endsWith(".ngrok-free.dev") || url.hostname.endsWith(".onrender.com");
      return Object.values(ENDPOINTS).includes(url.pathname) && (allowedLocal || allowedTunnel);
    } catch (error) {
      return false;
    }
  }

  function cleanText(value) {
    return String(value || "").replace(/[\s，,。！？!?、；;：「」『』（）()]/g, "").trim();
  }

  function textFromPayload(payload) {
    if (payload == null) return "";
    if (typeof payload === "string") return cleanText(payload);
    if (Array.isArray(payload)) return cleanText(payload.join(""));
    const value = payload.text ?? payload.result ?? payload.transcript ?? payload.sentence ?? payload.tokens ?? payload.data;
    if (Array.isArray(value)) return cleanText(value.join(""));
    if (value && typeof value === "object") return textFromPayload(value);
    return cleanText(value);
  }

  function tokensFromPayload(payload) {
    if (payload == null) return [];
    if (Array.isArray(payload)) return payload.map(String).filter(Boolean);
    if (typeof payload !== "object") return [];
    const value = payload.tokens ?? payload.words ?? payload.segments ?? payload.result ?? payload.data;
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (typeof item === "object" && item) return item.text ?? item.word ?? item.token ?? "";
        return item;
      }).map(String).map((item) => item.trim()).filter(Boolean);
    }
    if (value && typeof value === "object") return tokensFromPayload(value);
    return [];
  }

  function normalizeResponse(payload, fallback = {}) {
    const tokens = tokensFromPayload(payload);
    const text = textFromPayload(payload);
    return {
      ok: payload?.ok ?? Boolean(text || tokens.length),
      provider: payload?.provider ?? fallback.provider ?? "",
      provider_id: payload?.provider_id ?? fallback.provider_id ?? "",
      dialect: payload?.dialect ?? fallback.dialect ?? "",
      recognizer: payload?.recognizer ?? fallback.recognizer ?? "",
      scene_id: payload?.scene_id ?? fallback.scene_id ?? "",
      text,
      tokens,
      raw: payload?.raw ?? payload
    };
  }

  window.SPEECH_API = {
    baseUrl,
    endpoint,
    isAllowedEndpoint,
    normalizeResponse,
    textFromPayload,
    tokensFromPayload,
    cleanText,
    endpoints: ENDPOINTS,
    providers: PROVIDERS,
    recognitionModes: RECOGNITION_MODES,
    storageKey: "speakingDemoSpeechEndpoint"
  };
}());

