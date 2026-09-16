async function test() {
  console.log("正在測試 Vercel 線上端點（最新錨點版本）...");
  const res = await fetch("https://speaking-scenarios-v2.vercel.app/api/judge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt: "你扮演動物園售票員。情境：學生來買票。通關目標：說出買 3 張學生票。\n請以 JSON 格式輸出：{\"isMatch\": false, \"semanticAccuracy\": 0, \"dynamicNpcResponse\": \"台詞\", \"feedback\": \"回饋\"}",
      userPrompt: "學生說：『我要三張優待票』。請評估。"
    })
  });
  console.log("HTTP 狀態:", res.status);
  const data = await res.json();
  console.log("線上回傳:", JSON.stringify(data, null, 2));
}

test().catch(console.error);
