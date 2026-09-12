/**
 * ============================================================================
 * Vercel Serverless Function: /api/judge
 * ============================================================================
 * LLM-as-a-Judge 後端轉發評估介面
 * 支援 Google Gemini 3.6 Flash / 3.5 Flash 及 OpenAI 格式 API。
 * 金鑰安全隔離於後端 .env。
 */

function json(res, statusCode, payload) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  if (req.method !== "POST") return {};
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

async function callGemini(apiKey, models, systemPrompt, userPrompt) {
  let lastError = null;
  for (const model of models) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        })
      });

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (text) {
          return { text, modelUsed: model };
        }
      } else {
        const errBody = await geminiRes.text();
        lastError = new Error(`Gemini [${model}] HTTP ${geminiRes.status}: ${errBody.slice(0, 150)}`);
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("All Gemini candidate models failed.");
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    json(res, 204, { ok: true });
    return;
  }

  if (req.method === "GET") {
    json(res, 200, {
      ok: true,
      service: "llm-judge-proxy",
      description: "客語情境口說任務 LLM-as-a-Judge 後端評估轉發服務。"
    });
    return;
  }

  if (req.method !== "POST") {
    json(res, 405, { error: "Method Not Allowed，請使用 POST。" });
    return;
  }

  try {
    const body = await readBody(req);
    const { systemPrompt, userPrompt } = body;

    const apiKey = process.env.LLM_API_KEY || "";
    const primaryModel = process.env.LLM_MODEL || "gemini-3.6-flash";
    const endpoint = process.env.LLM_ENDPOINT || "";

    if (!apiKey) {
      json(res, 503, { error: "後端尚未設定 LLM_API_KEY 環境變數。" });
      return;
    }

    let llmResponseContent = "";
    let modelUsed = primaryModel;

    // 判斷是否為 Gemini API (以 AQ. 或 AIza 開頭，或 endpoint 包含 googleapis)
    const isGemini = apiKey.startsWith("AQ.") || apiKey.startsWith("AIza") || endpoint.includes("googleapis.com");

    if (isGemini) {
      const candidateModels = [
        primaryModel,
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-2.5-pro"
      ].filter((v, i, a) => a.indexOf(v) === i && !v.includes("1.5")); // 排除已廢棄的 1.5 系列

      const result = await callGemini(apiKey, candidateModels, systemPrompt, userPrompt);
      llmResponseContent = result.text;
      modelUsed = result.modelUsed;
    } else {
      // 標準 OpenAI 格式
      const openaiEndpoint = endpoint || "https://api.openai.com/v1/chat/completions";
      const openAiRes = await fetch(openaiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: primaryModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2
        })
      });

      if (!openAiRes.ok) {
        const errBody = await openAiRes.text();
        throw new Error(`OpenAI API 請求失敗（HTTP ${openAiRes.status}）：${errBody.slice(0, 180)}`);
      }

      const openAiData = await openAiRes.json();
      llmResponseContent = openAiData.choices?.[0]?.message?.content || "";
    }

    const cleanJson = llmResponseContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    json(res, 200, {
      ok: true,
      isFromAPI: true,
      modelUsed,
      ...parsed
    });
  } catch (error) {
    const isRateLimited = error.message?.includes("429") || error.message?.includes("ResourceExhausted") || error.message?.includes("quota") || error.message?.includes("high demand") || error.message?.includes("503");
    json(res, isRateLimited ? 429 : 500, {
      ok: false,
      isRateLimited: !!isRateLimited,
      error: error.message || "LLM 評估伺服器處理異常"
    });
  }
};
