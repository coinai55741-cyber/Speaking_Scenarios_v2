# 系統待製作與隱藏項目清單 (Hidden & Pending Features Roadmap)

本文件整理《客語生活任務 (Speaking Scenarios v2)》中所有被標記為**隱藏（註解）、停用（disabled/locked）或即將推出**的項目與功能模組，方便後續依序逐一製作。

---

## 總覽索引表

| 序號 | 模組 / 頁面 | 項目名稱 | 目前狀態 | 預計工作目標 |
| :--- | :--- | :--- | :--- | :--- |
| **1** | 首頁 `index.html` (基礎學習) | **口說生活短句** | `is-disabled` / 即將推出 | 建立生活短句學習頁面與練習題型 |
| **2** | 首頁 `index.html` (情境應用) | **逛街吃飯記** (`shopping-food`) | 註解隱藏於 `app.js` | 製作點餐/逛街生活任務（或併入連鎖原型） |
| **3** | 首頁 `index.html` (情境應用) | **阿明的一天** (`aming-day`) | 註解隱藏於 `app.js` | 製作時間作息與看圖說話生活任務 |
| **4** | 課堂測驗 `reading.html` | **繪本篇章 2：紅色个球仔** | `is-locked` / `disabled` | 建立 `reading-story-2.html` 朗讀題組與音檔 |
| **5** | 課堂測驗 `reading.html` | **繪本篇章 3：啊！有黃蚻** | `is-locked` / `disabled` | 建立 `reading-story-3.html` 朗讀題組與音檔 |
| **6** | 基礎學習 `Vocabulary.html` | **客語互動場景** (階段1) | 卡片 `disabled` | 開啟並完善 `classroom-stage-1.html` 互動 |
| **7** | 基礎學習 `Vocabulary.html` | **戶外教學趣** (階段2) | 卡片 `disabled` | 開啟並完善 `field-trip.html` 聽音跟讀 |
| **8** | 多頁面共同 | **其他五大客語腔別支援** | `disabled` | 擴充海陸、大埔、饒平、詔安、南四縣音檔與題庫 |
| **9** | 分級測驗 `speaking-exam.html` | **考試時間倒數與提示音 / 隱藏題庫** | 題庫含 rules、2題 pending 未啟用 | 實作倒數與提示音，串接評分 API 與 Gemini LLM（詳見 [SPEAKING_EXAM_PLAN.md](./SPEAKING_EXAM_PLAN.md)） |
| **10**| 連鎖原型 `chain-quest-prototype` | **連鎖生活任務新分支擴充** | 待評估新增情境 | 評估是否將逛街吃飯、阿明的一天導入連鎖引擎 |

---

## 詳細項目說明

### 1. 首頁「基礎學習」：口說生活短句
* **所在位置**：`index.html` (`#basic` 區塊，Line 134-140)
* **卡片內容**：
  * 標題：`口說生活短句`
  * 說明：「從問候、吃飯、上課與活動句開始，把短句變成日常能用的話。」
  * 圖片：`./assets/area-life-situations.png`
  * 按鈕狀態：`<button class="start-learning-btn is-disabled" disabled>即將推出</button>`
* **製作規劃**：
  1. 規劃生活短句分類（問候、用餐、課堂、校園活動）。
  2. 建立專屬練習頁面（如 `daily-sentences.html`），支援聽示範音與開口跟讀。

---

### 2. 首頁「情境應用」：逛街吃飯記 (`shopping-food`)
* **所在位置**：`app.js` (`scenarios` 陣列註解區，Line 55-68)
* **卡片內容**：
  * 標題：`逛街吃飯記`
  * 圖片：`./assets/scenario-shopping-food.png`
  * 說明：「和同學出門逛街，到了中午去吃飯，練習在餐廳用客語表達需求。」
  * 原始設定流程：
    1. 先說：明天我要跟同學去逛街。
    2. 再說：準備吃午餐了！
    3. 最後請店員把送錯的餐點換成炸雞。
* **製作規劃**：
  * 可作為獨立情境頁面 `shopping-food.html`；
  * 或直接移植進 `chain-quest-prototype`（連鎖情境任務原型）擴充為第 7 個點餐/換餐情境。

---

### 3. 首頁「情境應用」：阿明的一天 (`aming-day`)
* **所在位置**：`app.js` (`scenarios` 陣列註解區，Line 69-83)
* **卡片內容**：
  * 標題：`阿明的一天`
  * 圖片：`./assets/scenario-aming-day.png`
  * 說明：「看著早上、白天和晚上的圖片，照順序說出阿明一天的安排。」
  * 原始設定流程：
    1. 先練：你每天早上幾點起床？
    2. 再練：六點半起床，先刷牙洗臉。
    3. 最後說出游泳、上課、回家吃晚飯的順序。
* **製作規劃**：
  * 製作時間與日程順序題型（早起、洗臉、上學、運動、晚餐）。
  * 支援看圖說話與順序排列互動。

---

### 4. 繪本朗讀任務：〈紅色个球仔〉 (篇章 2)
* **所在位置**：`reading.html` (Line 49-56)
* **卡片內容**：
  * 標題：`紅色个球仔`
  * 圖片：`https://dn9mvjhbyvvpc.cloudfront.net/self_study/reading/2/image/0.png`
  * 說明：「大大的球去哪裡了？大聲地朗讀繪本，幫主角看看球最後去哪裡了。」
  * 目前狀態：`class="lesson-card is-locked"`，`data-url="./reading-story-2.html"`，`disabled`
* **製作規劃**：
  1. 建立 `reading-story-2.html`。
  2. 串接客委會/教材音檔與分段段落。
  3. 解鎖 `reading.html` 卡片。

---

### 5. 繪本朗讀任務：〈啊！有黃蚻〉 (篇章 3)
* **所在位置**：`reading.html` (Line 57-64)
* **卡片內容**：
  * 標題：`啊！有黃蚻`
  * 圖片：`https://dn9mvjhbyvvpc.cloudfront.net/self_study/reading/14/image/0.png`
  * 說明：「有蟑螂！用腳踩，用拖鞋，怎麼打也打不到，最後......。快來大聲地朗讀繪本，把蟑螂給抓住吧！」
  * 目前狀態：`class="lesson-card is-locked"`，`data-url="./reading-story-3.html"`，`disabled`
* **製作規劃**：
  1. 建立 `reading-story-3.html`。
  2. 串接蟑螂主題幽默情境插圖、分段文字朗讀與評測。
  3. 解鎖 `reading.html` 卡片。

---

### 6. 口說詞彙卡：階段主題解鎖
* **所在位置**：`Vocabulary.html` (Line 41-56)
* **項目**：
  1. **客語互動場景 (`classroom-stage-1.html`)**：學習階段 1，觀察場景並進行詞語互動（目前按鈕 disabled）。
  2. **戶外教學趣 (`field-trip.html`)**：學習階段 2，聽音跟讀客庄詞語（目前按鈕 disabled）。
* **製作規劃**：檢查兩頁面完備度，補齊練習題或修復後解鎖按鈕。

---

### 7. 各模組之多腔別支援 (海陸/大埔/饒平/詔安/南四縣)
* **所在位置**：
  * `holiday.html`
  * `classroom.html`
  * `reading.html`
  * `Vocabulary.html`
* **目前狀態**：目前僅四縣腔可正常切換，其餘腔別均設有 `disabled aria-disabled="true"`。
* **製作規劃**：配合客委會詞庫/音檔 API，補齊各腔別發音對照資料庫後逐步開放。

---

### 8. 客語分級測驗：即時作答倒數與提示音
* **所在位置**：`speaking-exam.html`
* **現狀**：題庫資料已包含作答規則字串（例如準備時間、作答時間、開始作答前叮一聲），但目前畫面上尚未實作倒數計時器與提示音效果。
* **製作規劃**：加入音效觸發（叮聲）與考試倒數進度條。
