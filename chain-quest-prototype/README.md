# 客語生活任務 · 6 大情境互動學習原型 (Chain Quest Prototype)

這是一個獨立、低資源消耗的客語情境口說原型系統，不依賴任何外部重型圖片或建置流程，採用原生純 HTML、CSS 與 JavaScript 實作。

---

## 📁 檔案結構

```
chain-quest-prototype/
├── index.html        # 獨立主頁面（支援 6 大情境切換、關卡視覺、互動回饋與 JSON 檢視）
├── style.css         # 現代響應式樣式、卡片陰影、Emoji 視覺與動態回饋效果
├── app.js            # 6 大題型資料結構、語音辨識模擬服務層 (SpeechService)、狀態與 UI 控制
└── README.md         # 專案說明與 API 串接指南
```

---

## 🚀 如何在本機開啟與測試

1. **直接開啟**：
   - 雙擊開啟 `index.html`，或用任何現代瀏覽器（Chrome、Edge、Safari）直接開啟。
2. **透過 Local Server 開啟**：
   - 終端機切換至資料夾後執行 `npx serve .` 或透過 VS Code Live Server 開啟。

---

## 🎮 6 大情境題型設計與對齊

| 序號 | 情境主題 | 關卡數 | 核心目標客語句（四縣腔） | 關鍵字與目標 |
| :--- | :--- | :---: | :--- | :--- |
| **1** | **🦁 動物園連鎖任務** | 4 關 | 1. 𠊎愛買一張學生票。<br>2. 這係𠊎个飛仔，恁仔細。<br>3. 請問大象區愛仰般行？<br>4. 大象个鼻仔當長，當得人惜！ | **【設計取捨說明】**<br>將原案中買票、進場、問路、看大象等 4 個環節，整理成連貫一致的 4 階段 Tracker（1.買票 ➔ 2.驗票進場 ➔ 3.問路找大象 ➔ 4.大象互動），解決階段不一致問題。 |
| **2** | **🍜 客家美食點餐** | 3 關 | 1. 老闆，𠊎愛一碗湯粄條。<br>2. 毋好放香菜，甜一點。<br>3. 再加一杯擂茶，這道客家小炒當好食！ | 點主食、提出客製化需求（不加香菜）、加點飲品與評價。 |
| **3** | **🎒 校外教學打包** | 3 關 | 1. 𠊎有帶遮仔。<br>2. 水壺裝好水了。<br>3. 毛巾同點心放落書包了。 | 雨具、水壺、毛巾點心清點確認。 |
| **4** | **🚌 搭車街頭問路** | 3 關 | 1. 請問去文化園區愛坐哪一路公車？<br>2. 請問這台車有到學校無？<br>3. 向前行，過紅綠燈越倒手就到了。 | 問公車路線、確認到站、聽懂轉彎方向（越倒手）。 |
| **5** | **🏥 健康中心求助** | 3 關 | 1. 護理師，𠊎頭那痛、肚痛。<br>2. 體育課跑太遽，𠊎腳跌倒痛痛。<br>3. 𠊎會多啉水、好好歇睏，恁仔細！ | 描述身體不適症狀、說明受傷原因、承諾休息與感謝。 |
| **6** | **🌦️ 今日天氣穿搭** | 3 關 | 1. 今晡日天時落大雨，愛帶遮仔。<br>2. 天時當熱，愛著短衫、多啉水。<br>3. 天時當寒，出門愛著厚外套。 | 下雨帶遮仔、炎熱著短衫、寒流著厚外套。 |

---

## 🔌 未來真實 API 串接點 (Speech Service Contract)

在 `app.js` 中已完成 `SpeechService` 抽象層封裝：

```javascript
class SpeechService {
  // 1. 答案評估邏輯（命中比對）
  static evaluateAnswer(userTranscript, stepConfig) { ... }

  // 2. 原型測試模擬（可切換成功/失敗/自訂字串）
  static async mockRecognize({ success, customText, stepConfig }) { ... }

  // 3. 未來真實客委會 ASR / Web Speech API 介面注入點
  static async recognizeSpeech(audioInput, dialect = "sixian") {
    // 串接 WebSocket wss://asr.hakka.gov.tw 或 POST /api/v1/speech_to_text
  }
}
```
未來串接真實 ASR 後端時，前端 UI 邏輯與題型狀態機完全毋需修改，只需將 `recognizeSpeech` 回傳之字串注入 `evaluateAnswer` 即可無縫上線。
