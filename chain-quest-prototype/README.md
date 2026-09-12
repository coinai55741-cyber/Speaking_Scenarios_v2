# 客語生活任務 · 6 大情境互動學習原型系統 (Chain Quest Prototype Engine)

這是一個具備高度互動性、模組化與雙軌語音辨識的客語情境口說原型系統，採用現代 **MVC (Model-View-Controller)** 架構與原生純 HTML、CSS、JavaScript 實作，支援「**口說分支選擇**」、「**Canvas 2D 地圖尋路走位**」、「**4 格背包自由收集**」、「**三層流水線即時監控 (ASR ➔ MT ➔ LLM-as-a-Judge)**」與「**華語/客語模式即時切換**」。

---

## 📁 檔案結構

```
chain-quest-prototype/
├── index.html        # 獨立主頁面（支援 6 大情境分頁切換、插畫看板、故事敘述卡、Canvas 地圖、流水線監控）
├── style.css         # 響應式佈局、現代卡片、玻璃質感、動態徽章與拖移把手樣式
├── app.js            # 核心 MVC 引擎 (SCENARIOS_GRAPH, GraphStateManager, ZooMapEngine, UIController, ASR/MT/LLM 適配器)
├── scenarios_spec.md # 6 大情境完整題目、引導故事、雙語關鍵詞與 MVC 規格表
├── scenarios_spec.csv# 規格資料 CSV 匯出檔
├── api/
│   ├── judge.js            # Vercel Serverless Function: LLM-as-a-Judge 後端評估 (Google Gemini / OpenAI)
│   ├── realtime-ticket.js  # Vercel Serverless Function: 客委會 WebSocket ASR 票券中繼
│   └── translate.js        # Vercel Serverless Function: 客委會 MT 機器翻譯轉發
└── README.md         # 專案說明與架構指南
```

---

## 🏗️ 核心 MVC 架構說明

- **Model (資料與狀態層)**：
  - `SCENARIOS_GRAPH`：6 大情境節點圖（主線、分支選擇、地圖移動、背包收集、集合點），封裝雙語故事引導句、標準目標句、命中關鍵詞、NPC 角色人設與情境回應。
  - `GraphStateManager`：管理當前情境、當前節點、分支選擇路徑、4 格背包收集 Set、口說辨識模式（`hakka` 客委會 ASR / `mandarin` 瀏覽器內建 Web Speech）。
- **View (視覺與互動呈現層)**：
  - 主舞台故事敘述卡、提詞卡片容器、學生/NPC 對話氣泡。
  - `ZooMapEngine`：Canvas 2D 動物園尋路引擎（小人自走、虛擬 D-pad、展區以 `❓` 呈現避免暴雷）。
  - `devDockSidebar`：開發者模式內部檢視抽屜（支援左右拖移調整寬度、快速跳題、分支切換、Live JSON 預覽）。
  - `Pipeline Inspector`：即時監控 `1. ASR 辨識` ➔ `2. MT 客華轉譯` ➔ `3. LLM 邊界評審` 三層狀態。
- **Controller (業務控制與服務適配層)**：
  - `UIController`：事件調度、情境分頁切換、點擊錄音控制 (點擊開始/再按結束)、畫面重繪。
  - `HakkaASRAdapter`：客委會 WebSocket 即時客語 ASR 與瀏覽器 Web Speech 華語辨識雙軌適配。
  - `HakkaToMandarinAdapter`：客轉華正規化翻譯適配器（客委會 API + 60+ 生活對照字典）。
  - `LLMServiceAdapter`：語意邊界評審考官（Google Gemini 後端呼叫、嚴格對錯判定、動態 NPC 生成、429 頻率冷卻情境化緩衝）。

---

## 🎮 6 大情境題型與任務目標

| 序號 | 情境主題 | 關卡數 | 核心任務與學習目標 |
| :--- | :--- | :---: | :--- |
| **1** | **🦁 動物園連鎖任務** | 6 關 | 體驗購票、驗票、口說問路並依照指引在 Canvas 地圖操縱角色走入展區（展區以 ❓ 呈現需依指示前往），完成對話並於出口集合。 |
| **2** | **🍜 客家美食點餐** | 3 關 | 走入傳統餐館，體驗點粄條主食、客製化飲食需求（不放香菜甜一點）與加點客家擂茶評價。 |
| **3** | **🎒 校外教學打包** | 4 格背包+集合 | 在出發前對照清單，以自由順序將雨傘、水壺、毛巾、點心 4 樣物品用客語/華語裝入背包，並於玄關集合出發。 |
| **4** | **🚌 搭車街頭問路** | 4 關 | 看提示口說選擇目的地向站務員詢問公車路線（文化園區 802 / 學校 615 / 圖書館 306），上車確認班次，並於下車後聽懂十字路口方向指引。 |
| **5** | **🏥 健康中心求助** | 3 關 | 看提示口說向護理師清楚描述症狀（頭痛肚子痛 / 跑步跌倒膝蓋擦傷 / 身體發熱無力），配合擦藥休息並禮貌致謝。 |
| **6** | **🌦️ 今日天氣穿搭** | 3 關 | 觀察早晨天氣狀況，看提示口說選擇下雨、酷熱或寒冷天氣，說出合適的穿搭與防護提醒，並於玄關整齊出門。 |

---

## 🚀 本機運行與測試

1. **直接開啟**：
   - 雙擊開啟 `index.html`，或用現代瀏覽器（Chrome、Edge）直接開啟。
2. **透過 Local Server 開啟**：
   - 終端機切換至資料夾後執行 `npx serve .` 或啟動 VS Code Live Server。
