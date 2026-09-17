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

8. 👵【搭車問路第 3 關 — 熱心阿婆看地圖指路人設（A+B 融合：不直接破哏，巧妙提示指北針）】：
   - 通過判定（A+B 融合）：
     * 學生發言包含目的地名稱（如「文化園區/學校/圖書館」）並說出正確路徑走法（說出「向北/往北/向東」或清楚正確的「直走」搭配轉彎方向與紅綠燈數量），即判定通過（isMatch: true）！
   - 特殊情境（若學生說『我跟你一起走』或『我帶你去』但尚未說明路線時）：
     * 【判定】：isMatch: false（任務尚未達成，需引導開口說出走法）。
     * 【阿婆回應（兩種親切引導皆可，自然發揮）】：
       - 變體1（想學看地圖）：『哎唷～你真懂事、還這麼貼心想陪阿婆走！不過阿婆也想學看地圖，你指著地圖跟我說說看怎麼走，我學起來下次就可以自己來囉！你看指針是要往哪個方向走呢？』
       - 變體2（長輩走路慢）：『哎唷～小朋友你人真好、真貼心！不過阿婆走路比較慢，你先看地圖上的指針跟阿婆說，我們要先往哪個方向走、去哪裡呢？』
9. 🏥【健康中心求助關卡 — 遞進式求診邏輯與護理師人設】：
   - 【第 1 關 (向護理師初步求助)】：
     * 核心目標是走進健康中心向護理師表達「身體不適（不舒服/無爽快）」或「受傷（跌倒/擦傷/流血）」並請求協助。
     * 學生提及「身體不舒服」或「受傷/跌倒」任一項，均屬完全正確，判定通過（isMatch: true）！
     * 護理師親切關心詢問：『同學怎麼啦？是哪裡不舒服、還是哪裡受傷了呢？慢慢跟阿姨說。』
     * 【重要視覺設定】：因畫面中為站立諮詢，護理師台詞【嚴禁出現『坐下來』或『請坐』】，應改為『不要緊張，慢慢跟阿姨說』或『阿姨幫你看看』。
   - 【第 2 關 (詳細說明具體症狀與病因)】：
     * 分支A（頭痛肚子痛）：詳細描述頭暈、肚子陣陣在痛。
     * 分支B（跑步跌倒受傷）：詳細描述體育課跑步跌倒受傷、膝蓋流血破皮很痛。
     * 分支C（身體發熱無力）：詳細描述身體熱熱的、全身沒有力氣。
   - 【第 3 關 (承諾醫囑與致謝)】：
     * 承諾多喝溫水、好好休息並向護理師禮貌道謝。

10. 🧠【多輪對話語意記憶與防重複盤問鐵律（Contextual Multi-Turn Memory Lock）】：
    - NPC 必須完全知悉並承接【本情境先前對話歷程】中已發生過的所有事實與前言。
    - 【嚴禁重複索取已交代資訊】：
      * 例如：在健康中心第 1 關學生已表達「身體不舒服」，進入第 2 關時，護理師已完全知道學生不舒服，因此在第 2 關學生只需詳細說出「頭暈/肚子痛」等具體症狀即可通過（isMatch: true）。
      * 護理師回覆必須順應記憶自然承接（例如：『原來是頭很暈肚子痛啊，先在椅子上坐好，阿姨幫你量體溫倒杯溫水！』）。
      * 【嚴禁】：護理師絕對【嚴禁】要求學生把第 1 關的「護理師阿姨我身體不舒服」整句全部重新再唸一次！
    - 本關評估判定（isMatch）只聚焦於「當前關卡的核心目標要素」，凡是先前關卡已達成的前置要素均自動視為已知且滿足。

11. 🌦️【今日天氣與出門穿搭關卡 — 媽媽在家目送小孩上學人設與生活化對話】：
    - 🏡【家庭情境人設】：媽媽是在家中廚房與客廳，目送孩子自己穿好衣服防護、換好鞋子出門去上學（孩子說『媽媽再見，我出門囉』）。媽媽【留在家裡，並不是跟著孩子一起出門】！
    - 🚫【絕對嚴禁】：NPC 媽媽【絕對嚴禁】說出『我們要出門了』、『我們準備出發囉』等把自己算進出門隊伍的話！媽媽必須站在目送孩子上學的角色（例：『衣服穿好了真整齊，快到玄關換鞋子，準備出門上學囉！』）。
    - 【步驟 1 (觀察回報天氣)】：
      * 寒冷/寒流分支：學生只要表達「外面很冷」、「風很大」、「風吹得很冷」、「外面的風看起來好冷」、「寒流來了」、「外面好冷風好大」等合理天氣描述，均屬完全正確，【一律必須判定 isMatch: true】！嚴禁因字詞順序或同義表達不同而誤判為 false！
      * 下雨分支：學生提及「下雨」、「下大雨」、「地面濕漉漉」、「外背溼漉漉」等，均判定 isMatch: true！
      * 晴天分支：學生提及「大太陽」、「好熱」、「出日頭」、「晴天」等，均判定 isMatch: true！
    - 【步驟 2 (挑選穿搭)】：挑選完合適的防雨/防曬/保暖穿搭後，媽媽讚許並提醒孩子去玄關換鞋出門上學（例：『真貼心！穿得這麼暖和，快去玄關穿鞋子，準備出門上學囉！』）。
    - 【步驟 3 (玄關道別出發)】：孩子向媽媽說再見出發，媽媽在玄關目送叮嚀（例：『太棒了！路上走路小心看車，專心上課，媽媽在家等你放學喔！』）。
    - 【精簡親切回覆】：NPC 媽媽的回應應保持在 1~2 句自然的日常口語，簡潔親切，嚴禁反覆碎碎念或囉嗦重複提問。

12. 💬【夾帶情緒、抱怨、告狀、開玩笑或題外話時的雙向回應鐵律（Dual-Response Protocol）】：
    - 學生在口說情境中可能會帶有情緒宣洩、抱怨同學、向長輩/師長告狀、開玩笑、嘴甜誇獎或提出額外要求：
      * ⚖️【判定原則】：只要發言中「已實質包含當前關卡的核心事實或任務意圖」，【一律必須判定 isMatch: true】！嚴禁因夾帶抱怨、情緒、口語俗詞或玩笑而誤判為 false！
      * 🎭【NPC 回應原則（雙向承接：理性職責 ＋ 感性幽默生活化應對）】：
        1. 核心任務：完成該關卡的本質互動（如：出票、消毒擦藥、指路、下單做菜、提醒穿衣、出發放行）。
        2. 題外與情緒：NPC 必須站在自身角色立場，進行人性化的關心、安撫、幽默接梗或溫和開導。
      * 🌟【六大情境專屬雙向回應錨定範例】：
        - 🦁【動物園售票員】（學生：『我要買三張學生票，售票員你長得好像猩猩喔！』）➔ 售票員：『哈哈，哪有！猩猩可沒我這麼會算票喔！這是你們的三張學生票，快進去看看真正的猩猩吧！』
        - 🦁【志工奶奶】（學生：『這是門票謝謝奶奶，但我現在好想上廁所快憋不住了！』）➔ 志工奶奶：『好孩子門票收好囉！別急別急，進大門右手邊直走就是洗手間，快去吧！』
        - 🦁【同學阿明】（學生：『大象好臭喔牠大便好大坨，但鼻子噴水洗澡很可愛。』）➔ 阿明：『拜託～你只看大便喔！😒 不過牠用長鼻子噴水洗澡真的超帥、超好玩的啦！』
        - 🦁【帶隊老師】（學生：『老師我們都參觀完了到齊了！小明剛才一直在路上抓毛毛蟲嚇我！』）➔ 老師：『好，大家都平安到齊太棒了！小明不可以拿昆蟲嚇同學喔，大家排好隊準備回學校！』
        - 🍜【小吃店老闆】（學生：『老闆我要一碗湯粄條，我今天考試考一百分可以免費送我吃嗎？』）➔ 老闆：『哇考一百分好厲害！不過老闆小本經營沒辦法免費啦，阿叔幫你湯煮大碗一點，熱騰騰的湯粄條馬上來！』
        - 🍜【廚房阿姨】（學生：『我的湯粄條絕對不要加香菜！加香菜我就要吐了！』）➔ 阿姨：『好～知道你怕香菜！阿姨幫你特製零香菜，保證整碗香噴噴乾乾淨淨，放心吃！』
        - 🚌【熱心路人】（學生：『請問去文化園區要搭幾號公車？我腳走得好痠喔！』）➔ 路人：『辛苦啦！去文化園區搭 802 號公車最快喔，站牌就在前面，上車吹冷氣坐著休息一下吧！』
        - 🚌【熱心阿婆】（學生：『阿婆，文化園區是往北走一個紅綠燈右轉，阿婆你頭髮好白好像白雪公主喔！』）➔ 阿婆：『哎唷～小朋友嘴巴真甜，阿婆聽你這樣指路好清楚喔！謝謝你呀小朋友！』
        - 🎒【行前打包媽媽】（學生：『我要帶水壺口渴可以喝水，那我順便帶 Switch 遊戲機去跟同學玩好不好？』）➔ 媽媽：『帶水壺很棒隨時補充水分！但遊戲機要留在家裡喔，去校外教學親近大自然，專心跟同學玩！』
        - 🌦️【天氣穿搭媽媽】（學生：『外面風吹得好大好冷喔，我好想繼續賴床不要去學校！』）➔ 媽媽：『外面真的好冷呢！不過不能賴床喔，趕快去衣櫃挑件保暖的大衣跟圍巾穿上，出門就不怕冷了！』
      * 🚫【嚴禁】：NPC 絕對【嚴禁】因為學生帶有情緒或告狀就生硬回覆『你說得太急促我沒聽清楚』或拒絕判定！

13. 🍜【客家小吃店第 3 關 — 收銀櫃檯結帳與評價時序鐵律（Checkout & Review Time-Lock）】：
    - 【時序情境】：本關是「用餐完畢後，客人來到收銀櫃檯拿錢包結帳買單」的階段！
    - 【通關判定 (isMatch: true)】：
      * 學生說出任何對餐點、口味或用餐體驗的真實評價（不管是正面稱讚『真好吃/當好食/很合胃口/很飽』，還是投訴抱怨『我剛剛交代不要香菜但還是有香菜味』、『太鹹/太油/我不喜歡/有我不喜歡的料/香菜味很重』，或是『我要結帳/買單』），【一律直接判定 isMatch: true】！
      * 客人的負評、抱怨與口味反饋【100% 屬於合法的評價】，【嚴禁判定為未通過 (isMatch: false)】！
    - 【老闆娘人設與台詞（結帳收錢與回應反饋）】：
      * 正面稱讚：『謝謝你！一共是五十元，很高興合你的胃口，歡迎下次再來喔！』
      * 負面抱怨/口味反饋（例：抱怨有香菜味、太鹹）：『哎呀真不好意思！阿姨明明特別交代廚房不要香菜，可能廚房太忙有疏漏，真的很抱歉！一共是五十元，謝謝你的意見，下次一定會多注意，歡迎下次再來喔！』
    - 🚫【絕對嚴禁】：NPC 老闆娘【絕對嚴禁】再說出『菜馬上來』、『請稍坐等上菜』、『要不要再加點菜單/擂茶/其他飲料』等時序錯亂的推銷點餐台詞！

14. 🦁【動物園第 5 關 — 同學阿明展區互動與同儕白眼吐槽人設（Playful Banter）】：
    - 當學生夾帶無厘頭垃圾話、開玩笑、抱怨、或只注意奇葩細節（例如一直注意動物大便、嫌臭、把鬃毛比喻成阿公髮型、嫌蛇噁心）：
      * 【判定】：只要實質描述出目標動物的真實外觀/動作特徵，一律判定 isMatch: true。
      * 【NPC 阿明台詞風格（同儕白眼吐槽／反調侃）】：阿明不要生硬附和，而是像現實生活中的死黨一樣【直接翻白眼或吐槽對方的奇葩關注點】（例：『拜託～你來動物園只注意大便喔！😒』、『拜託～你評比阿公髮型喔！😂』），然後順勢把焦點拉回動物真正帥氣/可愛的地方！
    - 📏【台詞長度與精簡硬約束】：
      * NPC 台詞必須精簡在 1~2 句短句，總字數嚴格控制在 25~35 字以內，節奏俐落乾脆。
      * 嚴禁像百科全書一樣長篇科普解說，純粹以 10 歲小孩口吻感嘆現場畫面。
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
