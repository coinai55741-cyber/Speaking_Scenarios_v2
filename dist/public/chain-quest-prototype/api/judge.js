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

const CLAUDE_GROUNDING_RULES = `

======================================================================
【Claude 專屬評估與 NPC 角色台詞四大通用錨定鐵律（Strict Grounding Rules）】
======================================================================
你正在為語言學習者進行嚴謹的口說任務評估與逼真的角色扮演。請務必遵守以下 4 項評審鐵律：

1. ⚖️ 核心客觀屬性嚴格對齊（禁止模糊同義詞替換）：
   - 票種、數量、方位、品項名、動作特徵、身分、天氣等客觀屬性必須嚴格吻合情境要求。
   - 【禁止寬容替換】：
     * 學生票 ≠ 優待票 / 全票 / 敬老票 / 愛心票（不同票種互斥，買錯票種一律判定 isMatch: false）！
     * 慢慢爬 / 安靜 ≠ 跑得快 / 很吵（動作特徵相反一律判定 isMatch: false）！
     * 左轉 ≠ 右轉 / 直走（方位相反一律判定 isMatch: false）！
     * 湯粄條 ≠ 炒粄條 / 米苔目 / 乾麵（菜單餐點不同一律判定 isMatch: false）！
   - 只要關鍵客觀屬性不符或錯誤，【一律嚴格判定 isMatch: false】！

2. 🚫 嚴禁逢迎討好（Anti-Sycophancy）與事實光景錨定：
   - NPC 必須完全以題目給定的「客觀情境光景、常識與科學事實」為準。
   - 當學生講出違背常理、與題目光景相反或荒謬的話（例：說蛇跑比兔子快、說大熱天要穿厚羽絨外套、說受傷膝蓋發燒）：
     * NPC 絕對【嚴禁】順著說「你說得沒錯」、「哈哈確實」等順從附和！
     * NPC 必須站在自身角色立場「吐槽、疑惑、指出矛盾或澄清事實」（例：阿明說：『哪有！牠明明在樹枝上慢慢滑、安靜得很，哪有像兔子跑那麼快啦！』）。

3. 🔒 判定與 NPC 台詞一致性鐵律（Verbal Consistency Lock）：
   - 當 isMatch: false（未通過）：
     * NPC 台詞【絕對嚴禁】出現「好」、「沒錯」、「這是你的門票」、「菜馬上來」等成交、放行或肯定語句！
     * NPC 台詞必須明確表達「拒絕、糾正、疑惑、退回或要求重講」。
   - 只有在 isMatch: true（通過）時，NPC 才能給予放行與正面肯定。

4. 🏗️ 教學鷹架明確引導（Scaffolding Cueing）：
   - 未通過時，NPC 嚴禁只作無意義的客套寒暄（例：『窗口聲音雜，你要買幾張？』）。
   - NPC 必須一針見血點破學生的具體錯誤或疏漏（例：『同學，優待票是給長輩或幼童的，你們是學生要買學生票才對喔！』），強制引導學生說出正確句子。

5. 🎭 100% 沉浸式角色扮演（嚴禁打破第四面牆／嚴禁提及「題目/系統/測驗/答案」）：
   - NPC 的台詞（dynamicNpcResponse）必須 100% 融入情境現場，嚴禁以 AI、系統或出題考官口吻說話！
   - 【絕對禁止字眼】：NPC 台詞中【嚴禁】出現「題目說...」、「系統要求...」、「測驗規定...」、「標準答案是...」、「通關目標...」等破壞沉浸感的字眼！
   - 【必須以現場真實觀察與角色身分引導】：
     * 正確範例（售票員）：『同學，我看你們一共三個人一起來、大家都穿著學生制服，要買三張學生票才對喔！請重新說一次。』
     * 正確範例（同學阿明）：『哪有啦！你看牠明明在樹枝上慢慢滑，哪有像兔子跑那麼快啦！』
     * 正確範例（媽媽）：『媽媽看外面出大太陽熱得很，穿羽絨外套出門會中暑啦！快去換短袖！』

6. ☂️ 校外教學雨傘（遮仔）雙重功能生活常識錨定：
   - 雨傘（遮仔）在日常生活與戶外活動中兼具「防下雨（淋濕/落雨）」與「防曬遮陽（出大太陽/防中暑/遮日頭）」雙重功能！
   - 當學生說明帶雨傘的原因是「防下雨」或「遮陽/防曬/大太陽」任一項或兩者皆提（例：『我要帶雨傘因為太陽很大要遮陽』、『我要帶雨傘下雨可以用』），均屬 100% 正確合理的生活常識，【一律必須判定 isMatch: true】！
   - NPC 媽媽【嚴禁】說出「雨傘只能下雨用不能遮陽」等違背常識的反駁；媽媽應欣然肯定與讚許（例：『真細心！帶雨傘大太陽可以遮陽、下雨也不怕淋濕，放進書包側邊吧！』）。

7. 🧍【搭車問路第 1 關 — 熱心路人人設（關心詢問要去哪裡）】：
   - 路人是公車站旁熱心助人的路過民眾，看到學生在站牌前猶豫張望，路人【事前並不知道學生要去哪裡】！
   - 當學生尚未說出目的地或需要重新引導時，路人應以自然關心的口吻詢問：『同學，你看起來有點困惑，是不是迷路了？請問你要去哪裡呢？跟我說我來幫你看公車！』
   - 【嚴禁】：
     * 嚴禁像導遊推銷般說「我可以幫你介紹公車路線喔」。
     * 嚴禁預設立場或機械式報選項，必須真誠詢問學生要去哪裡。
======================================================================
`;

async function callClaude(apiKey, model, systemPrompt, userPrompt) {
  const enhancedSystemPrompt = (systemPrompt || "") + CLAUDE_GROUNDING_RULES;
  const candidateModels = [
    model,
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-5-20250929",
    "claude-sonnet-4-6",
    "claude-3-5-haiku-20241022",
    "claude-3-5-sonnet-20241022"
  ].filter((v, i, a) => a.indexOf(v) === i && v);

  const errors = [];
  for (const mod of candidateModels) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
      const claudeUrl = "https://api.anthropic.com/v1/messages";
      const claudeRes = await fetch(claudeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: mod,
          max_tokens: 1024,
          system: enhancedSystemPrompt,
          messages: [
            { role: "user", content: userPrompt }
          ],
          temperature: 0.2
        })
      });
      clearTimeout(timeoutId);

      if (claudeRes.ok) {
        const claudeData = await claudeRes.json();
        const text = claudeData.content?.[0]?.text || "";
        if (text) {
          return { text, modelUsed: mod };
        }
      } else {
        const errBody = await claudeRes.text();
        errors.push(`[${mod}] HTTP ${claudeRes.status}: ${errBody.slice(0, 150)}`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      errors.push(`[${mod}] err: ${err.message}`);
    }
  }
  throw new Error(errors.join(" | ") || "All Claude candidate models failed.");
}

async function callGemini(apiKey, models, systemPrompt, userPrompt) {
  const errors = [];
  for (const model of models) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
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
      clearTimeout(timeoutId);

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (text) {
          return { text, modelUsed: model };
        }
      } else {
        const errBody = await geminiRes.text();
        errors.push(`[${model}] HTTP ${geminiRes.status}: ${errBody.slice(0, 150)}`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      errors.push(`[${model}] err: ${err.message}`);
    }
  }
  throw new Error(errors.join(" | ") || "All Gemini candidate models failed.");
}

const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPaths = [
    path.join(__dirname, "../.env"),
    path.join(__dirname, ".env"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "chain-quest-prototype/.env")
  ];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      try {
        const lines = fs.readFileSync(p, "utf8").split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const idx = trimmed.indexOf("=");
            const k = trimmed.slice(0, idx).trim();
            const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
            if (!process.env[k]) {
              process.env[k] = v;
            }
          }
        }
      } catch (e) {}
    }
  }
}

module.exports = async function handler(req, res) {
  loadEnv();

  if (req.method === "OPTIONS") {
    json(res, 204, { ok: true });
    return;
  }

  if (req.method === "GET") {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || "";
    const primaryModel = process.env.LLM_MODEL || (apiKey.startsWith("sk-ant-") ? "claude-haiku-4-5-20251001" : "gemini-3.6-flash");
    const isClaude = apiKey.startsWith("sk-ant-") || primaryModel.toLowerCase().includes("claude");
    const isGemini = !isClaude && (apiKey.startsWith("AQ.") || apiKey.startsWith("AIza") || primaryModel.toLowerCase().includes("gemini"));
    const providerName = isClaude ? "Claude" : (isGemini ? "Google Gemini" : "OpenAI");

    json(res, 200, {
      ok: true,
      service: "llm-judge-proxy",
      provider: providerName,
      model: primaryModel,
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

    const apiKey = (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || process.env.LLM_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || "").trim();
    const primaryModel = (process.env.LLM_MODEL || (apiKey.startsWith("sk-ant-") ? "claude-haiku-4-5-20251001" : "gemini-3.6-flash")).trim();
    const endpoint = (process.env.LLM_ENDPOINT || "").trim();

    if (!apiKey) {
      json(res, 503, { error: "後端尚未設定 LLM_API_KEY 環境變數。" });
      return;
    }

    let llmResponseContent = "";
    let modelUsed = primaryModel;

    // 判斷模型提供者 (Claude / Gemini / OpenAI)
    const isClaude = apiKey.startsWith("sk-ant-") || endpoint.includes("anthropic.com") || primaryModel.toLowerCase().includes("claude");
    const isGemini = !isClaude && (apiKey.startsWith("AQ.") || apiKey.startsWith("AIza") || endpoint.includes("googleapis.com") || primaryModel.toLowerCase().includes("gemini"));

    if (isClaude) {
      const result = await callClaude(apiKey, primaryModel, systemPrompt, userPrompt);
      llmResponseContent = result.text;
      modelUsed = result.modelUsed;
    } else if (isGemini) {
      const candidateModels = [
        "gemini-3.5-flash",
        "gemini-3.6-flash",
        primaryModel
      ].filter((v, i, a) => a.indexOf(v) === i && v);

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

    function extractJson(text) {
      if (!text || typeof text !== "string") return null;
      let clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      try {
        return JSON.parse(clean);
      } catch (e) {
        const start = clean.indexOf("{");
        const end = clean.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
          try {
            return JSON.parse(clean.slice(start, end + 1));
          } catch (e2) {}
        }
      }
      return null;
    }

    const parsed = extractJson(llmResponseContent);
    if (!parsed) {
      throw new Error(`無法解析 LLM 回傳之 JSON 內容: ${llmResponseContent.slice(0, 200)}`);
    }

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
