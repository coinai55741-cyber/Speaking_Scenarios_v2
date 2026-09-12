/**
 * ============================================================================
 * 連鎖情境任務原型系統 (Chain Quest Interactive Prototype Engine)
 * ============================================================================
 * 支援「口說分支選擇」、「Canvas 2D 地圖尋路走位與重走檢驗」、「4 格背包自由收集」
 * 「真實 Web Speech API 語音識別還原」與「開發者模式分支直接切換」之客語情境教學系統。
 */

// ==========================================
// 1. 聲音合成特效 (Web Audio API)
// ==========================================
class SoundFX {
  static init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
  }

  static playTone(freq, type = "sine", duration = 0.15, gainVal = 0.1) {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // ignore
    }
  }

  static success() {
    this.playTone(523.25, "sine", 0.1, 0.15); // C5
    setTimeout(() => this.playTone(659.25, "sine", 0.1, 0.15), 90); // E5
    setTimeout(() => this.playTone(783.99, "sine", 0.25, 0.2), 180); // G5
  }

  static error() {
    this.playTone(220, "triangle", 0.15, 0.2);
    setTimeout(() => this.playTone(180, "triangle", 0.25, 0.2), 120);
  }

  static select() {
    this.playTone(440, "sine", 0.08, 0.08);
  }

  static step() {
    this.playTone(320, "sine", 0.05, 0.05);
  }

  static complete() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, "sine", 0.2, 0.15), i * 110);
    });
  }
}

// ==========================================
// 2. 全情境與節點圖資料結構 (Node Graph Definition)
// ==========================================
const SCENARIOS_GRAPH = {
  // ----------------------------------------------------
  // 情境 1：動物園連鎖任務 (含 Canvas 尋路地圖與分支)
  // ----------------------------------------------------
  zoo_chain: {
    id: "zoo_chain",
    title: "動物園連鎖任務",
    icon: "🦁",
    bannerImage: "./assets/zoo_chain.jpg",
    objectPosition: "calc(32% + 100px) 42%",
    objective: "體驗購票、驗票、口說問路並依照指引在 Canvas 地圖操縱小人走入展區，完成對話並於出口集合。",
    startNodeId: "zoo_start",
    nodes: {
      zoo_start: {
        id: "zoo_start",
        title: "第一關：購票入園",
        nodeType: "主線",
        locationTag: "動物園大門售票處",
        storyPrompt: "今天天氣晴朗，你跟同學一起來到動物園門口。輪到你上前時，你準備跟售票員買學生票。你說：",
        targetHakka: "𠊎愛買三張學生票。",
        targetMandarin: "我要買三張學生票。",
        keywords: ["三張", "愛買", "學生票"],
        altKeywords: ["三張", "學生", "學生票", "買票"],
        npcRole: "售票員",
        npcAvatar: "🧑‍💼",
        npcSuccessResponse: "「好，三張學生票。這是你的門票，請收好，祝你們玩得開心！」",
        npcRetryResponse: "「不好意思我沒聽清楚，請問是要買幾張呢？例如說：『𠊎愛買三張學生票』。」",
        nextNodeId: "zoo_gate"
      },
      zoo_gate: {
        id: "zoo_gate",
        title: "第二關：驗票進場",
        nodeType: "主線",
        locationTag: "入園驗票閘門",
        storyPrompt: "你拿著門票走到閘門前，志工奶奶準備幫你驗票，你也想向她道謝。你說：",
        targetHakka: "這係𠊎个門票，恁仔細。",
        targetMandarin: "這是我的門票，謝謝。",
        keywords: ["門票", "恁仔細"],
        altKeywords: ["這係", "謝謝", "門票"],
        npcRole: "驗票志工",
        npcAvatar: "👵",
        npcSuccessResponse: "「歡迎光臨！閘門打開了，進去請小心腳步，慢慢參觀喔！」",
        npcRetryResponse: "「志工奶奶正在等你出示門票，可以說：『這係𠊎个門票，恁仔細』喔！」",
        nextNodeId: "zoo_choose_animal"
      },
      zoo_choose_animal: {
        id: "zoo_choose_animal",
        title: "第三關：園區問路找展區",
        nodeType: "選擇",
        locationTag: "園區路口導覽站",
        storyPrompt: "進到園區後，你們想先看一種動物。請看上方提示，開口向導覽員詢問你想去的展區（例如大象、獅子或蛇）：",
        targetHakka: "請問大象區愛仰般行？",
        targetMandarin: "請問大象展區要怎麼走？",
        keywords: ["請問", "愛仰般行"],
        altKeywords: ["大象", "獅子", "蛇", "仰般行"],
        npcRole: "園區導覽員",
        npcAvatar: "👨‍🌾",
        npcSuccessResponse: "「想好要看哪一種動物後，就看清楚路線提示，操縱小人出發吧！」",
        npcRetryResponse: "「請問你想去哪裡呢？請開口說出大象、獅子或蛇其中一個展區喔！」",
        choices: [
          {
            id: "elephant",
            title: "🐘 大象展區",
            sub: "左上方水池旁",
            targetBranchId: "zoo_elephant",
            zoneCode: "A",
            keywords: ["大象", "象", "水池", "鼻仔"],
            guideResponse: "「想看大象的話，從這裡沿著步道直走經過十字路口，再往左手邊走到底，就會看到大象水池囉！」"
          },
          {
            id: "lion",
            title: "🦁 獅子展區",
            sub: "正上方岩石區",
            targetBranchId: "zoo_lion",
            zoneCode: "B",
            keywords: ["獅子", "獅仔", "獅", "岩石", "威風"],
            guideResponse: "「想看獅子的話，從這裡沿著步道直走經過十字路口，正前方岩石區就是獅子展區囉！」"
          },
          {
            id: "snake",
            title: "🐍 蛇展區",
            sub: "右上方溫室玻璃屋",
            targetBranchId: "zoo_snake",
            zoneCode: "C",
            keywords: ["蛇", "蛇仔", "溫室", "玻璃", "安靜"],
            guideResponse: "「想看蛇的話，從這裡沿著步道直走經過十字路口，再往右手邊走到底，玻璃溫室就是蛇展區囉！」"
          }
        ],
        nextNodeId: "zoo_map_nav"
      },
      zoo_map_nav: {
        id: "zoo_map_nav",
        title: "第四關：園區步道尋路移動",
        nodeType: "地圖移動",
        locationTag: "園區步道十字路口",
        storyPrompt: "請依照導覽員的指示，操縱小人沿著石板步道走向你選擇的【⭐ 星標展區】，抵達後按右下角【確定抵達】！",
        npcRole: "園區導覽員",
        npcAvatar: "👨‍🌾",
        npcSuccessResponse: "「很好！你順利走到展區了，快跟同學分享你的發現吧！」",
        npcRetryResponse: "「哎呀走錯展區囉！目前位置不是你選擇的展區，請按【🔄 重新走】或看清楚星標再試一次！」"
      },
      zoo_elephant: {
        id: "zoo_elephant",
        title: "第五關：大象展區互動",
        nodeType: "分支",
        locationTag: "大象展區水池旁",
        storyPrompt: "你看到大象用長鼻子吸水沖在背上洗澡，覺得很可愛，想跟身邊的同學分享。你說：",
        targetHakka: "大象个鼻仔當長，當得人惜！",
        targetMandarin: "大象的鼻子好長，好可愛！",
        keywords: ["大象", "鼻仔", "當長", "得人惜"],
        altKeywords: ["鼻仔", "得人惜", "長", "大象"],
        npcRole: "同學阿明",
        npcAvatar: "👦",
        npcSuccessResponse: "「真的耶！你看牠還會用長鼻子捲草吃，大象真的好得意喔！」",
        npcRetryResponse: "「蛤，你剛剛說什麼？試著說說大象的鼻子：『大象个鼻仔當長，當得人惜！』」",
        nextNodeId: "zoo_meet_point"
      },
      zoo_lion: {
        id: "zoo_lion",
        title: "第五關：獅子展區互動",
        nodeType: "分支",
        locationTag: "獅子展區岩石旁",
        storyPrompt: "你看到獅子趴在石頭上休息，鬃毛看起來很威風，想跟身邊的同學分享。你說：",
        targetHakka: "獅仔看起來當威風。",
        targetMandarin: "獅子看起來很威風。",
        keywords: ["獅仔", "當威風"],
        altKeywords: ["獅子", "威風", "獅仔"],
        npcRole: "同學阿明",
        npcAvatar: "👦",
        npcSuccessResponse: "「對啊，牠趴在岩石上，看起來就像草原之王一樣威風！」",
        npcRetryResponse: "「試著用客語說：『獅仔看起來當威風』喔！」",
        nextNodeId: "zoo_meet_point"
      },
      zoo_snake: {
        id: "zoo_snake",
        title: "第五關：蛇展區互動",
        nodeType: "分支",
        locationTag: "蛇展區玻璃窗前",
        storyPrompt: "你看到蛇慢慢爬過樹枝，動作很安靜，想跟身邊的同學分享。你說：",
        targetHakka: "蛇仔行路當靜。",
        targetMandarin: "蛇移動得很安靜。",
        keywords: ["蛇仔", "當靜"],
        altKeywords: ["蛇", "安靜", "靜", "蛇仔"],
        npcRole: "同學阿明",
        npcAvatar: "👦",
        npcSuccessResponse: "「真的，牠在樹枝上滑行得好慢，幾乎一點聲音都沒有！」",
        npcRetryResponse: "「試著用客語說：『蛇仔行路當靜』喔！」",
        nextNodeId: "zoo_meet_point"
      },
      zoo_meet_point: {
        id: "zoo_meet_point",
        title: "第六關：展區出口集合",
        nodeType: "集合點",
        locationTag: "園區出口集合點",
        storyPrompt: "參觀完動物展區後，大家走到【⭐ 出口集合點】集合，老師正在清點人數。你向老師報告：",
        targetHakka: "老師，𠊎兜都參觀好了！",
        targetMandarin: "老師，我們都參觀好了！",
        keywords: ["老師", "參觀", "好了"],
        altKeywords: ["老師", "好了", "參觀好了"],
        npcRole: "帶隊老師",
        npcAvatar: "👩‍🏫",
        npcSuccessResponse: "「太棒了！大家都準時集合而且學到很多動物知識，動物園探索大成功！」",
        npcRetryResponse: "「跟老師報告大家參觀好了：『老師，𠊎兜都參觀好了！』」",
        nextNodeId: null // 結束
      }
    }
  },

  // ----------------------------------------------------
  // 情境 2：客家美食點餐 (還原上一版經典 3 步驟)
  // ----------------------------------------------------
  hakka_food: {
    id: "hakka_food",
    title: "客家美食點餐",
    icon: "🍜",
    bannerImage: "./assets/hakka_food.jpg",
    objectPosition: "50% 50%",
    objective: "走入客家傳統餐館，學習點粄條主食、客製化飲食需求與加點飲品評價。",
    startNodeId: "food_step1",
    nodes: {
      food_step1: {
        id: "food_step1",
        title: "步驟 1：點傳統主食",
        nodeType: "主線",
        locationTag: "客家小吃店櫃檯",
        storyPrompt: "我走過街上聞一聞好香喔，我的嘴巴都流口水了，跟著香味走去原來是一個客家小吃攤。你舔了一舔嘴巴，進到餐廳門口看了一下，決定跟老闆點菜。你說：",
        targetHakka: "老闆，𠊎愛一碗湯粄條。",
        targetMandarin: "老闆，我要一碗湯粄條。",
        keywords: ["老闆", "愛一碗", "湯粄條"],
        altKeywords: ["愛", "湯粄條", "一碗", "粄條"],
        npcRole: "小吃店老闆",
        npcAvatar: "👨‍🍳",
        npcSuccessResponse: "「好，我收你五十箍，你去那邊稍坐一下喔，等一下就上菜了！」",
        npcRetryResponse: "「想吃粄條嗎？可以跟老闆說：『老闆，𠊎愛一碗湯粄條』喔！」",
        nextNodeId: "food_step2"
      },
      food_step2: {
        id: "food_step2",
        title: "步驟 2：客製化飲食需求",
        nodeType: "主線",
        locationTag: "出餐備料區",
        storyPrompt: "你想起自己平常不喜歡吃香菜，而且喜歡湯頭稍微甘甜一點。你走到廚房窗口前，親切地交代掌廚的阿姨。你說：",
        targetHakka: "毋好放香菜，甜一點。",
        targetMandarin: "不要放香菜，甜一點。",
        keywords: ["毋好放", "香菜"],
        altKeywords: ["毋好", "香菜", "甜一點"],
        npcRole: "廚房阿姨",
        npcAvatar: "👩‍🍳",
        npcSuccessResponse: "「沒問題！阿姨記下來了，不放香菜，幫你煮得甘甜甘甜！」",
        npcRetryResponse: "「如果不加香菜，可以說：『毋好放香菜，甜一點』喔！」",
        nextNodeId: "food_step3"
      },
      food_step3: {
        id: "food_step3",
        title: "步驟 3：加點飲品與評價",
        nodeType: "集合點",
        locationTag: "小吃店用餐餐桌",
        storyPrompt: "熱騰騰的粄條和客家小炒端上桌了，每一口都香氣四溢。你吃得津津有味，想順便加點一杯傳統客家擂茶解渴，順便稱讚老闆手藝。你說：",
        targetHakka: "再加一杯擂茶，這道客家小炒當好食！",
        targetMandarin: "再加一杯擂茶，這道客家小炒真好吃！",
        keywords: ["擂茶", "客家小炒", "當好食"],
        altKeywords: ["擂茶", "好食", "客家小炒"],
        npcRole: "服務生",
        npcAvatar: "🧑‍💼",
        npcSuccessResponse: "「多謝你喜歡！冰涼濃郁的現磨擂茶馬上送上來，請慢用喔！」",
        npcRetryResponse: "「可以試著說：『再加一杯擂茶，這道客家小炒當好食！』」",
        nextNodeId: null
      }
    }
  },

  // ----------------------------------------------------
  // 情境 3：校外教學打包 (4 格背包非線性自由收集)
  // ----------------------------------------------------
  field_trip_pack: {
    id: "field_trip_pack",
    title: "校外教學打包",
    icon: "🎒",
    bannerImage: "./assets/field_trip_pack.jpg",
    objectFit: "cover",
    objectPosition: "46% 50%",
    objective: "在出發前對照清單，以自由順序將雨傘、水壺、毛巾、點心 4 樣物品用客語裝入背包，並於玄關集合。",
    startNodeId: "pack_hub",
    nodes: {
      pack_hub: {
        id: "pack_hub",
        title: "背包打包任務",
        nodeType: "收集任務",
        locationTag: "客廳背包整理區",
        storyPrompt: "明天要校外教學，媽媽提醒你把需要的東西放進背包。請在下方【背包清單】點選物品，說出它的客語名稱與原因！",
        npcRole: "媽媽",
        npcAvatar: "👩",
        npcSuccessResponse: "「雨傘、水壺、毛巾、點心都裝齊了，太棒了！我們到玄關集合準備出發！」",
        items: [
          {
            id: "umbrella",
            name: "雨傘",
            icon: "☂️",
            desc: "下雨防淋濕",
            locationTag: "臥室書桌前",
            storyPrompt: "你看見雨傘，請說出它的名字，以及為什麼校外教學要帶它。你說：",
            targetHakka: "𠊎愛帶遮仔，落雨做得用。",
            targetMandarin: "我要帶雨傘，下雨可以用。",
            keywords: ["遮仔", "落雨", "用"],
            altKeywords: ["雨傘", "下雨", "遮仔"],
            npcRole: "媽媽",
            npcAvatar: "👩",
            npcSuccessResponse: "「真乖！下雨時就不怕淋濕了，放進書包側邊吧！」",
            npcRetryResponse: "「請說出雨傘的名字與用途：『𠊎愛帶遮仔，落雨做得用』喔！」"
          },
          {
            id: "bottle",
            name: "水壺",
            icon: "💧",
            desc: "口渴喝水",
            locationTag: "廚房飲水機旁",
            storyPrompt: "你看見水壺，請說出它的名字，以及為什麼校外教學要帶它。你說：",
            targetHakka: "𠊎愛帶水壺，嘴渴做得啉水。",
            targetMandarin: "我要帶水壺，口渴可以喝水。",
            keywords: ["水壺", "嘴渴", "啉水"],
            altKeywords: ["水壺", "喝水", "口渴"],
            npcRole: "媽媽",
            npcAvatar: "👩",
            npcSuccessResponse: "「很好！水壺裝滿溫水放好，走路流汗要多補充水分喔！」",
            npcRetryResponse: "「請說出水壺與喝水：『𠊎愛帶水壺，嘴渴做得啉水』。」"
          },
          {
            id: "towel",
            name: "毛巾",
            icon: "🧣",
            desc: "流汗擦乾",
            locationTag: "客廳收納櫃前",
            storyPrompt: "你看見乾淨毛巾，請說出它的名字，以及為什麼校外教學要帶它。你說：",
            targetHakka: "𠊎愛帶毛巾，流汗做得拭汗。",
            targetMandarin: "我要帶毛巾，流汗可以擦汗。",
            keywords: ["毛巾", "流汗", "拭汗"],
            altKeywords: ["毛巾", "擦汗", "拭汗"],
            npcRole: "爸爸",
            npcAvatar: "👨",
            npcSuccessResponse: "「很細心！活動後把汗擦乾，比較不會著涼感冒。」",
            npcRetryResponse: "「請說出毛巾與擦汗：『𠊎愛帶毛巾，流汗做得拭汗』。」"
          },
          {
            id: "snack",
            name: "點心",
            icon: "🍪",
            desc: "肚子餓補充體力",
            locationTag: "點心餅乾盒前",
            storyPrompt: "你看見美味點心餅乾，請說出它的名字，以及為什麼校外教學要帶它。你說：",
            targetHakka: "𠊎愛帶點心，肚屎枵做得食。",
            targetMandarin: "我要帶點心，肚子餓可以吃。",
            keywords: ["點心", "肚屎枵", "食"],
            altKeywords: ["點心", "肚子餓", "肚屎枵"],
            npcRole: "爸爸",
            npcAvatar: "👨",
            npcSuccessResponse: "「沒錯！健行休息肚子餓時，可以吃點心補充元氣！」",
            npcRetryResponse: "「請說出點心與肚子餓：『𠊎愛帶點心，肚屎枵做得食』。」"
          }
        ],
        nextNodeId: "pack_done"
      },
      pack_done: {
        id: "pack_done",
        title: "完成整理：玄關出發",
        nodeType: "集合點",
        locationTag: "玄關大門口",
        storyPrompt: "4 樣物品都順利放進背包了！你背起背包走到玄關，精神飽滿地向家人說：",
        targetHakka: "𠊎東西都收好，準備好出發了！",
        targetMandarin: "我東西都收好了，準備好出發了！",
        keywords: ["收好", "出發"],
        altKeywords: ["準備", "出發", "收好"],
        npcRole: "媽媽",
        npcAvatar: "👩",
        npcSuccessResponse: "「太棒了！裝備齊全，今天校外教學一定會非常順利又開心！」",
        npcRetryResponse: "「跟媽媽說準備好出發了：『𠊎東西都收好，準備好出發了！』」",
        nextNodeId: null
      }
    }
  },

  // ----------------------------------------------------
  // 情境 4：搭車問路 (比照動物園口說分支與指引邏輯)
  // ----------------------------------------------------
  bus_directions: {
    id: "bus_directions",
    title: "搭車與街頭問路",
    icon: "🚌",
    bannerImage: "./assets/bus_directions.jpg",
    objectPosition: "80% 48%",
    objective: "看提示口說選擇目的地向站務員詢問路線，上車確認班次，並於下車後聽懂十字路口方向指引。",
    startNodeId: "bus_choose_dest",
    nodes: {
      bus_choose_dest: {
        id: "bus_choose_dest",
        title: "步驟 1：詢問搭車路線",
        nodeType: "選擇",
        locationTag: "市區公車站牌",
        storyPrompt: "你站在熱鬧的市區公車站前，看著站牌。請看上方提示，開口向站務員詢問你想去的目的地路線（如文化園區、學校或圖書館）：",
        targetHakka: "請問去文化園區愛坐哪一路公車？",
        targetMandarin: "請問去文化園區要搭哪一路公車？",
        keywords: ["請問", "哪一路", "公車"],
        altKeywords: ["文化園區", "學校", "圖書館", "公車"],
        npcRole: "站務人員",
        npcAvatar: "👮",
        npcSuccessResponse: "「選好目的地後，我會告訴你搭哪一路公車喔！」",
        npcRetryResponse: "「請清楚問要去哪個地方：文化園區、學校或圖書館。」",
        choices: [
          {
            id: "culture",
            title: "🏛️ 文化園區",
            sub: "搭乘 802 路公車",
            targetBranchId: "bus_ask_culture",
            keywords: ["文化園區", "文化", "園區"],
            guideResponse: "「去文化園區要搭 802 路公車喔！大約再過三分鐘就會進站了，準備好悠遊卡喔！」"
          },
          {
            id: "school",
            title: "🏫 學校正門",
            sub: "搭乘 615 路公車",
            targetBranchId: "bus_ask_school",
            keywords: ["學校", "正門", "學校正門"],
            guideResponse: "「去學校可以搭 615 路公車，請在右側站牌等候喔！」"
          },
          {
            id: "library",
            title: "📚 市立圖書館",
            sub: "搭乘 306 路公車",
            targetBranchId: "bus_ask_library",
            keywords: ["圖書館", "市立圖書館"],
            guideResponse: "「去圖書館請搭 306 路公車，很快就到了喔！」"
          }
        ],
        nextNodeId: "bus_ask_culture"
      },
      bus_ask_culture: {
        id: "bus_ask_culture",
        title: "步驟 2：802 站牌候車問候",
        nodeType: "分支",
        locationTag: "802 站牌前",
        storyPrompt: "你來到 802 站牌前，向巡邏站務員再次禮貌確認。你說：",
        targetHakka: "請問去文化園區愛坐哪一路公車？",
        targetMandarin: "請問去文化園區要搭哪一路公車？",
        keywords: ["文化園區", "哪一路", "公車"],
        altKeywords: ["坐", "公車", "文化園區"],
        npcRole: "站務人員",
        npcAvatar: "👮",
        npcSuccessResponse: "「對！802 路公車馬上進站了，請在黃線後方排隊上車喔！」",
        npcRetryResponse: "「請清楚問：『請問去文化園區愛坐哪一路公車？』」",
        nextNodeId: "bus_board"
      },
      bus_ask_school: {
        id: "bus_ask_school",
        title: "步驟 2：615 站牌候車問候",
        nodeType: "分支",
        locationTag: "學校線站牌前",
        storyPrompt: "你來到學校線站牌前，向巡邏站務員再次禮貌確認。你說：",
        targetHakka: "請問去學校愛坐哪一路公車？",
        targetMandarin: "請問去學校要搭哪一路公車？",
        keywords: ["學校", "哪一路", "公車"],
        altKeywords: ["坐", "公車", "學校"],
        npcRole: "站務人員",
        npcAvatar: "👮",
        npcSuccessResponse: "「對！615 路公車馬上進站了，請在黃線後方排隊上車喔！」",
        npcRetryResponse: "「請清楚問：『請問去學校愛坐哪一路公車？』」",
        nextNodeId: "bus_board"
      },
      bus_ask_library: {
        id: "bus_ask_library",
        title: "步驟 2：306 站牌候車問候",
        nodeType: "分支",
        locationTag: "圖書館線站牌前",
        storyPrompt: "你來到圖書館線站牌前，向巡邏站務員再次禮貌確認。你說：",
        targetHakka: "請問去圖書館愛坐哪一路公車？",
        targetMandarin: "請問去圖書館要搭哪一路公車？",
        keywords: ["圖書館", "哪一路", "公車"],
        altKeywords: ["坐", "公車", "圖書館"],
        npcRole: "站務人員",
        npcAvatar: "👮",
        npcSuccessResponse: "「對！306 路公車馬上進站了，請在黃線後方排隊上車喔！」",
        npcRetryResponse: "「請清楚問：『請問去圖書館愛坐哪一路公車？』」",
        nextNodeId: "bus_board"
      },
      bus_board: {
        id: "bus_board",
        title: "步驟 3：上車確認到站",
        nodeType: "主線",
        locationTag: "公車前門刷卡處",
        storyPrompt: "公車停靠開門，你在刷卡上車時，向司機先生再次確認這班車會不會到目的地。你說：",
        targetHakka: "請問這台車有到目的地無？",
        targetMandarin: "請問這台車有到目的地嗎？",
        keywords: ["這台車", "有到", "無"],
        altKeywords: ["目的地", "這台車", "有到無"],
        npcRole: "公車司機",
        npcAvatar: "👨‍✈️",
        npcSuccessResponse: "「有喔！這班車有到，快進去坐好、抓緊扶手喔！」",
        npcRetryResponse: "「可以問司機：『請問這台車有到目的地無？』」",
        nextNodeId: "bus_arrive"
      },
      bus_arrive: {
        id: "bus_arrive",
        title: "步驟 4：下車路口方向指引",
        nodeType: "集合點",
        locationTag: "十字路口紅綠燈旁",
        storyPrompt: "下車後走到十字路口，你向路旁熱心阿婆確認向前走、過紅綠燈左轉就會到。你說：",
        targetHakka: "向前行，過紅綠燈越倒手就到了。",
        targetMandarin: "往前走，過紅綠燈左轉就到了。",
        keywords: ["向前行", "紅綠燈", "越倒手"],
        altKeywords: ["向前", "過紅綠燈", "左轉", "越倒手"],
        npcRole: "熱心阿婆",
        npcAvatar: "👵",
        npcSuccessResponse: "「無錯！過紅綠燈越倒手（左轉）走兩步路就看到大門了，祝你順利喔！」",
        npcRetryResponse: "「照著方向唸：『向前行，過紅綠燈越倒手就到了』喔！」",
        nextNodeId: null
      }
    }
  },

  // ----------------------------------------------------
  // 情境 5：健康中心 (比照動物園口說分支與指引邏輯)
  // ----------------------------------------------------
  health_center: {
    id: "health_center",
    title: "健康中心求助",
    icon: "🏥",
    bannerImage: "./assets/health_center.jpg",
    objectFit: "cover",
    objectPosition: "37.25% 50%",
    objective: "看提示口說向護理師清楚描述症狀，配合擦藥休息並禮貌道謝。",
    startNodeId: "health_choose_symptom",
    nodes: {
      health_choose_symptom: {
        id: "health_choose_symptom",
        title: "步驟 1：向護理師表達不適",
        nodeType: "選擇",
        locationTag: "學校健康中心諮詢桌",
        storyPrompt: "你走進安靜的健康中心，護理師溫柔地問你哪裡不舒服。請看上方提示，開口說明你的狀況（如頭痛肚子痛、膝蓋擦傷或身體發熱）：",
        targetHakka: "護理師，𠊎頭那痛、肚痛。",
        targetMandarin: "護理師，我頭痛、肚子痛。",
        keywords: ["護理師", "痛"],
        altKeywords: ["頭痛", "肚痛", "擦傷", "發熱"],
        npcRole: "護理師",
        npcAvatar: "👩‍⚕️",
        npcSuccessResponse: "「慢慢說，哪裡不舒服都可以告訴我喔。」",
        npcRetryResponse: "「哪裡痛痛呢？可以開口說出頭痛、擦傷或發熱喔！」",
        choices: [
          {
            id: "head_stomach",
            title: "🤕 頭痛肚子痛",
            sub: "頭暈腦脹、肚子陣陣疼痛",
            targetBranchId: "health_symptom_head",
            keywords: ["頭痛", "肚痛", "頭那痛", "肚子痛", "頭暈"],
            guideResponse: "「小朋友辛苦了，先坐下來量體溫，阿姨倒一杯溫開水給你喝喔。」"
          },
          {
            id: "scratch",
            title: "🩹 膝蓋擦傷",
            sub: "操場跑步跌倒擦破皮",
            targetBranchId: "health_symptom_scratch",
            keywords: ["擦傷", "跌倒", "膝蓋", "跑太快", "腳痛", "流血"],
            guideResponse: "「不要緊喔！阿姨幫你用生理食鹽水清洗傷口、擦藥膏喔！」"
          },
          {
            id: "fever",
            title: "🤒 身體發熱",
            sub: "全身熱熱的、沒有力氣",
            targetBranchId: "health_symptom_fever",
            keywords: ["發熱", "發燒", "身體熱", "當燒", "無力", "燒"],
            guideResponse: "「我先幫你量耳溫，稍微有一點發燒，等一下幫你聯絡家長與導師。」"
          }
        ],
        nextNodeId: "health_symptom_head"
      },
      health_symptom_head: {
        id: "health_symptom_head",
        title: "步驟 2：說明頭痛肚子痛",
        nodeType: "分支",
        locationTag: "學校健康中心諮詢桌",
        storyPrompt: "你向護理師詳細說明頭暈腦脹與肚子陣陣絞痛的情形。你說：",
        targetHakka: "護理師，𠊎頭那痛、肚痛。",
        targetMandarin: "護理師，我頭痛、肚子痛。",
        keywords: ["護理師", "頭那痛", "肚痛"],
        altKeywords: ["頭痛", "肚痛", "痛"],
        npcRole: "護理師",
        npcAvatar: "👩‍⚕️",
        npcSuccessResponse: "「我知道了，先坐下來量體溫，阿姨倒一杯溫開水給你喝喔。」",
        npcRetryResponse: "「請說出頭痛與肚子痛：『護理師，𠊎頭那痛、肚痛』。」",
        nextNodeId: "health_rest"
      },
      health_symptom_scratch: {
        id: "health_symptom_scratch",
        title: "步驟 2：說明跑步跌倒擦傷",
        nodeType: "分支",
        locationTag: "傷口擦藥床位",
        storyPrompt: "護理師注意到你的膝蓋有紅紅擦傷，你跟護理師解釋剛剛體育課跑步太快跌倒了。你說：",
        targetHakka: "體育課跑太遽，𠊎腳跌倒痛痛。",
        targetMandarin: "體育課跑太快，我腳跌倒痛痛。",
        keywords: ["體育課", "跑太遽", "跌倒"],
        altKeywords: ["跑太快", "腳痛", "跌倒", "跑太遽"],
        npcRole: "護理師",
        npcAvatar: "👩‍⚕️",
        npcSuccessResponse: "「不要緊喔！阿姨幫你擦消炎藥、貼上透氣紗布，很快就不會痛了。」",
        npcRetryResponse: "「試著說明：『體育課跑太遽，𠊎腳跌倒痛痛』。」",
        nextNodeId: "health_rest"
      },
      health_symptom_fever: {
        id: "health_symptom_fever",
        title: "步驟 2：說明身體發熱無力",
        nodeType: "分支",
        locationTag: "量體溫區",
        storyPrompt: "你覺得身體熱熱的，全身沒有力氣，向護理師說明。你說：",
        targetHakka: "𠊎身體當燒，無麼个力。",
        targetMandarin: "我身體很熱，沒有什麼力氣。",
        keywords: ["身體", "當燒", "無力"],
        altKeywords: ["發熱", "沒力", "當燒", "身體"],
        npcRole: "護理師",
        npcAvatar: "👩‍⚕️",
        npcSuccessResponse: "「我先幫你量耳溫，稍微有一點發燒，先在床上躺著休息一節課喔。」",
        npcRetryResponse: "「請說出身體很熱：『𠊎身體當燒，無麼个力』。」",
        nextNodeId: "health_rest"
      },
      health_rest: {
        id: "health_rest",
        title: "步驟 3：承諾休息叮嚀與致謝",
        nodeType: "集合點",
        locationTag: "健康中心休息區",
        storyPrompt: "傷口包紮好後，護理師叮嚀你今天不要劇烈運動，要多喝溫水好好休息。你答應她並道謝。你說：",
        targetHakka: "𠊎會多啉水、好好歇睏，恁仔細！",
        targetMandarin: "我會多喝水、好好休息，謝謝您！",
        keywords: ["多啉水", "歇睏", "恁仔細"],
        altKeywords: ["喝水", "休息", "謝謝", "多啉水"],
        npcRole: "護理師",
        npcAvatar: "👩‍⚕️",
        npcSuccessResponse: "「真懂事！先在病床上躺著休息一節課，身體很快就會恢復元氣囉！」",
        npcRetryResponse: "「記得跟阿姨說：『𠊎會多啉水、好好歇睏，恁仔細！』」",
        nextNodeId: null
      }
    }
  },

  // ----------------------------------------------------
  // 情境 6：今日天氣與穿搭 (比照動物園口說分支與指引邏輯)
  // ----------------------------------------------------
  weather_outfit: {
    id: "weather_outfit",
    title: "今日天氣與出門穿搭",
    icon: "🌦️",
    bannerImage: "./assets/weather_outfit.jpg",
    objectPosition: "calc(50% + 100px) 50%",
    objective: "觀察早晨天氣狀況，看提示口說選擇下雨、酷熱或寒冷天氣，用客語說出合適的穿搭與防護提醒。",
    startNodeId: "weather_choose_type",
    nodes: {
      weather_choose_type: {
        id: "weather_choose_type",
        title: "步驟 1：選擇今日天氣提醒",
        nodeType: "選擇",
        locationTag: "玄關落地窗前",
        storyPrompt: "清晨拉開窗簾看天氣。請看上方提示，開口提醒家人今天的天氣與穿搭（如下雨天、大熱天或寒冷天）：",
        targetHakka: "今晡日落雨，愛帶遮仔著雨衣。",
        targetMandarin: "今天下雨，要帶雨傘穿雨衣。",
        keywords: ["今晡日", "愛"],
        altKeywords: ["落雨", "當熱", "當冷", "雨傘", "帽子", "大衣"],
        npcRole: "家人",
        npcAvatar: "👨‍👩‍👧",
        npcSuccessResponse: "「看清楚天氣，再想想今天要穿什麼或帶什麼出門喔！」",
        npcRetryResponse: "「請看窗外天氣，開口提醒下雨、大熱天或寒冷天穿搭喔！」",
        choices: [
          {
            id: "rain",
            title: "🌧️ 陰雨綿綿",
            sub: "天空飄雨、地面潮濕",
            targetBranchId: "weather_outfit_rain",
            keywords: ["落雨", "下雨", "雨天", "雨傘", "雨衣", "遮仔"],
            guideResponse: "「無錯！落雨天路滑，著好雨衣、帶好遮仔，出門小心行喔！」"
          },
          {
            id: "hot",
            title: "☀️ 炎熱大晴天",
            sub: "豔陽高照、氣溫偏高",
            targetBranchId: "weather_outfit_hot",
            keywords: ["當熱", "很熱", "大熱天", "晴天", "太陽", "遮陽帽"],
            guideResponse: "「大熱天陽光真烈，戴上帽仔、多喝水才不會中暑喔！」"
          },
          {
            id: "cold",
            title: "❄️ 寒冷冬日",
            sub: "冷氣團來襲、北風呼呼",
            targetBranchId: "weather_outfit_cold",
            keywords: ["當冷", "很冷", "寒冷", "天冷", "冬天", "大衫", "圍巾"],
            guideResponse: "「乖孫真靈俐！著暖暖、圍巾圍好，出門就毋驚吹風冷著囉！」"
          }
        ],
        nextNodeId: "weather_outfit_rain"
      },
      weather_outfit_rain: {
        id: "weather_outfit_rain",
        title: "步驟 2：下雨天穿搭提醒",
        nodeType: "分支",
        locationTag: "雨具區落地窗前",
        storyPrompt: "窗外正滴滴答答下著細雨，地上濕漉漉的。你轉頭提醒即將出門的家人要備好雨具。你說：",
        targetHakka: "今晡日落雨，愛帶遮仔著雨衣。",
        targetMandarin: "今天下雨，要帶雨傘穿雨衣。",
        keywords: ["今晡日", "落雨", "遮仔", "雨衣"],
        altKeywords: ["下雨", "雨傘", "雨衣", "遮仔"],
        npcRole: "媽媽",
        npcAvatar: "👩",
        npcSuccessResponse: "「無錯！落雨天路滑，著好雨衣、帶好遮仔，出門小心行喔！」",
        npcRetryResponse: "「提醒家人下雨天：『今晡日落雨，愛帶遮仔著雨衣』喔！」",
        nextNodeId: "weather_done"
      },
      weather_outfit_hot: {
        id: "weather_outfit_hot",
        title: "步驟 2：大熱天穿搭提醒",
        nodeType: "分支",
        locationTag: "客廳日曆與陽臺旁",
        storyPrompt: "七月豔陽高照，外頭的大太陽曬得柏油路直冒熱氣。你戴上遮陽帽並提醒大家防曬。你說：",
        targetHakka: "今晡日當熱，愛戴等遮陽帽仔。",
        targetMandarin: "今天很熱，要戴著遮陽帽。",
        keywords: ["今晡日", "當熱", "遮陽帽仔"],
        altKeywords: ["很熱", "帽子", "遮陽帽", "當熱"],
        npcRole: "爸爸",
        npcAvatar: "👨",
        npcSuccessResponse: "「大熱天陽光真烈，戴上帽仔、多喝水才不會中暑喔！」",
        npcRetryResponse: "「說說天氣熱的穿搭：『今晡日當熱，愛戴等遮陽帽仔』。」",
        nextNodeId: "weather_done"
      },
      weather_outfit_cold: {
        id: "weather_outfit_cold",
        title: "步驟 2：寒冷天穿搭提醒",
        nodeType: "分支",
        locationTag: "臥室衣櫃前",
        storyPrompt: "寒流來襲，北風呼呼地吹著，溫度計顯示只有十度。你拿出厚厚的大衣和圍巾穿戴整齊。你說：",
        targetHakka: "天時當冷，愛著大衫圍等圍巾。",
        targetMandarin: "天氣很冷，要穿大衣圍著圍巾。",
        keywords: ["天時", "當冷", "大衫", "圍巾"],
        altKeywords: ["很冷", "大衣", "圍巾", "當冷"],
        npcRole: "阿公",
        npcAvatar: "👴",
        npcSuccessResponse: "「乖孫真靈俐！著暖暖、圍巾圍好，出門就毋驚吹風冷著囉！」",
        npcRetryResponse: "「天冷要穿暖，試著說：『天時當冷，愛著大衫圍等圍巾』喔！」",
        nextNodeId: "weather_done"
      },
      weather_done: {
        id: "weather_done",
        title: "步驟 3：穿搭整齊準備出門",
        nodeType: "集合點",
        locationTag: "玄關大門口",
        storyPrompt: "穿戴整齊後，大家走到門口，準備精神奕奕地出門。你說：",
        targetHakka: "大家都準備好了，出門行囉！",
        targetMandarin: "大家都準備好了，出門走囉！",
        keywords: ["準備好", "出門"],
        altKeywords: ["準備", "出門", "準備好了"],
        npcRole: "家人",
        npcAvatar: "👨‍👩‍👧",
        npcSuccessResponse: "「太棒了！穿搭完全符合今天的天氣，出門平安順心！」",
        npcRetryResponse: "「跟家人說出門囉：『大家都準備好了，出門行囉！』」",
        nextNodeId: null
      }
    }
  }
};

// ==========================================
// 3. 第二階段：客語語音辨識適配器 (Hakka ASR Adapter)
// ==========================================
class HakkaASRAdapter {
  static config = {
    timeout: 5000
  };

  /**
   * 啟動錄音與辨識流程
   */
  static startRecognition({ onInterim, onFinal, onError, speechMode = "hakka" }) {
    if (speechMode === "mandarin") {
      // 華語對照模式：直接調用瀏覽器內建 Web Speech API (zh-TW)
      return this.startWebSpeech({ onInterim, onFinal, onError, lang: "zh-TW" });
    }

    // 客語模式：優先連線客委會即時 WebSocket ASR 串流
    return this.startHakkaWebSocketASR({ onInterim, onFinal, onError });
  }

  static startWebSpeech({ onInterim, onFinal, onError, lang = "zh-TW" }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError("瀏覽器尚未支援 Web Speech API，已自動啟用模擬辨識。");
      return null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang || "zh-TW";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalTranscript = "";

      recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const currentText = (finalTranscript || interim || "").trim();
        if (onInterim) onInterim(currentText);
      };

      recognition.onerror = (event) => {
        if (event.error === "no-speech") return;
        if (onError) onError(event.error === "not-allowed" ? "請允許麥克風權限以進行錄音。" : `辨識提示：${event.error}`);
      };

      recognition.onend = () => {
        if (onFinal) onFinal(finalTranscript.trim());
      };

      recognition.start();
      return recognition;
    } catch (err) {
      if (onError) onError(err.message || "無法啟動麥克風錄音。");
      return null;
    }
  }

  static startHakkaWebSocketASR({ onInterim, onFinal, onError }) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (onError) onError("無法取得麥克風，降級至 Web Speech。");
      return this.startWebSpeech({ onInterim, onFinal, onError, lang: "zh-TW" });
    }

    let ws = null;
    let audioContext = null;
    let sourceNode = null;
    let processorNode = null;
    let ready = false;
    let closed = false;
    let pending = [];
    let segments = {};
    let ownedStream = null;

    function currentText() {
      return Object.keys(segments)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => segments[key])
        .join("")
        .trim();
    }

    function stopAudio() {
      try { if (processorNode) processorNode.disconnect(); } catch (e) {}
      try { if (sourceNode) sourceNode.disconnect(); } catch (e) {}
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
      try { if (audioContext) audioContext.close(); } catch (e) {}
      audioContext = null;
      try { if (ws) ws.close(); } catch (e) {}
      ws = null;
      const text = currentText();
      if (onFinal) onFinal(text || "");
    }

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, sampleRate: { ideal: 16000 }, echoCancellation: true, noiseSuppression: true }
        });
        ownedStream = stream;

        // 1. 向後端取票 (/api/realtime-ticket)
        const ticketRes = await fetch("/api/realtime-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: "hak" })
        });

        if (!ticketRes.ok) throw new Error(`取票失敗 HTTP ${ticketRes.status}`);
        const ticketData = await ticketRes.json();
        if (!ticketData?.url || !ticketData?.ticket) throw new Error(ticketData?.error || "無效辨識票券");

        // 2. 建立 WebSocket 連線至客委會即時 ASR
        const query = `?ticket=${encodeURIComponent(ticketData.ticket)}&type=raw&rate=16000&channel=1&charactersToNumbers=0&noSpeechTimeout=20`;
        ws = new WebSocket(ticketData.url + query);
        ws.binaryType = "arraybuffer";

        ws.onmessage = (event) => {
          let payload = null;
          try { payload = JSON.parse(event.data); } catch (e) { return; }
          const code = Number(payload.code || 0);
          if (code === 180) {
            ready = true;
            pending.forEach((chunk) => { try { ws.send(chunk); } catch (e) {} });
            pending = [];
            return;
          }
          if (code === 200 && Array.isArray(payload.result)) {
            payload.result.forEach((item) => {
              if (item?.transcript) segments[item.segment ?? 0] = item.transcript;
            });
            const text = currentText();
            if (onInterim) onInterim(text);
          }
          if (code === 204 || payload.end === 1) finish();
          if (code >= 400) finish();
        };

        ws.onerror = () => {
          if (!closed) console.warn("[HakkaASRAdapter] 客委會 WebSocket 斷線");
        };

        ws.onclose = () => { if (!closed) finish(); };

        // 3. 擷取音訊並即時轉為 16kHz PCM
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === "suspended") await audioContext.resume();

        sourceNode = audioContext.createMediaStreamSource(stream);
        processorNode = audioContext.createScriptProcessor(4096, 1, 1);
        processorNode.onaudioprocess = (event) => {
          if (!ws || ws.readyState > 1 || closed) return;
          const pcm = HakkaASRAdapter.downsample(event.inputBuffer.getChannelData(0), audioContext.sampleRate, 16000);
          if (ready) {
            try { ws.send(pcm.buffer); } catch (e) {}
          } else if (pending.length < 80) {
            pending.push(pcm.buffer);
          }
        };
        sourceNode.connect(processorNode);
        processorNode.connect(audioContext.destination);

        if (onInterim) onInterim("🎙️ 客委會即時客語辨識連線中，請開始說話...");
      } catch (err) {
        console.warn("[HakkaASRAdapter] 客委會即時 ASR 雲端連線失敗，自動降級至瀏覽器辨識：", err);
        stopAudio();
        HakkaASRAdapter.startWebSpeech({ onInterim, onFinal, onError, lang: "zh-TW" });
      }
    })();

    return {
      stop: () => {
        stopAudio();
        if (ws && ws.readyState === 1) {
          try { ws.send("EOS"); } catch (e) {}
          setTimeout(() => finish(), 1200);
        } else {
          finish();
        }
      }
    };
  }

  static downsample(buffer, fromRate, toRate = 16000) {
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
}

// ==========================================
// 4. 第二階段：客語轉華語翻譯適配器 (Hakka to Mandarin Adapter)
// ==========================================
class HakkaToMandarinAdapter {
  static config = {
    engine: "external_mt", // "external_mt" (客委會 API) | "builtin" (本機字典)
    endpoint: "/api/translate",
    apiKey: "",
    timeout: 4000
  };

  // 內建 60+ 組高頻生活情境客語詞彙對照表
  static HAKKA_MANDARIN_DICT = [
    { hakka: "𠊎想愛去", mandarin: "我想要去" },
    { hakka: "𠊎想愛", mandarin: "我想要" },
    { hakka: "𠊎愛買", mandarin: "我要買" },
    { hakka: "𠊎愛帶", mandarin: "我要帶" },
    { hakka: "𠊎愛", mandarin: "我要" },
    { hakka: "𠊎", mandarin: "我" },
    { hakka: "毋好", mandarin: "不要" },
    { hakka: "恁仔細", mandarin: "謝謝你" },
    { hakka: "這係", mandarin: "這是" },
    { hakka: "鼻仔", mandarin: "鼻子" },
    { hakka: "當長", mandarin: "好長" },
    { hakka: "得人惜", mandarin: "惹人喜愛可愛" },
    { hakka: "獅仔", mandarin: "獅子" },
    { hakka: "蛇仔", mandarin: "蛇" },
    { hakka: "行路", mandarin: "走路" },
    { hakka: "當靜", mandarin: "好安靜" },
    { hakka: "當威風", mandarin: "好威風" },
    { hakka: "遮仔", mandarin: "雨傘" },
    { hakka: "落雨", mandarin: "下雨" },
    { hakka: "做得用", mandarin: "可以用" },
    { hakka: "嘴渴", mandarin: "口渴" },
    { hakka: "啉水", mandarin: "喝水" },
    { hakka: "拭汗", mandarin: "擦汗" },
    { hakka: "肚屎枵", mandarin: "肚子餓" },
    { hakka: "食", mandarin: "吃" },
    { hakka: "頭那痛", mandarin: "頭痛" },
    { hakka: "肚痛", mandarin: "肚子痛" },
    { hakka: "跑太遽", mandarin: "跑太快" },
    { hakka: "當燒", mandarin: "很燙發熱" },
    { hakka: "無麼个力", mandarin: "沒什麼力氣" },
    { hakka: "歇睏", mandarin: "休息" },
    { hakka: "今晡日", mandarin: "今天" },
    { hakka: "當熱", mandarin: "很熱" },
    { hakka: "天時當冷", mandarin: "天氣很冷" },
    { hakka: "大衫", mandarin: "大衣外套" },
    { hakka: "戴等", mandarin: "戴著" },
    { hakka: "著等", mandarin: "穿著" },
    { hakka: "著雨衣", mandarin: "穿雨衣" },
    { hakka: "向前行", mandarin: "往前走" },
    { hakka: "越倒手", mandarin: "向左轉" },
    { hakka: "越順手", mandarin: "向右轉" },
    { hakka: "湯粄條", mandarin: "湯粄條" },
    { hakka: "當好食", mandarin: "真好吃" },
    { hakka: "擂茶", mandarin: "客家擂茶" },
    { hakka: "客家小炒", mandarin: "客家小炒" }
  ];

  /**
   * 將客語輸入轉換為標準華語語意意圖
   */
  static async translate(hakkaText) {
    if (!hakkaText || !hakkaText.trim()) return { mandarinText: "", hitTerms: [] };

    // 若設定外部翻譯 API (包含 Vercel /api/translate，附帶超時降級)
    if (this.config.engine === "external_mt" && this.config.endpoint) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.config.timeout);

        const res = await fetch(this.config.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {})
          },
          body: JSON.stringify({ text: hakkaText, input: hakkaText, source_lang: "hakka", target_lang: "zh-TW" }),
          signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.translatedText) {
            return {
              mandarinText: data.translatedText,
              hitTerms: ["客委會API轉譯"]
            };
          }
        }
      } catch (err) {
        console.warn("[HakkaToMandarinAdapter] 外部翻譯 API 超時或異常，自動切換至本機對照引擎：", err);
      }
    }

    // 本機字典翻譯引擎 (Built-in Rule Normalizer)
    let translated = hakkaText;
    const hitTerms = [];

    for (const entry of this.HAKKA_MANDARIN_DICT) {
      if (translated.includes(entry.hakka)) {
        hitTerms.push(`${entry.hakka}➔${entry.mandarin}`);
        translated = translated.split(entry.hakka).join(entry.mandarin);
      }
    }

    return {
      mandarinText: translated,
      hitTerms
    };
  }
}

// ==========================================
// 5. 第三階段：LLM 語意邊界評估與適配器 (LLM-as-a-Judge Guardrail Adapter)
// ==========================================
class LLMServiceAdapter {
  static config = {
    provider: "vercel_api", // "vercel_api" (Vercel 後端 Google Gemini) | "local_judge" | "openai_gemini"
    model: "gemini-3.6-flash",
    apiEndpoint: "/api/judge",
    apiKey: "",
    timeout: 7000
  };

  /**
   * 建構發送給 LLM 的 System Prompt (注入情境邊界、封閉意圖與 NPC 人設)
   */
  static buildSystemPrompt(nodeConfig, scenario) {
    const rolePersonas = {
      "售票員": "說話客氣親切、專業有效率的售票人員，負責確認張數與票種。",
      "驗票志工": "和藹可親的社區志工奶奶，熱情問候並提醒安全注意事項。",
      "園區導覽員": "熱心開朗的生態解說員，清楚指引步道方向與各動物展區特點。",
      "同學阿明": "活潑好奇的同班同學，喜歡熱情分享在展區觀察到的動物特徵。",
      "老師": "溫和關心的帶隊老師，清點人數並提醒集合時間。",
      "媽媽": "細心叮嚀的母親，關心生活起居、天氣穿搭與物品齊全度。",
      "爸爸": "幽默溫暖的父親，提醒補充水分與戶外防曬。",
      "站務人員": "清楚沉穩的公車調度站務員，明確指引搭乘路線與候車月台。",
      "公車司機": "專注安全的公車駕駛，提醒上下車刷卡與握好扶手。",
      "熱心阿婆": "住在附近的親切老奶奶，以清晰的地標方向指引路人。",
      "護理師": "溫柔耐心的學校保健室阿姨，仔細診察學生身體不適並給予照護衛教。",
      "家人": "溫馨關懷的家庭長輩，提醒天冷天熱穿搭並祝出門順利。",
      "小吃店老闆": "熱情大方的客家小吃店掌櫃，招呼客人並推薦招牌菜。",
      "廚房阿姨": "手藝俐落的廚房掌杓阿姨，細心紀錄客製化飲食要求。",
      "服務生": "動作迅速有禮的餐飲服務員，介紹客家飲品與特色小炒。"
    };

    const currentPersona = rolePersonas[nodeConfig.npcRole] || "熱情友善的情境對話 NPC 角色";

    return [
      `你是一位極其專業且細心的客語情境口說 AI 助教兼角色扮演考官（LLM-as-a-Judge & Roleplayer）。`,
      `【情境主題】：${scenario?.title || ""}（目標：${scenario?.objective || ""}）`,
      `【當前關卡】：${nodeConfig?.title || ""}（地點：${nodeConfig?.locationTag || ""}，類型：${nodeConfig?.nodeType || "主線"}）`,
      `【NPC 角色人設】：你將扮演「${nodeConfig?.npcRole || "NPC"}」— ${currentPersona}`,
      `【標準目標客語句】：${nodeConfig?.targetHakka || "（分支選擇/自由回答關卡）"}`,
      `【標準華語意圖】：${nodeConfig?.targetMandarin || "（分支選擇/自由回答關卡）"}`,
      `【核心關鍵詞】：${(nodeConfig?.keywords || []).join("、") || "無"}`,
      ``,
      `【嚴格判定規則 (Strict Correctness & Guardrails)】：`,
      `1. 精準對錯判定 (Strict Verification)：`,
      `   - 學生的回答必須精準符合當前題目的「核心動作」、「數量/張數」、「地點」或「指定項目」。`,
      `   - 【數量/項目錯誤一律判錯】：例如題目要求「買三張學生票」，若學生說「兩張門票」、「一張票」或未提及學生票，數量或票種不符，必須判定 isMatch: false！`,
      `   - 【答非所問/離題一律判錯】：若學生說不相干的話（如問路時說要買漢堡、天氣很冷等），必須判定 isMatch: false！`,
      `   - 【只有正確表達才通過】：必須語意完整且數量/對象正確，才判定 isMatch: true。`,
      `2. 客語 ASR 諧音合理容錯：若客語語音辨識產生同音錯字但語意數量完全正確，可判定通過。`,
      `3. 真實動態 NPC 角色扮演回應 (Dynamic NPC Roleplay)：`,
      `   - 務必根據「學生實際說出的內容」客製化生成 20~35 字生動的 NPC 繁體中文對話。`,
      `   - 若學生說錯（如說兩張票）：NPC 要針對他說的內容指正：「我們有三位同學，應該要買三張學生票喔！」`,
      `   - 若學生說對：NPC 要自然接話並推進劇情。`,
      `4. 輸出規範：請嚴格回傳標準 JSON 格式。`
    ].join("\n");
  }

  /**
   * 建構 User Prompt (注入客語原文、華語意圖與分支清單)
   */
  static buildUserPrompt(hakkaTranscript, mandarinTranscript, nodeConfig) {
    let choicesText = "";
    if (nodeConfig?.choices) {
      choicesText = `\n【本題合法分支選項清單】：\n` + nodeConfig.choices.map(c => `  - [${c.id}] 名稱: ${c.title}, 說明: ${c.sub || c.title}, 關鍵字: [${(c.keywords || []).join(", ")}]`).join("\n");
    }
    return [
      `【學生客語 ASR 辨識文字】：「${hakkaTranscript || "（無輸入）"}」`,
      `【客轉華語意正規化意圖】：「${mandarinTranscript || hakkaTranscript || "（無輸入）"}」`,
      `【目標客語句】：${nodeConfig?.targetHakka || "無固定句"}`,
      `【目標華語意圖】：${nodeConfig?.targetMandarin || "無"}`,
      `【關鍵詞清單】：${(nodeConfig?.keywords || []).join(", ") || "無"}`,
      `${choicesText}`,
      ``,
      `請依據上述輸入評估是否通過，並嚴格依照以下 JSON 結構回傳：`,
      `{`,
      `  "isMatch": true 或 false,`,
      `  "intent": "識別出的意圖或分支名稱",`,
      `  "matchedChoiceId": "選定之分支 ID（若為選擇題）或 null",`,
      `  "semanticAccuracy": 0 到 100 的整數,`,
      `  "hitKeywords": ["命中之關鍵詞"],`,
      `  "missingKeywords": ["缺漏之關鍵詞"],`,
      `  "feedback": "客語教學引導短評",`,
      `  "dynamicNpcResponse": "NPC 角色當下的情境回覆對話（20-35字）"`,
      `}`
    ].join("\n");
  }

  /**
   * 預期 JSON Schema
   */
  static buildExpectedSchema() {
    return {
      isMatch: true,
      intent: "大象展區",
      matchedChoiceId: "choice_elephant",
      semanticAccuracy: 95,
      hitKeywords: ["大象", "象"],
      missingKeywords: [],
      feedback: "辨識成功！語意明確，已順利選擇大象展區。",
      dynamicNpcResponse: "「想看大象啊！沿著步道直走到底右轉就到囉，祝你們玩得開心！」"
    };
  }

  /**
   * 執行 LLM 評估 (整合 Vercel /api/judge、線上 API 與本地安全網雙軌備援)
   */
  static async evaluate({ hakkaTranscript, mandarinTranscript, nodeConfig, scenario }) {
    const systemPrompt = this.buildSystemPrompt(nodeConfig, scenario);
    const userPrompt = this.buildUserPrompt(hakkaTranscript, mandarinTranscript, nodeConfig);

    // 模式 A: 透過 Vercel 後端 /api/judge 呼叫 (金鑰完全隱藏於後端)
    if (this.config.provider === "vercel_api" || (!this.config.apiKey && this.config.provider !== "local_judge")) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.config.timeout);

        const res = await fetch("/api/judge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ systemPrompt, userPrompt, hakkaTranscript, mandarinTranscript }),
          signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.isMatch !== undefined) {
            return {
              ...data,
              isFromAPI: true,
              provider: "gemini_api"
            };
          }
        }
      } catch (err) {
        console.warn("[LLMServiceAdapter] Vercel 後端 /api/judge 調用異常，自動降級至本地安全網：", err);
      }
    }

    // 模式 B: 線上 LLM 直接呼叫 (若有本機輸入 Key)
    if (this.config.provider === "openai_gemini" && this.config.apiKey) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.config.timeout);

        const isGemini = this.config.apiKey.startsWith("AQ.") || this.config.apiKey.startsWith("AIza") || this.config.apiEndpoint.includes("googleapis.com");

        if (isGemini) {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model || "gemini-1.5-flash"}:generateContent?key=${this.config.apiKey}`;
          const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
              generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
            }),
            signal: controller.signal
          });
          clearTimeout(timer);

          if (res.ok) {
            const data = await res.json();
            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (raw) return JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
          }
        } else {
          const response = await fetch(this.config.apiEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
              model: this.config.model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              response_format: { type: "json_object" },
              temperature: 0.2
            }),
            signal: controller.signal
          });
          clearTimeout(timer);

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) return JSON.parse(content);
          }
        }
      } catch (err) {
        console.warn("[LLMServiceAdapter] 線上 API 調用異常或超時，自動降級至本地智能安全網：", err);
      }
    }

    // 本地雙軌安全網：結合客語與華語意圖進行智能匹配
    const combinedText = `${hakkaTranscript || ""} ${mandarinTranscript || ""}`;
    const fallbackEval = SpeechService.evaluateAnswer(combinedText, nodeConfig);
    const matchedChoice = fallbackEval.matchedChoice;

    let dynamicNpcResponse = "";
    if (fallbackEval.isMatch) {
      if (matchedChoice && matchedChoice.guideResponse) {
        dynamicNpcResponse = matchedChoice.guideResponse;
      } else {
        dynamicNpcResponse = nodeConfig.npcSuccessResponse || "「很好！說得非常清楚！」";
      }
    } else {
      dynamicNpcResponse = nodeConfig.npcRetryResponse || "「請再說一次喔！」";
    }

    return {
      isMatch: fallbackEval.isMatch,
      intent: matchedChoice ? matchedChoice.title : (fallbackEval.isMatch ? "目標對話達成" : "語意未達標"),
      matchedChoiceId: matchedChoice ? matchedChoice.id : null,
      matchedChoice: matchedChoice,
      semanticAccuracy: fallbackEval.similarity,
      hitKeywords: fallbackEval.hitKeywords,
      missingKeywords: fallbackEval.missingKeywords,
      feedback: fallbackEval.feedback,
      dynamicNpcResponse: dynamicNpcResponse
    };
  }
}

// ==========================================
// 6. 語音評估規則核心 (SpeechService)
// ==========================================

class SpeechService {
  /**
   * 比對學生發音文字與節點要求
   */
  static evaluateAnswer(userTranscript, nodeConfig) {
    if (!userTranscript || !userTranscript.trim()) {
      return {
        isMatch: false,
        hitKeywords: [],
        missingKeywords: nodeConfig.keywords || [],
        similarity: 0,
        feedback: "未偵測到清晰語音，請靠近麥克風再試一次。"
      };
    }

    const cleanText = userTranscript.replace(/[。，！？、？\s\.,!?]/g, "");

    // 1. 若為「選擇」節點，進行分支關鍵字匹配
    if (nodeConfig.nodeType === "選擇" && nodeConfig.choices) {
      for (const choice of nodeConfig.choices) {
        const choiceKeywords = choice.keywords || [choice.title];
        const isChoiceHit = choiceKeywords.some(kw => cleanText.includes(kw));
        if (isChoiceHit) {
          return {
            isMatch: true,
            matchedChoice: choice,
            hitKeywords: choiceKeywords.filter(kw => cleanText.includes(kw)),
            missingKeywords: [],
            similarity: 100,
            feedback: `辨識成功！偵測到選擇【${choice.title}】。`
          };
        }
      }
    }

    // 2. 一般口說比對 (嚴格要求核心關鍵字與數量匹配)
    const primaryKeywords = nodeConfig.keywords || [];
    const hitPrimary = primaryKeywords.filter(kw => cleanText.includes(kw));
    const missingPrimary = primaryKeywords.filter(kw => !cleanText.includes(kw));

    // 數量衝突檢查 (若題目要求三張，但回答包含兩張/一張/二等衝突數字，則嚴格判錯)
    const targetRequiresThree = (nodeConfig.targetHakka || "").includes("三") || (nodeConfig.targetMandarin || "").includes("三") || primaryKeywords.some(k => k.includes("三") || k.includes("3"));
    const studentHasWrongQuantity = targetRequiresThree && (cleanText.includes("兩") || cleanText.includes("二") || cleanText.includes("一") || cleanText.includes("2") || cleanText.includes("1")) && !cleanText.includes("三") && !cleanText.includes("3");

    const targetClean = (nodeConfig.targetHakka || "").replace(/[。，！？、？\s\.,!?]/g, "");
    const isFullPrimaryHit = primaryKeywords.length > 0 && hitPrimary.length === primaryKeywords.length;
    const isStrictHit = primaryKeywords.length >= 2 ? (hitPrimary.length >= primaryKeywords.length) : (hitPrimary.length >= 1);
    const isMatch = !studentHasWrongQuantity && (isFullPrimaryHit || isStrictHit || (targetClean && cleanText.includes(targetClean)));

    return {
      isMatch: isMatch,
      matchedChoice: null,
      hitKeywords: hitPrimary,
      missingKeywords: missingPrimary,
      similarity: isFullPrimaryHit ? 100 : Math.round((hitPrimary.length / Math.max(1, primaryKeywords.length)) * 100),
      feedback: isMatch ? "辨識成功！語意明確且關鍵字命中。" : (studentHasWrongQuantity ? "數量不符（題目要求三張，非兩張或一張），請修正數量後再試一次。" : "關鍵字詞未完整命中（如數量或指定項目不符），請參考提示再說一次。")
    };
  }

  /**
   * 原生 Web Speech API 語音識別實例
   */
  static startWebSpeechRecognition({ onInterim, onFinal, onError }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError("您的瀏覽器尚未支援 Web Speech API，請使用 Google Chrome 瀏覽器。");
      return null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "zh-TW";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalTranscript = "";

      recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const currentText = (finalTranscript || interim || "").trim();
        if (onInterim) onInterim(currentText);
      };

      recognition.onerror = (event) => {
        if (event.error === "no-speech") return;
        if (onError) onError(event.error === "not-allowed" ? "請允許麥克風權限以進行語音錄音。" : `辨識提示：${event.error}`);
      };

      recognition.onend = () => {
        if (onFinal) onFinal(finalTranscript.trim());
      };

      recognition.start();
      return recognition;
    } catch (err) {
      if (onError) onError(err.message || "無法啟動麥克風錄音。");
      return null;
    }
  }

  /**
   * 模擬辨識 (用於快速測試 / 無麥克風降級)
   */
  static mockRecognize({ success = true, customText = null, nodeConfig, selectedChoice = null }) {
    return new Promise((resolve) => {
      setTimeout(() => {
        let resultText = "";
        if (customText) {
          resultText = customText;
        } else if (nodeConfig.nodeType === "選擇" && nodeConfig.choices) {
          const choice = selectedChoice || nodeConfig.choices[0];
          resultText = success ? `𠊎想愛去${choice.title.replace(/[^\u4e00-\u9fa5]/g, "")}` : "𠊎愛去買玩具（完全不相干地點）";
        } else if (success) {
          resultText = nodeConfig.targetHakka || "𠊎愛買三張學生票。";
        } else {
          resultText = "𠊎愛食客家小炒（答非所問）";
        }
        resolve({
          text: resultText,
          confidence: success ? 0.95 : 0.25
        });
      }, 400);
    });
  }
}

// ==========================================
// 4. 遊戲狀態管理器 (Graph State Manager)
// ==========================================
class GraphStateManager {
  constructor() {
    this.currentScenarioId = "zoo_chain";
    this.currentNodeId = "zoo_start";
    this.selectedChoiceId = null; // 紀錄使用者在選擇節點挑選的分支
    this.selectedTargetBranchId = null;
    this.collectedItems = new Set(); // 用於背包自由收集任務
    this.activePackItemIndex = 0; // 目前正在練習哪一個背包物品
    this.completedNodes = new Set();
    this.pathHistory = [];
    this.isRecognizing = false;
    this.isDevMode = false;
    this.speechMode = "hakka"; // "hakka" (客委會客語 ASR) | "mandarin" (瀏覽器內建華語 Web Speech)
    this.activeRecognitionInstance = null;

    // 地圖導航狀態
    this.playerPos = { x: 200, y: 220 }; // 起點在入口大門
    this.targetZoneCode = "A"; // A: 大象, B: 獅子, C: 蛇, D: 出口集合
  }

  getScenario() {
    return SCENARIOS_GRAPH[this.currentScenarioId] || SCENARIOS_GRAPH.zoo_chain;
  }

  getCurrentNode() {
    const scenario = this.getScenario();
    return scenario.nodes[this.currentNodeId] || scenario.nodes[scenario.startNodeId];
  }

  setScenario(scenarioId) {
    if (SCENARIOS_GRAPH[scenarioId]) {
      this.currentScenarioId = scenarioId;
      const scenario = SCENARIOS_GRAPH[scenarioId];
      this.currentNodeId = scenario.startNodeId;
      this.selectedChoiceId = null;
      this.selectedTargetBranchId = null;
      this.collectedItems.clear();
      this.activePackItemIndex = 0;
      this.completedNodes.clear();
      this.pathHistory = [this.currentNodeId];
      this.playerPos = { x: 200, y: 220 };
      this.targetZoneCode = "A";
    }
  }

  setNode(nodeId) {
    const scenario = this.getScenario();
    if (scenario.nodes[nodeId]) {
      this.currentNodeId = nodeId;
      if (!this.pathHistory.includes(nodeId)) {
        this.pathHistory.push(nodeId);
      }
    }
  }

  markCurrentNodeCompleted() {
    this.completedNodes.add(this.currentNodeId);
  }

  isScenarioCompleted() {
    const node = this.getCurrentNode();
    return node.nodeType === "集合點" && this.completedNodes.has(node.id);
  }
}

// ==========================================
// 5. Canvas 2D 動物園地圖尋路引擎
// ==========================================
class ZooMapEngine {
  constructor(canvas, onArrivalCallback, onToastCallback) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext("2d") : null;
    this.onArrival = onArrivalCallback;
    this.onToast = onToastCallback;

    // 園區關鍵地標座標 (寬 400, 高 250)
    this.zones = {
      GATE: { x: 200, y: 220, label: "大門入口", icon: "🚪", color: "#64748b" },
      FORK: { x: 200, y: 130, label: "十字分岔", icon: "🚏", color: "#3b82f6" },
      A: { x: 65, y: 55, label: "🐘 大象展區", code: "A", icon: "🐘", radius: 36, color: "#10b981" },
      B: { x: 200, y: 45, label: "🦁 獅子展區", code: "B", icon: "🦁", radius: 36, color: "#f59e0b" },
      C: { x: 335, y: 55, label: "🐍 蛇展區", code: "C", icon: "🐍", radius: 36, color: "#8b5cf6" },
      D: { x: 340, y: 215, label: "⭐ 出口集合點", code: "D", icon: "🚩", radius: 32, color: "#ef4444" }
    };

    this.player = { x: 200, y: 220, targetX: 200, targetY: 220, speed: 4 };
    this.targetCode = "A";
    this.animId = null;
    this.hasTriggeredArrival = false;

    this.initEvents();
  }

  setTarget(zoneCode) {
    this.targetCode = zoneCode || "A";
    this.hasTriggeredArrival = false;
    // 重設小人到起點
    this.player.x = 200;
    this.player.y = 220;
    this.player.targetX = 200;
    this.player.targetY = 220;
    this.startLoop();
  }

  resetPosition() {
    this.player.x = 200;
    this.player.y = 220;
    this.player.targetX = 200;
    this.player.targetY = 220;
    this.hasTriggeredArrival = false;
    SoundFX.step();
  }

  isAtTargetZone() {
    const targetZone = this.zones[this.targetCode];
    if (!targetZone) return true;
    const distToTarget = Math.hypot(this.player.x - targetZone.x, this.player.y - targetZone.y);
    return distToTarget <= (targetZone.radius + 15);
  }

  getCurrentZone() {
    for (const code of ["A", "B", "C", "D"]) {
      const zone = this.zones[code];
      const dist = Math.hypot(this.player.x - zone.x, this.player.y - zone.y);
      if (dist <= zone.radius + 10) return zone;
    }
    return null;
  }

  initEvents() {
    if (!this.canvas) return;

    // 點擊/觸控地圖任意位置行走
    const handlePointer = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;
      this.walkTo(clickX, clickY);
    };

    this.canvas.addEventListener("click", handlePointer);
  }

  walkTo(x, y) {
    this.player.targetX = Math.max(25, Math.min(375, x));
    this.player.targetY = Math.max(25, Math.min(225, y));
    SoundFX.step();
  }

  moveBy(dx, dy) {
    this.walkTo(this.player.x + dx, this.player.y + dy);
  }

  startLoop() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const loop = () => {
      this.update();
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  stopLoop() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = null;
  }

  update() {
    const dx = this.player.targetX - this.player.x;
    const dy = this.player.targetY - this.player.y;
    const dist = Math.hypot(dx, dy);

    if (dist > this.player.speed) {
      this.player.x += (dx / dist) * this.player.speed;
      this.player.y += (dy / dist) * this.player.speed;
    } else {
      this.player.x = this.player.targetX;
      this.player.y = this.player.targetY;
    }

    // 檢查是否抵達指定展區
    const targetZone = this.zones[this.targetCode];
    if (targetZone && !this.hasTriggeredArrival) {
      const distToTarget = Math.hypot(this.player.x - targetZone.x, this.player.y - targetZone.y);
      if (distToTarget < targetZone.radius) {
        this.hasTriggeredArrival = true;
        SoundFX.success();
        if (this.onArrival) this.onArrival(this.targetCode, targetZone);
      }
    }
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. 草地背景
    ctx.fillStyle = "#81c784";
    ctx.fillRect(0, 0, w, h);

    // 2. 繪製步道系統 (淺黃石板路)
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 主幹道: 入口 (200,220) -> 分岔 (200,130)
    ctx.strokeStyle = "#ffe082";
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(200, 220);
    ctx.lineTo(200, 130);
    // 分岔 -> A: 大象 (65, 55)
    ctx.lineTo(65, 55);
    ctx.moveTo(200, 130);
    // 分岔 -> B: 獅子 (200, 45)
    ctx.lineTo(200, 45);
    ctx.moveTo(200, 130);
    // 分岔 -> C: 蛇 (335, 55)
    ctx.lineTo(335, 55);
    // 側步道 -> D: 出口集合 (340, 215)
    ctx.moveTo(200, 130);
    ctx.quadraticCurveTo(320, 140, 340, 215);
    ctx.stroke();

    // 步道邊線
    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. 裝飾：小樹林與水池
    this.drawDecorations(ctx);

    // 4. 繪製地標展區目標
    ["A", "B", "C", "D"].forEach((code) => {
      const zone = this.zones[code];
      const isTarget = this.targetCode === code;

      // 目標光暈
      if (isTarget) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius + 6 + Math.sin(Date.now() / 200) * 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 235, 59, 0.45)";
        ctx.fill();
        ctx.restore();
      }

      // 展區圓形地基
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.fillStyle = isTarget ? "#ffffff" : "#f1f5f9";
      ctx.fill();
      ctx.lineWidth = isTarget ? 3.5 : 2;
      ctx.strokeStyle = isTarget ? "#f59e0b" : "#cbd5e1";
      ctx.stroke();

      // 圖示
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(zone.icon, zone.x, zone.y - 4);

      // 目標星號標記
      if (isTarget) {
        ctx.font = "bold 13px sans-serif";
        ctx.fillStyle = "#b45309";
        ctx.fillText("⭐ 目標", zone.x, zone.y + 18);
      } else {
        ctx.font = "bold 10px sans-serif";
        ctx.fillStyle = "#475569";
        ctx.fillText(zone.label.split(" ")[1] || zone.label, zone.x, zone.y + 18);
      }
    });

    // 5. 繪製大門起點
    ctx.beginPath();
    ctx.arc(200, 220, 16, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#64748b";
    ctx.stroke();
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🚪", 200, 220);

    // 6. 繪製小人 (🧍 學生玩家)
    this.drawPlayer(ctx, this.player.x, this.player.y);
  }

  drawPlayer(ctx, px, py) {
    // 影子
    ctx.beginPath();
    ctx.ellipse(px, py + 8, 10, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fill();

    // 身體徽章
    ctx.beginPath();
    ctx.arc(px, py - 4, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#2d8a56";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // 學生 Emoji
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🧍", px, py - 4);
  }

  drawDecorations(ctx) {
    // 水池 (左中)
    ctx.fillStyle = "#4fc3f7";
    ctx.beginPath();
    ctx.ellipse(90, 150, 24, 16, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 樹木 (右中)
    ctx.font = "14px sans-serif";
    ctx.fillText("🌲", 300, 130);
    ctx.fillText("🌳", 280, 165);
    ctx.fillText("🌲", 110, 85);
  }
}

// ==========================================
// 6. 主 UI 控制器與業務邏輯
// ==========================================
class UIController {
  constructor(stateManager) {
    this.state = stateManager;
    this.mapEngine = null;
    this.initElements();
    this.bindEvents();
    this.initMapEngine();
    this.render();
  }

  initElements() {
    const byId = (id) => document.getElementById(id);

    this.els = {
      // 導覽標籤與開關
      navTabs: document.querySelectorAll(".nav-tab"),
      debugToggle: byId("debugToggle"),
      closeDevDockBtn: byId("closeDevDockBtn"),
      devDockSidebar: byId("devDockSidebar"),
      layoutShell: byId("layoutShell"),
      devResizer: byId("devResizer"),

      // 主視圖：左側欄
      themeIcon: byId("themeIcon"),
      scenarioTitle: byId("scenarioTitle"),
      scenarioObjective: byId("scenarioObjective"),
      progressCounter: byId("progressCounter"),
      stepTracker: byId("stepTracker"),

      // 插畫展演看板
      scenarioBannerImg: byId("scenarioBannerImg"),
      showcaseBadge: byId("showcaseBadge"),
      showcaseTitle: byId("showcaseTitle"),
      showcaseLocTag: byId("showcaseLocTag"),
      showcaseStepTag: byId("showcaseStepTag"),

      // 故事敘述卡
      narrativeCard: byId("narrativeCard"),
      scenarioCompletedCard: byId("scenarioCompletedCard"),
      currentStepTag: byId("currentStepTag"),
      sceneLocationTag: byId("sceneLocationTag"),
      storyPrompt: byId("storyPrompt"),

      // 靜態提詞卡片容器 (不可點擊，僅提示口說選項)
      speechHintSection: byId("speechHintSection"),
      speechHintCards: byId("speechHintCards"),
      speechHintTip: byId("speechHintTip"),

      // 語音模式與互動按鈕
      modeHakkaBtn: byId("modeHakkaBtn"),
      modeMandarinBtn: byId("modeMandarinBtn"),
      speechActionSection: byId("speechActionSection"),
      recordBtn: byId("recordBtn"),
      recordBtnIcon: byId("recordBtnIcon"),
      recordBtnText: byId("recordBtnText"),
      statusDot: byId("statusDot"),
      statusTip: byId("statusTip"),
      speakerNameTag: byId("speakerNameTag"),
      studentSpeechBubble: byId("studentSpeechBubble"),
      studentTranscriptText: byId("studentTranscriptText"),

      // NPC 回應卡
      npcResponseSection: byId("npcResponseSection"),
      npcAvatar: byId("npcAvatar"),
      npcRoleName: byId("npcRoleName"),
      npcDialogText: byId("npcDialogText"),
      nextStepBtn: byId("nextStepBtn"),
      nextStepBtnText: byId("nextStepBtnText"),

      // 結算畫面
      completedTitle: byId("completedTitle"),
      completedSubtitle: byId("completedSubtitle"),
      completedStepCount: byId("completedStepCount"),
      replayScenarioBtn: byId("replayScenarioBtn"),
      nextScenarioBtn: byId("nextScenarioBtn"),

      // 開發者側邊欄
      devNodeIdText: byId("devNodeIdText"),
      devNodeTypeTag: byId("devNodeTypeTag"),
      devTargetLocText: byId("devTargetLocText"),
      devBranchSection: byId("devBranchSection"),
      devBranchGrid: byId("devBranchGrid"),
      devTargetHakka: byId("devTargetHakka"),
      devTargetMandarin: byId("devTargetMandarin"),
      devKeywordsList: byId("devKeywordsList"),
      devStatusText: byId("devStatusText"),
      devTranscriptText: byId("devTranscriptText"),
      devSkipNextBtn: byId("devSkipNextBtn"),
      devAutoFillSuccessBtn: byId("devAutoFillSuccessBtn"),
      devAutoFillFailBtn: byId("devAutoFillFailBtn"),
      devCustomInputBtn: byId("devCustomInputBtn"),
      toggleLlmBtn: byId("toggleLlmBtn"),
      llmViewer: byId("llmViewer"),
      toggleJsonBtn: byId("toggleJsonBtn"),
      jsonViewer: byId("jsonViewer"),

      // 第二階段：流水線監控面板元件
      pipeStep1Card: byId("pipeStep1Card"),
      pipeAsrBadge: byId("pipeAsrBadge"),
      pipeAsrText: byId("pipeAsrText"),
      pipeStep2Card: byId("pipeStep2Card"),
      pipeMtBadge: byId("pipeMtBadge"),
      pipeMtText: byId("pipeMtText"),
      pipeStep3Card: byId("pipeStep3Card"),
      pipeLlmBadge: byId("pipeLlmBadge"),
      pipeLlmResult: byId("pipeLlmResult"),
      pipeLlmIntent: byId("pipeLlmIntent"),
      pipeLlmScore: byId("pipeLlmScore"),
      pipeLlmNpc: byId("pipeLlmNpc")
    };
  }

  initMapEngine() {
    const canvas = document.createElement("canvas");
    canvas.id = "zooMapCanvas";
    canvas.width = 400;
    canvas.height = 250;

    this.mapEngine = new ZooMapEngine(
      canvas,
      (zoneCode, zone) => {
        this.showMapToast(`🎉 抵達【${zone.label}】！請按右下角【確定抵達】。`);
      },
      (msg) => this.showMapToast(msg)
    );
  }

  showMapToast(msg, isError = false) {
    const existing = document.querySelector(".map-overlay-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "map-overlay-toast";
    if (isError) toast.style.borderColor = "#f87171";
    toast.innerHTML = `<span>${isError ? "⚠️" : "🧭"}</span> <span>${msg}</span>`;
    const wrapper = document.querySelector(".map-canvas-wrapper");
    if (wrapper) wrapper.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 3200);
  }

  bindEvents() {
    // 1. 拖曳側邊欄
    if (this.els.devResizer && this.els.devDockSidebar && this.els.layoutShell) {
      const resizer = this.els.devResizer;
      const sidebar = this.els.devDockSidebar;
      const layout = this.els.layoutShell;
      let isResizing = false;
      let startX = 0;
      let startWidth = 0;

      const onMouseDown = (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = sidebar.getBoundingClientRect().width;
        layout.classList.add("is-resizing");
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        e.preventDefault();
      };

      const onMouseMove = (e) => {
        if (!isResizing) return;
        const deltaX = e.clientX - startX;
        const newWidth = Math.max(200, Math.min(window.innerWidth * 0.65, startWidth + deltaX));
        sidebar.style.setProperty("--dev-sidebar-width", `${newWidth}px`);
      };

      const onMouseUp = () => {
        if (!isResizing) return;
        isResizing = false;
        layout.classList.remove("is-resizing");
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      resizer.addEventListener("mousedown", onMouseDown);
    }

    // 2. 開發者模式切換
    if (this.els.debugToggle) {
      this.els.debugToggle.addEventListener("change", (e) => this.setDevMode(e.target.checked));
    }
    if (this.els.closeDevDockBtn) {
      this.els.closeDevDockBtn.addEventListener("click", () => this.setDevMode(false));
    }

    // 3. 頂部標籤切換情境
    if (this.els.navTabs) {
      this.els.navTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const scenarioKey = tab.dataset.scenario;
          if (scenarioKey && scenarioKey !== this.state.currentScenarioId) {
            SoundFX.select();
            this.state.setScenario(scenarioKey);
            this.render();
          }
        });
      });
    }

    // 口說模式切換 (客語專用 ASR vs 瀏覽器內建華語對照)
    if (this.els.modeHakkaBtn) {
      this.els.modeHakkaBtn.addEventListener("click", () => this.setSpeechMode("hakka"));
    }
    if (this.els.modeMandarinBtn) {
      this.els.modeMandarinBtn.addEventListener("click", () => this.setSpeechMode("mandarin"));
    }

    // 4. 錄音按鈕 (支援 Web Speech API / 客語 ASR 真實辨識)
    if (this.els.recordBtn) {
      this.els.recordBtn.addEventListener("click", () => this.toggleRealRecording());
    }

    // 5. 開發者快速測試
    if (this.els.devAutoFillSuccessBtn) {
      this.els.devAutoFillSuccessBtn.addEventListener("click", () => this.handleSpeechInteraction(true));
    }
    if (this.els.devAutoFillFailBtn) {
      this.els.devAutoFillFailBtn.addEventListener("click", () => this.handleSpeechInteraction(false));
    }
    if (this.els.devCustomInputBtn) {
      this.els.devCustomInputBtn.addEventListener("click", () => this.handleCustomSpeechInput());
    }
    if (this.els.devSkipNextBtn) {
      this.els.devSkipNextBtn.addEventListener("click", () => this.advanceToNextNode());
    }

    // 6. 前進下一關按鈕
    if (this.els.nextStepBtn) {
      this.els.nextStepBtn.addEventListener("click", () => this.advanceToNextNode());
    }

    // 7. 切換 LLM Prompt 結構檢視
    if (this.els.toggleLlmBtn && this.els.llmViewer) {
      this.els.toggleLlmBtn.addEventListener("click", () => {
        const isHidden = this.els.llmViewer.hidden;
        this.els.llmViewer.hidden = !isHidden;
        this.els.toggleLlmBtn.textContent = isHidden ? "🤖 關閉 LLM Prompt 與語意結構" : "🤖 展開本題 LLM Prompt 與語意結構";
      });
    }

    // 10. 切換 JSON 檢視
    if (this.els.toggleJsonBtn && this.els.jsonViewer) {
      this.els.toggleJsonBtn.addEventListener("click", () => {
        const isHidden = this.els.jsonViewer.hidden;
        this.els.jsonViewer.hidden = !isHidden;
        this.els.toggleJsonBtn.textContent = isHidden ? "📋 關閉 Live JSON 結構" : "📋 展開本題 Live JSON 結構";
      });
    }

    // 11. 結算畫面按鈕
    if (this.els.replayScenarioBtn) {
      this.els.replayScenarioBtn.addEventListener("click", () => {
        this.state.setScenario(this.state.currentScenarioId);
        this.render();
      });
    }
    if (this.els.nextScenarioBtn) {
      this.els.nextScenarioBtn.addEventListener("click", () => {
        const keys = Object.keys(SCENARIOS_GRAPH);
        const currentIndex = keys.indexOf(this.state.currentScenarioId);
        const nextKey = keys[(currentIndex + 1) % keys.length];
        this.state.setScenario(nextKey);
        this.render();
      });
    }

    // 鍵盤方向鍵控制地圖小人
    window.addEventListener("keydown", (e) => {
      const node = this.state.getCurrentNode();
      if (node.nodeType === "地圖移動" && this.mapEngine) {
        const stepDist = 18;
        if (e.key === "ArrowUp") { this.mapEngine.moveBy(0, -stepDist); e.preventDefault(); }
        if (e.key === "ArrowDown") { this.mapEngine.moveBy(0, stepDist); e.preventDefault(); }
        if (e.key === "ArrowLeft") { this.mapEngine.moveBy(-stepDist, 0); e.preventDefault(); }
        if (e.key === "ArrowRight") { this.mapEngine.moveBy(stepDist, 0); e.preventDefault(); }
      }
    });
  }

  setDevMode(isOpen) {
    this.state.isDevMode = isOpen;
    if (this.els.layoutShell) this.els.layoutShell.classList.toggle("is-dev-open", isOpen);
    if (this.els.debugToggle) this.els.debugToggle.checked = isOpen;
  }

  // 切換口說辨識模式 (客語專用 ASR vs 瀏覽器內建華語對照)
  setSpeechMode(mode) {
    this.state.speechMode = mode;
    SoundFX.select();
    if (this.els.modeHakkaBtn) this.els.modeHakkaBtn.classList.toggle("is-active", mode === "hakka");
    if (this.els.modeMandarinBtn) this.els.modeMandarinBtn.classList.toggle("is-active", mode === "mandarin");

    const pipeStep1Title = document.querySelector("#pipeStep1Card .pipeline-step-title");

    if (mode === "mandarin") {
      if (this.els.recordBtnIcon) this.els.recordBtnIcon.textContent = "🗣️";
      if (this.els.recordBtnText) this.els.recordBtnText.textContent = "點擊說華語 (Web Speech)";
      if (this.els.statusTip) this.els.statusTip.textContent = "🗣️ 華語對照模式：請直接開口說華語（例如「我要買三張學生票」），系統將由瀏覽器直接辨識並由 AI 評審！";
      if (pipeStep1Title) pipeStep1Title.textContent = "1️⃣ 華語 ASR 語音轉文字 (瀏覽器內建)";
      if (this.els.pipeMtBadge) {
        this.els.pipeMtBadge.textContent = "華語直通";
        this.els.pipeMtBadge.className = "pipeline-badge badge-success";
      }
      if (this.els.pipeMtText) this.els.pipeMtText.textContent = "（華語模式：已略過客轉華轉譯直通）";
    } else {
      if (this.els.recordBtnIcon) this.els.recordBtnIcon.textContent = "🎙️";
      if (this.els.recordBtnText) this.els.recordBtnText.textContent = "按住／點擊錄音";
      if (this.els.statusTip) this.els.statusTip.textContent = "請點擊下方按鈕，開始用客語說出你想講的話。";
      if (pipeStep1Title) pipeStep1Title.textContent = "1️⃣ 客語 ASR 語音轉文字 (客委會)";
      if (this.els.pipeMtBadge) {
        this.els.pipeMtBadge.textContent = "待處理";
        this.els.pipeMtBadge.className = "pipeline-badge badge-pending";
      }
      if (this.els.pipeMtText) this.els.pipeMtText.textContent = "（等待客語發音翻譯...）";
    }
  }

  // 觸發真實 HakkaASRAdapter 錄音
  toggleRealRecording() {
    if (this.state.isRecognizing) {
      if (this.state.activeRecognitionInstance) {
        try { this.state.activeRecognitionInstance.stop(); } catch (e) {}
      }
      return;
    }

    const nodeConfig = this.getActiveSpeechNodeConfig();
    this.state.isRecognizing = true;
    this.setControlsLoading(true);

    let recordedText = "";

    const recog = HakkaASRAdapter.startRecognition({
      speechMode: this.state.speechMode,
      onInterim: (interimText) => {
        recordedText = interimText;
        if (this.els.studentSpeechBubble) this.els.studentSpeechBubble.hidden = false;
        if (this.els.studentTranscriptText) this.els.studentTranscriptText.textContent = `「${interimText}」`;
        if (this.els.devTranscriptText) this.els.devTranscriptText.textContent = interimText;
        this.updatePipelineStep(1, "running", interimText);
      },
      onFinal: async (finalText) => {
        recordedText = finalText || recordedText;
        this.state.isRecognizing = false;
        this.state.activeRecognitionInstance = null;
        await this.executePipeline(recordedText, nodeConfig);
      },
      onError: async (errMsg) => {
        this.state.isRecognizing = false;
        this.state.activeRecognitionInstance = null;
        this.setControlsLoading(false);
        if (this.els.statusTip) this.els.statusTip.textContent = errMsg;
        if (!recordedText) {
          await this.handleSpeechInteraction(true);
        }
      }
    });

    this.state.activeRecognitionInstance = recog;
  }

  // 取得目前正在進行口說比對的節點設定
  getActiveSpeechNodeConfig() {
    const node = this.state.getCurrentNode();
    if (node.nodeType === "收集任務" && node.items) {
      return node.items[this.state.activePackItemIndex] || node.items[0];
    }
    return node;
  }

  // 處理自訂客語/華語文字輸入
  async handleCustomSpeechInput() {
    const node = this.getActiveSpeechNodeConfig();
    const isMandarin = this.state.speechMode === "mandarin";
    const defaultVal = isMandarin ? (node.targetMandarin || "我要買三張學生票") : (node.targetHakka || "𠊎愛買三張學生票");
    const input = window.prompt(`請輸入測試之${isMandarin ? '華語' : '客語'}文字：`, defaultVal);
    if (input !== null && input.trim()) {
      await this.executePipeline(input.trim(), node);
    }
  }

  // 模擬辨識評估 (支援華語與客語)
  async handleSpeechInteraction(isSuccess, customText = null) {
    const nodeConfig = this.getActiveSpeechNodeConfig();
    this.state.isRecognizing = true;
    this.setControlsLoading(true);

    const isMandarin = this.state.speechMode === "mandarin";
    let simulatedText = customText;
    if (!simulatedText) {
      if (isMandarin) {
        simulatedText = isSuccess ? (nodeConfig.targetMandarin || "我要買三張學生票") : "我想去……（未清楚指明）";
      }
    }

    const res = await SpeechService.mockRecognize({
      success: isSuccess,
      customText: simulatedText,
      nodeConfig,
      selectedChoice: nodeConfig.choices ? nodeConfig.choices[0] : null
    });

    this.state.isRecognizing = false;
    await this.executePipeline(res.text, nodeConfig);
  }

  // 第二階段核心：執行 ASR -> 客轉華翻譯 -> LLM 判定與 NPC 生成三層流水線
  async executePipeline(userText, nodeConfig) {
    this.setControlsLoading(false);
    const scenario = this.state.getScenario();
    const isMandarinMode = this.state.speechMode === "mandarin";

    // 步驟 1: 更新 ASR 辨識狀態
    const asrDisplay = isMandarinMode ? `🗣️ [華語] ${userText || "（無語音）"}` : (userText || "（無語音）");
    this.updatePipelineStep(1, "success", asrDisplay);

    let mandarinText = userText;
    let hitTerms = [];

    // 步驟 2: 客轉華語意正規化翻譯 (華語模式直接直通)
    if (isMandarinMode) {
      this.updatePipelineStep(2, "success", userText, ["華語直通 (免轉譯)"]);
      mandarinText = userText;
    } else {
      this.updatePipelineStep(2, "running", "翻譯中...");
      const mtResult = await HakkaToMandarinAdapter.translate(userText);
      mandarinText = mtResult.mandarinText;
      hitTerms = mtResult.hitTerms;
      this.updatePipelineStep(2, "success", mtResult.mandarinText, mtResult.hitTerms);
    }

    // 步驟 3: LLM 邊界意圖判定與 NPC 生成
    this.updatePipelineStep(3, "running", "LLM 評估中...");
    const evalResult = await LLMServiceAdapter.evaluate({
      hakkaTranscript: isMandarinMode ? "" : userText,
      mandarinTranscript: mandarinText,
      nodeConfig,
      scenario
    });
    this.updatePipelineStep(3, evalResult.isMatch ? "success" : "fail", evalResult);

    // 呈現學生氣泡
    if (this.els.studentSpeechBubble) this.els.studentSpeechBubble.hidden = false;
    if (this.els.studentTranscriptText) this.els.studentTranscriptText.textContent = `「${userText}」`;

    // 呈現 NPC 回應
    if (this.els.npcResponseSection) this.els.npcResponseSection.hidden = false;
    if (this.els.npcAvatar) this.els.npcAvatar.textContent = nodeConfig.npcAvatar;
    if (this.els.npcRoleName) this.els.npcRoleName.textContent = nodeConfig.npcRole;

    if (evalResult.isMatch) {
      SoundFX.success();
      if (this.els.statusDot) this.els.statusDot.className = "status-dot is-success";

      const currentNode = this.state.getCurrentNode();
      let dynamicReply = evalResult.dynamicNpcResponse || nodeConfig.npcSuccessResponse;
      if (isMandarinMode && nodeConfig.targetHakka) {
        dynamicReply += `\n（💡 華語說得很清楚！客語請說：『${nodeConfig.targetHakka}』喔！）`;
      }

      // 若為「選擇節點」
      if (currentNode.nodeType === "選擇") {
        const choice = evalResult.matchedChoice || (currentNode.choices ? currentNode.choices[0] : null);
        if (choice) {
          this.state.selectedChoiceId = choice.id;
          this.state.selectedTargetBranchId = choice.targetBranchId;
          if (choice.zoneCode) this.state.targetZoneCode = choice.zoneCode;

          if (this.els.npcDialogText) {
            this.els.npcDialogText.textContent = dynamicReply;
          }
        }
        this.state.markCurrentNodeCompleted();
        if (this.els.statusTip) this.els.statusTip.textContent = isMandarinMode ? "✓ [華語模式] 辨識通過！請點擊【繼續前進】進入下一步。" : "✓ 已辨識你的選擇！請點擊【繼續前進】進入下一步。";
        if (this.els.nextStepBtnText) this.els.nextStepBtnText.textContent = "繼續前進 ➔";
      }
      // 若為「收集任務」（教學打包）
      else if (currentNode.nodeType === "收集任務") {
        this.state.collectedItems.add(nodeConfig.id);
        const totalItems = (currentNode.items || []).length;
        const isAllCollected = this.state.collectedItems.size >= totalItems;

        if (this.els.npcDialogText) {
          this.els.npcDialogText.textContent = dynamicReply;
        }
        if (this.els.statusTip) {
          this.els.statusTip.textContent = isAllCollected ? "🎉 4 樣背包物品全數裝入完成！請點擊繼續前往玄關！" : "✓ 本項物品已成功放入背包！請切換其他物品或前進。";
        }
        this.render();
      }
      // 一般主線/分支/集合點
      else {
        this.state.markCurrentNodeCompleted();
        if (this.els.npcDialogText) {
          this.els.npcDialogText.textContent = dynamicReply;
        }
        if (this.els.statusTip) this.els.statusTip.textContent = isMandarinMode ? "✓ [華語模式] 辨識通過！請點擊【繼續前進】。" : "✓ 辨識成功！請點擊【繼續前進】。";
        if (this.els.nextStepBtnText) this.els.nextStepBtnText.textContent = "繼續前進 ➔";
      }
    } else {
      SoundFX.error();
      if (this.els.statusDot) this.els.statusDot.className = "status-dot is-error";
      if (this.els.npcDialogText) {
        this.els.npcDialogText.textContent = evalResult.dynamicNpcResponse || nodeConfig.npcRetryResponse;
      }
      if (this.els.statusTip) {
        this.els.statusTip.textContent = isMandarinMode ? "⚠️ 華語語意未達標，請依照提示再試一次。" : "⚠️ 發音或關鍵字未命中，請參考提示再試一次。";
      }
    }

    // 更新開發者側邊欄
    this.renderDevSidebar(nodeConfig, {
      transcript: userText,
      mandarinText: mandarinText,
      evalResult
    });
  }

  // 更新流水線步驟卡片狀態
  updatePipelineStep(stepNum, status, data, extraInfo = null) {
    if (stepNum === 1) {
      if (this.els.pipeAsrBadge) {
        this.els.pipeAsrBadge.className = `pipeline-badge badge-${status}`;
        this.els.pipeAsrBadge.textContent = status === "running" ? "辨識中..." : "已辨識";
      }
      if (this.els.pipeAsrText) this.els.pipeAsrText.textContent = data || "（無語音）";
      if (this.els.pipeStep1Card) {
        this.els.pipeStep1Card.className = `pipeline-step-card is-${status}`;
      }
    } else if (stepNum === 2) {
      if (this.els.pipeMtBadge) {
        this.els.pipeMtBadge.className = `pipeline-badge badge-${status}`;
        this.els.pipeMtBadge.textContent = status === "running" ? "翻譯中..." : "已正規化";
      }
      if (this.els.pipeMtText) {
        const termsHint = extraInfo && extraInfo.length > 0 ? `（命中詞：${extraInfo.join(", ")}）` : "";
        this.els.pipeMtText.textContent = `${data || "（無）"} ${termsHint}`;
      }
      if (this.els.pipeStep2Card) {
        this.els.pipeStep2Card.className = `pipeline-step-card is-${status}`;
      }
    } else if (stepNum === 3) {
      if (this.els.pipeLlmBadge) {
        this.els.pipeLlmBadge.className = `pipeline-badge badge-${status}`;
        this.els.pipeLlmBadge.textContent = status === "running" ? "評審中..." : (status === "success" ? "判定通過" : "未命中重試");
      }
      if (this.els.pipeStep3Card) {
        this.els.pipeStep3Card.className = `pipeline-step-card is-${status}`;
      }
      if (status !== "running" && data) {
        if (this.els.pipeLlmResult) {
          const sourceTag = data.isFromAPI ? " [☁️ Gemini 雲端運算]" : " [🛡️ 本地安全網]";
          this.els.pipeLlmResult.textContent = (data.isMatch ? "✓ 通過 (Match)" : "⚠️ 未命中重試 (Retry)") + sourceTag;
          this.els.pipeLlmResult.style.color = data.isMatch ? "#34d399" : "#f87171";
        }
        if (this.els.pipeLlmIntent) this.els.pipeLlmIntent.textContent = data.intent || "無";
        if (this.els.pipeLlmScore) this.els.pipeLlmScore.textContent = `${data.semanticAccuracy}%`;
        if (this.els.pipeLlmNpc) this.els.pipeLlmNpc.textContent = data.dynamicNpcResponse || "（無回應）";
      }
    }
  }

  // 前進下一節點
  advanceToNextNode() {
    this.state.markCurrentNodeCompleted();
    const currentNode = this.state.getCurrentNode();

    if (currentNode.nodeType === "收集任務") {
      if (this.state.collectedItems.size >= (currentNode.items || []).length) {
        this.state.setNode(currentNode.nextNodeId || "pack_done");
      } else {
        alert("還有背包物品尚未練習裝入喔！請點選其他物品繼續完成。");
        return;
      }
    } else if (currentNode.nodeType === "選擇") {
      // 選擇節點完成後：若有地圖移動走向地圖；否則走向分支節點
      if (this.state.currentScenarioId === "zoo_chain") {
        this.state.setNode("zoo_map_nav");
      } else {
        const targetBranchId = this.state.selectedTargetBranchId || (currentNode.choices ? currentNode.choices[0].targetBranchId : null);
        if (targetBranchId) {
          this.state.setNode(targetBranchId);
        } else if (currentNode.nextNodeId) {
          this.state.setNode(currentNode.nextNodeId);
        }
      }
    } else if (currentNode.nodeType === "地圖移動") {
      // 動物園地圖移動檢驗
      if (this.mapEngine && !this.mapEngine.isAtTargetZone()) {
        const currentZone = this.mapEngine.getCurrentZone();
        const zoneNameMap = { A: "🐘 大象展區", B: "🦁 獅子展區", C: "🐍 蛇展區", D: "🚩 出口集合點" };
        const targetName = zoneNameMap[this.state.targetZoneCode] || "指定展區";
        
        let errorMsg = `哎呀走錯了喔！你的目標是【${targetName}】。`;
        if (currentZone) {
          errorMsg = `哎呀走錯到【${currentZone.label}】了！你的目標是【${targetName}】。`;
        }
        this.showMapToast(errorMsg + " 請按【🔄 重新走】或移動小人！", true);
        SoundFX.error();
        return;
      }

      // 地圖移動成功抵達 -> 進入已選的分支對話
      const targetBranchId = this.state.selectedTargetBranchId || "zoo_elephant";
      this.state.setNode(targetBranchId);
    } else if (currentNode.nextNodeId) {
      this.state.setNode(currentNode.nextNodeId);
    } else {
      // 全情境通關
      this.renderScenarioCompleted();
      return;
    }

    SoundFX.select();
    this.render();
  }

  render() {
    const scenario = this.state.getScenario();
    const node = this.state.getCurrentNode();

    // 更新頂部標籤狀態
    if (this.els.navTabs) {
      this.els.navTabs.forEach((tab) => {
        tab.classList.toggle("is-active", tab.dataset.scenario === scenario.id);
      });
    }

    // 重設面板狀態
    if (this.els.scenarioCompletedCard) this.els.scenarioCompletedCard.hidden = true;
    if (this.els.narrativeCard) this.els.narrativeCard.hidden = false;
    if (this.els.studentSpeechBubble) this.els.studentSpeechBubble.hidden = true;
    if (this.els.npcResponseSection) this.els.npcResponseSection.hidden = true;
    if (this.els.statusDot) this.els.statusDot.className = "status-dot";

    // 情境看板
    if (this.els.scenarioBannerImg && scenario.bannerImage) {
      this.els.scenarioBannerImg.src = scenario.bannerImage;
      this.els.scenarioBannerImg.style.objectFit = scenario.objectFit || "cover";
      this.els.scenarioBannerImg.style.objectPosition = scenario.objectPosition || "50% 50%";
    }
    if (this.els.showcaseTitle) this.els.showcaseTitle.textContent = scenario.title;
    if (this.els.showcaseLocTag) this.els.showcaseLocTag.textContent = `📍 ${node.locationTag}`;
    if (this.els.showcaseStepTag) this.els.showcaseStepTag.textContent = `節點：${node.title}`;

    // 左側情境資訊
    if (this.els.themeIcon) this.els.themeIcon.textContent = scenario.icon;
    if (this.els.scenarioTitle) this.els.scenarioTitle.textContent = scenario.title;
    if (this.els.scenarioObjective) this.els.scenarioObjective.textContent = scenario.objective;

    // 渲染節點軌跡 (Step Tracker)
    this.renderStepTracker(scenario, node);

    // 故事敘述卡
    if (this.els.currentStepTag) this.els.currentStepTag.textContent = `${node.nodeType}：${node.title}`;
    if (this.els.sceneLocationTag) this.els.sceneLocationTag.textContent = node.locationTag;

    // 清理動態插入區塊 (背包清單、地圖)
    this.cleanupDynamicSections();

    // 根據 node.nodeType 渲染主要互動區
    if (node.nodeType === "選擇") {
      this.renderChoiceNode(node);
    } else if (node.nodeType === "地圖移動") {
      this.renderMapNavigationNode(node);
    } else if (node.nodeType === "收集任務") {
      this.renderBackpackCollectionNode(node);
    } else {
      this.renderSpeechNode(node);
    }

    // 渲染開發者面板與分支切換器
    this.renderDevSidebar(node, null);
  }

  cleanupDynamicSections() {
    document.querySelectorAll(".choice-action-section, .backpack-panel, .map-action-section").forEach(el => el.remove());
  }

  // 1. 渲染動態任務關卡進度 Step Tracker
  renderStepTracker(scenario, currentNode) {
    if (!this.els.stepTracker) return;

    // 根據已選擇的分支動態計算呈現的步驟清單
    const visibleSteps = [];

    if (scenario.id === "zoo_chain") {
      visibleSteps.push({ id: "zoo_start", title: "第一關：購票入園" });
      visibleSteps.push({ id: "zoo_gate", title: "第二關：驗票進場" });
      visibleSteps.push({ id: "zoo_choose_animal", title: "第三關：園區問路找展區" });

      // 當選擇完分支後，才動態加入地圖尋路與對應動物展區
      if (this.state.selectedTargetBranchId || this.state.completedNodes.has("zoo_choose_animal")) {
        visibleSteps.push({ id: "zoo_map_nav", title: "第四關：園區步道尋路移動" });
        const branchId = this.state.selectedTargetBranchId || "zoo_elephant";
        const branchTitle = scenario.nodes[branchId] ? scenario.nodes[branchId].title : "第五關：展區互動";
        visibleSteps.push({ id: branchId, title: branchTitle });
        visibleSteps.push({ id: "zoo_meet_point", title: "第六關：展區出口集合" });
      }
    } else if (scenario.id === "hakka_food") {
      visibleSteps.push({ id: "food_step1", title: "步驟 1：點傳統主食" });
      visibleSteps.push({ id: "food_step2", title: "步驟 2：客製化飲食需求" });
      visibleSteps.push({ id: "food_step3", title: "步驟 3：加點飲品與評價" });
    } else if (scenario.id === "field_trip_pack") {
      visibleSteps.push({ id: "pack_hub", title: "任務：背包 4 項整理" });
      visibleSteps.push({ id: "pack_done", title: "完成：玄關集合出發" });
    } else if (scenario.id === "bus_directions") {
      visibleSteps.push({ id: "bus_choose_dest", title: "步驟 1：詢問搭車路線" });
      if (this.state.selectedTargetBranchId || this.state.completedNodes.has("bus_choose_dest")) {
        const branchId = this.state.selectedTargetBranchId || "bus_ask_culture";
        visibleSteps.push({ id: branchId, title: scenario.nodes[branchId]?.title || "步驟 2：站牌候車問候" });
        visibleSteps.push({ id: "bus_board", title: "步驟 3：上車確認到站" });
        visibleSteps.push({ id: "bus_arrive", title: "步驟 4：下車路口方向指引" });
      }
    } else if (scenario.id === "health_center") {
      visibleSteps.push({ id: "health_choose_symptom", title: "步驟 1：向護理師表達不適" });
      if (this.state.selectedTargetBranchId || this.state.completedNodes.has("health_choose_symptom")) {
        const branchId = this.state.selectedTargetBranchId || "health_symptom_head";
        visibleSteps.push({ id: branchId, title: scenario.nodes[branchId]?.title || "步驟 2：說明不適狀況" });
        visibleSteps.push({ id: "health_rest", title: "步驟 3：承諾休息與致謝" });
      }
    } else if (scenario.id === "weather_outfit") {
      visibleSteps.push({ id: "weather_choose_type", title: "步驟 1：選擇今日天氣提醒" });
      if (this.state.selectedTargetBranchId || this.state.completedNodes.has("weather_choose_type")) {
        const branchId = this.state.selectedTargetBranchId || "weather_outfit_rain";
        visibleSteps.push({ id: branchId, title: scenario.nodes[branchId]?.title || "步驟 2：天氣穿搭提醒" });
        visibleSteps.push({ id: "weather_done", title: "步驟 3：穿搭整齊準備出門" });
      }
    }

    if (this.els.progressCounter) {
      const activeIdx = visibleSteps.findIndex(s => s.id === currentNode.id);
      const curNum = activeIdx >= 0 ? activeIdx + 1 : 1;
      this.els.progressCounter.textContent = `第 ${curNum} 關 / 共 ${visibleSteps.length} 關`;
    }

    this.els.stepTracker.innerHTML = visibleSteps.map((s, idx) => {
      let stateClass = "";
      if (this.state.completedNodes.has(s.id)) stateClass = "is-completed";
      else if (s.id === currentNode.id) stateClass = "is-active";

      return `
        <div class="step-item ${stateClass}" data-node-id="${s.id}" role="button" tabindex="0" title="點擊切換至 ${s.title}">
          <span class="step-bullet">${this.state.completedNodes.has(s.id) ? "✓" : idx + 1}</span>
          <span class="step-name">${s.title}</span>
        </div>
      `;
    }).join("");

    this.els.stepTracker.querySelectorAll(".step-item").forEach(item => {
      item.addEventListener("click", () => {
        const nodeId = item.dataset.nodeId;
        if (nodeId && scenario.nodes[nodeId]) {
          this.state.setNode(nodeId);
          this.render();
        }
      });
    });
  }

  // 2. 渲染分支選擇節點 (純口說 + 靜態提詞卡片，不可點擊)
  renderChoiceNode(node) {
    if (this.els.storyPrompt) this.els.storyPrompt.textContent = node.storyPrompt;
    if (this.els.speechActionSection) this.els.speechActionSection.hidden = false;
    if (this.els.statusTip) this.els.statusTip.textContent = "請看上方提示，點擊下方按鈕開始用客語開口說出你的選擇！";

    // 呈現靜態提詞卡片 (禁止滑鼠點擊，僅供視覺輔助)
    if (this.els.speechHintSection && this.els.speechHintCards && node.choices) {
      this.els.speechHintSection.hidden = false;
      if (this.els.speechHintTip) {
        this.els.speechHintTip.textContent = `提示有以下 ${node.choices.length} 個選項，請開口說出你想去或想說的內容：`;
      }
      this.els.speechHintCards.innerHTML = node.choices.map(c => `
        <div class="speech-hint-card">
          <div class="speech-hint-icon">${c.title.split(" ")[0]}</div>
          <div class="speech-hint-info">
            <div class="speech-hint-title">${c.title.split(" ")[1] || c.title}</div>
            <div class="speech-hint-sub">${c.sub || ""}</div>
          </div>
        </div>
      `).join("");
    }

    this.renderSpeechNodeControls(node);
  }

  // 3. 渲染 Canvas 2D 地圖尋路節點
  renderMapNavigationNode(node) {
    if (this.els.storyPrompt) this.els.storyPrompt.textContent = node.storyPrompt;
    if (this.els.speechActionSection) this.els.speechActionSection.hidden = true;
    if (this.els.speechHintSection) this.els.speechHintSection.hidden = true;
    if (this.els.statusTip) this.els.statusTip.textContent = "請操作綠衣小人沿著石板路走向 ⭐ 星標展區，抵達後按【確定抵達】！";

    const targetCode = this.state.targetZoneCode || "A";
    const zoneNameMap = { A: "🐘 大象展區", B: "🦁 獅子展區", C: "🐍 蛇展區", D: "🚩 出口集合點" };
    const currentTargetName = zoneNameMap[targetCode] || "指定展區";

    const mapSection = document.createElement("div");
    mapSection.className = "map-action-section";
    mapSection.innerHTML = `
      <div class="map-guide-banner">
        <div class="map-guide-icon">🧭</div>
        <div class="map-guide-info">
          <div class="map-guide-title">
            <span>當前目的地：${currentTargetName}</span>
            <span class="map-tip-pill">可點擊步道或按方向鍵移動</span>
          </div>
          <div class="map-guide-sub">引導綠衣小人走到黃色光圈【⭐ 目標展區】，抵達後請按右下角【確定抵達】！</div>
        </div>
      </div>

      <div class="map-canvas-wrapper" id="mapCanvasHost"></div>

      <!-- 虛擬 D-pad 控制 -->
      <div class="map-dpad">
        <button class="dpad-btn" id="dpadUp" title="往上走">▲</button>
        <div class="dpad-mid-row">
          <button class="dpad-btn" id="dpadLeft" title="往左走">◀</button>
          <button class="dpad-btn" id="dpadDown" title="往下走">▼</button>
          <button class="dpad-btn" id="dpadRight" title="往右走">▶</button>
        </div>
      </div>

      <div class="map-controls-dock">
        <button class="btn-map-reset" id="btnMapReset">🔄 重新走</button>
        <button class="btn-map-ok" id="btnMapOk">✅ 確定抵達 (OK)</button>
      </div>
    `;

    const narrativeBody = document.querySelector(".narrative-card") || document.querySelector(".stage-dialogue-col");
    narrativeBody.appendChild(mapSection);

    // 掛載 Canvas
    const host = document.getElementById("mapCanvasHost");
    if (host && this.mapEngine && this.mapEngine.canvas) {
      host.appendChild(this.mapEngine.canvas);
      this.mapEngine.setTarget(targetCode);
    }

    // 綁定虛擬按鍵
    const stepDist = 20;
    document.getElementById("dpadUp")?.addEventListener("click", () => this.mapEngine.moveBy(0, -stepDist));
    document.getElementById("dpadDown")?.addEventListener("click", () => this.mapEngine.moveBy(0, stepDist));
    document.getElementById("dpadLeft")?.addEventListener("click", () => this.mapEngine.moveBy(-stepDist, 0));
    document.getElementById("dpadRight")?.addEventListener("click", () => this.mapEngine.moveBy(stepDist, 0));
    
    // 左下角【重新走】：回到大門起點
    document.getElementById("btnMapReset")?.addEventListener("click", () => {
      this.mapEngine.resetPosition();
      this.showMapToast("🔄 已重回大門起點，請重新出發！");
    });

    // 右下角【確定抵達】：驗證走位
    document.getElementById("btnMapOk")?.addEventListener("click", () => {
      this.advanceToNextNode();
    });
  }

  // 4. 渲染 4 格背包非線性收集節點
  renderBackpackCollectionNode(node) {
    const activeItem = node.items[this.state.activePackItemIndex] || node.items[0];

    if (this.els.storyPrompt) this.els.storyPrompt.textContent = activeItem.storyPrompt;
    if (this.els.speechActionSection) this.els.speechActionSection.hidden = false;
    if (this.els.speechHintSection) this.els.speechHintSection.hidden = true;
    if (this.els.statusTip) this.els.statusTip.textContent = `正在整理【${activeItem.name}】，請點擊下方按鈕錄音回答。`;

    // 注入背包清單面板
    const backpackPanel = document.createElement("div");
    backpackPanel.className = "backpack-panel";
    backpackPanel.innerHTML = `
      <div class="backpack-header">
        <span>🎒 背包清單（可自由點選順序）</span>
        <span class="backpack-count">已收集 ${this.state.collectedItems.size} / ${node.items.length} 項</span>
      </div>
      <div class="backpack-grid">
        ${node.items.map((it, idx) => {
          const isCollected = this.state.collectedItems.has(it.id);
          const isActive = idx === this.state.activePackItemIndex;
          return `
            <div class="backpack-item ${isActive ? 'is-active' : ''} ${isCollected ? 'is-collected' : ''}" data-item-index="${idx}">
              <div class="backpack-item-icon">${it.icon}</div>
              <div class="backpack-item-label">${it.name}</div>
              <div class="backpack-item-status">${isCollected ? '✓ 已放入' : (isActive ? '● 整理中' : '未放入')}</div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    const narrativeBody = document.querySelector(".narrative-card") || document.querySelector(".stage-dialogue-col");
    narrativeBody.appendChild(backpackPanel);

    // 綁定背包格子點擊切換
    backpackPanel.querySelectorAll(".backpack-item").forEach(item => {
      item.addEventListener("click", () => {
        const itemIdx = parseInt(item.dataset.itemIndex, 10);
        if (!isNaN(itemIdx)) {
          SoundFX.select();
          this.state.activePackItemIndex = itemIdx;
          this.render();
        }
      });
    });

    this.renderSpeechNodeControls(activeItem);
  }

  // 5. 渲染一般口說主線/分支/集合點節點
  renderSpeechNode(node) {
    if (this.els.storyPrompt) this.els.storyPrompt.textContent = node.storyPrompt;
    if (this.els.speechActionSection) this.els.speechActionSection.hidden = false;
    if (this.els.speechHintSection) this.els.speechHintSection.hidden = true;
    if (this.els.statusTip) this.els.statusTip.textContent = "請點擊下方按鈕，開始用客語說出你想講的話。";

    this.renderSpeechNodeControls(node);
  }

  renderSpeechNodeControls(targetNodeConfig) {
    if (this.els.recordBtn) {
      this.els.recordBtn.disabled = false;
      this.els.recordBtn.classList.remove("is-recording");
    }
    if (this.els.recordBtnText) this.els.recordBtnText.textContent = "按住／點擊錄音";
    if (this.els.devAutoFillSuccessBtn) this.els.devAutoFillSuccessBtn.disabled = false;
    if (this.els.devAutoFillFailBtn) this.els.devAutoFillFailBtn.disabled = false;
  }

  setControlsLoading(isLoading) {
    if (isLoading) {
      if (this.els.recordBtn) {
        this.els.recordBtn.disabled = false;
        this.els.recordBtn.classList.add("is-recording");
      }
      if (this.els.recordBtnText) this.els.recordBtnText.textContent = "🔴 正在錄音辨識中...（可再點擊停止）";
      if (this.els.statusDot) this.els.statusDot.className = "status-dot is-recording";
      if (this.els.statusTip) this.els.statusTip.textContent = "正在聆聽麥克風客語發音並即時與語料比對中...";
    } else {
      if (this.els.recordBtn) {
        this.els.recordBtn.classList.remove("is-recording");
      }
      if (this.els.recordBtnText) this.els.recordBtnText.textContent = "按住／點擊錄音";
    }
  }

  // 渲染開發者側邊欄 (包含分支直接切換器)
  renderDevSidebar(nodeConfig, runtimeResult) {
    if (this.els.devNodeIdText) this.els.devNodeIdText.textContent = nodeConfig.id || this.state.currentNodeId;
    if (this.els.devNodeTypeTag) this.els.devNodeTypeTag.textContent = nodeConfig.nodeType || "主線";
    if (this.els.devTargetLocText) this.els.devTargetLocText.textContent = nodeConfig.locationTag || "無指定";

    if (this.els.devTargetHakka) this.els.devTargetHakka.textContent = nodeConfig.targetHakka || "（本節點為口說分支選擇）";
    if (this.els.devTargetMandarin) {
      this.els.devTargetMandarin.textContent = nodeConfig.targetMandarin ? `（華語：${nodeConfig.targetMandarin}）` : "";
    }

    // 分支路線切換器 (Dev Branch Switcher)
    const currentNode = this.state.getCurrentNode();
    if (this.els.devBranchSection && this.els.devBranchGrid) {
      const scenario = this.state.getScenario();
      let choicesList = null;

      if (currentNode.nodeType === "選擇" && currentNode.choices) {
        choicesList = currentNode.choices;
      } else {
        // 尋找此情境中的所有分支選項
        const chooseNode = Object.values(scenario.nodes).find(n => n.nodeType === "選擇" && n.choices);
        if (chooseNode) choicesList = chooseNode.choices;
      }

      if (choicesList && choicesList.length > 0) {
        this.els.devBranchSection.hidden = false;
        this.els.devBranchGrid.innerHTML = choicesList.map(c => {
          const isCurrent = this.state.selectedChoiceId === c.id || this.state.selectedTargetBranchId === c.targetBranchId;
          return `
            <button class="dev-branch-btn ${isCurrent ? 'is-active' : ''}" type="button" data-choice-id="${c.id}" data-target-branch="${c.targetBranchId}" data-zone-code="${c.zoneCode || ''}">
              <span>${c.title}</span>
              <span>➔ 切換</span>
            </button>
          `;
        }).join("");

        // 綁定開發者分支切換按鈕
        this.els.devBranchGrid.querySelectorAll(".dev-branch-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            SoundFX.select();
            const choiceId = btn.dataset.choiceId;
            const targetBranch = btn.dataset.targetBranch;
            const zoneCode = btn.dataset.zoneCode;

            this.state.selectedChoiceId = choiceId;
            this.state.selectedTargetBranchId = targetBranch;
            if (zoneCode) this.state.targetZoneCode = zoneCode;

            if (currentNode.nodeType === "選擇") {
              this.state.markCurrentNodeCompleted();
              if (scenario.id === "zoo_chain") {
                this.state.setNode("zoo_map_nav");
              } else {
                this.state.setNode(targetBranch);
              }
            } else {
              this.state.setNode(targetBranch);
            }
            this.render();
          });
        });
      } else {
        this.els.devBranchSection.hidden = true;
      }
    }

    // 關鍵字標籤
    if (this.els.devKeywordsList) {
      const kwList = nodeConfig.keywords || (nodeConfig.choices ? nodeConfig.choices.flatMap(c => c.keywords || []) : []);
      this.els.devKeywordsList.innerHTML = kwList.map(kw => `<span class="kw-tag">${kw}</span>`).join("");
    }

    if (runtimeResult) {
      const { transcript, evalResult } = runtimeResult;
      if (this.els.devTranscriptText) this.els.devTranscriptText.textContent = transcript || "（無）";
      if (this.els.devStatusText) {
        this.els.devStatusText.textContent = evalResult.isMatch ? "✓ 辨識命中通過" : "⚠️ 未命中重試";
        this.els.devStatusText.style.color = evalResult.isMatch ? "#34d399" : "#f87171";
      }

      if (this.els.devKeywordsList) {
        const kwTags = this.els.devKeywordsList.querySelectorAll(".kw-tag");
        kwTags.forEach(tag => {
          const isHit = evalResult.hitKeywords.some(h => tag.textContent.includes(h));
          tag.classList.toggle("is-hit", isHit);
        });
      }
    } else {
      if (this.els.devTranscriptText) this.els.devTranscriptText.textContent = "（等待學生錄音中...）";
      if (this.els.devStatusText) {
        this.els.devStatusText.textContent = "尚未錄音";
        this.els.devStatusText.style.color = "#9ca3af";
      }
      this.updatePipelineStep(1, "pending", "（等待發音...）");
      this.updatePipelineStep(2, "pending", "（等待翻譯...）");
      this.updatePipelineStep(3, "pending", null);
      if (this.els.pipeLlmResult) {
        this.els.pipeLlmResult.textContent = "尚未判定";
        this.els.pipeLlmResult.style.color = "#cbd5e1";
      }
      if (this.els.pipeLlmIntent) this.els.pipeLlmIntent.textContent = "無";
      if (this.els.pipeLlmScore) this.els.pipeLlmScore.textContent = "--";
      if (this.els.pipeLlmNpc) this.els.pipeLlmNpc.textContent = "（待生成...）";
    }

    // LLM Prompt 結構預覽
    if (this.els.llmViewer) {
      const scenario = this.state.getScenario();
      const currentHakka = runtimeResult ? runtimeResult.transcript : (nodeConfig.targetHakka || "𠊎想愛去大象園區");
      const currentMandarin = runtimeResult ? (runtimeResult.mandarinText || currentHakka) : (nodeConfig.targetMandarin || "我想要去大象園區");
      const llmPayload = {
        currentEngine: LLMServiceAdapter.config.provider === "openai_gemini" ? "線上 LLM (GPT-4o / Gemini)" : "本機智慧安全網 (離線零延遲)",
        systemPrompt: LLMServiceAdapter.buildSystemPrompt(nodeConfig, scenario),
        userPrompt: LLMServiceAdapter.buildUserPrompt(currentHakka, currentMandarin, nodeConfig),
        expectedJsonOutputSchema: LLMServiceAdapter.buildExpectedSchema()
      };
      this.els.llmViewer.textContent = JSON.stringify(llmPayload, null, 2);
    }

    // Live JSON
    if (this.els.jsonViewer) {
      const scenario = this.state.getScenario();
      const payload = {
        scenarioId: scenario.id,
        title: scenario.title,
        currentNodeId: this.state.currentNodeId,
        nodeType: nodeConfig.nodeType || "主線",
        selectedChoiceId: this.state.selectedChoiceId,
        selectedTargetBranchId: this.state.selectedTargetBranchId,
        targetZoneCode: this.state.targetZoneCode,
        collectedBackpackItems: Array.from(this.state.collectedItems),
        nodeConfig: nodeConfig,
        runtimeResult: runtimeResult || null
      };
      this.els.jsonViewer.textContent = JSON.stringify(payload, null, 2);
    }
  }

  renderScenarioCompleted() {
    SoundFX.complete();
    const scenario = this.state.getScenario();
    if (this.els.narrativeCard) this.els.narrativeCard.hidden = true;
    if (this.els.scenarioCompletedCard) this.els.scenarioCompletedCard.hidden = false;
    if (this.els.completedTitle) this.els.completedTitle.textContent = `【${scenario.title}】連鎖任務探索完成！`;
    if (this.els.completedStepCount) {
      this.els.completedStepCount.textContent = `通關節點：${this.state.pathHistory.length} 關`;
    }
    if (this.els.statusDot) this.els.statusDot.className = "status-dot is-success";
    if (this.els.statusTip) this.els.statusTip.textContent = "恭喜完成本情境所有連鎖任務！";
  }
}

// 啟動應用
document.addEventListener("DOMContentLoaded", () => {
  const stateManager = new GraphStateManager();
  window.app = new UIController(stateManager);
});
