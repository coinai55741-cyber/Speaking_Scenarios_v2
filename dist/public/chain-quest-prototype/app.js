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
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  static playTone(freq, type = "sine", duration = 0.15, gainVal = 0.15) {
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
    this.playTone(523.25, "sine", 0.12, 0.2); // C5
    setTimeout(() => this.playTone(659.25, "sine", 0.12, 0.22), 100); // E5
    setTimeout(() => this.playTone(783.99, "sine", 0.28, 0.25), 200); // G5
  }

  static error() {
    this.playTone(240, "triangle", 0.18, 0.22);
    setTimeout(() => this.playTone(190, "triangle", 0.28, 0.22), 130);
  }

  static select() {
    this.playTone(440, "sine", 0.08, 0.1);
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
    bannerImage: "./assets/zoo-ticket-booth.png",
    objectFit: "cover",
    objectPosition: "50% 50%",
    objective: "體驗購票、驗票、口說問路並依照指引在 Canvas 地圖操縱小人走入展區，完成對話並於出口集合。",
    mandarinObjective: "體驗購票、驗票、口說問路並依照指引在 Canvas 地圖操縱角色走入展區，完成對話並於出口集合。",
    startNodeId: "zoo_start",
    nodes: {
      zoo_start: {
        id: "zoo_start",
        title: "第一關：購票入園",
        image: "./assets/zoo-ticket-booth.png",
        nodeType: "主線",
        locationTag: "動物園大門售票處",
        storyPrompt: "今天天氣晴朗，你跟同學一起來到動物園門口。輪到你上前時，你準備跟售票員買學生票。你說：",
        mandarinStoryPrompt: "今天天氣晴朗，你跟同學一起來到動物園門口。輪到你上前時，你準備跟售票員買學生票。你說：",
        targetHakka: "𠊎愛買三張學生票。",
        targetMandarin: "我要買三張學生票。",
        keywords: ["三張", "愛買", "學生票"],
        mandarinKeywords: ["我要買", "三張", "學生票"],
        altKeywords: ["三張", "學生", "學生票", "買票"],
        npcRole: "售票員",
        npcAvatar: "🧑‍💼",
        npcSuccessResponse: "「好，三張學生票。這是你的門票，請收好，祝你們玩得開心！」",
        mandarinNpcSuccessResponse: "「好，三張學生票。這是你的門票，請收好，祝你們玩得開心！」",
        npcRetryResponse: "「不好意思售票窗口聲音比較雜，請問你們幾位、要買幾張票呢？」",
        mandarinNpcRetryResponse: "「不好意思售票窗口聲音比較雜，請問你們幾位、要買幾張票呢？」",
        nextNodeId: "zoo_gate"
      },
      zoo_gate: {
        id: "zoo_gate",
        title: "第二關：驗票進場",
        image: "./assets/zoo-gate-entry.png",
        nodeType: "主線",
        locationTag: "入園驗票閘門",
        storyPrompt: "你拿著門票走到閘門前，志工奶奶準備幫你驗票，你也想向她道謝。你說：",
        mandarinStoryPrompt: "你拿著門票走到閘門前，志工奶奶準備幫你驗票，你也想向她道謝。你說：",
        targetHakka: "這係𠊎个門票，恁仔細。",
        targetMandarin: "這是我的門票，謝謝。",
        keywords: ["門票", "恁仔細"],
        mandarinKeywords: ["這是", "門票", "謝謝"],
        altKeywords: ["這係", "謝謝", "門票"],
        npcRole: "驗票志工",
        npcAvatar: "👵",
        npcSuccessResponse: "「歡迎光臨！閘門打開了，進去請小心腳步，慢慢參觀喔！」",
        mandarinNpcSuccessResponse: "「歡迎光臨！閘門打開了，進去請小心腳步，慢慢參觀喔！」",
        npcRetryResponse: "「嗯……年輕人，進場要有禮貌說聲謝謝喔！奶奶也在等著幫你驗門票呢，要不要再說一次？」",
        mandarinNpcRetryResponse: "「嗯……年輕人，進場要有禮貌說聲謝謝喔！奶奶也在等著幫你驗門票呢，要不要再說一次？」",
        nextNodeId: "zoo_choose_animal"
      },
      zoo_choose_animal: {
        id: "zoo_choose_animal",
        title: "第三關：園區問路找展區",
        image: "./assets/zoo-ask-directions.png",
        nodeType: "選擇",
        locationTag: "園區路口導覽站",
        storyPrompt: "進到園區後，你們想先看一種動物。請看上方提示，開口向導覽員詢問你想去的展區（例如大象、獅子或蛇）：",
        mandarinStoryPrompt: "進到園區後，你們想先看一種動物。請看上方提示，開口向導覽員詢問你想去的展區（例如大象、獅子或蛇）：",
        targetHakka: "請問大象區愛仰般行？",
        targetMandarin: "請問大象展區要怎麼走？",
        keywords: ["大象", "獅子", "蛇"],
        mandarinKeywords: ["大象", "獅子", "蛇"],
        altKeywords: ["大象", "獅子", "蛇", "水池", "岩石", "溫室", "仰般行", "怎麼走"],
        npcRole: "園區導覽員",
        npcAvatar: "👨‍🌾",
        npcSuccessResponse: "「想好要看哪一種動物後，就看清楚路線提示，操縱小人出發吧！」",
        mandarinNpcSuccessResponse: "「想好要看哪一種動物後，就看清楚路線提示，操縱角色出發吧！」",
        npcRetryResponse: "「同學，你想要先看哪一種動物呢？大象、獅子還是蛇，告訴我我幫你指路喔！」",
        mandarinNpcRetryResponse: "「同學，你想要先看哪一種動物呢？大象、獅子還是蛇，告訴我我幫你指路喔！」",
        choices: [
          {
            id: "elephant",
            title: "🐘 大象展區",
            sub: "左上方水池旁",
            hintImage: "./assets/zoo-icon-elephant-pool.png",
            targetBranchId: "zoo_elephant",
            zoneCode: "A",
            keywords: ["大象", "象", "水池", "鼻仔"],
            mandarinKeywords: ["大象", "大象區", "大象展區", "水池", "鼻子"],
            guideResponse: "「想看大象的話，從這裡沿著步道直走經過十字路口，再往左手邊走到底，就會看到大象水池囉！」",
            mandarinGuideResponse: "「想看大象的話，從這裡沿著步道直走經過十字路口，再往左手邊走到底，就會看到大象水池囉！」"
          },
          {
            id: "lion",
            title: "🦁 獅子展區",
            sub: "正上方岩石區",
            hintImage: "./assets/zoo-icon-lion-rock.png",
            targetBranchId: "zoo_lion",
            zoneCode: "B",
            keywords: ["獅子", "獅仔", "獅", "岩石", "威風"],
            mandarinKeywords: ["獅子", "獅子區", "獅子展區", "岩石", "威風"],
            guideResponse: "「想看獅子的話，從這裡沿著步道直走經過十字路口，正前方岩石區就是獅子展區囉！」",
            mandarinGuideResponse: "「想看獅子的話，從這裡沿著步道直走經過十字路口，正前方岩石區就是獅子展區囉！」"
          },
          {
            id: "snake",
            title: "🐍 蛇展區",
            sub: "右上方溫室玻璃屋",
            hintImage: "./assets/zoo-icon-snake-greenhouse.png",
            targetBranchId: "zoo_snake",
            zoneCode: "C",
            keywords: ["蛇", "蛇仔", "溫室", "玻璃", "安靜"],
            mandarinKeywords: ["蛇", "蛇區", "蛇展區", "溫室", "安靜"],
            guideResponse: "「想看蛇的話，從這裡沿著步道直走經過十字路口，再往右手邊走到底，玻璃溫室就是蛇展區囉！」",
            mandarinGuideResponse: "「想看蛇的話，從這裡沿著步道直走經過十字路口，再往右手邊走到底，玻璃溫室就是蛇展區囉！」"
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
        mandarinStoryPrompt: "請依照導覽員的指示，操縱角色沿著石板步道走向你選擇的【⭐ 星標展區】，抵達後按右下角【確定抵達】！",
        npcRole: "園區導覽員",
        npcAvatar: "👨‍🌾",
        npcSuccessResponse: "「很好！你順利走到展區了，快跟同學分享你的發現吧！」",
        mandarinNpcSuccessResponse: "「很好！你順利走到展區了，快跟同學分享你的發現吧！」",
        npcRetryResponse: "「哎呀走錯展區囉！目前位置不是你選擇的展區，請按【🔄 重新走】或看清楚星標再試一次！」",
        mandarinNpcRetryResponse: "「哎呀走錯展區囉！目前位置不是你選擇的展區，請按【🔄 重新走】或看清楚星標再試一次！」"
      },
      zoo_elephant: {
        id: "zoo_elephant",
        title: "第五關：大象展區互動",
        image: "./assets/zoo-exhibit-elephant.png",
        nodeType: "分支",
        locationTag: "大象展區水池旁",
        storyPrompt: "你看到大象用長鼻子吸水沖在背上洗澡，覺得很可愛，想跟身邊的同學分享。你說：",
        mandarinStoryPrompt: "你看到大象用長鼻子吸水沖在背上洗澡，覺得很可愛，想跟身邊的同學分享。你說：",
        targetHakka: "大象个鼻仔當長，當得人惜！",
        targetMandarin: "大象的鼻子好長，好可愛！",
        keywords: ["大象", "鼻仔", "當長", "得人惜"],
        mandarinKeywords: ["大象", "鼻子", "好長", "可愛"],
        altKeywords: ["鼻仔", "得人惜", "長", "大象"],
        npcRole: "同學阿明",
        npcAvatar: "👦",
        npcSuccessResponse: "「真的耶！你看牠還會用長鼻子捲草吃，大象真的好得意喔！」",
        mandarinNpcSuccessResponse: "「真的耶！你看牠還會用長鼻子吸水噴在背上，大象真的好可愛喔！」",
        npcRetryResponse: "「阿明歪著頭問：『大象到底在做什麼呀？我剛才沒看清楚，快跟我說說看！』」",
        mandarinNpcRetryResponse: "「阿明歪著頭問：『大象到底在做什麼呀？我剛才沒看清楚，快跟我說說看！』」",
        nextNodeId: "zoo_meet_point"
      },
      zoo_lion: {
        id: "zoo_lion",
        title: "第五關：獅子展區互動",
        image: "./assets/zoo-exhibit-lion.png",
        nodeType: "分支",
        locationTag: "獅子展區岩石旁",
        storyPrompt: "你看到獅子趴在石頭上休息，鬃毛看起來很威風，想跟身邊的同學分享。你說：",
        mandarinStoryPrompt: "你看到獅子趴在石頭上休息，鬃毛看起來很威風，想跟身邊的同學分享。你說：",
        targetHakka: "獅仔看起來當威風。",
        targetMandarin: "獅子看起來很威風。",
        keywords: ["獅仔", "當威風"],
        mandarinKeywords: ["獅子", "威風", "很威風"],
        altKeywords: ["獅子", "威風", "獅仔"],
        npcRole: "同學阿明",
        npcAvatar: "👦",
        npcSuccessResponse: "「對啊，牠趴在岩石上，看起來就像草原之王一樣威風！」",
        mandarinNpcSuccessResponse: "「對啊，牠趴在岩石上，看起來就像草原之王一樣威風！」",
        npcRetryResponse: "「阿明指著岩石說：『你看獅子趴在那邊，看起來像什麼呢？快跟我分享！』」",
        mandarinNpcRetryResponse: "「阿明指著岩石說：『你看獅子趴在那邊，看起來像什麼呢？快跟我分享！』」",
        nextNodeId: "zoo_meet_point"
      },
      zoo_snake: {
        id: "zoo_snake",
        title: "第五關：蛇展區互動",
        image: "./assets/zoo-exhibit-snake.png",
        nodeType: "分支",
        locationTag: "蛇展區玻璃窗前",
        storyPrompt: "你看到蛇慢慢爬過樹枝，動作很安靜，想跟身邊的同學分享。你說：",
        mandarinStoryPrompt: "你看到蛇慢慢爬過樹枝，動作很安靜，想跟身邊的同學分享。你說：",
        targetHakka: "蛇仔行路當靜。",
        targetMandarin: "蛇移動得很安靜。",
        keywords: ["蛇仔", "當靜"],
        mandarinKeywords: ["蛇", "移動", "安靜", "很安靜"],
        altKeywords: ["蛇", "安靜", "靜", "蛇仔"],
        npcRole: "同學阿明",
        npcAvatar: "👦",
        npcSuccessResponse: "「真的，牠在樹枝上滑行得好慢，幾乎一點聲音都沒有！」",
        mandarinNpcSuccessResponse: "「真的，牠在樹枝上滑行得好慢，幾乎一點聲音都沒有！」",
        npcRetryResponse: "「阿明靠在玻璃窗邊說：『蛇在樹枝上是怎麼移動的呀？快跟我說說看！』」",
        mandarinNpcRetryResponse: "「阿明靠在玻璃窗邊說：『蛇在樹枝上是怎麼移動的呀？快跟我說說看！』」",
        nextNodeId: "zoo_meet_point"
      },
      zoo_meet_point: {
        id: "zoo_meet_point",
        title: "第六關：展區出口集合",
        image: "./assets/zoo-complete-badge.png",
        nodeType: "集合點",
        locationTag: "園區出口集合點",
        storyPrompt: "參觀完動物展區後，大家走到【⭐ 出口集合點】集合，老師正在清點人數。你向老師報告大家都到齊了：",
        mandarinStoryPrompt: "參觀完動物展區後，大家走到【⭐ 出口集合點】集合，老師正在清點人數。你向老師報告大家都到齊了：",
        targetHakka: "老師，𠊎兜都參觀好了，人都到齊了！",
        targetMandarin: "老師，我們都參觀好了，人都到齊了！",
        keywords: ["參觀好了", "到齊", "人都到齊了"],
        mandarinKeywords: ["參觀好了", "到齊", "大家都到了"],
        altKeywords: ["都參觀好了", "都到齊了", "全到齊了", "大家都到了", "人都到了", "到齊"],
        npcRole: "帶隊老師",
        npcAvatar: "👩‍🏫",
        npcSuccessResponse: "「太棒了！大家都準時到齊而且學到很多動物知識，動物園探索大成功！」",
        mandarinNpcSuccessResponse: "「太棒了！大家都準時到齊而且學到很多動物知識，動物園探索大成功！」",
        npcRetryResponse: "「那我們再等一下下，等全部人都到齊、都參觀完了之後再出發喔！」",
        mandarinNpcRetryResponse: "「那我們再等一下下，等全部人都到齊、都參觀完了之後再出發喔！」",
        nextNodeId: null // 結束
      }
    }
  },

  // ----------------------------------------------------
  // 情境 2：客家美食點餐 (經典 3 步驟)
  // ----------------------------------------------------
  hakka_food: {
    id: "hakka_food",
    title: "客家美食點餐",
    icon: "🍜",
    bannerImage: "./assets/food-counter-order.png",
    objectFit: "cover",
    objectPosition: "50% 50%",
    objective: "在熱鬧的客家小吃店，向老闆點餐、確認客製化需求，最後到收銀機前結帳並說出評價。菜單與客製化選項可由 UI 或 LLM 替換。",
    mandarinObjective: "在熱鬧的傳統小吃店，向老闆點餐、確認客製化需求，最後到收銀機前結帳並說出評價。菜單與客製化選項可由 UI 或 LLM 替換。",
    startNodeId: "food_step1",
    nodes: {
      food_step1: {
        id: "food_step1",
        title: "步驟 1：向老闆點一份餐點",
        nodeType: "主線",
        locationTag: "客家小吃店櫃檯",
        image: "./assets/food-counter-order.png",
        objectPosition: "50% 50%",
        storyPrompt: "你走進一間熱鬧的客家小吃店，穿客家服飾的男老闆站在櫃檯後招呼你。你看著可替換菜單，準備點一份餐點。你說：",
        mandarinStoryPrompt: "你走進一間熱鬧的傳統小吃店，男老闆站在櫃檯後招呼你。你看著可替換菜單，準備點一份餐點。你說：",
        targetHakka: "老闆，𠊎愛一碗湯粄條。",
        targetMandarin: "老闆，我要一碗湯粄條。",
        keywords: ["湯粄條", "炒粄條", "米苔目", "客家小炒"],
        mandarinKeywords: ["湯粄條", "炒粄條", "米苔目", "客家小炒", "粄條"],
        altKeywords: ["湯粄條", "炒粄條", "粄條", "米苔目", "客家小炒", "小炒", "薑絲大腸", "鹹豬肉", "鹹湯圓", "梅干扣肉"],
        npcRole: "小吃店老闆",
        npcAvatar: "👨‍🍳",
        npcSuccessResponse: "「好，我收你五十箍，你去那邊稍坐一下喔，等一下就上菜了！」",
        mandarinNpcSuccessResponse: "「好，我收你五十元，你去那邊稍坐一下喔，等一下就上菜了！」",
        npcRetryResponse: "「老闆熱情問道：『同學，今天想吃點什麼好料的？我們招牌有現煮湯粄條跟客家小炒喔！』」",
        mandarinNpcRetryResponse: "「老闆熱情問道：『同學，今天想吃點什麼好料的？我們招牌有現煮湯粄條跟客家小炒喔！』」",
        nextNodeId: "food_step2"
      },
      food_step2: {
        id: "food_step2",
        title: "步驟 2：確認客製化需求",
        nodeType: "主線",
        locationTag: "客家小吃店餐桌旁",
        image: "./assets/food-custom-request.png",
        objectPosition: "50% 50%",
        storyPrompt: "老闆端著托盤過來，親切地向你確認餐點有沒有特別需求。你想起自己不喜歡吃香菜，也想調整口味。你說：",
        mandarinStoryPrompt: "老闆端著托盤過來，親切地向你確認餐點有沒有特別需求。你想起自己不喜歡吃香菜，也想調整口味。你說：",
        targetHakka: "毋好放香菜，甜一點。",
        targetMandarin: "不要放香菜，甜一點。",
        keywords: ["毋好放", "香菜"],
        mandarinKeywords: ["不要放", "香菜", "甜一點"],
        altKeywords: ["毋好", "香菜", "甜一點"],
        npcRole: "小吃店老闆",
        npcAvatar: "👨‍🍳",
        npcSuccessResponse: "「沒問題！老闆記下來了，不放香菜，幫你煮得甘甜甘甜！」",
        mandarinNpcSuccessResponse: "「沒問題！老闆記下來了，不放香菜，幫你煮得甘甜甘甜！」",
        npcRetryResponse: "「老闆拿著托盤問：『同學，你的餐點口味上有什麼特別交代嗎？比如不要放香菜還是要甜一點？』」",
        mandarinNpcRetryResponse: "「老闆拿著托盤問：『同學，你的餐點口味上有什麼特別交代嗎？比如不要放香菜還是要甜一點？』」",
        nextNodeId: "food_step3"
      },
      food_step3: {
        id: "food_step3",
        title: "步驟 3：結帳時說出評價",
        nodeType: "集合點",
        locationTag: "小吃店收銀櫃檯",
        image: "./assets/food-review.png",
        objectPosition: "50% 50%",
        storyPrompt: "吃飽後，你來到收銀機前拿出錢包準備結帳。老闆娘手拿帳單，親切問你今天吃得如何。你可以說喜歡或不喜歡。你說：",
        mandarinStoryPrompt: "吃飽後，你來到收銀機前拿出錢包準備結帳。老闆娘手拿帳單，親切問你今天吃得如何。你可以說喜歡或不喜歡。你說：",
        targetHakka: "再加一杯擂茶，這道客家小炒當好食！",
        targetMandarin: "再加一杯擂茶，這道客家小炒真好吃！",
        keywords: ["擂茶", "客家小炒", "當好食"],
        mandarinKeywords: ["擂茶", "客家小炒", "好吃", "真好吃"],
        altKeywords: ["擂茶", "好食", "客家小炒"],
        npcRole: "老闆娘",
        npcAvatar: "👩‍🍳",
        npcSuccessResponse: "「多謝你講出感覺！歡迎下次再來，老闆娘會幫你記得喜歡的口味。」",
        mandarinNpcSuccessResponse: "「謝謝你說出感覺！歡迎下次再來，老闆娘會幫你記得喜歡的口味。」",
        npcRetryResponse: "「老闆娘拿著帳單親切問：『吃得還滿意嗎？你可以說這道料理當好食，也可以說當不好食。』」",
        mandarinNpcRetryResponse: "「老闆娘拿著帳單親切問：『吃得還滿意嗎？你可以說這道料理很好吃，也可以說不好吃。』」",
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
    bannerImage: "./assets/field-trip-room-ready.png",
    objectFit: "cover",
    objectPosition: "50% 50%",
    objective: "在出發前對照清單，以自由順序將雨傘、水壺、毛巾、點心 4 樣物品用客語裝入背包，並於玄關集合。",
    mandarinObjective: "在出發前對照清單，以自由順序將雨傘、水壺、毛巾、點心 4 樣物品裝入背包，並於玄關集合。",
    startNodeId: "pack_hub",
    nodes: {
      pack_hub: {
        id: "pack_hub",
        title: "任務一：背包 4 項整理",
        nodeType: "收集任務",
        locationTag: "房間背包整理區",
        image: "./assets/field-trip-room-ready.png",
        tableImage: "./assets/field-trip-table-items.png",
        storyPrompt: "期待已久的戶外教學就是今天！出門前，媽媽再次叮嚀要仔細檢查清單，確認需要的物品都好好裝進背包裡。讓我們看著桌上的物品，一樣一樣清點確認吧！",
        mandarinStoryPrompt: "期待已久的戶外教學就是今天！出門前，媽媽再次叮嚀要仔細檢查清單，確認需要的物品都好好裝進背包裡。讓我們看著桌上的物品，一樣一樣清點確認吧！",
        npcRole: "媽媽",
        npcAvatar: "👩",
        npcSuccessResponse: "「雨傘、水壺、毛巾、點心都裝齊了，太棒了！我們到玄關集合準備出發！」",
        mandarinNpcSuccessResponse: "「雨傘、水壺、毛巾、點心都裝齊了，太棒了！我們到玄關集合準備出發！」",
        items: [
          {
            id: "umbrella",
            name: "雨傘",
            icon: "☂️",
            desc: "下雨防淋濕 / 晴天防曬遮陽",
            locationTag: "臥室書桌前",
            storyPrompt: "你看見雨傘，請說出它的名字，以及為什麼校外教學要帶它。你說：",
            mandarinStoryPrompt: "你看見雨傘，請說出它的名字，以及為什麼校外教學要帶它。你說：",
            targetHakka: "𠊎愛帶遮仔，落雨做得用。（大日頭乜做得遮陽）",
            targetMandarin: "我要帶雨傘，下雨可以用。（出大太陽也可以遮陽）",
            keywords: ["遮仔", "落雨", "用", "遮陽", "日頭"],
            mandarinKeywords: ["我要帶", "雨傘", "下雨", "可以用", "遮陽", "防曬", "太陽", "大太陽"],
            altKeywords: ["雨傘", "下雨", "遮仔", "遮陽", "防曬", "太陽", "大太陽", "日頭", "熱"],
            npcRole: "媽媽",
            npcAvatar: "👩",
            npcSuccessResponse: "「真乖！帶雨傘大太陽可以遮陽、下雨也不怕淋濕，放進書包側邊吧！」",
            mandarinNpcSuccessResponse: "「真乖！帶雨傘大太陽可以遮陽、下雨也不怕淋濕，放進書包側邊吧！」",
            npcRetryResponse: "「媽媽叮嚀：『書桌上的雨傘要記得收進去喔，出門下雨才不會淋濕、太陽大也能遮陽，快收好跟媽媽說！』」",
            mandarinNpcRetryResponse: "「媽媽叮嚀：『書桌上的雨傘要記得收進去喔，出門下雨才不會淋濕，太陽大也能遮陽，快收好跟媽媽說！』」"
          },
          {
            id: "bottle",
            name: "水壺",
            icon: "💧",
            desc: "口渴喝水",
            locationTag: "廚房飲水機旁",
            storyPrompt: "你看見水壺，請說出它的名字，以及為什麼校外教學要帶它。你說：",
            mandarinStoryPrompt: "你看見水壺，請說出它的名字，以及為什麼校外教學要帶它。你說：",
            targetHakka: "𠊎愛帶水壺，嘴渴做得啉水。",
            targetMandarin: "我要帶水壺，口渴可以喝水。",
            keywords: ["水壺", "嘴渴", "啉水"],
            mandarinKeywords: ["我要帶", "水壺", "口渴", "喝水"],
            altKeywords: ["水壺", "喝水", "口渴"],
            npcRole: "媽媽",
            npcAvatar: "👩",
            npcSuccessResponse: "「很好！水壺裝滿溫水放好，走路流汗要多補充水分喔！」",
            mandarinNpcSuccessResponse: "「很好！水壺裝滿溫水放好，走路流汗要多補充水分喔！」",
            npcRetryResponse: "「媽媽提醒：『水壺裝好溫水了嗎？健行走路要多補充水分，快收好跟媽媽說！』」",
            mandarinNpcRetryResponse: "「媽媽提醒：『水壺裝好溫水了嗎？健行走路要多補充水分，快收好跟媽媽說！』」"
          },
          {
            id: "towel",
            name: "毛巾",
            icon: "🧣",
            desc: "流汗擦乾",
            locationTag: "客廳收納櫃前",
            storyPrompt: "你看見乾淨毛巾，請說出它的名字，以及為什麼校外教學要帶它。你說：",
            mandarinStoryPrompt: "你看見乾淨毛巾，請說出它的名字，以及為什麼校外教學要帶它。你說：",
            targetHakka: "𠊎愛帶毛巾，流汗做得拭汗。",
            targetMandarin: "我要帶毛巾，流汗可以擦汗。",
            keywords: ["毛巾", "流汗", "拭汗"],
            mandarinKeywords: ["我要帶", "毛巾", "流汗", "擦汗"],
            altKeywords: ["毛巾", "擦汗", "拭汗"],
            npcRole: "爸爸",
            npcAvatar: "👨",
            npcSuccessResponse: "「很細心！活動後把汗擦乾，比較不會著涼感冒。」",
            mandarinNpcSuccessResponse: "「很細心！活動後把汗擦乾，比較不會著涼感冒。」",
            npcRetryResponse: "「爸爸笑著說：『活動流汗要記得帶毛巾擦乾才不會著涼喔，收好跟爸爸說一聲！』」",
            mandarinNpcRetryResponse: "「爸爸笑著說：『活動流汗要記得帶毛巾擦乾才不會著涼喔，收好跟爸爸說一聲！』」"
          },
          {
            id: "snack",
            name: "點心",
            icon: "🍪",
            desc: "肚子餓補充體力",
            locationTag: "點心餅乾盒前",
            storyPrompt: "你看見美味點心餅乾，請說出它的名字，以及為什麼校外教學要帶它。你說：",
            mandarinStoryPrompt: "你看見美味點心餅乾，請說出它的名字，以及為什麼校外教學要帶它。你說：",
            targetHakka: "𠊎愛帶點心，肚屎枵做得食。",
            targetMandarin: "我要帶點心，肚子餓可以吃。",
            keywords: ["點心", "肚屎枵", "食"],
            mandarinKeywords: ["我要帶", "點心", "肚子餓", "吃"],
            altKeywords: ["點心", "肚子餓", "肚屎枵"],
            npcRole: "爸爸",
            npcAvatar: "👨",
            npcSuccessResponse: "「沒錯！健行休息肚子餓時，可以吃點心補充元氣！」",
            mandarinNpcSuccessResponse: "「沒錯！健行休息肚子餓時，可以吃點心補充元氣！」",
            npcRetryResponse: "「爸爸提醒：『健行如果走累了肚子餓，點心餅乾很重要喔，放進背包跟爸爸說！』」",
            mandarinNpcRetryResponse: "「爸爸提醒：『健行如果走累了肚子餓，點心餅乾很重要喔，放進背包跟爸爸說！』」"
          }
        ],
        nextNodeId: "pack_done"
      },
      pack_done: {
        id: "pack_done",
        title: "任務二：完成整理：玄關出發",
        nodeType: "集合點",
        locationTag: "玄關大門口",
        image: "./assets/field-trip-ready-go.png",
        storyPrompt: "4 樣物品都順利放進背包了！你背起背包走到玄關，精神飽滿地向家人說：",
        mandarinStoryPrompt: "4 樣物品都順利放進背包了！你背起背包走到玄關，精神飽滿地向家人說：",
        targetHakka: "𠊎東西都收好，準備好出發了！",
        targetMandarin: "我東西都收好了，準備好出發了！",
        keywords: ["收好", "出發"],
        mandarinKeywords: ["東西", "收好了", "準備好", "出發"],
        altKeywords: ["準備", "出發", "收好"],
        npcRole: "媽媽",
        npcAvatar: "👩",
        npcSuccessResponse: "「太棒了！裝備齊全，今天校外教學一定會非常順利又開心！」",
        mandarinNpcSuccessResponse: "「太棒了！裝備齊全，今天校外教學一定會非常順利又開心！」",
        npcRetryResponse: "「媽媽在玄關笑著問：『東西都檢查齊全了嗎？準備好我們就要出發囉！』」",
        mandarinNpcRetryResponse: "「媽媽在玄關笑著問：『東西都檢查齊全了嗎？準備好我們就要出發囉！』」",
        nextNodeId: null
      }
    }
  },

  // ----------------------------------------------------
  // 情境 4：搭車問路 (口說分支與指引)
  // ----------------------------------------------------
  bus_directions: {
    id: "bus_directions",
    title: "搭車與街頭問路",
    icon: "🚌",
    bannerImage: "./assets/bus-ask-passerby.png",
    objectFit: "cover",
    objectPosition: "50% 50%",
    objective: "先向路人詢問想去目的地的公車路線，再向巡邏站務員確認搭乘公車；下車後看著公車站路口地圖，回答也想去同一目的地的阿婆。",
    mandarinObjective: "先向路人詢問想去目的地的公車路線，再向巡邏站務員確認搭乘公車；下車後看著公車站路口地圖，回答也想去同一目的地的阿婆。",
    startNodeId: "bus_choose_dest",
    nodes: {
      bus_choose_dest: {
        id: "bus_choose_dest",
        title: "步驟 1：向路人詢問目的地公車路線",
        nodeType: "選擇",
        locationTag: "市區公車站牌",
        image: "./assets/bus-ask-passerby.png",
        objectPosition: "50% 50%",
        storyPrompt: "你站在熱鬧的市區公車站前，看著站牌。請看上方提示，開口向路人詢問你想去的目的地公車路線（如文化園區、學校或圖書館）：",
        mandarinStoryPrompt: "你站在熱鬧的市區公車站前，看著站牌。請看上方提示，開口向路人詢問你想去的目的地公車路線（如文化園區、學校或圖書館）：",
        targetHakka: "請問去文化園區愛坐哪一路公車？",
        targetMandarin: "請問去文化園區要搭哪一路公車？",
        keywords: ["文化園區", "學校", "圖書館"],
        mandarinKeywords: ["文化園區", "學校", "圖書館"],
        altKeywords: ["文化園區", "學校", "圖書館", "公車"],
        npcRole: "路人",
        npcAvatar: "🧍",
        npcSuccessResponse: "「真好！選好目的地了，我跟你說搭哪一路公車喔！」",
        mandarinNpcSuccessResponse: "「真好！選好目的地了，我跟你說搭哪一路公車喔！」",
        npcRetryResponse: "「路人關心問：『同學，你看起來有點困惑，是不是迷路了呀？請問你要去哪裡呢？告訴我我來幫你看公車！』」",
        mandarinNpcRetryResponse: "「路人關心問：『同學，你看起來有點困惑，是不是迷路了呀？請問你要去哪裡呢？告訴我我來幫你看公車！』」",
        choices: [
          {
            id: "culture",
            title: "🏛️ 文化園區",
            sub: "想去文化園區",
            targetBranchId: "bus_ask_culture",
            keywords: ["文化園區", "文化", "園區"],
            mandarinKeywords: ["文化園區", "文化", "園區"],
            guideResponse: "「去文化園區要搭 802 路公車喔！大約再過三分鐘就會進站了，準備好悠遊卡喔！」",
            mandarinGuideResponse: "「去文化園區要搭 802 路公車喔！大約再過三分鐘就會進站了，準備好悠遊卡喔！」"
          },
          {
            id: "school",
            title: "🏫 學校正門",
            sub: "想去學校正門",
            targetBranchId: "bus_ask_school",
            keywords: ["學校", "正門", "學校正門"],
            mandarinKeywords: ["學校", "學校正門", "正門"],
            guideResponse: "「去學校可以搭 615 路公車，請在右側站牌等候喔！」",
            mandarinGuideResponse: "「去學校可以搭 615 路公車，請在右側站牌等候喔！」"
          },
          {
            id: "library",
            title: "📚 市立圖書館",
            sub: "想去市立圖書館",
            targetBranchId: "bus_ask_library",
            keywords: ["圖書館", "市立圖書館"],
            mandarinKeywords: ["圖書館", "市立圖書館"],
            guideResponse: "「去圖書館請搭 306 路公車，很快就到了喔！」",
            mandarinGuideResponse: "「去圖書館請搭 306 路公車，很快就到了喔！」"
          }
        ],
        nextNodeId: "bus_ask_culture"
      },
      bus_ask_culture: {
        id: "bus_ask_culture",
        title: "步驟 2：向巡邏站務員確認 802 公車",
        nodeType: "分支",
        locationTag: "802 站牌前",
        image: "./assets/bus-confirm-attendant.png",
        objectPosition: "50% 50%",
        storyPrompt: "你來到 802 站牌前，向巡邏站務員禮貌確認去文化園區是不是搭 802 公車。你說：",
        mandarinStoryPrompt: "你來到 802 站牌前，向巡邏站務員禮貌確認去文化園區是不是搭 802 公車。你說：",
        targetHakka: "請問站務員，去文化園區係坐 802 公車無？",
        targetMandarin: "請問站務員，文化園區是搭 802 公車嗎？",
        keywords: ["文化園區", "802", "公車"],
        mandarinKeywords: ["文化園區", "802", "公車"],
        altKeywords: ["文化園區", "文化", "802", "八零二", "802路", "公車", "站務員"],
        npcRole: "站務人員",
        npcAvatar: "👮",
        npcSuccessResponse: "「對！802 路公車馬上進站了，請在黃線後方排隊上車喔！」",
        mandarinNpcSuccessResponse: "「對！802 路公車馬上進站了，請在黃線後方排隊上車喔！」",
        npcRetryResponse: "「站務員指著站牌：『同學，去文化園區要搭哪一路公車呢？看清楚站牌再跟我確認一次喔！』」",
        mandarinNpcRetryResponse: "「站務員指著站牌：『同學，去文化園區要搭哪一路公車呢？看清楚站牌再跟我確認一次喔！』」",
        nextNodeId: "bus_arrive"
      },
      bus_ask_school: {
        id: "bus_ask_school",
        title: "步驟 2：向巡邏站務員確認 615 公車",
        nodeType: "分支",
        locationTag: "學校線站牌前",
        image: "./assets/bus-confirm-attendant.png",
        objectPosition: "50% 50%",
        storyPrompt: "你來到 615 站牌前，向巡邏站務員禮貌確認去學校是不是搭 615 公車。你說：",
        mandarinStoryPrompt: "你來到 615 站牌前，向巡邏站務員禮貌確認去學校是不是搭 615 公車。你說：",
        targetHakka: "請問站務員，去學校係坐 615 公車無？",
        targetMandarin: "請問站務員，學校是搭 615 公車嗎？",
        keywords: ["學校", "615", "公車"],
        mandarinKeywords: ["學校", "615", "公車"],
        altKeywords: ["學校", "學校正門", "正門", "615", "六一五", "615路", "公車", "站務員"],
        npcRole: "站務人員",
        npcAvatar: "👮",
        npcSuccessResponse: "「對！615 路公車馬上進站了，請在黃線後方排隊上車喔！」",
        mandarinNpcSuccessResponse: "「對！615 路公車馬上進站了，請在黃線後方排隊上車喔！」",
        npcRetryResponse: "「站務員指著站牌：『同學，去學校要搭哪一路公車呢？看清楚站牌再跟我確認一次喔！』」",
        mandarinNpcRetryResponse: "「站務員指著站牌：『同學，去學校要搭哪一路公車呢？看清楚站牌再跟我確認一次喔！』」",
        nextNodeId: "bus_arrive"
      },
      bus_ask_library: {
        id: "bus_ask_library",
        title: "步驟 2：向巡邏站務員確認 306 公車",
        nodeType: "分支",
        locationTag: "圖書館線站牌前",
        image: "./assets/bus-confirm-attendant.png",
        objectPosition: "50% 50%",
        storyPrompt: "你來到 306 站牌前，向巡邏站務員禮貌確認去圖書館是不是搭 306 公車。你說：",
        mandarinStoryPrompt: "你來到 306 站牌前，向巡邏站務員禮貌確認去圖書館是不是搭 306 公車。你說：",
        targetHakka: "請問站務員，去圖書館係坐 306 公車無？",
        targetMandarin: "請問站務員，圖書館是搭 306 公車嗎？",
        keywords: ["圖書館", "306", "公車"],
        mandarinKeywords: ["圖書館", "306", "公車"],
        altKeywords: ["圖書館", "市立圖書館", "306", "三零六", "306路", "公車", "站務員"],
        npcRole: "站務人員",
        npcAvatar: "👮",
        npcSuccessResponse: "「對！306 路公車馬上進站了，請在黃線後方排隊上車喔！」",
        mandarinNpcSuccessResponse: "「對！306 路公車馬上進站了，請在黃線後方排隊上車喔！」",
        npcRetryResponse: "「站務員指著站牌：『同學，去圖書館要搭哪一路公車呢？看清楚站牌再跟我確認一次喔！』」",
        mandarinNpcRetryResponse: "「站務員指著站牌：『同學，去圖書館要搭哪一路公車呢？看清楚站牌再跟我確認一次喔！』」",
        nextNodeId: "bus_arrive"
      },
      bus_arrive: {
        id: "bus_arrive",
        title: "步驟 3：下車後回答阿婆怎麼走",
        nodeType: "集合點",
        locationTag: "公車站旁十字路口地圖前",
        image: "./assets/bus-help-grandma.png",
        objectPosition: "50% 50%",
        storyPrompt: "下車後，旁邊的阿婆也想去你的目的地，她問你怎麼走。你看著公車站路口地圖回答她。你說：",
        mandarinStoryPrompt: "下車後，旁邊的阿婆也想去你的目的地，她問你怎麼走。你看著公車站路口地圖回答她。你說：",
        targetHakka: "文化園區係向北行一個紅綠燈，再向正手邊行一個紅綠燈，文化園區就喺你个倒手前。",
        targetMandarin: "文化園區是往北方走一個紅綠燈，再往右邊走一個紅綠燈，然後文化園區就在你的左前方。",
        keywords: ["文化園區", "北方", "一個紅綠燈", "右邊", "左前方"],
        mandarinKeywords: ["文化園區", "北方", "一個紅綠燈", "右邊", "左前方"],
        altKeywords: ["文化園區", "文化", "北方", "向北", "往北", "北邊", "直走", "直行", "紅綠燈", "一個紅綠燈", "右邊", "向右", "右轉", "正手", "左前方", "倒手前", "倒手", "左邊"],
        npcRole: "熱心阿婆",
        npcAvatar: "👵",
        npcSuccessResponse: "「哎唷～聽你恁樣講好清楚喔，恁仔細喔小朋友！」",
        mandarinNpcSuccessResponse: "「哎唷～聽你這樣說好清楚喔，謝謝你呀小朋友！」",
        npcRetryResponse: "「阿婆笑等講：『小朋友，阿婆𠊎看得識地圖喔，頭擺有學過指北針！你看地圖右下角个指針，愛向哪一個方向行、去哪位呢？你再看等指針摎阿婆講好無？』」",
        mandarinNpcRetryResponse: "「阿婆笑著說：『小朋友，阿婆我看得懂地圖喔，以前有學過看指北針！你看地圖右下角的指針，從這裡是要往哪一個方向走、去哪裡呢？你再看著指針跟阿婆說一次好嗎？』」",
        nextNodeId: null
      }
    }
  },

  // ----------------------------------------------------
  // 情境 5：健康中心求助
  // ----------------------------------------------------
  health_center: {
    id: "health_center",
    title: "健康中心求助",
    icon: "🏥",
    bannerImage: "./assets/health-room-empty.png",
    objectFit: "cover",
    objectPosition: "50% 50%",
    objective: "看提示口說向護理師清楚描述症狀，配合擦藥休息並禮貌道謝。",
    mandarinObjective: "看提示口說向護理師清楚描述症狀，配合擦藥休息並禮貌道謝。",
    startNodeId: "health_choose_symptom",
    nodes: {
      health_choose_symptom: {
        id: "health_choose_symptom",
        title: "步驟 1：向護理師表達不適與求助",
        nodeType: "選擇",
        locationTag: "學校健康中心諮詢桌",
        image: "./assets/health-room-empty.png",
        characterSprite: "./assets/health-nurse-concerned-sprite.png?v=20260916-nurse-uniform",
        characterSpriteClass: "is-health-nurse-waist",
        storyPrompt: "你走進安靜的健康中心，向護理師禮貌說明身體不舒服或受傷了，請求協助。你說：",
        mandarinStoryPrompt: "你走進安靜的健康中心，向護理師禮貌說明身體不舒服或受傷了，請求協助。你說：",
        targetHakka: "護理師，𠊎身體無爽快，做得摎𠊎看一過無？",
        targetMandarin: "護理師，我身體不太舒服，可以幫我看一下嗎？",
        keywords: ["護理師", "無爽快", "受傷", "看一過"],
        mandarinKeywords: ["護理師", "不舒服", "受傷", "看一下", "不太舒服"],
        altKeywords: ["護理師", "不舒服", "受傷", "無爽快", "跌倒", "痛", "難受", "生病", "看一下", "不適", "發燒", "頭痛", "肚子痛", "擦傷"],
        npcRole: "護理師",
        npcAvatar: "👩‍⚕️",
        npcSuccessResponse: "「同學怎麼啦？哪裡不舒服或哪裡受傷了呢？慢慢跟阿姨說。」",
        mandarinNpcSuccessResponse: "「同學怎麼啦？哪裡不舒服或哪裡受傷了呢？慢慢跟阿姨說。」",
        npcRetryResponse: "「護理師溫柔問：『同學，看你臉色不太對，是哪裡不舒服還是受傷了呢？跟阿姨說，阿姨幫你看！』」",
        mandarinNpcRetryResponse: "「護理師溫柔問：『同學，看你臉色不太對，是哪裡不舒服還是受傷了呢？跟阿姨說，阿姨幫你看！』」",
        choices: [
          {
            id: "head_stomach",
            title: "🤕 身體不舒服",
            sub: "向護理師說明身體不太舒服想求助",
            targetBranchId: "health_symptom_head",
            keywords: ["身體", "無爽快", "不舒服", "看一過"],
            mandarinKeywords: ["身體", "不舒服", "不太舒服", "看一下", "難受"],
            guideResponse: "「同學怎麼啦？別緊張先在椅子上坐好，詳細告訴阿姨是哪裡不舒服呢？」",
            mandarinGuideResponse: "「同學怎麼啦？別緊張先在椅子上坐好，詳細告訴阿姨是哪裡不舒服呢？」"
          },
          {
            id: "scratch",
            title: "🩹 跌倒受傷了",
            sub: "向護理師說明剛剛受傷了想擦藥",
            targetBranchId: "health_symptom_scratch",
            keywords: ["受傷", "跌倒", "痛痛", "擦藥"],
            mandarinKeywords: ["受傷", "跌倒", "受傷了", "破皮", "擦藥"],
            guideResponse: "「哎呀受傷啦！快過來坐好，告訴阿姨剛才是怎麼跌倒、哪裡受傷了？」",
            mandarinGuideResponse: "「哎呀受傷啦！快過來坐好，告訴阿姨剛才是怎麼跌倒、哪裡受傷了？」"
          },
          {
            id: "fever",
            title: "🌡️ 好像發燒了",
            sub: "向護理師說明全身熱熱的想量體溫",
            targetBranchId: "health_symptom_fever",
            keywords: ["身體當燒", "量體溫", "發燒", "發熱"],
            mandarinKeywords: ["量體溫", "發燒", "發熱", "身體很熱", "想量體溫"],
            guideResponse: "「哎呀摸起來有點燙！先坐好，告訴阿姨是頭很燙還是全身沒力氣呢？」",
            mandarinGuideResponse: "「哎呀摸起來有點燙！先坐好，告訴阿姨是頭很燙還是全身沒力氣呢？」"
          }
        ],
        nextNodeId: "health_symptom_head"
      },
      health_symptom_head: {
        id: "health_symptom_head",
        title: "步驟 2：說明頭痛肚子痛",
        nodeType: "分支",
        locationTag: "學校健康中心諮詢桌",
        image: "./assets/health-boy-head-stomach.png",
        storyPrompt: "護理師請你在椅子上坐好後，你詳細向護理師說明頭暈腦脹與肚子陣陣絞痛的情形。你說：",
        mandarinStoryPrompt: "護理師請你在椅子上坐好後，你詳細向護理師說明頭暈腦脹與肚子陣陣絞痛的情形。你說：",
        targetHakka: "𠊎頭那暈暈、肚肚一直陣陣痛。",
        targetMandarin: "我頭很暈、肚子一直陣陣在痛。",
        keywords: ["頭那暈", "肚肚", "痛", "陣陣痛"],
        mandarinKeywords: ["頭很暈", "肚子", "陣陣在痛", "痛", "肚子痛", "頭痛"],
        altKeywords: ["頭暈", "頭痛", "肚子痛", "肚子", "絞痛", "陣陣痛", "肚肚", "頭那暈"],
        npcRole: "護理師",
        npcAvatar: "👩‍⚕️",
        npcSuccessResponse: "「阿姨知道了！先喝杯溫開水，阿姨幫你量耳溫，深呼吸放輕鬆喔。」",
        mandarinNpcSuccessResponse: "「阿姨知道了！先喝杯溫開水，阿姨幫你量耳溫，深呼吸放輕鬆喔。」",
        npcRetryResponse: "「護理師輕聲問：『是頭暈腦脹還是肚子陣陣在痛呢？慢慢跟阿姨說清楚喔。』」",
        mandarinNpcRetryResponse: "「護理師輕聲問：『是頭暈腦脹還是肚子陣陣在痛呢？慢慢跟阿姨說清楚喔。』」",
        nextNodeId: "health_rest"
      },
      health_symptom_scratch: {
        id: "health_symptom_scratch",
        title: "步驟 2：說明跑步跌倒受傷擦傷",
        nodeType: "分支",
        locationTag: "傷口擦藥床位",
        image: "./assets/health-boy-knee-scrape.png",
        storyPrompt: "護理師請你在椅子上坐好後，你向護理師說明剛剛體育課跑步太快跌倒受傷、膝蓋擦傷流血。你說：",
        mandarinStoryPrompt: "護理師請你在椅子上坐好後，你向護理師說明剛剛體育課跑步太快跌倒受傷、膝蓋擦傷流血。你說：",
        targetHakka: "體育課跑太遽跌倒，腳膝頭擦傷流血痛痛。",
        targetMandarin: "體育課跑太快跌倒受傷，膝蓋流血破皮很痛。",
        keywords: ["體育課", "跑太遽", "跌倒", "腳膝頭", "擦傷", "流血", "受傷"],
        mandarinKeywords: ["體育課", "跑太快", "跌倒", "受傷", "膝蓋", "流血", "破皮", "很痛"],
        altKeywords: ["體育課", "跑太快", "跌倒", "受傷", "膝蓋", "流血", "破皮", "擦傷", "痛", "腳痛"],
        npcRole: "護理師",
        npcAvatar: "👩‍⚕️",
        npcSuccessResponse: "「不要緊喔！阿姨幫你擦消炎藥、貼上透氣紗布，很快就不會痛了。」",
        mandarinNpcSuccessResponse: "「不要緊喔！阿姨幫你擦消炎藥、貼上透氣紗布，很快就不會痛了。」",
        npcRetryResponse: "「護理師看著你的膝蓋：『哎呀膝蓋紅紅破皮了，剛剛體育課是怎麼受傷跌倒的呢？跟阿姨說。』」",
        mandarinNpcRetryResponse: "「護理師看著你的膝蓋：『哎呀膝蓋紅紅破皮了，剛剛體育課是怎麼受傷跌倒的呢？跟阿姨說。』」",
        nextNodeId: "health_rest"
      },
      health_symptom_fever: {
        id: "health_symptom_fever",
        title: "步驟 2：說明身體發熱無力",
        nodeType: "分支",
        locationTag: "量體溫區",
        image: "./assets/health-boy-fever.png",
        storyPrompt: "護理師請你在椅子上坐好後，你向護理師詳細說明頭昏腦脹、全身發熱無力的情形。你說：",
        mandarinStoryPrompt: "護理師請你在椅子上坐好後，你向護理師詳細說明頭昏腦脹、全身發熱無力的情形。你說：",
        targetHakka: "𠊎身體當燒，全身無麼个力。",
        targetMandarin: "我身體熱熱的，全身都沒有力氣。",
        keywords: ["身體", "當燒", "全身", "無力"],
        mandarinKeywords: ["身體", "熱熱的", "很熱", "全身", "沒有力氣", "發燒"],
        altKeywords: ["發熱", "發燒", "很熱", "身體熱", "沒力", "全身無力", "當燒", "身體"],
        npcRole: "護理師",
        npcAvatar: "👩‍⚕️",
        npcSuccessResponse: "「阿姨先幫你量耳溫，稍微有一點發燒，先在椅子上喝溫水休息一節課喔。」",
        mandarinNpcSuccessResponse: "「阿姨先幫你量耳溫，稍微有一點發燒，先在椅子上喝溫水休息一節課喔。」",
        npcRetryResponse: "「護理師摸摸你的額頭：『額頭稍微有點溫溫的，身體還有哪裡覺得熱熱沒力氣嗎？』」",
        mandarinNpcRetryResponse: "「護理師摸摸你的額頭：『額頭稍微有點溫溫的，身體還有哪裡覺得熱熱沒力氣嗎？』」",
        nextNodeId: "health_rest"
      },
      health_rest: {
        id: "health_rest",
        title: "步驟 3：承諾休息叮嚀與致謝",
        nodeType: "集合點",
        locationTag: "健康中心休息區",
        image: "./assets/health-rest-bed.png",
        storyPrompt: "護理師細心幫你照護完後，叮嚀你今天不要勉強運動，要多喝溫水好好休息。你答應她並道謝。你說：",
        mandarinStoryPrompt: "護理師細心幫你照護完後，叮嚀你今天不要勉強運動，要多喝溫水好好休息。你答應她並道謝。你說：",
        targetHakka: "𠊎會多啉溫水、好好歇睏，恁仔細護理師！",
        targetMandarin: "我會多喝溫水、好好休息，謝謝護理師！",
        keywords: ["多啉水", "歇睏", "恁仔細", "護理師"],
        mandarinKeywords: ["多喝水", "好好休息", "謝謝護理師", "謝謝"],
        altKeywords: ["喝水", "休息", "謝謝", "多啉水", "護理師"],
        npcRole: "護理師",
        npcAvatar: "👩‍⚕️",
        npcSuccessResponse: "「真懂事！先在病床上躺著休息一節課，身體很快就會恢復元氣囉！」",
        mandarinNpcSuccessResponse: "「真懂事！先在病床上躺著休息一節課，身體很快就會恢復元氣囉！」",
        npcRetryResponse: "「護理師叮嚀：『阿姨幫你擦好藥了，今天不要劇烈運動，要答應阿姨多喝溫水好好休息喔！』」",
        mandarinNpcRetryResponse: "「護理師叮嚀：『阿姨幫你擦好藥了，今天不要劇烈運動，要答應阿姨多喝溫水好好休息喔！』」",
        nextNodeId: null
      }
    }
  },

  // ----------------------------------------------------
  // 情境 6：今日天氣與穿搭
  // ----------------------------------------------------
  weather_outfit: {
    id: "weather_outfit",
    title: "今日天氣與出門穿搭",
    icon: "🌦️",
    bannerImage: "./assets/weather-choose-clothes.png",
    objectFit: "cover",
    objectPosition: "50% 30%",
    objective: "早晨拉開窗簾觀察天氣，向媽媽回報天氣狀況；再走到衣櫃挑選出合適的防護穿搭，最後整裝出門！",
    mandarinObjective: "早晨拉開窗簾觀察天氣，向媽媽回報天氣狀況；再走到衣櫃挑選出合適的防護穿搭，最後整裝出門！",
    startNodeId: "weather_choose_type",
    nodes: {
      weather_choose_type: {
        id: "weather_choose_type",
        title: "步驟 1：拉開窗簾觀察回報天氣",
        nodeType: "選擇",
        locationTag: "臥室窗戶前",
        image: "./assets/weather-choose-clothes.png",
        objectPosition: "50% 30%",
        storyPrompt: "清晨起床拉開窗簾看天氣，看見外頭烏雲密布、正在下大雨。媽媽在廚房問你：「今天外面天氣看起來怎麼樣呀？」你回答她：",
        mandarinStoryPrompt: "清晨起床拉開窗簾看天氣，看見外頭烏雲密布、正在下大雨。媽媽在廚房問你：「今天外面天氣看起來怎麼樣呀？」你回答她：",
        targetHakka: "今晡日落大雨，外背溼漉漉！",
        targetMandarin: "今天在下大雨，外面濕漉漉！",
        keywords: ["今晡日", "落大雨", "溼漉漉"],
        mandarinKeywords: ["今天", "下大雨", "濕漉漉"],
        altKeywords: ["下雨", "落雨", "下大雨", "落大雨", "陰天", "濕漉漉", "溼漉漉", "雨天"],
        npcRole: "媽媽",
        npcAvatar: "👩",
        npcSuccessResponse: "「哎呀真的在下雨呢！那去學校要準備合適的衣服跟雨具喔！」",
        mandarinNpcSuccessResponse: "「哎呀真的在下雨呢！那去學校要準備合適的衣服跟雨具喔！」",
        npcRetryResponse: "「媽媽在廚房問：『拉開窗簾看看窗外，今天是什麼天氣呀？』」",
        mandarinNpcRetryResponse: "「媽媽在廚房問：『拉開窗簾看看窗外，今天是什麼天氣呀？』」",
        choices: [
          {
            id: "rain",
            title: "🌧️ 陰雨綿綿 (下大雨)",
            sub: "天空飄雨、地面濕漉漉",
            targetBranchId: "weather_outfit_rain",
            keywords: ["落大雨", "落雨", "下雨", "下大雨", "溼漉漉", "濕漉漉"],
            mandarinKeywords: ["下雨", "雨天", "下大雨", "濕漉漉", "陰雨", "落雨"],
            guideResponse: "「哎呀真的在下雨呢！那去學校要準備合適的衣服跟雨具喔！」",
            mandarinGuideResponse: "「哎呀真的在下雨呢！那去學校要準備合適的衣服跟雨具喔！」"
          },
          {
            id: "hot",
            title: "☀️ 炎熱大晴天 (出大太陽)",
            sub: "豔陽高照、氣溫好熱",
            targetBranchId: "weather_outfit_hot",
            keywords: ["出大日頭", "日頭", "大太陽", "太陽", "當熱", "好熱", "很熱"],
            mandarinKeywords: ["出大太陽", "大太陽", "太陽", "好熱", "很熱", "大熱天", "晴天"],
            guideResponse: "「哇，太陽好大好熱呢！去學校要挑選清涼透氣的衣服跟防曬喔！」",
            mandarinGuideResponse: "「哇，太陽好大好熱呢！去學校要挑選清涼透氣的衣服跟防曬喔！」"
          },
          {
            id: "cold",
            title: "❄️ 寒冷冬日 (寒流來襲)",
            sub: "北風呼呼、天氣好冷",
            targetBranchId: "weather_outfit_cold",
            keywords: ["寒流", "天時當冷", "當冷", "吹大風", "風很大", "很冷", "天冷", "風冷", "好冷"],
            mandarinKeywords: ["寒流", "風很大", "很冷", "天氣很冷", "天冷", "冬天", "好冷", "風好大", "風很冷", "風看起來好冷", "外面很冷", "外面的風", "冷風"],
            altKeywords: ["寒流", "天冷", "很冷", "當冷", "大風", "吹大風", "冷氣團", "冬天", "好冷", "風好大", "風吹", "外面的風", "看起來好冷", "很冷喔", "好冷喔", "風很冷"],
            guideResponse: "「天哪，冷氣團真的來了！去衣櫃拿保暖的厚衣服跟配件穿上喔！」",
            mandarinGuideResponse: "「天哪，冷氣團真的來了！去衣櫃拿保暖的厚衣服跟配件穿上喔！」"
          }
        ],
        nextNodeId: "weather_outfit_rain"
      },
      weather_outfit_rain: {
        id: "weather_outfit_rain",
        title: "步驟 2：走到衣櫃挑選防雨穿搭",
        nodeType: "分支",
        locationTag: "臥室衣櫃前（防雨穿搭）",
        image: "./assets/weather-rain-action.png",
        objectPosition: "50% 30%",
        storyPrompt: "知道今天會下大雨後，你走到衣櫃前挑選今天上學要穿戴的防雨裝備。你對媽媽說：",
        mandarinStoryPrompt: "知道今天會下大雨後，你走到衣櫃前挑選今天上學要穿戴的防雨裝備。你對媽媽說：",
        targetHakka: "𠊎愛著雨衣，手拿遮仔！",
        targetMandarin: "我要穿上雨衣，手上帶雨傘！",
        keywords: ["雨衣", "遮仔"],
        mandarinKeywords: ["雨衣", "雨傘"],
        altKeywords: ["下雨", "雨傘", "雨衣", "遮仔", "著雨衣", "帶雨傘", "拿遮仔", "穿雨衣"],
        npcRole: "媽媽",
        npcAvatar: "👩",
        npcSuccessResponse: "「太棒了！穿好雨衣又帶了雨傘，下雨天就不怕淋成落湯雞了！」",
        mandarinNpcSuccessResponse: "「太棒了！穿好雨衣又帶了雨傘，下雨天就不怕淋成落湯雞了！」",
        npcRetryResponse: "「媽媽看著你問：『外面在下大雨呢，去學校要穿戴什麼防雨裝備才不會淋濕呀？』」",
        mandarinNpcRetryResponse: "「媽媽看著你問：『外面在下大雨呢，去學校要穿戴什麼防雨裝備才不會淋濕呀？』」",
        nextNodeId: "weather_done"
      },
      weather_outfit_hot: {
        id: "weather_outfit_hot",
        title: "步驟 2：走到衣櫃挑選防曬穿搭",
        nodeType: "分支",
        locationTag: "臥室衣櫃前（防曬穿搭）",
        image: "./assets/weather-hot-action.png",
        objectPosition: "50% 30%",
        storyPrompt: "知道今天出大太陽很熱後，你走到衣櫃前挑選今天上學要穿戴的清涼防曬裝備。你對媽媽說：",
        mandarinStoryPrompt: "知道今天出大太陽很熱後，你走到衣櫃前挑選今天上學要穿戴的清涼防曬裝備。你對媽媽說：",
        targetHakka: "𠊎愛著短衫短褲，戴等遮陽帽仔！",
        targetMandarin: "我要穿短袖短褲，戴著遮陽帽！",
        keywords: ["短衫", "短褲", "遮陽帽仔"],
        mandarinKeywords: ["短袖", "短褲", "遮陽帽"],
        altKeywords: ["很熱", "短袖", "短褲", "薄衫", "帽子", "遮陽帽", "帽仔", "防曬"],
        npcRole: "媽媽",
        npcAvatar: "👩",
        npcSuccessResponse: "「真聰明！穿清涼短袖短褲、戴上遮陽帽，這樣在學校就不怕曬傷中暑了！」",
        mandarinNpcSuccessResponse: "「真聰明！穿清涼短袖短褲、戴上遮陽帽，這樣在學校就不怕曬傷中暑了！」",
        npcRetryResponse: "「媽媽看著你問：『今天太陽那麼烈，出門要穿什麼清涼防曬的衣服呀？』」",
        mandarinNpcRetryResponse: "「媽媽看著你問：『今天太陽那麼烈，出門要穿什麼清涼防曬的衣服呀？』」",
        nextNodeId: "weather_done"
      },
      weather_outfit_cold: {
        id: "weather_outfit_cold",
        title: "步驟 2：走到衣櫃挑選保暖穿搭",
        nodeType: "分支",
        locationTag: "臥室衣櫃前（保暖穿搭）",
        image: "./assets/weather-cold-action.png",
        objectPosition: "50% 30%",
        storyPrompt: "知道今天寒流很冷後，你走到衣櫃前挑選今天上學要穿戴的保暖冬裝。你對媽媽說：",
        mandarinStoryPrompt: "知道今天寒流很冷後，你走到衣櫃前挑選今天上學要穿戴的保暖冬裝。你對媽媽說：",
        targetHakka: "𠊎愛著厚大衫，圍等暖暖个圍巾！",
        targetMandarin: "我要穿上厚大衣，圍著保暖的圍巾！",
        keywords: ["厚大衫", "大衫", "圍巾"],
        mandarinKeywords: ["厚大衣", "大衣", "圍巾"],
        altKeywords: ["很冷", "厚大衫", "大衫", "大衣", "圍巾", "毛衣", "羽絨衣", "厚外套", "保暖", "穿暖", "著暖"],
        npcRole: "媽媽",
        npcAvatar: "👩",
        npcSuccessResponse: "「真貼心！穿厚大衣又圍上毛圍巾，這樣在路上吹風就不會著涼感冒了！」",
        mandarinNpcSuccessResponse: "「真貼心！穿厚大衣又圍上毛圍巾，這樣在路上吹風就不會著涼感冒了！」",
        npcRetryResponse: "「媽媽摸摸你的手問：『今天寒流只有十度呢，快去拿厚大衣跟圍巾穿暖喔！』」",
        mandarinNpcRetryResponse: "「媽媽摸摸你的手問：『今天寒流只有十度呢，快去拿厚大衣跟圍巾穿暖喔！』」",
        nextNodeId: "weather_done"
      },
      weather_done: {
        id: "weather_done",
        title: "步驟 3：玄關整裝出發",
        nodeType: "集合點",
        locationTag: "玄關大門口",
        objectPosition: "50% 30%",
        storyPrompt: "穿戴好合適的衣物裝備後，你站在玄關門口精神飽滿地向媽媽道別準備出發。你說：",
        mandarinStoryPrompt: "穿戴好合適的衣物裝備後，你站在玄關門口精神飽滿地向媽媽道別準備出發。你說：",
        targetHakka: "𠊎都準備好了，出門行囉，媽媽再見！",
        targetMandarin: "我都準備好了，出門走囉，媽媽再見！",
        keywords: ["準備好", "出門", "再見"],
        mandarinKeywords: ["準備好了", "出門走囉", "再見"],
        altKeywords: ["準備", "出門", "準備好了", "再見", "出門行囉"],
        npcRole: "媽媽",
        npcAvatar: "👩",
        npcSuccessResponse: "「太棒了！路上小心走，專心上課，祝你有美好的一天！」",
        mandarinNpcSuccessResponse: "「太棒了！路上小心走，專心上課，祝你有美好的一天！」",
        npcRetryResponse: "「媽媽在玄關笑著問：『東西跟衣服都穿戴整齊、準備好出發了嗎？』」",
        mandarinNpcRetryResponse: "「媽媽在玄關笑著問：『東西跟衣服都穿戴整齊、準備好出發了嗎？』」",
        nextNodeId: null
      }
    }
  }
};

// ==========================================
// 2.1 今日天氣情境隨機預設組 (Weather Random Presets: 寒冷、夏天、下雨)
// ==========================================
const WEATHER_RANDOM_PRESETS = {
  rain: {
    id: "rain",
    weatherName: "陰雨綿綿 (下雨天)",
    weatherIcon: "🌧️",
    badgeLabel: "🌧️ 今日天氣：陰雨綿綿",
    targetBranchId: "weather_outfit_rain",
    image: "./assets/weather-observe-rain.png",
    locationTag: "臥室窗戶前（🌧️ 正在下雨）",
    storyPrompt: "清晨起床拉開窗簾看天氣，看見外頭烏雲密布、正在下大雨。媽媽在廚房問你：「今天外面天氣看起來怎麼樣呀？」你回答她：",
    mandarinStoryPrompt: "清晨起床拉開窗簾看天氣，看見外頭烏雲密布、正在下大雨。媽媽在廚房問你：「今天外面天氣看起來怎麼樣呀？」你回答她：",
    targetHakka: "今晡日落大雨，外背溼漉漉！",
    targetMandarin: "今天在下大雨，外面濕漉漉！",
    keywords: ["今晡日", "落大雨", "溼漉漉"],
    mandarinKeywords: ["今天", "下大雨", "濕漉漉"],
    altKeywords: ["下雨", "落雨", "下大雨", "落大雨", "陰天", "濕漉漉", "溼漉漉", "雨天"]
  },
  hot: {
    id: "hot",
    weatherName: "炎熱大晴天 (夏天/大熱天)",
    weatherIcon: "☀️",
    badgeLabel: "☀️ 今日天氣：炎熱大晴天",
    targetBranchId: "weather_outfit_hot",
    image: "./assets/weather-observe-hot.png",
    locationTag: "臥室窗戶前（☀️ 豔陽高照）",
    storyPrompt: "清晨起床拉開窗簾看天氣，看見外頭豔陽高照、出大太陽。媽媽在廚房問你：「今天外面天氣看起來怎麼樣呀？」你回答她：",
    mandarinStoryPrompt: "清晨起床拉開窗簾看天氣，看見外頭豔陽高照、出大太陽。媽媽在廚房問你：「今天外面天氣看起來怎麼樣呀？」你回答她：",
    targetHakka: "今晡日出大日頭，天時當熱！",
    targetMandarin: "今天出大太陽，天氣好熱喔！",
    keywords: ["出大日頭", "天時", "當熱"],
    mandarinKeywords: ["出大太陽", "天氣", "好熱"],
    altKeywords: ["太陽", "日頭", "大太陽", "出太陽", "大晴天", "晴天", "好熱", "很熱", "當熱", "炎熱"]
  },
  cold: {
    id: "cold",
    weatherName: "寒冷冬日 (寒流來襲/冬天)",
    weatherIcon: "❄️",
    badgeLabel: "❄️ 今日天氣：寒冷冬日",
    targetBranchId: "weather_outfit_cold",
    image: "./assets/weather-observe-cold.png",
    locationTag: "臥室窗戶前（❄️ 寒流來襲）",
    storyPrompt: "清晨起床拉開窗簾看天氣，看見外頭北風呼呼吹、寒流來襲。媽媽在廚房問你：「今天外面天氣看起來怎麼樣呀？」你回答她：",
    mandarinStoryPrompt: "清晨起床拉開窗簾看天氣，看見外頭北風呼呼吹、寒流來襲。媽媽在廚房問你：「今天外面天氣看起來怎麼樣呀？」你回答她：",
    targetHakka: "今晡日寒流來，天時當冷吹大風！",
    targetMandarin: "今天寒流來了，外面風很大很冷！",
    keywords: ["寒流", "天時", "當冷", "吹大風"],
    mandarinKeywords: ["寒流", "風很大", "很冷"],
    altKeywords: ["寒流", "天冷", "很冷", "當冷", "大風", "吹大風", "冷氣團", "冬天"]
  }
};

// ==========================================
// 2.2 搭車問路第三步路線導航對照組 (Bus Arrive Route Presets: 文化園區、學校正門、市立圖書館)
// ==========================================
const BUS_ARRIVE_ROUTES = {
  bus_ask_culture: {
    id: "bus_ask_culture",
    destName: "文化園區",
    storyPrompt: "下車後走到十字路口，旁邊的阿婆想去文化園區，她問你怎麼走。你看著路口地圖（文化園區在右上方）回答她。你說：",
    mandarinStoryPrompt: "下車後走到十字路口，旁邊的阿婆想去文化園區，她問你怎麼走。你看著路口地圖（文化園區在右上方）回答她。你說：",
    targetHakka: "文化園區係向北行一個紅綠燈，再向正手邊行一個紅綠燈，文化園區就喺你个倒手前。",
    targetMandarin: "文化園區是往北方走一個紅綠燈，再往右邊走一個紅綠燈，然後文化園區就在你的左前方。",
    keywords: ["文化園區", "北方", "一個紅綠燈", "右邊", "左前方"],
    mandarinKeywords: ["文化園區", "北方", "一個紅綠燈", "右邊", "左前方"],
    altKeywords: ["文化園區", "文化", "北方", "向北", "往北", "北邊", "直走", "直行", "紅綠燈", "一個紅綠燈", "右邊", "向右", "右轉", "正手", "左前方", "倒手前", "倒手", "左邊"]
  },
  bus_ask_school: {
    id: "bus_ask_school",
    destName: "學校正門",
    storyPrompt: "下車後走到十字路口，旁邊的阿婆想去學校正門，她問你怎麼走。你看著路口地圖（學校正門在左上方）回答她。你說：",
    mandarinStoryPrompt: "下車後走到十字路口，旁邊的阿婆想去學校正門，她問你怎麼走。你看著路口地圖（學校正門在左上方）回答她。你說：",
    targetHakka: "學校正門係向北直直行一個紅綠燈，再越倒手行一個紅綠燈，學校正門就喺你个正手前。",
    targetMandarin: "學校正門是往北邊直走一個紅綠燈，再往左轉走一個紅綠燈，學校的正門就在你的右前方。",
    keywords: ["學校正門", "北邊", "直走", "一個紅綠燈", "左轉", "右前方"],
    mandarinKeywords: ["學校正門", "北邊", "直走", "一個紅綠燈", "左轉", "右前方"],
    altKeywords: ["學校正門", "學校", "正門", "北邊", "北方", "向北", "往北", "直走", "直直行", "直行", "紅綠燈", "一個紅綠燈", "左轉", "越倒手", "倒手", "左邊", "右前方", "正手前", "正手", "右邊"]
  },
  bus_ask_library: {
    id: "bus_ask_library",
    destName: "市立圖書館",
    storyPrompt: "下車後走到十字路口，旁邊的阿婆想去市立圖書館，她問你怎麼走。你看著路口地圖（市立圖書館在右下方）回答她。你說：",
    mandarinStoryPrompt: "下車後走到十字路口，旁邊的阿婆想去市立圖書館，她問你怎麼走。你看著路口地圖（市立圖書館在右下方）回答她。你說：",
    targetHakka: "市立圖書館請你向東行兩個紅綠燈，市立圖書館就喺你个正手前。",
    targetMandarin: "市立圖書館請你往東方走兩個紅綠燈，市立圖書館就在你的右前方。",
    keywords: ["市立圖書館", "東方", "兩個紅綠燈", "右前方"],
    mandarinKeywords: ["市立圖書館", "東方", "兩個紅綠燈", "右前方"],
    altKeywords: ["市立圖書館", "圖書館", "東方", "向東", "往東", "直走", "直行", "紅綠燈", "兩個紅綠燈", "右前方", "正手前", "正手", "右手邊", "正手邊"]
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
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalTranscript = "";
      let currentFullText = "";
      let hasFinished = false;

      const finishOnce = () => {
        if (hasFinished) return;
        hasFinished = true;
        const text = (finalTranscript || currentFullText || "").trim();
        if (onFinal) onFinal(text);
      };

      recognition.onresult = (event) => {
        let interim = "";
        let final = "";
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        finalTranscript = final;
        currentFullText = (final + interim).trim();
        if (onInterim) onInterim(currentFullText);
      };

      recognition.onerror = (event) => {
        if (event.error === "no-speech") return;
        if (onError) onError(event.error === "not-allowed" ? "請允許麥克風權限以進行錄音。" : `辨識提示：${event.error}`);
      };

      recognition.onend = () => {
        finishOnce();
      };

      recognition.start();
      return {
        stop: () => {
          try { recognition.stop(); } catch (e) {}
          setTimeout(() => finishOnce(), 120);
        }
      };
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
    { hakka: "客家小炒", mandarin: "客家小炒" },
    { hakka: "係坐", mandarin: "是搭" },
    { hakka: "八零二", mandarin: "802" },
    { hakka: "六一五", mandarin: "615" },
    { hakka: "三零六", mandarin: "306" }
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
    provider: "vercel_api", // 支援後端 /api/judge 與 Vercel 雲端評估
    model: "claude-haiku-4-5-20251001",
    apiEndpoint: (typeof location !== "undefined" && (location.hostname.endsWith("github.io") || location.protocol === "file:" || (location.port && location.port !== "3000")))
      ? "https://speaking-scenarios-v2.vercel.app/api/judge"
      : "/api/judge",
    apiKey: (typeof localStorage !== "undefined" ? localStorage.getItem("llm_api_key") : "") || (typeof window !== "undefined" ? window.LLM_API_KEY : "") || "",
    timeout: 12000
  };

  /**
   * 安全解析 LLM 回傳之 JSON 字串 (去除 markdown 與思考標籤)
   */
  static extractJson(text) {
    if (!text || typeof text !== "string") return null;
    let clean = text.trim();
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
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

  /**
   * 建構發送給 LLM 的 System Prompt (注入情境邊界、封閉意圖與 NPC 人設)
   */
  static buildSystemPrompt(nodeConfig, scenario, isMandarin = false) {
    const rolePersonas = {
      "售票員": "親切專業的動物園售票專員，負責核對購票人數與發售票券，堅守票務規定但態度客氣熱情。",
      "驗票志工": "慈祥親切的動物園門口志工老奶奶，重視禮貌與問候，耐心回答遊客問題並引導安全入園。",
      "園區導覽員": "熱心博學的動物園導覽員，熟悉各展區位置、動物習性與最佳參觀路線。",
      "同學阿明": "活潑好奇的同班同學，喜歡熱情分享在展區觀察到的動物特徵，愛開玩笑。",
      "老師": "溫和關心的帶隊老師，清點人數、回答學生疑問並提醒集合時間。",
      "帶隊老師": "溫和關心的帶隊老師，清點人數、回答學生疑問並提醒集合時間。",
      "媽媽": "細心叮嚀的母親，關心生活起居、天氣穿搭與物品齊全度，適時提醒只能帶必備品。",
      "爸爸": "幽默溫暖的父親，提醒補充水分、戶外防曬，幽默應對孩子的玩笑。",
      "阿公": "慈祥和藹的長輩，提醒天冷注意保暖穿搭，疼愛孫子但堅持穿暖出門。",
      "站務人員": "清楚沉穩的公車調度站務員，明確指引搭乘路線與候車月台，依規定提醒票價與搭乘禮儀。",
      "公車司機": "專注安全的公車駕駛，提醒上下車刷卡與握好扶手，親切回答路線問題。",
      "路人": "熱心親切的市區路人，看到學生在公車站牌前猶豫張望，主動以關心、幫助的語氣詢問是不是迷路或找不到公車，熱心指引協助。",
      "熱心阿婆": "住在附近的親切老奶奶，以清晰的地標方向指引路人，熱情愛寒暄。",
      "護理師": "溫柔耐心的學校保健室阿姨，仔細診察學生身體不適並給予照護衛教，溫和化解學生的小藉口。",
      "家人": "溫馨關懷的家庭長輩，提醒天冷天熱穿搭並祝出門順利。",
      "小吃店老闆": "熱情大方的客家小吃店掌櫃，招呼客人並推薦招牌菜與傳統美食，小本經營幽默回絕殺價與折扣。",
      "廚房阿姨": "手藝俐落的廚房掌杓阿姨，細心紀錄客製化飲食要求，親切安撫特殊要求。",
      "服務生": "動作迅速有禮的餐飲服務員，介紹客家飲品與特色小炒，迅速應對客人加點。"
    };

    const currentPersona = rolePersonas[nodeConfig.npcRole] || "熱情友善的情境對話 NPC 角色";
    const coreKeywordsStr = (nodeConfig?.nodeType === "選擇" && nodeConfig?.choices)
      ? nodeConfig.choices.map(c => `${c.title}: [${(isMandarin ? (c.mandarinKeywords || c.keywords || []) : (c.keywords || [])).join(", ")}]`).join("； ")
      : ((isMandarin ? (nodeConfig?.mandarinKeywords || nodeConfig?.keywords || []) : (nodeConfig?.keywords || [])).join("、") || "無");

    return [
      `你是一位極其專業、具備深度語意推理能力與真實情境互動感的 AI 角色扮演考官兼情境引導助教（LLM-as-a-Judge & Roleplayer）。`,
      `【情境主題】：${scenario?.title || ""}（情境目標：${(isMandarin ? scenario?.mandarinObjective : scenario?.objective) || scenario?.objective || ""}）`,
      `【當前關卡】：${nodeConfig?.title || ""}（地點：${nodeConfig?.locationTag || ""}，類型：${nodeConfig?.nodeType || "主線"}）`,
      `【NPC 角色人設】：你將扮演「${nodeConfig?.npcRole || "NPC"}」— ${currentPersona}`,
      `【本關通關任務目標】：`,
      `   - 標準目標句參考：${(isMandarin ? nodeConfig?.targetMandarin : nodeConfig?.targetHakka) || "（自由表達/分支選擇）"}`,
      `   - 參考核心概念詞：${coreKeywordsStr}`,
      ``,
      `【語言模式】：${isMandarin ? "華語（國語）模式" : "客語口說模式（含客轉華語意譯）"}。`,
      ``,
      `【核心評估與 NPC 角色對話互動邏輯（極重要）】：`,
      `1. 「以核心任務達成 (Quest Goal) 為通過依助」：`,
      `   - 每個關卡都有核心任務目標。學生只要在發言中「實質達成該核心任務」，即可判定通過（isMatch: true）！`,
      `   - 【各情境通關判定標準】：`,
      `     * 【動物園第 1 關 (購票)】：核心目標是說出買學生票且數量為 3 位（3張）。`,
      `     * 【動物園第 2 關 (驗票)】：核心目標是出示門票並表達禮貌道謝（謝謝/恁仔細）。`,
      `     * 【動物園第 3 關 (問路選擇)】：核心目標是明確詢問想去的展區（大象/獅子/蛇）怎麼走。`,
      `     * 【動物園第 6 關 (出口集合清點人數)】：核心目標是向帶隊老師報告「大家都到齊了/我們都參觀好了準備出發」。【極關鍵審核鐵律】：若學生發言表達「還有人沒到」、「還有人在上廁所」、「少了一個人/少人」、「還沒到齊/還在等某人」等缺人狀況，代表全體尚未齊全，【一律嚴格判定未通過 (isMatch: false)】！帶隊老師必須站在老師角色親切回答：『那我們再等一下下，等全部人都到齊、都參觀完了之後再出發喔！』`,
      `     * 【客家小吃店第 1 關 (點主食)】：核心目標是點出「客家傳統小吃麵店/熱炒店」常態菜單上有的熱食主餐：`,
      `       - 【店內有賣的菜色 (通過 isMatch: true)】：湯粄條、炒粄條、乾粄條、米苔目、客家小炒、薑絲大腸、鹹豬肉、福菜肉片湯、客家鹹湯圓、梅干扣肉等。`,
      `       - 【店內沒賣的節慶米食/其他食物 (嚴格未通過 isMatch: false)】：若學生點了紅龜粿、草仔粿、艾草粄、肉粽/粽子、發粄、年糕、牛汶水，或是牛排、漢堡、披薩、壽司等非麵店常態小吃，【一律嚴格判定未通過 (isMatch: false)】！老闆必須站在熱情掌櫃角色親切幽默回絕並引導：『喔！同學，我們是現煮客家小炒麵店，沒有賣紅龜粿/肉粽這種節慶點心啦！要不要來一碗我們招牌的現煮湯粄條或客家小炒呢？』`,
      `       - 【只說量詞或問推薦 (未通過 isMatch: false)】：若只說『我要一碗』、『老闆有沒有特色菜』但未指明菜名，判定 isMatch: false，老闆熱情推薦招牌菜色。`,
      `     * 【客家小吃店第 2 關 (客製需求)】：核心目標是交代口味偏好（不要放香菜/甜一點/少油少鹽等）。`,
      `     * 【客家小吃店第 3 關 (加點評價)】：核心目標是加點飲品或稱讚美味。`,
      `     * 【健康中心第 1 關 (向護理師初步求助)】：核心目標是向護理師禮貌說明身體不舒服或受傷了請求看診（說出不舒服/無爽快/受傷/跌倒均判定通過）。護理師親切關心詢問（注意畫面為站立諮詢，嚴禁說『坐下來』）。`,
      `     * 【健康中心第 2 關 (詳細說明具體症狀)】：核心目標是詳細描述具體病徵與原因。特別注意：分支 A (頭痛肚子痛 health_symptom_head) 的畫面插圖是學生「坐在椅子上」，護理師台詞【只能回『先坐著休息（先坐好）』，阿姨幫你量體溫、倒一杯溫開水】，【嚴禁出現『去病床上躺著』或『躺在病床上』】！`,
      `     * 【健康中心第 3 關 (休息道謝)】：核心目標是答應遵照醫囑多喝溫水好好休息並禮貌道謝。`,
      `     * 【搭車問路第 1 關 (向路人詢問目的地公車路線)】：核心目標是學生向公車站旁的路人開口詢問想去的目的地（文化園區/學校/圖書館）要搭哪一路公車。路人 NPC 必須扮演「熱心助人的市民」（看到學生在站牌前猶豫張望，路人事前並不知道學生要去哪裡，應以親切關心的口吻詢問：『同學，你看起來有點困惑，是不是迷路了呀？請問你要去哪裡呢？跟我說我幫你看公車！』，嚴禁像導遊般說『我可以幫你介紹公車路線』）。`,
      `     * 【搭車問路第 3 關 (看地圖向阿婆指引路線)】：核心目標是學生看著地圖向阿婆清楚指引路線走法（包含方向、紅綠燈數量、轉彎與目的地相對位置）：`,
      `       - 🏛️ 文化園區 (802)：往北方走一個紅綠燈，再往右邊走一個紅綠燈，文化園區就在左前方。`,
      `       - 🏫 學校正門 (615)：往北邊直走一個紅綠燈，再往左轉走一個紅綠燈，學校的正門就在右前方。`,
      `       - 📚 市立圖書館 (306)：往東方走兩個紅綠燈，市立圖書館就在右前方。`,
      `       - 【通過標準 (isMatch: true)】：只要學生說出目的地名稱且走法方向正確（包含說出「向北/往北/向東」，或是清楚正確的「直走」搭配正確轉彎與紅綠燈數量），均判定通過！阿婆親切感謝小朋友（例如：『哇，這樣聽你說的好清楚喔，謝謝你小朋友！』）。`,
      `       - 【特殊情況 (若學生只說要帶阿婆一起走)】：若學生只說『我跟你一起走』但未說明路線，判定 isMatch: false，阿婆誇獎懂事並引導學生教阿婆（例如：『哎唷～你真懂事、還這麼貼心想陪阿婆走！不過阿婆也想學看地圖，你指著地圖跟我說說看怎麼走，我學起來下次就可以自己來囉！你看指針是要往哪個方向走呢？』或『哎唷～小朋友真貼心！不過阿婆走路慢，你先看地圖跟阿婆說我們要往哪個方向走好嗎？』）。`,
      `       - 【未通過/方向不明時 (isMatch: false)】：阿婆親切以看懂指北針引導學生，【嚴禁直接講出『向北走』破哏】：『小朋友，阿婆我看得懂地圖喔，以前有學過看指北針！你看地圖右下角的指針，從這裡是要往哪一個方向走、去哪裡呢？你再看著指針跟阿婆說一次好嗎？』。`,
      `     * 【今日天氣與出門穿搭關卡（3 步驟情境探索）】：`,
      `       - 【第 1 關 (weather_choose_type - 拉開窗簾觀察回報天氣)】：核心目標是拉開窗簾看外面天氣，並向廚房的媽媽清楚回報今天天氣（下大雨溼答答 / 出大太陽好熱 / 寒流來襲吹大風）。`,
      `         * 【回報正確天氣 (通過 isMatch: true)】：說出當前天氣狀況（如：下大雨、出大太陽很熱、寒流來很冷吹大風）。媽媽在廚房讚許回應並引導去衣櫃挑衣服。`,
      `         * 【回報錯誤或未觀察天氣 (未通過 isMatch: false)】：若亂說天氣或未提及天氣狀況，媽媽提醒再看清楚窗外。`,
      `       - 【第 2 關 (weather_outfit_* - 走到衣櫃挑選防護穿搭)】：核心目標是走到衣櫃挑選符合第 1 關天氣的專屬穿搭。`,
      `         * 【1. 寒冷冬天 (weather_outfit_cold)】：保暖冬裝（厚大衣/羽絨衣/毛衣/圍巾/長袖長褲）通過；單薄夏裝（短袖短褲背心）嚴格未通過，媽媽提醒外面很冷會感冒。`,
      `         * 【2. 炎熱大晴天 (weather_outfit_hot)】：清涼防曬（短袖/短褲/遮陽帽/多喝水）通過；厚重冬裝（大衣/羽絨衣/毛衣）嚴格未通過，媽媽提醒會中暑。`,
      `         * 【3. 陰雨綿綿 (weather_outfit_rain)】：防雨裝備（穿雨衣/拿雨傘/穿雨鞋）通過；沒帶雨具（不帶傘不穿雨衣）嚴格未通過，媽媽提醒會淋成落湯雞。`,
      `       - 【第 3 關 (weather_done - 玄關整裝出發)】：核心目標是在玄關穿好鞋子，向媽媽大聲告知準備好出門並禮貌說再見（例：『我都準備好了，出門走囉，媽媽再見！』）。`,
      `     * 【校外教學打包關卡】：核心目標是說出物品名稱（雨傘/水壺/毛巾/點心）與攜帶原因。【特別注意】：雨傘（遮仔）兼具「下雨防淋濕（防下雨/落雨）」與「出大太陽防曬遮陽（遮陽/防曬/防熱）」雙重功能，學生提及防雨或遮陽防曬任一項或兩者皆提，均屬 100% 正確合理，應判定 isMatch: true 並由媽媽給予肯定讚許！`,
      ``,
      `2. 【關鍵規則 — 符合目標但夾帶額外要求/問題/閒聊時的 NPC 反應】：`,
      `   - 若學生發言「已達成核心任務」，但後面又接續了題外話、額外問題或特殊要求（例如要求打折、殺價、問廁所、要禮物、開玩笑）：`,
      `     * 【判定】：isMatch: true（核心任務已達成，給予通過）！`,
      `     * 【NPC 對話 (dynamicNpcResponse)】：NPC 必須 100% 站在自身角色人設，同時回應學生的核心任務與其附加問題（例如幽默回絕、親切解答或溫和提醒）：`,
      `       - 例1【動物園售票員】（學生：『我要三張學生票請問可以打折嗎？』）：售票員回應：『同學，學生票已經是優惠票價了，沒辦法再打折囉！這是你們的三張學生票，祝你們玩得開心！』`,
      `       - 例2【小吃店老闆】（學生：『我要一碗湯粄條，我今天生日可以算便宜一點嗎？』）：老闆回應：『祝你生日快樂！不過我們小本經營沒辦法打折啦，阿叔幫你湯煮大碗一點，湯粄條馬上來！』`,
      `       - 例3【驗票志工奶奶】（學生：『這是我的門票謝謝，奶奶請問廁所在哪？』）：奶奶回應：『好懂事！門票收好囉，走進大門左手邊就是洗手間，慢慢參觀喔！』`,
      `       - 例4【站務員/司機】（學生：『請問文化園區是搭802公車嗎？司機你很帥喔』）：站務員回應：『哈哈謝謝稱讚！沒錯，802公車馬上進站了，請在黃線後方排隊上車喔！』`,
      `       - 例5【保健室護理師】（學生：『護理師我頭好痛肚子也一直拉，下午可以不用上課嗎？』）：護理師回應：『辛苦了！你先在椅子上坐著休息，阿姨幫你量體溫、倒杯溫開水，如果還是很不舒服阿姨再幫你聯絡導師喔！』`,
      `       - 例6【家人/長輩】（學生：『今天下雨我要帶雨傘，但我可以帶電動玩具去學校嗎？』）：長輩回應：『帶雨傘很細心！但是玩具要留在家裡喔，專心上課，出門小心別淋濕！』`,
      ``,
      `3. 【未達成目標時的自然生活化引導規則（嚴禁死板唸稿）】：`,
      `   - 若學生發言「尚未達成核心任務」（例如只問打折卻沒說買幾張票、只問推薦卻沒點菜、點了小吃店沒賣的紅龜粿或牛排）：`,
      `     * 【判定】：isMatch: false。`,
      `     * 【NPC 對話 (dynamicNpcResponse)】：NPC 根據學生說的話做出真實生動的情境引導與回絕，引導他完成本關目標！`,
      `     * 🚫【嚴禁命令背誦特定台詞】：NPC 絕對【嚴禁】在對話中直接命令學生說出特定句型（例：【絕對嚴禁】說『請說：...』、『你跟我說「...」』、『你大聲說「...」好嗎？』、『請你唸出...』）！NPC 應透過自然的生活觀察與親切提問來啟發學生，保持真實日常感。`,
      `4. 輸出規範：請嚴格回傳標準 JSON 格式。`
    ].join("\n");
  }

  /**
   * 建構 User Prompt (注入客語原文/華語意圖、先前對話歷程與分支清單)
   */
  static buildUserPrompt(hakkaTranscript, mandarinTranscript, nodeConfig, isMandarin = false, dialogueHistoryText = "") {
    let choicesText = "";
    if (nodeConfig?.choices) {
      if (isMandarin) {
        choicesText = `\n【本題合法分支選項清單】：\n` + nodeConfig.choices.map(c => `  - [${c.id}] 名稱: ${c.title}, 說明: ${c.sub || c.title}, 華語關鍵字/特徵: [${(c.mandarinKeywords || c.keywords || []).join(", ")}]`).join("\n");
      } else {
        choicesText = `\n【本題合法分支選項清單】：\n` + nodeConfig.choices.map(c => `  - [${c.id}] 名稱: ${c.title}, 說明: ${c.sub || c.title}, 關鍵字/特徵: [${(c.keywords || []).join(", ")}]`).join("\n");
      }
    }

    const coreKwList = (nodeConfig?.nodeType === "選擇" && nodeConfig?.choices)
      ? nodeConfig.choices.flatMap(c => isMandarin ? (c.mandarinKeywords || c.keywords || []) : (c.keywords || []))
      : (isMandarin ? (nodeConfig?.mandarinKeywords || nodeConfig?.keywords || []) : (nodeConfig?.keywords || []));

    const historySection = dialogueHistoryText ? `${dialogueHistoryText}\n` : "";

    return [
      historySection,
      `【學生本關實際語音輸入】：「${(isMandarin ? mandarinTranscript : (hakkaTranscript || mandarinTranscript)) || "（無輸入）"}」`,
      isMandarin ? "" : `【客轉華語意譯】：「${mandarinTranscript || hakkaTranscript || "（無輸入）"}」`,
      `【本關目標句參考】：${(isMandarin ? nodeConfig?.targetMandarin : nodeConfig?.targetHakka) || "無固定句"}`,
      `【本關核心概念詞】：${coreKwList.join(", ") || "無"}`,
      `${choicesText}`,
      ``,
      `請依據系統指令的「通關任務目標與引導邏輯」與「先前對話歷程」評估：`,
      `1. 多輪記憶防重複：請完全知曉先前對話歷程。若學生在前面關卡已表達過的事實（如第一關已說身體不舒服），在本關無需重複贅述。NPC 應自然接續，絕不可要求學生把上一關說過的話再講一遍！`,
      `2. 若學生發言已實質達成核心目標（就算後面接續了打折、閒聊等題外話），請回傳 isMatch: true，並由 NPC 站在角色立場同時回應核心任務與額外問題！`,
      `3. 若學生尚未達成目標（例如只問推薦/閒聊/未點菜/張數錯誤/點了沒賣的東西），請回傳 isMatch: false，並由 NPC 根據學生說的話自然引導（嚴禁直接給答案提示句，嚴禁以命令句要求學生背誦特定台詞）！`,
      ``,
      `請嚴格依照以下 JSON 結構回傳：`,
      `{`,
      `  "isMatch": true 或 false,`,
      `  "intent": "識別出的意圖或分支名稱",`,
      `  "matchedChoiceId": "選定之分支 ID（若為選擇題）或 null",`,
      `  "semanticAccuracy": 0 到 100 的整數,`,
      `  "hitKeywords": ["命中之概念詞"],`,
      `  "missingKeywords": ["缺漏之概念詞"],`,
      `  "feedback": "教學引導短評",`,
      `  "dynamicNpcResponse": "NPC 角色針對學生發言的情境回覆對話（20-35字，親切自然生活口語）"`,
      `}`
    ].filter(Boolean).join("\n");
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
   * 精準解析選擇節點之分支物件 (跨 6 大情境支援 ID、意圖、關鍵字模糊比對)
   */
  static resolveMatchedChoice(nodeConfig, evalData, hakkaText = "", mandarinText = "", isMandarin = false) {
    if (nodeConfig?.nodeType !== "選擇" || !nodeConfig?.choices || nodeConfig.choices.length === 0) {
      return null;
    }
    const choices = nodeConfig.choices;

    // 1. 若已有 matchedChoice 物件
    if (evalData?.matchedChoice && typeof evalData.matchedChoice === "object") {
      return evalData.matchedChoice;
    }

    // 2. 比對 matchedChoiceId (支援 raw id, 去除 choice_ 前綴, 或包含判斷)
    const targetId = (evalData?.matchedChoiceId || "").trim().toLowerCase();
    if (targetId && targetId !== "null" && targetId !== "undefined") {
      const cleanTargetId = targetId.replace(/^choice_/, "");
      const foundById = choices.find(c => {
        const cId = c.id.toLowerCase();
        return cId === targetId || cId === cleanTargetId || targetId.includes(cId) || (c.targetBranchId && targetId.includes(c.targetBranchId.toLowerCase()));
      });
      if (foundById) return foundById;
    }

    // 3. 比對 intent (例如 "大象展區", "獅子展區", "蛇展區", "文化園區", "學校", "膝蓋擦傷", "陰雨綿綿" 等)
    const intent = (evalData?.intent || "").trim().toLowerCase();
    if (intent && intent !== "目標對話達成" && intent !== "無") {
      const foundByIntent = choices.find(c => {
        const title = c.title.toLowerCase();
        const kwList = isMandarin ? (c.mandarinKeywords || c.keywords || []) : (c.keywords || []);
        const keywords = kwList.map(k => k.toLowerCase());
        return intent.includes(title) || title.includes(intent) || keywords.some(k => intent.includes(k) || k.includes(intent));
      });
      if (foundByIntent) return foundByIntent;
    }

    // 4. 比對語音輸入內容 (客語/華語/命中關鍵詞/動態對話)
    const fullText = `${hakkaText || ""} ${mandarinText || ""} ${(evalData?.hitKeywords || []).join(" ")} ${evalData?.dynamicNpcResponse || ""}`.toLowerCase();
    for (const choice of choices) {
      const kwList = isMandarin ? (choice.mandarinKeywords || choice.keywords || [choice.title]) : (choice.keywords || [choice.title]);
      const keywords = kwList.map(k => k.toLowerCase());
      if (keywords.some(k => fullText.includes(k))) {
        return choice;
      }
    }

    // 5. 若皆無命中且判定通過，才安全回傳第一個選項
    return evalData?.isMatch ? choices[0] : null;
  }

  /**
   * 當 LLM 遇到請求頻率限制 (429 Rate Limit) 時，生成完全融入角色情境的沉浸式緩衝台詞
   */
  static getRateLimitNpcResponse(npcRole, isMandarin = false) {
    const roleBuffers = {
      "售票員": isMandarin
        ? "「售票機剛好在重新整理票務連線中，請同學深呼吸、稍等五秒再說一次喔！」"
        : "「售票機連線稍微慢了一下，請同學深呼吸、稍等五秒再說一次喔！」",
      "驗票志工": isMandarin
        ? "「哎呀閘門感應器稍微感應中，請同學稍候五秒，再出示一次門票喔！」"
        : "「哎呀閘門感應器連線稍微慢了一下，請同學稍候五秒，再給奶奶看一次門票喔！」",
      "園區導覽員": "「前面展區參觀人潮比較多、廣播連線稍候片刻，請稍等五秒再問一次路線喔！」",
      "小吃店老闆": "「老闆手邊正忙著翻鍋大火快炒，剛才沒聽清楚，請客官稍等五秒再點一次喔！」",
      "廚房阿姨": "「阿姨剛才正在掌杓煮湯，請稍等五秒再交代一次客製要求喔！」",
      "服務生": "「店內點餐機正在出單整理中，請客人稍等五秒再加點飲品喔！」",
      "媽媽": "「媽媽剛才在忙著收衣服整理東西，請稍等五秒再跟媽媽說一次喔！」",
      "爸爸": "「爸爸剛才在看行程地圖，請稍等五秒再說一次要帶什麼裝備喔！」",
      "阿公": "「阿公剛才在戴老花眼鏡，請稍等五秒再跟阿公提醒一次穿搭喔！」",
      "站務人員": "「公車動態看板正在更新班次連線，請同學稍候五秒再詢問一次路線喔！」",
      "公車司機": "「司機先生正在專注看後照鏡進站，請稍等五秒上車再確認一次目的地喔！」",
      "熱心阿婆": "「阿婆剛才在看路邊紅綠燈，請稍等五秒再問一次方向喔！」",
      "護理師": "「阿姨剛才正在幫其他同學量體溫，請先深呼吸喘口氣、稍等五秒再說一次喔！」",
      "家人": "「外頭風聲有點大剛才沒聽清楚，請喝口水稍等五秒再提醒一次穿搭喔！」",
      "同學阿明": "「阿明剛才在看旁邊的展區分心了，請稍等五秒再跟我分享一次你的發現喔！」",
      "老師": "「老師剛才在點名冊上登記名字，請稍等五秒再向老師報告集合喔！」",
      "帶隊老師": "「老師剛才在點名冊上登記名字，請稍等五秒再向老師報告集合喔！」"
    };
    return roleBuffers[npcRole] || "「現場連線稍微整理中，請深呼吸稍等五秒再說一次喔！」";
  }

  /**
   * 執行 LLM 評估 (整合 Vercel /api/judge、前端直連 Google Gemini 3.6 Flash 與本地安全網三軌備援)
   */
  static async evaluate({ hakkaTranscript, mandarinTranscript, nodeConfig, scenario, speechMode = "hakka", dialogueHistoryText = "" }) {
    const isMandarin = speechMode === "mandarin" || (!hakkaTranscript && !!mandarinTranscript);
    const systemPrompt = this.buildSystemPrompt(nodeConfig, scenario, isMandarin);
    const userPrompt = this.buildUserPrompt(hakkaTranscript, mandarinTranscript, nodeConfig, isMandarin, dialogueHistoryText);

    // 通道 1: 優先透過後端 /api/judge 呼叫 (支援本地代理與 Vercel 雲端雙軌備援)
    const endpointsToTry = [
      this.config.apiEndpoint || "/api/judge",
      "/api/judge",
      "https://speaking-scenarios-v2.vercel.app/api/judge"
    ].filter((v, i, a) => a.indexOf(v) === i && v);

    for (const targetEndpoint of endpointsToTry) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(targetEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ systemPrompt, userPrompt, hakkaTranscript, mandarinTranscript, isMandarin }),
          signal: controller.signal
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.isMatch !== undefined) {
            const matchedChoice = this.resolveMatchedChoice(nodeConfig, data, hakkaTranscript, mandarinTranscript, isMandarin);
            return {
              ...data,
              matchedChoice,
              matchedChoiceId: matchedChoice ? matchedChoice.id : (data.matchedChoiceId || null),
              isFromAPI: true,
              provider: (data.modelUsed || "Claude") + " (後端轉發)"
            };
          }
        } else if (res.status === 429) {
          const rateLimitReply = this.getRateLimitNpcResponse(nodeConfig.npcRole, isMandarin);
          return {
            isMatch: false,
            isRateLimited: true,
            intent: "請求頻率超額 (Rate Limit)",
            matchedChoice: null,
            matchedChoiceId: null,
            semanticAccuracy: 0,
            hitKeywords: [],
            missingKeywords: [],
            feedback: "連線整理中（429 頻率冷卻），請稍候 5 秒再試一次。",
            dynamicNpcResponse: rateLimitReply
          };
        }
      } catch (err) {
        // 當前 endpoint 失敗，繼續嘗試備用端點
      }
    }

    // 通道 2: 前端直連 Google Gemini 3.6 Flash 雲端實時運算 (保證 100% 真實 LLM 邊界推理與角色扮演)
    if (this.config.apiKey) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.config.timeout);

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model || "gemini-3.6-flash"}:generateContent?key=${this.config.apiKey}`;
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
          const parts = data.candidates?.[0]?.content?.parts || [];
          let text = "";
          for (const part of parts) {
            if (part.text) text += part.text;
          }
          const parsed = this.extractJson(text);
          if (parsed && typeof parsed.isMatch === "boolean") {
            const matchedChoice = this.resolveMatchedChoice(nodeConfig, parsed, hakkaTranscript, mandarinTranscript, isMandarin);
            const accuracy = (typeof parsed.semanticAccuracy === "number")
              ? (parsed.semanticAccuracy <= 1 ? Math.round(parsed.semanticAccuracy * 100) : Math.round(parsed.semanticAccuracy))
              : 95;

            return {
              isMatch: parsed.isMatch,
              intent: parsed.intent || (parsed.isMatch ? "目標對話達成" : "語意未達標"),
              matchedChoiceId: matchedChoice ? matchedChoice.id : (parsed.matchedChoiceId || null),
              matchedChoice: matchedChoice,
              semanticAccuracy: accuracy,
              hitKeywords: parsed.hitKeywords || [],
              missingKeywords: parsed.missingKeywords || [],
              feedback: parsed.feedback || "",
              dynamicNpcResponse: parsed.dynamicNpcResponse || (parsed.isMatch ? (nodeConfig.mandarinNpcSuccessResponse || nodeConfig.npcSuccessResponse) : (nodeConfig.mandarinNpcRetryResponse || nodeConfig.npcRetryResponse)),
              isFromAPI: true,
              provider: "gemini-3.6-flash (雲端實時推理)"
            };
          }
        }
      } catch (err) {
        console.warn("[LLMServiceAdapter] 直連 Gemini 3.6 Flash API 異常，降級至本地安全網：", err);
      }
    }

    // 通道 3: 僅在無任何網路連線時的本地離線安全網
    const combinedText = `${hakkaTranscript || ""} ${mandarinTranscript || ""}`.trim();
    const fallbackEval = SpeechService.evaluateAnswer(combinedText, nodeConfig, isMandarin);
    const matchedChoice = fallbackEval.matchedChoice;

    let dynamicNpcResponse = "";
    if (fallbackEval.isMatch) {
      if (matchedChoice) {
        dynamicNpcResponse = isMandarin
          ? (matchedChoice.mandarinGuideResponse || matchedChoice.guideResponse || "「好的，往這個方向走喔！」")
          : (matchedChoice.guideResponse || "「好个，照等這隻方向行喔！」");
      } else {
        dynamicNpcResponse = isMandarin
          ? (nodeConfig.mandarinNpcSuccessResponse || nodeConfig.npcSuccessResponse || "「很好！說得非常清楚！」")
          : (nodeConfig.npcSuccessResponse || "「很好！說得非常清楚！」");
      }
    } else {
      if (fallbackEval.customNpcResponse) {
        dynamicNpcResponse = fallbackEval.customNpcResponse;
      } else {
        dynamicNpcResponse = isMandarin
          ? (nodeConfig.mandarinNpcRetryResponse || nodeConfig.npcRetryResponse || "「請再說一次喔！」")
          : (nodeConfig.npcRetryResponse || "「請再說一次喔！」");
      }
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
      dynamicNpcResponse: dynamicNpcResponse,
      isFromAPI: false,
      provider: "local_safety_net"
    };
  }
}

// ==========================================
// 6. 語音評估規則核心 (SpeechService)
// ==========================================

class SpeechService {
  /**
   * 比對學生發音文字與節點要求 (支援客語模式與華語模式關鍵字動態切換)
   */
  static evaluateAnswer(userTranscript, nodeConfig, isMandarinMode = false) {
    if (!userTranscript || !userTranscript.trim()) {
      return {
        isMatch: false,
        hitKeywords: [],
        missingKeywords: isMandarinMode ? (nodeConfig.mandarinKeywords || nodeConfig.keywords || []) : (nodeConfig.keywords || []),
        similarity: 0,
        feedback: "未偵測到清晰語音，請靠近麥克風再試一次。",
        customNpcResponse: null
      };
    }

    const cleanText = userTranscript.replace(/[。，！？、？\s\.,!?]/g, "");
    const normalizedCleanText = cleanText
      .replace(/八零二|八百零二/g, "802")
      .replace(/六一五|六百一十五/g, "615")
      .replace(/三零六|三百零六/g, "306");

    // 1. 若為「選擇」節點，進行分支關鍵字與語意特徵匹配
    if (nodeConfig.nodeType === "選擇" && nodeConfig.choices) {
      for (const choice of nodeConfig.choices) {
        const choiceKeywords = isMandarinMode
          ? (choice.mandarinKeywords || choice.keywords || [choice.title])
          : (choice.keywords || [choice.title]);
        const allKeywords = [...choiceKeywords, ...(choice.altKeywords || [])];
        
        let isChoiceHit = allKeywords.some(kw => normalizedCleanText.includes(kw) || cleanText.includes(kw));

        // 語意語境輔助識別
        if (!isChoiceHit) {
          if (choice.id === "head_stomach" && /頭|肚|拉|痛|暈|不舒服|肚屎/.test(normalizedCleanText)) isChoiceHit = true;
          if (choice.id === "scratch" && /擦傷|跌倒|膝蓋|流血|破皮|跑太快|腳痛|痛痛/.test(normalizedCleanText)) isChoiceHit = true;
          if (choice.id === "fever" && /熱|燒|發熱|發燒|沒力|無力|當燒/.test(normalizedCleanText)) isChoiceHit = true;
          if (choice.id === "culture" && /文化|園區|802/.test(normalizedCleanText)) isChoiceHit = true;
          if (choice.id === "school" && /學校|正門|615/.test(normalizedCleanText)) isChoiceHit = true;
          if (choice.id === "library" && /圖書館|306/.test(normalizedCleanText)) isChoiceHit = true;
          if (choice.id === "elephant" && /大象|象|水池|鼻/.test(normalizedCleanText)) isChoiceHit = true;
          if (choice.id === "lion" && /獅|獅子|岩石|威風/.test(normalizedCleanText)) isChoiceHit = true;
          if (choice.id === "snake" && /蛇|溫室|玻璃|安靜/.test(normalizedCleanText)) isChoiceHit = true;
          if (choice.id === "rain" && /雨|下雨|雨傘|雨衣|落雨/.test(normalizedCleanText)) isChoiceHit = true;
          if (choice.id === "hot" && (/大熱天|當熱|晴天|太陽|防曬|天氣很熱|好熱|很熱|太熱/.test(normalizedCleanText) || (normalizedCleanText.includes("熱") && !normalizedCleanText.includes("發熱")))) isChoiceHit = true;
          if (choice.id === "cold" && /冷|大衣|圍巾|毛衣|羽絨|外套|長袖|長褲|發熱衣|衛生衣|保暖|當冷|大衫/.test(normalizedCleanText) && !/短袖|短褲|吊嘎|背心|拖鞋|涼鞋/.test(normalizedCleanText)) isChoiceHit = true;
        }

        if (isChoiceHit) {
          return {
            isMatch: true,
            matchedChoice: choice,
            matchedChoiceId: choice.id,
            hitKeywords: choiceKeywords.filter(kw => normalizedCleanText.includes(kw) || cleanText.includes(kw)),
            missingKeywords: [],
            similarity: 100,
            feedback: `辨識成功！偵測到選擇【${choice.title}】。`,
            customNpcResponse: null
          };
        }
      }
      return {
        isMatch: false,
        matchedChoice: null,
        matchedChoiceId: null,
        hitKeywords: [],
        missingKeywords: nodeConfig.choices.map(c => c.title),
        similarity: 0,
        feedback: "未偵測到選項關鍵字，請開口說出你想選擇的項目喔！",
        customNpcResponse: isMandarinMode ? (nodeConfig.mandarinNpcRetryResponse || nodeConfig.npcRetryResponse) : (nodeConfig.npcRetryResponse || "「不好意思沒聽清楚，請再說一次喔！」")
      };
    }

    // 2. 一般口說比對 (支援語意擴展同義詞與主題合理對話)
    const primaryKeywords = isMandarinMode
      ? (nodeConfig.mandarinKeywords || nodeConfig.keywords || [])
      : (nodeConfig.keywords || []);
    const altKeywords = nodeConfig.altKeywords || [];
    const searchKeywords = [...new Set([...primaryKeywords, ...altKeywords])];

    const hitPrimary = primaryKeywords.filter(kw => normalizedCleanText.includes(kw) || cleanText.includes(kw));
    const hitAll = searchKeywords.filter(kw => normalizedCleanText.includes(kw) || cleanText.includes(kw));
    const missingPrimary = primaryKeywords.filter(kw => !normalizedCleanText.includes(kw) && !cleanText.includes(kw));

    // 稱謂黑名單：不可單靠稱謂過關（必須包含實質動作或內容詞）
    const SALUTATIONS = new Set(["老師", "老闆", "護理師", "阿姨", "站務員", "站務人員", "司機", "媽媽", "爸爸", "阿公", "奶奶", "同學", "阿明", "先生", "小姐"]);
    const substantiveHitPrimary = hitPrimary.filter(k => !SALUTATIONS.has(k));
    const substantiveHitAll = hitAll.filter(k => !SALUTATIONS.has(k));

    // 數量衝突檢查 (若題目要求三張，但回答包含兩張/一張/二等衝突數字，則嚴格判錯)
    const targetRequiresThree = (nodeConfig.targetHakka || "").includes("三") || (nodeConfig.targetMandarin || "").includes("三") || primaryKeywords.some(k => k.includes("三") || k.includes("3"));
    const studentHasWrongQuantity = targetRequiresThree && (cleanText.includes("兩") || cleanText.includes("二") || cleanText.includes("一") || cleanText.includes("2") || cleanText.includes("1")) && !cleanText.includes("三") && !cleanText.includes("3");

    // 禮貌度檢查 (例如驗票/健康中心致謝關卡，若只說「喂」或缺少謝謝/恁仔細，則給予指正)
    const requiresPoliteness = (nodeConfig.targetHakka || "").includes("恁仔細") || (nodeConfig.targetMandarin || "").includes("謝謝") || primaryKeywords.some(k => k.includes("恁仔細") || k.includes("謝謝"));
    const studentHasPoliteness = cleanText.includes("恁仔細") || cleanText.includes("謝謝") || cleanText.includes("多謝") || cleanText.includes("感謝");

    const targetTarget = isMandarinMode ? (nodeConfig.targetMandarin || "") : (nodeConfig.targetHakka || "");
    const targetClean = targetTarget.replace(/[。，！？、？\s\.,!?]/g, "");
    
    // 主題情境語意語境補充判斷 (如小吃點餐/問推薦、保健室陳述症狀、天氣穿搭等)
    let isSemanticContextMatch = false;
    let askingForRecommendation = false;
    const nid = nodeConfig.id || "";

    let unavailableFoodOrdered = null;
    if (nid === "food_step1") {
      const validDishes = /湯粄條|炒粄條|乾粄條|粄條|米苔目|客家小炒|小炒|大腸|薑絲大腸|鹹豬肉|福菜|鹹湯圓|梅干扣肉/;
      const unavailableFestivalFoods = /紅龜粿|草仔粿|艾草粄|肉粽|粽子|發粄|年糕|牛汶水|水粄/;
      const unavailableWesternFoods = /牛排|漢堡|薯條|披薩|義大利麵|壽司|拉麵|炸雞|熱狗|可樂|珍珠奶茶/;

      if (unavailableFestivalFoods.test(normalizedCleanText)) {
        unavailableFoodOrdered = normalizedCleanText.match(unavailableFestivalFoods)?.[0] || "節慶點心";
      } else if (unavailableWesternFoods.test(normalizedCleanText)) {
        unavailableFoodOrdered = normalizedCleanText.match(unavailableWesternFoods)?.[0] || "這項餐點";
      } else if (/推薦|好香|什麼菜|招牌|有什麼好吃的|菜單/.test(normalizedCleanText) && !validDishes.test(normalizedCleanText)) {
        askingForRecommendation = true;
      } else if (validDishes.test(normalizedCleanText)) {
        isSemanticContextMatch = true;
      }
    }
    if (nid === "food_step2" && /香菜|毋好|不要|甜|少油|少鹽|口味|老闆|阿姨/.test(normalizedCleanText)) isSemanticContextMatch = true;
    if (nid === "food_step3" && /擂茶|小炒|好吃|好食|好喝|再來|加點|美味/.test(normalizedCleanText)) isSemanticContextMatch = true;
    if (nid === "health_symptom_head" && /頭|肚|拉|痛|暈|不舒服|肚屎|頭那/.test(normalizedCleanText)) isSemanticContextMatch = true;
    if (nid === "health_symptom_scratch" && /擦傷|跌倒|膝蓋|流血|破皮|跑太快|腳痛|體育課/.test(normalizedCleanText)) isSemanticContextMatch = true;
    if (nid === "health_symptom_fever" && /熱|燒|發熱|發燒|沒力|無力|身體/.test(normalizedCleanText)) isSemanticContextMatch = true;
    if (nid === "health_rest" && studentHasPoliteness) isSemanticContextMatch = true;
    if (nid === "bus_arrive" && (/直直|向前|往前|左轉|越倒手|紅綠燈|右手邊|正手邊|目的地/.test(normalizedCleanText))) isSemanticContextMatch = true;

    // 今日天氣與穿搭（寒冷天、大熱天、下雨天）：智慧情境穿搭判斷
    let isColdClothesWarning = false;
    let isHotClothesWarning = false;
    let isRainGearWarning = false;

    if (nid === "weather_choose_type") {
      const isReportingWeather = /落大雨|落雨|下大雨|下雨|雨天|溼漉漉|濕漉漉|溼答答|出大日頭|日頭|出太陽|太陽|好熱|當熱|熱天|晴天|寒流|當冷|好冷|天冷|吹大風|吹風|大風/.test(normalizedCleanText);
      if (isReportingWeather) isSemanticContextMatch = true;
    }

    if (nid === "weather_outfit_cold") {
      const isWarmClothes = /大衫|大衣|厚外套|外套|毛衣|羽絨|羽絨衣|羽絨服|毛線衣|長袖|長褲|圍巾|發熱衣|衛生衣|保暖|手套|毛帽|暖暖包|厚長褲|穿暖|著暖/.test(normalizedCleanText);
      const isColdClothes = /短袖|短褲|背心|吊嘎|拖鞋|涼鞋|薄衫|泳衣|短裙|薄外套/.test(normalizedCleanText);
      if (isColdClothes && !isWarmClothes) {
        isColdClothesWarning = true;
      } else if (isWarmClothes) {
        isSemanticContextMatch = true;
      }
    }

    if (nid === "weather_outfit_hot") {
      const isOverdressed = /大衫|大衣|厚外套|毛衣|羽絨|羽絨衣|羽絨服|毛線衣|圍巾|毛帽|暖暖包/.test(normalizedCleanText);
      const isCoolClothes = /短袖|短褲|薄衫|遮陽帽|帽子|帽仔|防曬|多喝水|多啉水|晴天|大熱天|當熱/.test(normalizedCleanText);
      if (isOverdressed && !isCoolClothes) {
        isHotClothesWarning = true;
      } else if (isCoolClothes) {
        isSemanticContextMatch = true;
      }
    }

    if (nid === "weather_outfit_rain") {
      const isRefusingRainGear = /不要帶雨傘|不要帶傘|不用帶雨傘|不用帶傘|沒帶雨傘|沒有帶雨傘|不帶雨傘|沒帶傘|沒有帶傘|不帶傘|不穿雨衣|沒穿雨衣|無帶遮仔|毋著雨衣|毋帶遮仔/.test(normalizedCleanText);
      const hasPositiveRainGear = !isRefusingRainGear && (/帶.*(雨傘|遮仔|傘)|著.*雨衣|穿.*雨衣|帶遮仔|著雨衣|帶雨傘|穿雨衣|拿雨傘|備好雨具|拿遮仔|雨鞋/.test(normalizedCleanText) || /雨傘|雨衣|遮仔/.test(normalizedCleanText));

      if (isRefusingRainGear || !hasPositiveRainGear) {
        isRainGearWarning = true;
      } else if (hasPositiveRainGear) {
        isSemanticContextMatch = true;
      }
    }

    if (nid === "weather_done" && /準備|出門|再見|行囉|走囉/.test(normalizedCleanText)) {
      isSemanticContextMatch = true;
    }

    // 命中判定規則：命中 >= 1 個實質關鍵詞（排除純稱謂），或符合主題語意，或完整命中目標句
    const isKeywordHit = !askingForRecommendation && !unavailableFoodOrdered && (substantiveHitAll.length >= 1 || substantiveHitPrimary.length >= 1);
    let isMatch = !studentHasWrongQuantity && !askingForRecommendation && !unavailableFoodOrdered && !isColdClothesWarning && !isHotClothesWarning && !isRainGearWarning && (isKeywordHit || isSemanticContextMatch || (targetClean && cleanText.includes(targetClean)));
    
    // 若題目要求禮貌道謝但學生未道謝或語氣粗魯，一律判錯
    if (requiresPoliteness && !studentHasPoliteness) {
      isMatch = false;
    }

    // 出口集合清點人數關卡 (zoo_meet_point) 嚴格把關：
    // 1. 若含有未到齊、缺人、沒到、上廁所、延遲等詞彙，一律判錯！
    // 2. 必須明確表達「到齊 / 都到了 / 參觀好了」等全員正面完成意圖，才可通過！
    const hasMissingPersons = nid === "zoo_meet_point" && (
      /還有.*(沒|未|一人|一個|同學|上廁所|洗手間|等)|(沒有|沒|未|還沒).*(到|來|齊|好)|上廁所|洗手間|去廁所|少[一兩個人]|缺[一兩個人]|差[一兩個人]|等一下|還在等|落單|不見|迷路/.test(normalizedCleanText) ||
      /還有(一個|一人|人|同學|誰|兩個|兩人)|(沒有|沒|未|還沒)(到|來|齊|好)|(上|去|在)(廁所|洗手間)/.test(normalizedCleanText)
    );
    const hasPositiveArrival = nid === "zoo_meet_point" && /到齊|全到|都到|都齊|全齊|人都到了|大家都到了|參觀好了|參觀完了|準備好了|好勢了|到齊了/.test(normalizedCleanText);

    if (nid === "zoo_meet_point") {
      if (hasMissingPersons || !hasPositiveArrival) {
        isMatch = false;
      }
    }

    let customNpcResponse = null;
    let feedbackMsg = isMatch ? "辨識成功！語意明確且符合情境交流。" : "情境語意未達標，請參考提示再說一次。";

    if (askingForRecommendation) {
      customNpcResponse = isMandarinMode
        ? "「我們店裡的招牌是現煮湯粄條跟客家小炒，香噴噴的，你要來一碗哪一樣呢？」"
        : "「𠊎兜店裡个招牌係現煮湯粄條同客家小炒，當香喔，你愛食哪一隻呢？」";
      feedbackMsg = "老闆已為您推薦招牌菜色，請開口點選想吃的餐點喔！";
    } else if (unavailableFoodOrdered) {
      customNpcResponse = isMandarinMode
        ? `「喔！同學，我們是現煮客家熱炒小吃店，沒有賣${unavailableFoodOrdered}啦！要不要來一碗我們招牌的現煮湯粄條或客家小炒呢？」`
        : `「喔！同學，𠊎兜係現煮客家小吃店，無賣${unavailableFoodOrdered}啦！愛來一碗招牌湯粄條無？」`;
      feedbackMsg = `小吃店未販售「${unavailableFoodOrdered}」，請參考菜單點選湯粄條或客家小炒喔！`;
    } else if (isColdClothesWarning) {
      customNpcResponse = isMandarinMode
        ? "「哎呀！外面寒風刺骨只有十度，穿短袖短褲出門會感冒著涼啦！快去換厚外套或大衣穿暖再出門！」"
        : "「哎呀！外背風當冷，著短袖會冷著啦！遽遽去換大衫穿暖暖喔！」";
      feedbackMsg = "天氣寒冷，請選擇大衣、毛衣或圍巾等保暖衣物喔！";
    } else if (isHotClothesWarning) {
      customNpcResponse = isMandarinMode
        ? "「哎呀！外面太陽好大好熱、氣溫三十多度，穿厚大衣和毛衣出門會滿頭大汗中暑啦！快去換清涼短袖、戴上遮陽帽喔！」"
        : "「哎呀！外背日頭當大當熱，著大衫會流汗著痧啦！遽遽換短袖戴帽仔喔！」";
      feedbackMsg = "天氣炎熱，請選擇短袖、遮陽帽等輕便防曬衣物喔！";
    } else if (isRainGearWarning) {
      customNpcResponse = isMandarinMode
        ? "「看著窗外滴滴答答在下雨呢！不帶雨傘或雨衣出門，衣服和書包馬上就會淋成落湯雞感冒啦！快去玄關拿雨傘或穿上雨衣再出門喔！」"
        : "「看著外背落雨呢！無帶遮仔著雨衣，衫同書包會淋濕濕啦！遽遽去拿遮仔著雨衣出門喔！」";
      feedbackMsg = "下雨天路滑容易淋濕，請記得帶雨傘或穿雨衣喔！";
    } else if (nid === "zoo_meet_point" && (hasMissingPersons || !isMatch)) {
      customNpcResponse = isMandarinMode
        ? "「那我們再等一下下，等全部人都到齊、都參觀完了之後再出發喔！」"
        : "「該𠊎兜過等一下仔，等全部人都到齊、都參觀好後再出發喔！」";
      feedbackMsg = "同學尚未全員到齊或尚未完成參觀報告，請等大家都到齊後再向老師報告出發喔！";
    } else if (isMatch && nid === "zoo_start" && /打折|算便宜|優惠/.test(normalizedCleanText)) {
      customNpcResponse = isMandarinMode
        ? "「同學，學生票已經是優惠票價了，沒辦法再打折囉！這是你們的三張學生票，祝你們玩得開心！」"
        : "「同學，學生票已經係優惠價了，無辦法過打折囉！這係你兜个三張學生票，祝你兜搞得歡喜！」";
      feedbackMsg = "成功購票！售票員已向您說明票價規定。";
    } else if (isMatch && nid === "food_step1" && /打折|算便宜|生日|優惠/.test(normalizedCleanText)) {
      customNpcResponse = isMandarinMode
        ? "「我們小本經營沒辦法打折啦，但我幫你湯頭煮大碗一點！這是你的餐點，請稍坐等候喔！」"
        : "「𠊎兜小本生意無辦法打折啦，但𠊎幫你湯煮大碗一點！這係你點个餐，請去坐等喔！」";
      feedbackMsg = "成功點餐！老闆已幽默說明並幫您準備餐點。";
    } else if (studentHasWrongQuantity) {
      customNpcResponse = isMandarinMode ? (nodeConfig.mandarinNpcRetryResponse || nodeConfig.npcRetryResponse) : nodeConfig.npcRetryResponse;
      feedbackMsg = "數量不符，請確認正確數量後再試一次。";
    } else if (requiresPoliteness && !studentHasPoliteness) {
      customNpcResponse = isMandarinMode ? (nodeConfig.mandarinNpcRetryResponse || nodeConfig.npcRetryResponse) : nodeConfig.npcRetryResponse;
      feedbackMsg = "缺少道謝或禮貌問候，請記得說聲謝謝（客語：恁仔細）喔！";
    } else if (!isMatch) {
      customNpcResponse = isMandarinMode ? (nodeConfig.mandarinNpcRetryResponse || nodeConfig.npcRetryResponse) : nodeConfig.npcRetryResponse;
      feedbackMsg = "語意未達標，請參考情境提示再說一次。";
    }

    const accuracyScore = isMatch ? Math.max(85, Math.round((substantiveHitAll.length / Math.max(1, primaryKeywords.length)) * 100)) : 35;

    return {
      isMatch: isMatch,
      matchedChoice: null,
      hitKeywords: substantiveHitAll.length > 0 ? substantiveHitAll : substantiveHitPrimary,
      missingKeywords: missingPrimary,
      similarity: accuracyScore,
      feedback: feedbackMsg,
      customNpcResponse: customNpcResponse
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
    // 純記憶體情境暫存：分頁切換時保持進度，按 F5 重新整理即 100% 清空重來
    this.scenarioSessions = {};

    let initialScenarioId = "zoo_chain";
    this.currentScenarioId = initialScenarioId;
    this.isRecognizing = false;
    this.isDevMode = false;
    this.speechMode = "hakka"; // "hakka" (客委會客語 ASR) | "mandarin" (瀏覽器內建華語 Web Speech)
    this.activeRecognitionInstance = null;

    this.initFreshScenario(initialScenarioId);
  }

  initFreshScenario(scenarioId) {
    this.currentScenarioId = scenarioId;
    const scenario = SCENARIOS_GRAPH[scenarioId] || SCENARIOS_GRAPH.zoo_chain;
    this.currentNodeId = scenario.startNodeId;
    this.selectedChoiceId = null; // 紀錄使用者在選擇節點挑選的分支
    this.selectedTargetBranchId = null;
    this.collectedItems = new Set(); // 用於背包自由收集任務
    this.activePackItemIndex = null; // 預設不選取到物件
    this.completedNodes = new Set();
    this.pathHistory = [this.currentNodeId];
    this.playerPos = { x: 200, y: 220 }; // 起點在入口大門
    this.targetZoneCode = "A"; // A: 大象, B: 獅子, C: 蛇
    this.nodeInteractions = {};
    this.chatHistory = []; // 💬 LINE 連續對話歷史記錄
    this.randomWeatherKey = "rain";

    if (scenarioId === "weather_outfit") {
      this.initRandomWeather();
      const initialBranch = this.randomWeatherKey
        ? (WEATHER_RANDOM_PRESETS[this.randomWeatherKey]?.targetBranchId || "weather_outfit_rain")
        : null;
      this.selectedChoiceId = this.randomWeatherKey || null;
      this.selectedTargetBranchId = initialBranch;
    }
  }

  saveCurrentScenarioSession() {
    if (!this.currentScenarioId) return;
    if (!this.scenarioSessions) this.scenarioSessions = {};
    this.scenarioSessions[this.currentScenarioId] = {
      currentNodeId: this.currentNodeId,
      selectedChoiceId: this.selectedChoiceId,
      selectedTargetBranchId: this.selectedTargetBranchId,
      collectedItems: Array.from(this.collectedItems || []),
      activePackItemIndex: this.activePackItemIndex,
      completedNodes: Array.from(this.completedNodes || []),
      pathHistory: [...(this.pathHistory || [this.currentNodeId])],
      playerPos: this.playerPos ? { ...this.playerPos } : { x: 200, y: 220 },
      targetZoneCode: this.targetZoneCode || "A",
      randomWeatherKey: this.randomWeatherKey || "rain",
      nodeInteractions: this.nodeInteractions ? { ...this.nodeInteractions } : {},
      chatHistory: Array.isArray(this.chatHistory) ? [...this.chatHistory] : []
    };
  }

  loadScenarioSession(scenarioId) {
    if (!this.scenarioSessions) this.scenarioSessions = {};
    const session = this.scenarioSessions[scenarioId];
    if (session) {
      this.currentScenarioId = scenarioId;
      this.currentNodeId = session.currentNodeId;
      this.selectedChoiceId = session.selectedChoiceId;
      this.selectedTargetBranchId = session.selectedTargetBranchId;
      this.collectedItems = new Set(session.collectedItems || []);
      this.activePackItemIndex = session.activePackItemIndex ?? null;
      this.completedNodes = new Set(session.completedNodes || []);
      this.pathHistory = Array.isArray(session.pathHistory) ? [...session.pathHistory] : [this.currentNodeId];
      this.playerPos = session.playerPos ? { ...session.playerPos } : { x: 200, y: 220 };
      this.targetZoneCode = session.targetZoneCode || "A";
      this.randomWeatherKey = session.randomWeatherKey || "rain";
      this.nodeInteractions = session.nodeInteractions ? { ...session.nodeInteractions } : {};
      this.chatHistory = Array.isArray(session.chatHistory) ? [...session.chatHistory] : [];

      if (scenarioId === "weather_outfit" && this.randomWeatherKey) {
        this.applyRandomWeather(this.randomWeatherKey);
        this.currentNodeId = session.currentNodeId;
        this.selectedTargetBranchId = session.selectedTargetBranchId;
      }
      return true;
    }
    return false;
  }

  resetScenarioSession(scenarioId) {
    if (this.scenarioSessions && this.scenarioSessions[scenarioId]) {
      delete this.scenarioSessions[scenarioId];
    }
    this.initFreshScenario(scenarioId);
  }

  addChatMessage({ stageId, stageTitle, sender, speakerName, avatar, text, isMatch = true }) {
    if (!this.chatHistory) this.chatHistory = [];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const msg = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      stageId: stageId || this.currentNodeId,
      stageTitle: stageTitle || (this.getCurrentNode()?.title || "當前關卡"),
      sender: sender || "user", // "user" | "npc"
      speakerName: speakerName || (sender === "user" ? "你" : "NPC"),
      avatar: avatar || (sender === "user" ? "🧒" : "👵"),
      text: text || "",
      isMatch: isMatch !== undefined ? isMatch : true,
      time: timeStr
    };
    this.chatHistory.push(msg);
    this.saveCurrentScenarioSession();
    return msg;
  }

  getScenarioChatHistoryText() {
    if (!this.chatHistory || this.chatHistory.length === 0) return "";
    const lines = ["【本情境先前對話歷程（學生已說過的內容與 NPC 回應紀錄）】："];
    this.chatHistory.forEach((msg) => {
      const roleStr = msg.sender === "user" ? "學生" : msg.speakerName;
      lines.push(`- [${msg.stageTitle}] ${roleStr}: ${msg.text}`);
    });
    return lines.join("\n");
  }

  saveCurrentNodeInteraction(record) {
    if (!this.nodeInteractions) this.nodeInteractions = {};
    this.nodeInteractions[this.currentNodeId] = record;
    this.saveCurrentScenarioSession();
  }

  getCurrentNodeInteraction() {
    if (!this.nodeInteractions) return null;
    return this.nodeInteractions[this.currentNodeId] || null;
  }

  clearCurrentNodeInteraction() {
    if (this.nodeInteractions && this.nodeInteractions[this.currentNodeId]) {
      delete this.nodeInteractions[this.currentNodeId];
      this.saveCurrentScenarioSession();
    }
  }

  initRandomWeather() {
    const keys = ["rain", "hot", "cold"];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    this.applyRandomWeather(randomKey);
  }

  applyRandomWeather(key) {
    this.randomWeatherKey = key;
    const preset = WEATHER_RANDOM_PRESETS[key] || WEATHER_RANDOM_PRESETS.rain;
    const weatherScenario = SCENARIOS_GRAPH.weather_outfit;
    if (weatherScenario && weatherScenario.nodes && weatherScenario.nodes.weather_choose_type) {
      const node = weatherScenario.nodes.weather_choose_type;
      node.locationTag = preset.locationTag;
      node.storyPrompt = preset.storyPrompt;
      node.mandarinStoryPrompt = preset.mandarinStoryPrompt;
      node.targetHakka = preset.targetHakka;
      node.targetMandarin = preset.targetMandarin;
      node.keywords = preset.keywords;
      node.mandarinKeywords = preset.mandarinKeywords;
      node.altKeywords = preset.altKeywords;
      node.currentWeatherPreset = preset;
      node.image = preset.image;
      node.nextNodeId = preset.targetBranchId;
      weatherScenario.bannerImage = preset.image;
    }
    this.selectedTargetBranchId = preset.targetBranchId;
    this.selectedChoiceId = key;

    // 若當前節點已在步驟 2 分支，同步切換至對應天氣之分支節點
    if (this.currentNodeId && this.currentNodeId.startsWith("weather_outfit_")) {
      this.currentNodeId = preset.targetBranchId;
      if (!this.pathHistory.includes(preset.targetBranchId)) {
        this.pathHistory.push(preset.targetBranchId);
      }
    }
  }

  getScenario() {
    return SCENARIOS_GRAPH[this.currentScenarioId] || SCENARIOS_GRAPH.zoo_chain;
  }

  getCurrentNode() {
    const scenario = this.getScenario();
    const node = scenario.nodes[this.currentNodeId] || scenario.nodes[scenario.startNodeId];
    if (node && node.id === "bus_arrive") {
      const branchId = this.selectedTargetBranchId || "bus_ask_culture";
      const routeInfo = BUS_ARRIVE_ROUTES[branchId] || BUS_ARRIVE_ROUTES.bus_ask_culture;
      return {
        ...node,
        storyPrompt: routeInfo.storyPrompt,
        mandarinStoryPrompt: routeInfo.mandarinStoryPrompt,
        targetHakka: routeInfo.targetHakka,
        targetMandarin: routeInfo.targetMandarin,
        keywords: routeInfo.keywords,
        mandarinKeywords: routeInfo.mandarinKeywords,
        altKeywords: routeInfo.altKeywords
      };
    }
    if (node && node.id === "weather_done") {
      const branchId = this.selectedTargetBranchId || "weather_outfit_rain";
      const weatherPrompts = {
        weather_outfit_rain: {
          storyPrompt: "穿戴好雨衣與雨傘等防雨裝備後，你站在玄關門口精神飽滿地向媽媽道別準備出發。你說：",
          mandarinStoryPrompt: "穿戴好雨衣與雨傘等防雨裝備後，你站在玄關門口精神飽滿地向媽媽道別準備出發。你說："
        },
        weather_outfit_hot: {
          storyPrompt: "穿戴好短袖短褲與遮陽帽等防曬裝備後，你站在玄關門口精神飽滿地向媽媽道別準備出發。你說：",
          mandarinStoryPrompt: "穿戴好短袖短褲與遮陽帽等防曬裝備後，你站在玄關門口精神飽滿地向媽媽道別準備出發。你說："
        },
        weather_outfit_cold: {
          storyPrompt: "穿戴好厚大衣與圍巾等保暖裝備後，你站在玄關門口精神飽滿地向媽媽道別準備出發。你說：",
          mandarinStoryPrompt: "穿戴好厚大衣與圍巾等保暖裝備後，你站在玄關門口精神飽滿地向媽媽道別準備出發。你說："
        }
      };
      const info = weatherPrompts[branchId] || weatherPrompts.weather_outfit_rain;
      return {
        ...node,
        storyPrompt: info.storyPrompt,
        mandarinStoryPrompt: info.mandarinStoryPrompt
      };
    }
    return node;
  }

  setScenario(scenarioId) {
    if (SCENARIOS_GRAPH[scenarioId]) {
      // 1. 切換前先暫存當前情境所有關卡進度與回答記錄
      this.saveCurrentScenarioSession();

      this.currentScenarioId = scenarioId;
      try {
        localStorage.setItem("chainQuest_activeScenario", scenarioId);
      } catch (e) {}

      // 2. 如果目標情境有暫存 session，載入它；否則初始化新情境
      if (this.scenarioSessions && this.scenarioSessions[scenarioId]) {
        this.loadScenarioSession(scenarioId);
      } else {
        this.initFreshScenario(scenarioId);
      }
    }
  }

  setNode(nodeId) {
    const scenario = this.getScenario();
    if (scenario.nodes[nodeId]) {
      this.currentNodeId = nodeId;
      if (!this.pathHistory.includes(nodeId)) {
        this.pathHistory.push(nodeId);
      }
      this.saveCurrentScenarioSession();
    }
  }

  markCurrentNodeCompleted() {
    this.completedNodes.add(this.currentNodeId);
    this.saveCurrentScenarioSession();
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
    this.logicalWidth = 400;
    this.logicalHeight = 250;
    this.dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    this.setupCanvasResolution();

    // 園區關鍵地標座標 (邏輯寬 400, 高 250) - 展區以問號呈現，讓學生依導覽員口說指引自行尋路
    this.zones = {
      GATE: { x: 200, y: 220, label: "大門入口", icon: "🚪", color: "#64748b" },
      FORK: { x: 200, y: 130, label: "十字分岔", icon: "🚏", color: "#3b82f6" },
      A: { x: 65, y: 55, label: "展區 A", code: "A", icon: "❓", radius: 36, color: "#10b981", fullLabel: "🐘 大象展區" },
      B: { x: 200, y: 45, label: "展區 B", code: "B", icon: "❓", radius: 36, color: "#f59e0b", fullLabel: "🦁 獅子展區" },
      C: { x: 335, y: 55, label: "展區 C", code: "C", icon: "❓", radius: 36, color: "#8b5cf6", fullLabel: "🐍 蛇展區" }
    };

    this.player = { x: 200, y: 220, targetX: 200, targetY: 220, speed: 4 };
    this.targetCode = "A";
    this.animId = null;
    this.hasTriggeredArrival = false;

    this.initEvents();
  }

  setupCanvasResolution() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.round(rect.width || this.logicalWidth));
    const cssHeight = Math.max(1, Math.round(rect.height || this.logicalHeight));
    const pixelWidth = Math.round(cssWidth * this.dpr);
    const pixelHeight = Math.round(cssHeight * this.dpr);
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.ctx.setTransform(pixelWidth / this.logicalWidth, 0, 0, pixelHeight / this.logicalHeight, 0, 0);
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
    for (const code of ["A", "B", "C"]) {
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
      const scaleX = this.logicalWidth / rect.width;
      const scaleY = this.logicalHeight / rect.height;
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
    this.setupCanvasResolution();
    const w = this.logicalWidth;
    const h = this.logicalHeight;

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
    ctx.stroke();

    // 步道邊線
    ctx.strokeStyle = "#ffd54f";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. 裝飾：小樹林與水池
    this.drawDecorations(ctx);

    // 4. 繪製地標展區目標
    ["A", "B", "C"].forEach((code) => {
      const zone = this.zones[code];

      // 展區圓形地基
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#6366f1";
      ctx.stroke();

      // 圖示 (A, B, C 均為 ❓)
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(zone.icon, zone.x, zone.y - 4);

      // 地標文字 (展區 A / 展區 B / 展區 C)
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = "#334155";
      ctx.fillText(zone.label, zone.x, zone.y + 18);
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

    // 7. 繪製右下角精緻指北針 (Compass Rose)
    this.drawCompass(ctx, 368, 38, 18);
  }

  drawCompass(ctx, x, y, radius = 18) {
    ctx.save();
    
    // 背景圓盤
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "#94a3b8";
    ctx.stroke();

    // 內圈虛線
    ctx.shadowColor = "transparent";
    ctx.beginPath();
    ctx.arc(x, y, radius - 3.5, 0, Math.PI * 2);
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = "#cbd5e1";
    ctx.setLineDash([2, 2]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 北指針 (紅色三角)
    ctx.beginPath();
    ctx.moveTo(x, y - (radius - 4));
    ctx.lineTo(x - 3.5, y);
    ctx.lineTo(x, y - 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y - (radius - 4));
    ctx.lineTo(x + 3.5, y);
    ctx.lineTo(x, y - 2);
    ctx.fillStyle = "#dc2626";
    ctx.fill();

    // 南指針 (灰藍色三角)
    ctx.beginPath();
    ctx.moveTo(x, y + (radius - 4));
    ctx.lineTo(x - 3.5, y);
    ctx.lineTo(x, y + 2);
    ctx.fillStyle = "#94a3b8";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, y + (radius - 4));
    ctx.lineTo(x + 3.5, y);
    ctx.lineTo(x, y + 2);
    ctx.fillStyle = "#64748b";
    ctx.fill();

    // 中心微型轉軸
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#1e293b";
    ctx.fill();

    // 方位文字標示 (北、東、南、西)
    ctx.font = "900 7px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "#ef4444";
    ctx.fillText("北", x, y - radius + 3.5);

    ctx.font = "800 6px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText("東", x + radius - 4, y);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("南", x, y + radius - 3);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("西", x - radius + 4, y);

    ctx.restore();
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
    this.restorePersistedSettings();
    this.bindEvents();
    this.initMapEngine();
    this.render();
  }

  restorePersistedSettings() {
    try {
      const savedDevMode = localStorage.getItem("chainQuest_devModeOpen");
      if (savedDevMode !== null) {
        const isDevOpen = savedDevMode === "true";
        this.setDevMode(isDevOpen);
      }
    } catch (e) {}
  }

  initElements() {
    const byId = (id) => document.getElementById(id);

    this.els = {
      // 導覽標籤與開關
      navTabs: document.querySelectorAll(".nav-tab"),
      resetCurrentScenarioBtn: byId("resetCurrentScenarioBtn"),
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
      scenarioCharacterSprite: byId("scenarioCharacterSprite"),
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

      // 方案 C：對話歷史抽屜面板元件
      openHistoryDrawerBtn: byId("openHistoryDrawerBtn"),
      historyCountBadge: byId("historyCountBadge"),
      historyDrawer: byId("historyDrawer"),
      historyDrawerBackdrop: byId("historyDrawerBackdrop"),
      closeHistoryDrawerBtn: byId("closeHistoryDrawerBtn"),
      clearHistoryDrawerBtn: byId("clearHistoryDrawerBtn"),
      historyDrawerTitle: byId("historyDrawerTitle"),
      historyDrawerSub: byId("historyDrawerSub"),
      historySummaryText: byId("historySummaryText"),
      chatDialogueStream: byId("chatDialogueStream"),

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
      devLlmStatusTag: byId("devLlmStatusTag"),
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

    // 2.3 方案 C：對話歷史抽屜開關事件
    if (this.els.openHistoryDrawerBtn) {
      this.els.openHistoryDrawerBtn.addEventListener("click", () => this.toggleHistoryDrawer(true));
    }
    if (this.els.closeHistoryDrawerBtn) {
      this.els.closeHistoryDrawerBtn.addEventListener("click", () => this.toggleHistoryDrawer(false));
    }
    if (this.els.historyDrawerBackdrop) {
      this.els.historyDrawerBackdrop.addEventListener("click", () => this.toggleHistoryDrawer(false));
    }
    if (this.els.clearHistoryDrawerBtn) {
      this.els.clearHistoryDrawerBtn.addEventListener("click", () => {
        SoundFX.select();
        this.state.resetScenarioSession(this.state.currentScenarioId);
        this.render();
      });
    }
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isHistoryDrawerOpen) {
        this.toggleHistoryDrawer(false);
      }
    });

    // 2.5 頂部單一分頁進度重置按鈕 (只重置當前分頁暫存，回到第一關)
    if (this.els.resetCurrentScenarioBtn) {
      this.els.resetCurrentScenarioBtn.addEventListener("click", () => {
        SoundFX.select();
        this.state.resetScenarioSession(this.state.currentScenarioId);
        this.render();
      });
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
        this.state.resetScenarioSession(this.state.currentScenarioId);
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

    // 啟動時自動偵測後端 LLM 服務與模型
    this.detectLlmService();
  }

  async detectLlmService() {
    try {
      const targetEndpoint = LLMServiceAdapter.config.apiEndpoint || "/api/judge";
      const res = await fetch(targetEndpoint, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (data && data.model) {
          const provider = data.provider || "Claude";
          if (this.els.devLlmStatusTag) {
            this.els.devLlmStatusTag.textContent = `${provider} (${data.model})`;
            this.els.devLlmStatusTag.style.background = "#dcfce7";
            this.els.devLlmStatusTag.style.color = "#15803d";
          }
          return;
        }
      }
    } catch (e) {}
    if (this.els.devLlmStatusTag) {
      this.els.devLlmStatusTag.textContent = "Claude (/api/judge)";
    }
  }

  setDevMode(isOpen) {
    this.state.isDevMode = isOpen;
    if (this.els.layoutShell) this.els.layoutShell.classList.toggle("is-dev-open", isOpen);
    if (this.els.debugToggle) this.els.debugToggle.checked = isOpen;
    try {
      localStorage.setItem("chainQuest_devModeOpen", isOpen ? "true" : "false");
    } catch (e) {}
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
      if (this.els.recordBtnText) this.els.recordBtnText.textContent = "點擊錄音 (華語)";
      if (this.els.statusTip) this.els.statusTip.textContent = "🗣️ 華語對照模式：請點擊下方按鈕開始說華語，說完再點一次送出！";
      if (pipeStep1Title) pipeStep1Title.textContent = "1️⃣ 華語 ASR 語音轉文字 (瀏覽器內建)";
      if (this.els.pipeMtBadge) {
        this.els.pipeMtBadge.textContent = "華語直通";
        this.els.pipeMtBadge.className = "pipeline-badge badge-success";
      }
      if (this.els.pipeMtText) this.els.pipeMtText.textContent = "（華語模式：已略過客轉華轉譯直通）";
    } else {
      if (this.els.recordBtnIcon) this.els.recordBtnIcon.textContent = "🎙️";
      if (this.els.recordBtnText) this.els.recordBtnText.textContent = "點擊錄音";
      if (this.els.statusTip) this.els.statusTip.textContent = "請點擊下方按鈕開始用客語說話，說完再點一次送出！";
      if (pipeStep1Title) pipeStep1Title.textContent = "1️⃣ 客語 ASR 語音轉文字 (客委會)";
      if (this.els.pipeMtBadge) {
        this.els.pipeMtBadge.textContent = "待處理";
        this.els.pipeMtBadge.className = "pipeline-badge badge-pending";
      }
      if (this.els.pipeMtText) this.els.pipeMtText.textContent = "（等待客語發音翻譯...）";
    }
    this.render();
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
      if (this.state.activePackItemIndex !== null && this.state.activePackItemIndex !== undefined && this.state.activePackItemIndex >= 0) {
        return node.items[this.state.activePackItemIndex] || node;
      }
      return node;
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
    const dialogueHistoryText = this.state.getScenarioChatHistoryText();
    const evalResult = await LLMServiceAdapter.evaluate({
      hakkaTranscript: isMandarinMode ? "" : userText,
      mandarinTranscript: mandarinText,
      nodeConfig,
      scenario,
      speechMode: this.state.speechMode,
      dialogueHistoryText
    });
    this.updatePipelineStep(3, evalResult.isMatch ? "success" : "fail", evalResult);

    // 呈現學生氣泡
    if (this.els.studentSpeechBubble) this.els.studentSpeechBubble.hidden = false;
    if (this.els.studentTranscriptText) this.els.studentTranscriptText.textContent = `「${userText}」`;

    // 更新並呈現新節點之 NPC 角色與回應
    if (this.els.npcAvatar) this.els.npcAvatar.textContent = nodeConfig.npcAvatar || "👵";
    if (this.els.npcRoleName) this.els.npcRoleName.textContent = nodeConfig.npcRole || "NPC";

    let dynamicReply = "";

    if (evalResult.isMatch) {
      SoundFX.success();
      if (this.els.statusDot) this.els.statusDot.className = "status-dot is-success";

      const currentNode = this.state.getCurrentNode();
      dynamicReply = evalResult.dynamicNpcResponse || nodeConfig.mandarinNpcSuccessResponse || nodeConfig.npcSuccessResponse;

      // 若為「選擇節點」
      if (currentNode.nodeType === "選擇") {
        const choice = evalResult.matchedChoice || LLMServiceAdapter.resolveMatchedChoice(currentNode, evalResult, userText, mandarinText) || (currentNode.choices ? currentNode.choices[0] : null);
        if (choice) {
          this.state.selectedChoiceId = choice.id;
          this.state.selectedTargetBranchId = choice.targetBranchId;
          if (choice.zoneCode) this.state.targetZoneCode = choice.zoneCode;

          if (this.els.npcDialogText) {
            this.els.npcDialogText.textContent = dynamicReply;
          }
        }
        this.state.markCurrentNodeCompleted();
        const choiceTitle = choice ? choice.title : "";
        if (this.els.statusTip) {
          this.els.statusTip.textContent = isMandarinMode ? `✓ [華語模式] 成功選定【${choiceTitle}】！請點擊【繼續前進】。` : `✓ 已辨識你的選擇【${choiceTitle}】！請點擊【繼續前進】。`;
        }
        if (this.els.nextStepBtnText) this.els.nextStepBtnText.textContent = "繼續前進 ➔";
        if (this.els.nextStepBtn) this.els.nextStepBtn.hidden = false;
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
          this.els.statusTip.textContent = isAllCollected ? "🎉 4 樣背包物品全數裝入完成！請點選下方【前往下一關】！" : `✓【${nodeConfig.name || "物品"}】已成功放入背包！請點選桌上其他物品繼續整理。`;
        }

        // 刷新桌上物品 Canvas 的勾選狀態與計數
        const maskCanvas = document.querySelector(".pack-mask-canvas");
        if (maskCanvas) this.renderPackMaskCanvas(currentNode, maskCanvas);
        const packCount = document.querySelector(".backpack-count");
        if (packCount) packCount.textContent = `已收集 ${this.state.collectedItems.size} / ${totalItems} 項`;

        // 收集任務中，若尚未全收集則隱藏單步前進按鈕，引導點選桌上物品
        if (this.els.nextStepBtn) {
          this.els.nextStepBtn.hidden = !isAllCollected;
        }

        if (isAllCollected) {
          const existingAction = document.querySelector(".backpack-next-action");
          if (!existingAction) {
            const backpackPanel = document.querySelector(".backpack-panel");
            if (backpackPanel) {
              const actionDiv = document.createElement("div");
              actionDiv.className = "backpack-next-action";
              actionDiv.innerHTML = `
                <div class="backpack-next-hint">🎉 4 樣物品已全數打包齊全！</div>
                <button id="btnPackGoNext" type="button" class="btn-pack-go-next">
                  <span>🎒 前往下一關（關卡 2：玄關出發）</span>
                  <span>➔</span>
                </button>
              `;
              backpackPanel.appendChild(actionDiv);
              actionDiv.querySelector("#btnPackGoNext")?.addEventListener("click", () => {
                SoundFX.success();
                this.advanceToNextNode();
              });
            }
          }
        }
      }
      // 一般主線/分支/集合點
      else {
        this.state.markCurrentNodeCompleted();
        if (this.els.npcDialogText) {
          this.els.npcDialogText.textContent = dynamicReply;
        }
        if (this.els.statusTip) this.els.statusTip.textContent = isMandarinMode ? "✓ [華語模式] 辨識通過！請點擊【繼續前進】。" : "✓ 辨識成功！請點擊【繼續前進】。";
        if (this.els.nextStepBtnText) this.els.nextStepBtnText.textContent = "繼續前進 ➔";
        if (this.els.nextStepBtn) this.els.nextStepBtn.hidden = false;
      }
      if (this.els.npcResponseSection) this.els.npcResponseSection.hidden = false;
    } else {
      SoundFX.error();
      if (this.els.statusDot) this.els.statusDot.className = "status-dot is-error";
      if (this.els.nextStepBtn) this.els.nextStepBtn.hidden = true;
      dynamicReply = evalResult.dynamicNpcResponse || (isMandarinMode ? (nodeConfig.mandarinNpcRetryResponse || nodeConfig.npcRetryResponse) : nodeConfig.npcRetryResponse);
      if (this.els.npcDialogText) {
        this.els.npcDialogText.textContent = dynamicReply;
      }
      if (this.els.statusTip) {
        this.els.statusTip.textContent = isMandarinMode ? "⚠️ 華語語意未達標，請依照提示再試一次。" : "⚠️ 發音或關鍵字未命中，請參考提示再試一次。";
      }
      if (this.els.npcResponseSection) this.els.npcResponseSection.hidden = false;
    }

    // 💬 同步寫入 LINE 連續對話歷程
    const stageTitle = nodeConfig.title || this.state.getCurrentNode()?.title || "當前關卡";
    this.state.addChatMessage({
      stageId: this.state.currentNodeId,
      stageTitle: stageTitle,
      sender: "user",
      speakerName: "你",
      avatar: "🧒",
      text: userText,
      isMatch: evalResult.isMatch
    });
    this.state.addChatMessage({
      stageId: this.state.currentNodeId,
      stageTitle: stageTitle,
      sender: "npc",
      speakerName: nodeConfig.npcRole || "NPC",
      avatar: nodeConfig.npcAvatar || "👵",
      text: dynamicReply,
      isMatch: evalResult.isMatch
    });
    this.renderChatStream();

    // 儲存此節點之互動記錄 (供分頁切換暫存與回溯)
    const interactionRecord = {
      nodeId: this.state.currentNodeId,
      userText,
      mandarinText,
      isMatch: evalResult.isMatch,
      dynamicReply: this.els.npcDialogText ? this.els.npcDialogText.textContent : "",
      npcRole: nodeConfig.npcRole || "NPC",
      npcAvatar: nodeConfig.npcAvatar || "👵",
      statusTipText: this.els.statusTip ? this.els.statusTip.textContent : "",
      statusDotClass: this.els.statusDot ? this.els.statusDot.className : "",
      showNextStepBtn: this.els.nextStepBtn ? !this.els.nextStepBtn.hidden : false,
      nextStepBtnText: this.els.nextStepBtnText ? this.els.nextStepBtnText.textContent : "繼續前進 ➔",
      evalResult,
      pipelineState: {
        step1: {
          status: this.els.pipeAsrBadge ? this.els.pipeAsrBadge.className.replace(/.*badge-/, "") : "success",
          text: this.els.pipeAsrText ? this.els.pipeAsrText.textContent : asrDisplay
        },
        step2: {
          status: this.els.pipeMtBadge ? this.els.pipeMtBadge.className.replace(/.*badge-/, "") : "success",
          text: this.els.pipeMtText ? this.els.pipeMtText.textContent : mandarinText,
          extraInfo: hitTerms
        },
        step3: {
          status: evalResult.isMatch ? "success" : "fail",
          data: evalResult
        }
      }
    };
    this.state.saveCurrentNodeInteraction(interactionRecord);

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
        if (status === "running") {
          this.els.pipeLlmBadge.className = "pipeline-badge badge-running";
          this.els.pipeLlmBadge.textContent = "評審中...";
        } else if (data?.isRateLimited) {
          this.els.pipeLlmBadge.className = "pipeline-badge badge-pending";
          this.els.pipeLlmBadge.textContent = "⏳ 頻率冷卻 (429)";
        } else {
          this.els.pipeLlmBadge.className = `pipeline-badge badge-${status}`;
          this.els.pipeLlmBadge.textContent = status === "success" ? "判定通過" : "未命中重試";
        }
      }
      if (this.els.pipeStep3Card) {
        this.els.pipeStep3Card.className = `pipeline-step-card is-${status}`;
      }
      if (status !== "running" && data) {
        if (this.els.pipeLlmResult) {
          if (data.isRateLimited) {
            this.els.pipeLlmResult.textContent = "⏳ 請求頻率飽和 (Rate Limit 429) [已觸發 NPC 情境緩衝]";
            this.els.pipeLlmResult.style.color = "#f59e0b";
          } else {
            const sourceTag = data.isFromAPI ? ` [☁️ ${data.provider || data.modelUsed || 'Claude'}]` : " [🛡️ 本地安全網]";
            this.els.pipeLlmResult.textContent = (data.isMatch ? "✓ 通過 (Match)" : "⚠️ 未命中重試 (Retry)") + sourceTag;
            this.els.pipeLlmResult.style.color = data.isMatch ? "#34d399" : "#f87171";
            if (data.isFromAPI && (data.modelUsed || data.provider) && this.els.devLlmStatusTag) {
              this.els.devLlmStatusTag.textContent = `${data.provider || 'Claude'} (${data.modelUsed || '/api/judge'})`;
            }
          }
        }
        if (this.els.pipeLlmIntent) {
          this.els.pipeLlmIntent.textContent = data.isRateLimited ? "⚠️ 429 頻率冷卻 (請等 5 秒)" : (data.intent || "無");
        }
        if (this.els.pipeLlmScore) {
          this.els.pipeLlmScore.textContent = data.isRateLimited ? "冷卻 5s" : `${data.semanticAccuracy}%`;
        }
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
    if (this.els.nextStepBtn) this.els.nextStepBtn.hidden = true;
    if (this.els.studentSpeechBubble) {
      this.els.studentSpeechBubble.hidden = true;
      if (this.els.studentTranscriptText) this.els.studentTranscriptText.textContent = "";
    }
    if (this.els.npcResponseSection) {
      this.els.npcResponseSection.hidden = true;
      if (this.els.npcDialogText) this.els.npcDialogText.textContent = "";
      if (this.els.npcAvatar) this.els.npcAvatar.textContent = node.npcAvatar || "👵";
      if (this.els.npcRoleName) this.els.npcRoleName.textContent = node.npcRole || "NPC";
    }
    if (this.els.statusDot) this.els.statusDot.className = "status-dot";

    // 情境看板
    let bannerSrc = node.image || node.bannerImage || scenario.bannerImage;
    if (scenario.id === "weather_outfit") {
      const currentPreset = WEATHER_RANDOM_PRESETS[this.state.randomWeatherKey] || WEATHER_RANDOM_PRESETS.rain;
      if (node.id === "weather_choose_type") {
        bannerSrc = currentPreset.image || "./assets/weather-observe-rain.png";
      } else if (node.id === "weather_done") {
        const branchId = this.state.selectedTargetBranchId || currentPreset.targetBranchId;
        const branchNode = scenario.nodes[branchId];
        if (branchNode && branchNode.image) {
          bannerSrc = branchNode.image;
        }
      }
    } else if (scenario.id === "health_center" && node.id === "health_rest") {
      const branchId = this.state.selectedTargetBranchId || "health_symptom_head";
      const healthRestImages = {
        health_symptom_head: "./assets/health-action-warm-water.png",
        health_symptom_scratch: "./assets/health-action-bandage.png",
        health_symptom_fever: "./assets/health-rest-bed.png"
      };
      bannerSrc = healthRestImages[branchId] || node.image || scenario.bannerImage;
    }
    if (this.els.scenarioBannerImg && bannerSrc) {
      this.els.scenarioBannerImg.src = bannerSrc;
      this.els.scenarioBannerImg.style.objectFit = node.objectFit || scenario.objectFit || "cover";
      this.els.scenarioBannerImg.style.objectPosition = node.objectPosition || scenario.objectPosition || "50% 50%";
    }
    if (this.els.scenarioCharacterSprite) {
      this.els.scenarioCharacterSprite.className = "showcase-character-sprite";
      if (node.characterSprite) {
        this.els.scenarioCharacterSprite.src = node.characterSprite;
        if (node.characterSpriteClass) {
          this.els.scenarioCharacterSprite.classList.add(node.characterSpriteClass);
        }
        this.els.scenarioCharacterSprite.hidden = false;
      } else {
        this.els.scenarioCharacterSprite.hidden = true;
        this.els.scenarioCharacterSprite.removeAttribute("src");
      }
    }
    if (this.els.showcaseTitle) this.els.showcaseTitle.textContent = scenario.title;
    if (this.els.showcaseLocTag) this.els.showcaseLocTag.textContent = `📍 ${node.locationTag}`;
    if (this.els.showcaseStepTag) this.els.showcaseStepTag.textContent = `節點：${node.title}`;

    // 左側情境資訊
    const isMandarin = this.state.speechMode === "mandarin";
    if (this.els.themeIcon) this.els.themeIcon.textContent = scenario.icon;
    if (this.els.scenarioTitle) this.els.scenarioTitle.textContent = scenario.title;
    if (this.els.scenarioObjective) {
      this.els.scenarioObjective.textContent = isMandarin ? (scenario.mandarinObjective || scenario.objective) : scenario.objective;
    }

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

    // 恢復暫存的互動記錄 (學生發音、NPC回應、流水線卡片、按鈕狀態)
    const savedInteraction = this.state.getCurrentNodeInteraction();
    if (savedInteraction) {
      this.restoreSavedInteraction(savedInteraction, node);
    }

    // 渲染 LINE 連續對話流
    this.renderChatStream();

    // 渲染開發者面板與分支切換器
    this.renderDevSidebar(node, savedInteraction ? {
      transcript: savedInteraction.userText,
      mandarinText: savedInteraction.mandarinText,
      evalResult: savedInteraction.evalResult
    } : null);
  }

  // 方案 C：切換對話歷史抽屜開關
  toggleHistoryDrawer(isOpen) {
    this.isHistoryDrawerOpen = isOpen;
    SoundFX.select();
    if (this.els.historyDrawerBackdrop) {
      this.els.historyDrawerBackdrop.hidden = !isOpen;
      if (isOpen) {
        requestAnimationFrame(() => {
          this.els.historyDrawerBackdrop?.classList.add("is-open");
        });
      } else {
        this.els.historyDrawerBackdrop.classList.remove("is-open");
      }
    }
    if (this.els.historyDrawer) {
      this.els.historyDrawer.hidden = !isOpen;
      if (isOpen) {
        requestAnimationFrame(() => {
          this.els.historyDrawer?.classList.add("is-open");
        });
      } else {
        this.els.historyDrawer.classList.remove("is-open");
      }
    }
    if (isOpen) {
      this.renderChatStream();
    }
  }

  // 渲染 LINE 連續對話歷史流 (方案 C：抽屜內部渲染與徽章同步)
  renderChatStream() {
    const history = this.state.chatHistory || [];
    const scenario = this.state.getScenario();

    // 1. 即時更新頂部按鈕的對話則數徽章
    if (this.els.historyCountBadge) {
      if (history.length > 0) {
        this.els.historyCountBadge.hidden = false;
        this.els.historyCountBadge.textContent = String(history.length);
      } else {
        this.els.historyCountBadge.hidden = true;
        this.els.historyCountBadge.textContent = "0";
      }
    }

    // 2. 即時更新抽屜標題與統計
    if (this.els.historyDrawerSub && scenario) {
      this.els.historyDrawerSub.textContent = `${scenario.icon || ""} ${scenario.title || "生活任務"}`;
    }
    if (this.els.historySummaryText) {
      const turns = Math.ceil(history.length / 2);
      this.els.historySummaryText.textContent = `共 ${history.length} 則對話紀錄（${turns} 輪互動）`;
    }

    if (!this.els.chatDialogueStream) return;
    const streamEl = this.els.chatDialogueStream;

    // 3. 若無對話紀錄，顯示親切引導圖文
    if (history.length === 0) {
      const scenarioTitle = scenario?.title || "本情境";
      streamEl.innerHTML = `
        <div class="chat-empty-hint" style="flex-direction:column;text-align:center;padding:36px 18px;">
          <span style="font-size:38px;margin-bottom:10px;">💬</span>
          <strong style="color:#334155;font-size:14.5px;">【${scenarioTitle}】尚未開始對話</strong>
          <p style="margin-top:8px;line-height:1.65;font-size:12px;color:#64748b;">
            只要在主畫面開口說話，無論第 1 關、第 2 關或後續關卡，<br>
            所有角色的發言與回覆都會<strong>依時間順序完整記錄在此視窗中</strong>！
          </p>
        </div>
      `;
      return;
    }

    const escapeHtmlSafe = (str) => {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    let html = "";
    let lastStageTitle = "";

    history.forEach((msg) => {
      if (msg.stageTitle && msg.stageTitle !== lastStageTitle) {
        lastStageTitle = msg.stageTitle;
        html += `
          <div class="chat-stage-divider">
            <span class="chat-stage-pill">📍 ${escapeHtmlSafe(msg.stageTitle)}</span>
          </div>
        `;
      }

      const isUser = msg.sender === "user";
      const bubbleClass = isUser
        ? "user-bubble"
        : (msg.isMatch ? "npc-bubble is-success" : "npc-bubble is-retry");

      const statusBadge = isUser
        ? (msg.isMatch
            ? `<span class="chat-bubble-status is-pass">✓ 通過</span>`
            : `<span class="chat-bubble-status is-fail">⚠️ 需調整</span>`)
        : "";

      html += `
        <div class="chat-msg-row ${isUser ? 'is-user' : 'is-npc'}">
          <div class="chat-avatar">${msg.avatar || (isUser ? '🧒' : '👵')}</div>
          <div class="chat-bubble-wrap">
            <div class="chat-meta">
              <span class="chat-sender-name">${escapeHtmlSafe(msg.speakerName || (isUser ? '你' : 'NPC'))}</span>
              <span class="chat-time">${msg.time || ''}</span>
            </div>
            <div class="chat-bubble ${bubbleClass}">
              ${escapeHtmlSafe(msg.text || '')}
            </div>
            ${statusBadge}
          </div>
        </div>
      `;
    });

    streamEl.innerHTML = html;
    setTimeout(() => {
      streamEl.scrollTop = streamEl.scrollHeight;
    }, 40);
  }

  restoreSavedInteraction(savedInteraction, node) {
    if (!savedInteraction) return;

    // 1. 學生語音氣泡
    if (this.els.studentSpeechBubble) {
      this.els.studentSpeechBubble.hidden = false;
    }
    if (this.els.studentTranscriptText) {
      this.els.studentTranscriptText.textContent = `「${savedInteraction.userText || ""}」`;
    }

    // 2. NPC 回應區塊
    if (this.els.npcResponseSection) {
      this.els.npcResponseSection.hidden = false;
    }
    if (this.els.npcAvatar) {
      this.els.npcAvatar.textContent = savedInteraction.npcAvatar || node.npcAvatar || "👵";
    }
    if (this.els.npcRoleName) {
      this.els.npcRoleName.textContent = savedInteraction.npcRole || node.npcRole || "NPC";
    }
    if (this.els.npcDialogText) {
      this.els.npcDialogText.textContent = savedInteraction.dynamicReply || "";
    }

    // 3. 狀態燈與提示語
    if (this.els.statusDot) {
      this.els.statusDot.className = savedInteraction.statusDotClass || (savedInteraction.isMatch ? "status-dot is-success" : "status-dot is-error");
    }
    if (this.els.statusTip && savedInteraction.statusTipText) {
      this.els.statusTip.textContent = savedInteraction.statusTipText;
    }

    // 4. 前進下一關按鈕
    if (this.els.nextStepBtn && savedInteraction.showNextStepBtn !== undefined) {
      this.els.nextStepBtn.hidden = !savedInteraction.showNextStepBtn;
    }
    if (this.els.nextStepBtnText && savedInteraction.nextStepBtnText) {
      this.els.nextStepBtnText.textContent = savedInteraction.nextStepBtnText;
    }

    // 5. 流水線步驟卡片
    if (savedInteraction.pipelineState) {
      const ps = savedInteraction.pipelineState;
      if (ps.step1) this.updatePipelineStep(1, ps.step1.status, ps.step1.text);
      if (ps.step2) this.updatePipelineStep(2, ps.step2.status, ps.step2.text, ps.step2.extraInfo);
      if (ps.step3) this.updatePipelineStep(3, ps.step3.status, ps.step3.data);
    }
  }

  cleanupDynamicSections() {
    document.querySelectorAll(".choice-action-section, .backpack-panel, .map-action-section, .street-map-section").forEach(el => el.remove());
  }

  // 1. 渲染動態任務關卡進度 Step Tracker
  renderStepTracker(scenario, currentNode) {
    if (!this.els.stepTracker) return;

    // 根據已完成進度逐關顯示任務清單，避免一開始就露出後續關卡。
    const visibleSteps = [];
    const isDone = (id) => this.state.completedNodes.has(id);
    const isHere = (id) => currentNode.id === id;
    const isDoneOrHere = (id) => isDone(id) || isHere(id);
    const isAnyDoneOrHere = (ids) => ids.some(id => isDoneOrHere(id));
    const pickBranchId = (ids, fallbackId) => {
      if (ids.includes(this.state.selectedTargetBranchId)) return this.state.selectedTargetBranchId;
      if (ids.includes(currentNode.id)) return currentNode.id;
      const completedBranch = ids.find(id => isDone(id));
      return completedBranch || fallbackId;
    };

    if (scenario.id === "zoo_chain") {
      visibleSteps.push({ id: "zoo_start", title: "第一關：購票入園" });
      const zooBranches = ["zoo_elephant", "zoo_lion", "zoo_snake"];
      const zooBranchId = pickBranchId(zooBranches, "zoo_elephant");
      const hasZooBranchProgress = isAnyDoneOrHere(zooBranches);
      if (isDone("zoo_start") || isAnyDoneOrHere(["zoo_gate", "zoo_choose_animal", "zoo_map_nav", "zoo_meet_point"]) || hasZooBranchProgress) {
        visibleSteps.push({ id: "zoo_gate", title: "第二關：驗票進場" });
      }
      if (isDone("zoo_gate") || isAnyDoneOrHere(["zoo_choose_animal", "zoo_map_nav", "zoo_meet_point"]) || hasZooBranchProgress) {
        visibleSteps.push({ id: "zoo_choose_animal", title: "第三關：園區問路找展區" });
      }
      if (isDone("zoo_choose_animal") || isAnyDoneOrHere(["zoo_map_nav", "zoo_meet_point"]) || hasZooBranchProgress) {
        visibleSteps.push({ id: "zoo_map_nav", title: "第四關：園區步道尋路移動" });
      }
      if (isDone("zoo_map_nav") || isHere("zoo_meet_point") || hasZooBranchProgress) {
        const branchTitle = scenario.nodes[zooBranchId] ? scenario.nodes[zooBranchId].title : "第五關：展區互動";
        visibleSteps.push({ id: zooBranchId, title: branchTitle });
      }
      if (isDone(zooBranchId) || isHere("zoo_meet_point")) {
        visibleSteps.push({ id: "zoo_meet_point", title: "第六關：展區出口集合" });
      }
    } else if (scenario.id === "hakka_food") {
      visibleSteps.push({ id: "food_step1", title: "步驟 1：向老闆點一份餐點" });
      if (isDone("food_step1") || isAnyDoneOrHere(["food_step2", "food_step3"])) {
        visibleSteps.push({ id: "food_step2", title: "步驟 2：確認客製化需求" });
      }
      if (isDone("food_step2") || isHere("food_step3")) {
        visibleSteps.push({ id: "food_step3", title: "步驟 3：結帳時說出評價" });
      }
    } else if (scenario.id === "field_trip_pack") {
      visibleSteps.push({ id: "pack_hub", title: "任務一：背包 4 項整理" });
      const packItems = scenario.nodes.pack_hub?.items || [];
      const isPackReady = packItems.length > 0 && this.state.collectedItems.size >= packItems.length;
      if (isPackReady || currentNode.id === "pack_done") {
        visibleSteps.push({ id: "pack_done", title: "任務二：完成整理：玄關出發" });
      }
    } else if (scenario.id === "bus_directions") {
      visibleSteps.push({ id: "bus_choose_dest", title: "步驟 1：向路人詢問公車路線" });
      const busBranches = ["bus_ask_culture", "bus_ask_school", "bus_ask_library"];
      const branchId = pickBranchId(busBranches, "bus_ask_culture");
      if (isDone("bus_choose_dest") || isAnyDoneOrHere([...busBranches, "bus_arrive"])) {
        visibleSteps.push({ id: branchId, title: scenario.nodes[branchId]?.title || "步驟 2：站牌確認公車班次" });
      }
      if (isDone(branchId) || isHere("bus_arrive")) {
        visibleSteps.push({ id: "bus_arrive", title: "步驟 3：回答阿婆怎麼走" });
      }
    } else if (scenario.id === "health_center") {
      visibleSteps.push({ id: "health_choose_symptom", title: "步驟 1：向護理師表達不適" });
      const healthBranches = ["health_symptom_head", "health_symptom_scratch", "health_symptom_fever"];
      const branchId = pickBranchId(healthBranches, "health_symptom_head");
      if (isDone("health_choose_symptom") || isAnyDoneOrHere([...healthBranches, "health_rest"])) {
        visibleSteps.push({ id: branchId, title: scenario.nodes[branchId]?.title || "步驟 2：說明不適狀況" });
      }
      if (isDone(branchId) || isHere("health_rest")) {
        visibleSteps.push({ id: "health_rest", title: "步驟 3：承諾休息與致謝" });
      }
    } else if (scenario.id === "weather_outfit") {
      visibleSteps.push({ id: "weather_choose_type", title: "步驟 1：選擇今日天氣提醒" });
      const weatherBranches = ["weather_outfit_rain", "weather_outfit_hot", "weather_outfit_cold"];
      const branchId = pickBranchId(weatherBranches, "weather_outfit_rain");
      if (isDone("weather_choose_type") || isAnyDoneOrHere([...weatherBranches, "weather_done"])) {
        visibleSteps.push({ id: branchId, title: scenario.nodes[branchId]?.title || "步驟 2：天氣穿搭提醒" });
      }
      if (isDone(branchId) || isHere("weather_done")) {
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
      const displayTitle = this.formatStepTitle(s.title, idx);

      return `
        <div class="step-item ${stateClass}" data-node-id="${s.id}" role="button" tabindex="0" title="點擊切換至 ${displayTitle}">
          <span class="step-bullet">${this.state.completedNodes.has(s.id) ? "✓" : idx + 1}</span>
          <span class="step-name">${displayTitle}</span>
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

  formatStepTitle(title, index) {
    const cleanTitle = String(title || "")
      .replace(/^(第一|第二|第三|第四|第五|第六|第七|第八|第九|第十)關[:：]\s*/, "")
      .replace(/^第\s*\d+\s*關\s*\/\s*共\s*\d+\s*關\s*/, "")
      .replace(/^步驟\s*\d+\s*[:：]\s*/, "")
      .replace(/^任務[一二三四五六七八九十]\s*[:：]\s*/, "")
      .replace(/^關卡\s*\d+\s*[:：]\s*/, "")
      .trim();
    return `關卡 ${index + 1}：${cleanTitle}`;
  }

  // 2. 渲染分支選擇節點 (純口說 + 靜態提詞卡片，不可點擊)
  renderChoiceNode(node) {
    const isMandarin = this.state.speechMode === "mandarin";
    if (this.els.storyPrompt) {
      this.els.storyPrompt.textContent = isMandarin ? (node.mandarinStoryPrompt || node.storyPrompt) : node.storyPrompt;
    }
    if (this.els.speechActionSection) this.els.speechActionSection.hidden = false;
    if (this.els.statusTip) {
      this.els.statusTip.textContent = isMandarin
        ? "請看上方提示，點擊下方按鈕開始用華語開口說出你的選擇！"
        : "請看上方提示，點擊下方按鈕開始用客語開口說出你的選擇！";
    }

    // 呈現靜態提詞卡片 (禁止滑鼠點擊，僅供視覺輔助)
    if (this.els.speechHintSection && this.els.speechHintCards && node.choices) {
      this.els.speechHintSection.hidden = false;
      if (this.els.speechHintTip) {
        this.els.speechHintTip.textContent = `提示有以下 ${node.choices.length} 個選項，請開口說出你想去或想說的內容：`;
      }
      this.els.speechHintCards.innerHTML = node.choices.map(c => c.hintImage ? `
        <div class="speech-hint-card is-image-only" aria-label="${c.title}">
          <img class="speech-hint-image" src="${c.hintImage}" alt="${c.title}">
        </div>
      ` : `
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
    const isMandarin = this.state.speechMode === "mandarin";
    if (this.els.storyPrompt) {
      this.els.storyPrompt.textContent = isMandarin ? (node.mandarinStoryPrompt || node.storyPrompt) : node.storyPrompt;
    }
    if (this.els.speechActionSection) this.els.speechActionSection.hidden = true;
    if (this.els.speechHintSection) this.els.speechHintSection.hidden = true;
    if (this.els.statusTip) {
      this.els.statusTip.textContent = "請根據導覽員剛才說明的路線，操縱綠衣小人走到對應的展區，抵達後按【確定抵達】！";
    }

    const targetCode = this.state.targetZoneCode || "A";

    const mapSection = document.createElement("div");
    mapSection.className = "map-action-section";
    mapSection.innerHTML = `
      <div class="map-guide-banner">
        <div class="map-guide-icon">🧭</div>
        <div class="map-guide-info">
          <div class="map-guide-title">
            <span>尋路任務：依照剛才問路得到的方位前往目標展區</span>
            <span class="map-tip-pill">可點擊步道或按方向鍵移動</span>
          </div>
          <div class="map-guide-sub">請操縱綠衣小人走到剛才說好的展區位置（展區 A / B / C），抵達後請按右下角【確定抵達】！</div>
        </div>
      </div>

      <div class="map-canvas-wrapper" id="mapCanvasHost">
        <!-- 容器右下角指北針 (Compass Widget) -->
        <div class="map-compass-badge" title="指北針：上方為北">
          <div class="compass-dial">
            <span class="compass-n">北</span>
            <div class="compass-needle"></div>
            <div class="compass-pivot"></div>
            <span class="compass-s">南</span>
            <span class="compass-e">東</span>
            <span class="compass-w">西</span>
          </div>
        </div>
      </div>

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
    const isMandarin = this.state.speechMode === "mandarin";
    const hasActiveItem = this.state.activePackItemIndex !== null && this.state.activePackItemIndex !== undefined && this.state.activePackItemIndex >= 0 && this.state.activePackItemIndex < (node.items || []).length;
    const activeItem = hasActiveItem ? node.items[this.state.activePackItemIndex] : null;
    const totalItems = (node.items || []).length;
    const isAllCollected = this.state.collectedItems.size >= totalItems;

    if (this.els.storyPrompt) {
      if (activeItem) {
        this.els.storyPrompt.textContent = isMandarin ? (activeItem.mandarinStoryPrompt || activeItem.storyPrompt) : activeItem.storyPrompt;
      } else {
        this.els.storyPrompt.textContent = isMandarin ? (node.mandarinStoryPrompt || node.storyPrompt) : node.storyPrompt;
      }
    }
    if (this.els.sceneLocationTag) {
      this.els.sceneLocationTag.textContent = activeItem ? (activeItem.locationTag || node.locationTag) : node.locationTag;
    }
    if (this.els.speechHintSection) this.els.speechHintSection.hidden = true;
    if (this.els.speechActionSection) {
      this.els.speechActionSection.hidden = !activeItem || isAllCollected;
    }
    if (this.els.statusTip) {
      if (isAllCollected) {
        this.els.statusTip.textContent = isMandarin
          ? "🎉 4 樣物品已全數打包齊全！請點擊背包下方【前往下一關】！"
          : "🎉 4 樣物品已全數打包齊全！請點擊背包下方【前往下一關】！";
      } else if (activeItem) {
        this.els.statusTip.textContent = isMandarin ? `正在整理【${activeItem.name}】，請點擊下方按鈕以華語回答。` : `正在整理【${activeItem.name}】，請點擊下方按鈕以客語回答。`;
      } else {
        this.els.statusTip.textContent = isMandarin
          ? "請在下方點選桌上的物品（水壺、雨傘、毛巾、點心）開始整理！"
          : "請在下方點選桌頂个東西（水壺、遮仔、毛巾、點心）開始整理！";
      }
    }

    // 注入背包清單面板
    const backpackPanel = document.createElement("div");
    backpackPanel.className = "backpack-panel";
    backpackPanel.innerHTML = `
      <div class="backpack-header">
        <span>🎒 背包清單（可自由點選順序）</span>
        <span class="backpack-count">已收集 ${this.state.collectedItems.size} / ${node.items.length} 項</span>
      </div>
      <div class="pack-table-stage" aria-label="桌上打包物品互動圖">
        <img src="${node.tableImage || './assets/field-trip-table-items.png'}" alt="桌上的水壺、雨傘、毛巾和點心" class="pack-table-img">
        <canvas class="pack-mask-canvas" width="1086" height="1448" aria-label="可直接點選桌上的物品"></canvas>
      </div>
      ${isAllCollected ? `
        <div class="backpack-next-action">
          <div class="backpack-next-hint">🎉 4 樣物品已全數打包齊全！</div>
          <button id="btnPackGoNext" type="button" class="btn-pack-go-next">
            <span>🎒 前往下一關（關卡 2：玄關出發）</span>
            <span>➔</span>
          </button>
        </div>
      ` : ''}
    `;

    const narrativeBody = document.querySelector(".narrative-card") || document.querySelector(".stage-dialogue-col");
    narrativeBody.appendChild(backpackPanel);
    const maskCanvas = backpackPanel.querySelector(".pack-mask-canvas");
    this.renderPackMaskCanvas(node, maskCanvas);
    if (maskCanvas) {
      maskCanvas.addEventListener("click", (event) => {
        const itemIdx = this.resolvePackCanvasItemIndex(event, maskCanvas, node);
        if (itemIdx >= 0) {
          SoundFX.select();
          this.state.activePackItemIndex = itemIdx;
          this.render();
        }
      });
    }

    // 綁定前往下一關按鈕
    if (isAllCollected) {
      const btnGoNext = backpackPanel.querySelector("#btnPackGoNext");
      if (btnGoNext) {
        btnGoNext.addEventListener("click", () => {
          SoundFX.success();
          this.advanceToNextNode();
        });
      }
    }

    if (activeItem) {
      this.renderSpeechNodeControls(activeItem);
    }
  }

  renderPackMaskCanvas(node, canvas) {
    if (!canvas || !node || !node.items) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const zones = this.getPackItemZones();

    node.items.forEach((item, index) => {
      const zone = zones[item.id];
      if (!zone) return;
      const isActive = index === this.state.activePackItemIndex;
      const isCollected = this.state.collectedItems.has(item.id);

      ctx.save();
      ctx.shadowColor = isCollected ? "rgba(39, 174, 96, 0.65)" : (isActive ? "rgba(255, 24, 24, 0.65)" : "rgba(15, 23, 42, 0.28)");
      ctx.shadowBlur = isActive || isCollected ? 18 : 8;
      ctx.beginPath();
      ctx.arc(zone.center.x, zone.center.y, zone.radius, 0, Math.PI * 2);
      ctx.fillStyle = isCollected ? "rgba(39, 174, 96, 0.96)" : (isActive ? "rgba(255, 24, 24, 0.96)" : "rgba(255, 24, 24, 0.82)");
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = isActive || isCollected ? 10 : 7;
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = `900 ${zone.radius}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (isCollected) {
        ctx.lineWidth = 9;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(zone.center.x - zone.radius * 0.44, zone.center.y);
        ctx.lineTo(zone.center.x - zone.radius * 0.12, zone.center.y + zone.radius * 0.34);
        ctx.lineTo(zone.center.x + zone.radius * 0.5, zone.center.y - zone.radius * 0.38);
        ctx.stroke();
      } else if (isActive) {
        ctx.fillText("●", zone.center.x, zone.center.y + 1);
      } else {
        ctx.fillText("•", zone.center.x, zone.center.y + 1);
      }
      ctx.restore();
    });
  }

  getPackItemZones() {
    return {
      bottle: {
        center: { x: 245, y: 437 },
        radius: 48
      },
      umbrella: {
        center: { x: 725, y: 546 },
        radius: 52
      },
      towel: {
        center: { x: 292, y: 925 },
        radius: 52
      },
      snack: {
        center: { x: 865, y: 1065 },
        radius: 52
      }
    };
  }

  resolvePackCanvasItemIndex(event, canvas, node) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    const zones = this.getPackItemZones();
    return node.items.findIndex((item) => {
      const zone = zones[item.id];
      if (!zone) return false;
      const dx = x - zone.center.x;
      const dy = y - zone.center.y;
      return Math.hypot(dx, dy) <= zone.radius * 1.35;
    });
  }

  // 5. 渲染一般口說主線/分支/集合點節點
  renderSpeechNode(node) {
    const isMandarin = this.state.speechMode === "mandarin";
    let promptText = isMandarin ? (node.mandarinStoryPrompt || node.storyPrompt) : node.storyPrompt;

    // 健康中心步驟 3 (health_rest) 動態針對前一關選擇的症狀呈現最符合情境的引導提示：
    if (node.id === "health_rest") {
      const branchId = this.state.selectedTargetBranchId || "health_symptom_head";
      if (branchId === "health_symptom_scratch") {
        promptText = "傷口包紮好後，護理師叮嚀你今天不要劇烈運動，要多喝溫水好好休息。你答應她並道謝。你說：";
      } else if (branchId === "health_symptom_fever") {
        promptText = "量完耳溫確認微燒後，護理師叮嚀你先在病床上躺著休息、多喝溫開水。你答應她並道謝。你說：";
      } else {
        // 頭痛肚子痛 (health_symptom_head)
        promptText = "量完體溫並倒好溫開水後，護理師叮嚀你先坐著休息、多喝溫水。你答應她並道謝。你說：";
      }
    }

    if (this.els.storyPrompt) {
      this.els.storyPrompt.textContent = promptText;
    }
    if (this.els.speechActionSection) this.els.speechActionSection.hidden = false;
    if (this.els.speechHintSection) this.els.speechHintSection.hidden = true;
    if (this.els.statusTip) {
      this.els.statusTip.textContent = isMandarin ? "請點擊下方按鈕，開始用華語說出你想講的話。" : "請點擊下方按鈕，開始用客語說出你想講的話。";
    }

    // 搭車問路步驟 3 (bus_arrive) 繪製街頭十字路口棋盤地圖
    if (node.id === "bus_arrive") {
      this.renderStreetMapSection(node);
    }

    this.renderSpeechNodeControls(node);
  }

  // 6. 渲染搭車問路步驟 3 棋盤式十字路口 SVG 地圖 (依據所選公車路線呈現獨立專屬地圖)
  renderStreetMapSection(node) {
    const branch = this.state.selectedTargetBranchId || "bus_ask_culture";
    
    let mapSvgHtml = "";
    let headerTitle = "";
    let destBadge = "";

    if (branch === "bus_ask_school") {
      // 地圖 2: 🏫 學校正門 (搭乘 615 公車，目的地在【左上方街區】)
      headerTitle = "🏫 學校正門路線地圖（615 公車）";
      destBadge = "🎯 目的地：🏫 學校正門（左上方）";
      mapSvgHtml = `
        <svg viewBox="0 0 500 160" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto; display:block;">
          <rect width="500" height="160" fill="#f8fafc"/>
          
          <!-- 唯一目的地街區：學校正門 (左上) -->
          <rect x="20" y="10" width="130" height="50" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2.5"/>
          <text x="85" y="32" font-size="14" text-anchor="middle">🏫</text>
          <text x="85" y="48" font-size="11" font-weight="900" fill="#1e3a8a" text-anchor="middle">學校正門 🎯</text>

          <!-- 留白街區 -->
          <rect x="175" y="10" width="135" height="50" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          <rect x="340" y="10" width="140" height="50" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          <rect x="20" y="90" width="130" height="60" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          <rect x="175" y="90" width="135" height="60" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          <rect x="340" y="90" width="140" height="60" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>

          <!-- 道路網 (學府路 & 校前大道) -->
          <rect x="0" y="65" width="500" height="20" fill="#334155"/>
          <line x1="0" y1="75" x2="500" y2="75" stroke="#94a3b8" stroke-dasharray="5,5" stroke-width="1.5"/>
          
          <rect x="150" y="0" width="20" height="160" fill="#334155"/>
          <line x1="160" y1="0" x2="160" y2="160" stroke="#94a3b8" stroke-dasharray="5,5" stroke-width="1.5"/>

          <rect x="315" y="0" width="20" height="160" fill="#334155"/>
          <line x1="325" y1="0" x2="325" y2="160" stroke="#94a3b8" stroke-dasharray="5,5" stroke-width="1.5"/>

          <!-- 路名 -->
          <text x="440" y="78" font-size="9" font-weight="800" fill="#cbd5e1">校前大道</text>
          <text x="325" y="152" font-size="8.5" font-weight="800" fill="#cbd5e1" text-anchor="middle">學府路</text>

          <!-- 斑馬線 -->
          <rect x="317" y="66" width="16" height="2.5" fill="#ffffff"/>
          <rect x="317" y="71" width="16" height="2.5" fill="#ffffff"/>
          <rect x="317" y="76" width="16" height="2.5" fill="#ffffff"/>
          <rect x="317" y="81" width="16" height="2.5" fill="#ffffff"/>

          <rect x="152" y="66" width="16" height="2.5" fill="#ffffff"/>
          <rect x="152" y="71" width="16" height="2.5" fill="#ffffff"/>
          <rect x="152" y="76" width="16" height="2.5" fill="#ffffff"/>
          <rect x="152" y="81" width="16" height="2.5" fill="#ffffff"/>

          <!-- 十字路口紅綠燈 (雙路口皆有紅綠燈) -->
          <g transform="translate(172, 66)">
            <rect x="0" y="0" width="10" height="18" rx="2" fill="#1e293b"/>
            <circle cx="5" cy="4.5" r="2" fill="#ef4444"/>
            <circle cx="5" cy="9" r="2" fill="#f59e0b"/>
            <circle cx="5" cy="13.5" r="2" fill="#22c55e"/>
          </g>
          <g transform="translate(338, 66)">
            <rect x="0" y="0" width="10" height="18" rx="2" fill="#1e293b"/>
            <circle cx="5" cy="4.5" r="2" fill="#ef4444"/>
            <circle cx="5" cy="9" r="2" fill="#f59e0b"/>
            <circle cx="5" cy="13.5" r="2" fill="#22c55e"/>
          </g>

          <!-- Google Map 樣式：起點站牌 (道路左側站牌) -->
          <circle cx="315" cy="130" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
          <g transform="translate(110, 121)">
            <rect x="0" y="0" width="195" height="20" rx="4" fill="#ef4444" stroke="#ffffff" stroke-width="1"/>
            <text x="97" y="14" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">📍 615 公車站（道路左側站牌・你的位置）</text>
          </g>
          <!-- 右下角指北針 (Compass Rose) -->
          <g transform="translate(465, 128)">
            <circle cx="0" cy="0" r="18" fill="rgba(255, 255, 255, 0.95)" stroke="#94a3b8" stroke-width="1.2"/>
            <circle cx="0" cy="0" r="14.5" fill="none" stroke="#cbd5e1" stroke-width="0.8" stroke-dasharray="2,2"/>
            <polygon points="0,-12 -3.5,0 0,-2.5" fill="#ef4444"/>
            <polygon points="0,-12 3.5,0 0,-2.5" fill="#dc2626"/>
            <polygon points="0,12 -3.5,0 0,2.5" fill="#94a3b8"/>
            <polygon points="0,12 3.5,0 0,2.5" fill="#64748b"/>
            <circle cx="0" cy="0" r="2" fill="#1e293b"/>
            <text x="0" y="-13" font-size="7.5" font-weight="900" fill="#ef4444" text-anchor="middle" dominant-baseline="auto">北</text>
            <text x="13.5" y="2.5" font-size="6" font-weight="800" fill="#64748b" text-anchor="start" dominant-baseline="middle">東</text>
            <text x="0" y="14" font-size="6" font-weight="800" fill="#64748b" text-anchor="middle" dominant-baseline="hanging">南</text>
            <text x="-13.5" y="2.5" font-size="6" font-weight="800" fill="#64748b" text-anchor="end" dominant-baseline="middle">西</text>
          </g>
        </svg>
      `;
    } else if (branch === "bus_ask_library") {
      // 地圖 3: 📚 市立圖書館 (搭乘 306 公車，目的地在【右下方街區】)
      headerTitle = "📚 市立圖書館路線地圖（306 公車）";
      destBadge = "🎯 目的地：📚 市立圖書館（右下方）";
      mapSvgHtml = `
        <svg viewBox="0 0 500 160" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto; display:block;">
          <rect width="500" height="160" fill="#f8fafc"/>
          
          <!-- 留白街區 -->
          <rect x="20" y="10" width="130" height="50" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          <rect x="175" y="10" width="135" height="50" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          <rect x="340" y="10" width="140" height="50" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          <rect x="20" y="90" width="130" height="60" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          <rect x="175" y="90" width="135" height="60" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>

          <!-- 唯一目的地街區：市立圖書館 (右下) -->
          <rect x="340" y="90" width="140" height="60" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2.5"/>
          <text x="410" y="116" font-size="14" text-anchor="middle">📚</text>
          <text x="410" y="134" font-size="11" font-weight="900" fill="#1e3a8a" text-anchor="middle">市立圖書館 🎯</text>

          <!-- 道路網 (文教路 & 書香街) -->
          <rect x="0" y="65" width="500" height="20" fill="#334155"/>
          <line x1="0" y1="75" x2="500" y2="75" stroke="#94a3b8" stroke-dasharray="5,5" stroke-width="1.5"/>
          
          <rect x="150" y="0" width="20" height="160" fill="#334155"/>
          <line x1="160" y1="0" x2="160" y2="160" stroke="#94a3b8" stroke-dasharray="5,5" stroke-width="1.5"/>

          <rect x="315" y="0" width="20" height="160" fill="#334155"/>
          <line x1="325" y1="0" x2="325" y2="160" stroke="#94a3b8" stroke-dasharray="5,5" stroke-width="1.5"/>

          <!-- 路名 -->
          <text x="440" y="78" font-size="9" font-weight="800" fill="#cbd5e1">書香街</text>
          <text x="325" y="152" font-size="8.5" font-weight="800" fill="#cbd5e1" text-anchor="middle">文教路</text>

          <!-- 斑馬線 -->
          <rect x="317" y="66" width="16" height="2.5" fill="#ffffff"/>
          <rect x="317" y="71" width="16" height="2.5" fill="#ffffff"/>
          <rect x="317" y="76" width="16" height="2.5" fill="#ffffff"/>
          <rect x="317" y="81" width="16" height="2.5" fill="#ffffff"/>

          <rect x="152" y="66" width="16" height="2.5" fill="#ffffff"/>
          <rect x="152" y="71" width="16" height="2.5" fill="#ffffff"/>
          <rect x="152" y="76" width="16" height="2.5" fill="#ffffff"/>
          <rect x="152" y="81" width="16" height="2.5" fill="#ffffff"/>

          <!-- 十字路口紅綠燈 (雙路口皆有紅綠燈) -->
          <g transform="translate(172, 66)">
            <rect x="0" y="0" width="10" height="18" rx="2" fill="#1e293b"/>
            <circle cx="5" cy="4.5" r="2" fill="#ef4444"/>
            <circle cx="5" cy="9" r="2" fill="#f59e0b"/>
            <circle cx="5" cy="13.5" r="2" fill="#22c55e"/>
          </g>
          <g transform="translate(338, 66)">
            <rect x="0" y="0" width="10" height="18" rx="2" fill="#1e293b"/>
            <circle cx="5" cy="4.5" r="2" fill="#ef4444"/>
            <circle cx="5" cy="9" r="2" fill="#f59e0b"/>
            <circle cx="5" cy="13.5" r="2" fill="#22c55e"/>
          </g>

          <!-- Google Map 樣式：起點站牌 (道路右側站牌) -->
          <circle cx="75" cy="85" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
          <g transform="translate(20, 32)">
            <rect x="0" y="0" width="195" height="20" rx="4" fill="#ef4444" stroke="#ffffff" stroke-width="1"/>
            <text x="97" y="14" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">📍 306 公車站（道路右側站牌・你的位置）</text>
          </g>

          <!-- 右上角指北針 (Compass Rose) -->
          <g transform="translate(465, 35)">
            <circle cx="0" cy="0" r="18" fill="rgba(255, 255, 255, 0.95)" stroke="#94a3b8" stroke-width="1.2"/>
            <circle cx="0" cy="0" r="14.5" fill="none" stroke="#cbd5e1" stroke-width="0.8" stroke-dasharray="2,2"/>
            <polygon points="0,-12 -3.5,0 0,-2.5" fill="#ef4444"/>
            <polygon points="0,-12 3.5,0 0,-2.5" fill="#dc2626"/>
            <polygon points="0,12 -3.5,0 0,2.5" fill="#94a3b8"/>
            <polygon points="0,12 3.5,0 0,2.5" fill="#64748b"/>
            <circle cx="0" cy="0" r="2" fill="#1e293b"/>
            <text x="0" y="-13" font-size="7.5" font-weight="900" fill="#ef4444" text-anchor="middle" dominant-baseline="auto">北</text>
            <text x="13.5" y="2.5" font-size="6" font-weight="800" fill="#64748b" text-anchor="start" dominant-baseline="middle">東</text>
            <text x="0" y="14" font-size="6" font-weight="800" fill="#64748b" text-anchor="middle" dominant-baseline="hanging">南</text>
            <text x="-13.5" y="2.5" font-size="6" font-weight="800" fill="#64748b" text-anchor="end" dominant-baseline="middle">西</text>
          </g>
        </svg>
      `;
    } else {
      // 地圖 1: 🏛️ 文化園區 (搭乘 802 公車，目的地在【右上方街區】)
      headerTitle = "🏛️ 文化園區路線地圖（802 公車）";
      destBadge = "🎯 目的地：🏛️ 文化園區（右上方）";
      mapSvgHtml = `
        <svg viewBox="0 0 500 160" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto; display:block;">
          <rect width="500" height="160" fill="#f8fafc"/>
          
          <!-- 留白街區 -->
          <rect x="20" y="10" width="125" height="50" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          <rect x="175" y="10" width="135" height="50" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          
          <!-- 唯一目的地街區：文化園區 (右上) -->
          <rect x="340" y="10" width="140" height="50" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2.5"/>
          <text x="410" y="32" font-size="14" text-anchor="middle">🏛️</text>
          <text x="410" y="48" font-size="11" font-weight="900" fill="#1e3a8a" text-anchor="middle">文化園區 🎯</text>

          <rect x="20" y="90" width="125" height="60" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          <rect x="340" y="90" width="140" height="60" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>

          <!-- 道路網 (文化大道 & 園區一路) -->
          <rect x="0" y="65" width="500" height="20" fill="#334155"/>
          <line x1="0" y1="75" x2="500" y2="75" stroke="#94a3b8" stroke-dasharray="5,5" stroke-width="1.5"/>
          
          <rect x="150" y="0" width="20" height="160" fill="#334155"/>
          <line x1="160" y1="0" x2="160" y2="160" stroke="#94a3b8" stroke-dasharray="5,5" stroke-width="1.5"/>

          <rect x="315" y="0" width="20" height="160" fill="#334155"/>
          <line x1="325" y1="0" x2="325" y2="160" stroke="#94a3b8" stroke-dasharray="5,5" stroke-width="1.5"/>

          <!-- 路名 -->
          <text x="440" y="78" font-size="9" font-weight="800" fill="#cbd5e1">園區一路</text>
          <text x="160" y="152" font-size="8.5" font-weight="800" fill="#cbd5e1" text-anchor="middle">文化大道</text>

          <!-- 斑馬線 -->
          <rect x="152" y="66" width="16" height="2.5" fill="#ffffff"/>
          <rect x="152" y="71" width="16" height="2.5" fill="#ffffff"/>
          <rect x="152" y="76" width="16" height="2.5" fill="#ffffff"/>
          <rect x="152" y="81" width="16" height="2.5" fill="#ffffff"/>

          <rect x="317" y="66" width="16" height="2.5" fill="#ffffff"/>
          <rect x="317" y="71" width="16" height="2.5" fill="#ffffff"/>
          <rect x="317" y="76" width="16" height="2.5" fill="#ffffff"/>
          <rect x="317" y="81" width="16" height="2.5" fill="#ffffff"/>

          <!-- 十字路口紅綠燈 (雙路口皆有紅綠燈) -->
          <g transform="translate(172, 66)">
            <rect x="0" y="0" width="10" height="18" rx="2" fill="#1e293b"/>
            <circle cx="5" cy="4.5" r="2" fill="#ef4444"/>
            <circle cx="5" cy="9" r="2" fill="#f59e0b"/>
            <circle cx="5" cy="13.5" r="2" fill="#22c55e"/>
          </g>
          <g transform="translate(338, 66)">
            <rect x="0" y="0" width="10" height="18" rx="2" fill="#1e293b"/>
            <circle cx="5" cy="4.5" r="2" fill="#ef4444"/>
            <circle cx="5" cy="9" r="2" fill="#f59e0b"/>
            <circle cx="5" cy="13.5" r="2" fill="#22c55e"/>
          </g>

          <!-- Google Map 樣式：起點站牌 (道路右側站牌) -->
          <circle cx="170" cy="130" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
          <g transform="translate(180, 121)">
            <rect x="0" y="0" width="195" height="20" rx="4" fill="#ef4444" stroke="#ffffff" stroke-width="1"/>
            <text x="97" y="14" font-size="9" font-weight="900" fill="#ffffff" text-anchor="middle">📍 802 公車站（道路右側站牌・你的位置）</text>
          </g>

          <!-- 右下角指北針 (Compass Rose) -->
          <g transform="translate(465, 128)">
            <circle cx="0" cy="0" r="18" fill="rgba(255, 255, 255, 0.95)" stroke="#94a3b8" stroke-width="1.2"/>
            <circle cx="0" cy="0" r="14.5" fill="none" stroke="#cbd5e1" stroke-width="0.8" stroke-dasharray="2,2"/>
            <polygon points="0,-12 -3.5,0 0,-2.5" fill="#ef4444"/>
            <polygon points="0,-12 3.5,0 0,-2.5" fill="#dc2626"/>
            <polygon points="0,12 -3.5,0 0,2.5" fill="#94a3b8"/>
            <polygon points="0,12 3.5,0 0,2.5" fill="#64748b"/>
            <circle cx="0" cy="0" r="2" fill="#1e293b"/>
            <text x="0" y="-13" font-size="7.5" font-weight="900" fill="#ef4444" text-anchor="middle" dominant-baseline="auto">北</text>
            <text x="13.5" y="2.5" font-size="6" font-weight="800" fill="#64748b" text-anchor="start" dominant-baseline="middle">東</text>
            <text x="0" y="14" font-size="6" font-weight="800" fill="#64748b" text-anchor="middle" dominant-baseline="hanging">南</text>
            <text x="-13.5" y="2.5" font-size="6" font-weight="800" fill="#64748b" text-anchor="end" dominant-baseline="middle">西</text>
          </g>
        </svg>
      `;
    }

    const mapSection = document.createElement("div");
    mapSection.className = "street-map-section";
    mapSection.innerHTML = `
      <div class="street-map-header">
        <span class="street-map-badge">🧭 ${headerTitle}</span>
        <div class="street-map-dest-pill">${destBadge}</div>
      </div>
      <div class="street-map-svg-wrap">
        ${mapSvgHtml}
      </div>
    `;

    const narrativeBody = document.querySelector(".narrative-card") || document.querySelector(".stage-dialogue-col");
    // 插入在 speechActionSection 或 story-narrative-box 之後
    const storyBox = narrativeBody.querySelector(".story-narrative-box");
    if (storyBox && storyBox.nextSibling) {
      narrativeBody.insertBefore(mapSection, storyBox.nextSibling);
    } else {
      narrativeBody.appendChild(mapSection);
    }
  }

  updateRecordButtonDefaultState() {
    const isMandarin = this.state.speechMode === "mandarin";
    if (this.els.recordBtnIcon) {
      this.els.recordBtnIcon.textContent = isMandarin ? "🗣️" : "🎙️";
    }
    if (this.els.recordBtnText) {
      this.els.recordBtnText.textContent = isMandarin ? "點擊錄音 (華語)" : "點擊錄音";
    }
  }

  renderSpeechNodeControls(targetNodeConfig) {
    if (this.els.recordBtn) {
      this.els.recordBtn.disabled = false;
      this.els.recordBtn.classList.remove("is-recording");
    }
    this.updateRecordButtonDefaultState();
    if (this.els.devAutoFillSuccessBtn) this.els.devAutoFillSuccessBtn.disabled = false;
    if (this.els.devAutoFillFailBtn) this.els.devAutoFillFailBtn.disabled = false;
  }

  setControlsLoading(isLoading) {
    if (isLoading) {
      if (this.els.recordBtn) {
        this.els.recordBtn.disabled = false;
        this.els.recordBtn.classList.add("is-recording");
      }
      if (this.els.recordBtnIcon) this.els.recordBtnIcon.textContent = "⏹️";
      if (this.els.recordBtnText) this.els.recordBtnText.textContent = "⏹️ 錄音中...（再按一次結束送出）";
      if (this.els.statusDot) this.els.statusDot.className = "status-dot is-recording";
      if (this.els.npcResponseSection) {
        this.els.npcResponseSection.hidden = true;
        if (this.els.npcDialogText) this.els.npcDialogText.textContent = "";
      }
      if (this.els.statusTip) {
        this.els.statusTip.textContent = this.state.speechMode === "mandarin" ? "🔴 正在聆聽華語發音中...說完請再點擊一次按鈕送出！" : "🔴 正在聆聽客語發音中...說完請再點擊一次按鈕送出！";
      }
    } else {
      if (this.els.recordBtn) {
        this.els.recordBtn.classList.remove("is-recording");
      }
      this.updateRecordButtonDefaultState();
    }
  }

  // 渲染開發者側邊欄 (包含分支直接切換器)
  renderDevSidebar(nodeConfig, runtimeResult) {
    const isMandarin = this.state.speechMode === "mandarin";
    if (this.els.devNodeIdText) this.els.devNodeIdText.textContent = nodeConfig.id || this.state.currentNodeId;
    if (this.els.devNodeTypeTag) this.els.devNodeTypeTag.textContent = nodeConfig.nodeType || "主線";
    if (this.els.devTargetLocText) this.els.devTargetLocText.textContent = nodeConfig.locationTag || "無指定";

    if (this.els.devTargetHakka) {
      this.els.devTargetHakka.textContent = isMandarin
        ? (nodeConfig.targetMandarin || "（本節點為口說分支選擇）")
        : (nodeConfig.targetHakka || "（本節點為口說分支選擇）");
    }
    if (this.els.devTargetMandarin) {
      this.els.devTargetMandarin.textContent = isMandarin
        ? (nodeConfig.targetHakka ? `（客語對照：${nodeConfig.targetHakka}）` : "")
        : (nodeConfig.targetMandarin ? `（華語對照：${nodeConfig.targetMandarin}）` : "");
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
        let weatherQuickHtml = "";
        if (scenario.id === "weather_outfit") {
          const currentPreset = WEATHER_RANDOM_PRESETS[this.state.randomWeatherKey] || WEATHER_RANDOM_PRESETS.rain;
          weatherQuickHtml = `
            <div style="margin-bottom: 8px; padding: 6px 8px; background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px;">
              <div style="font-size: 11px; color: #bae6fd; font-weight: bold; margin-bottom: 4px;">🎲 今日隨機天氣：${currentPreset.weatherName}</div>
              <div style="display: flex; gap: 4px;">
                <button class="dev-weather-quick-btn ${this.state.randomWeatherKey === 'rain' ? 'is-active' : ''}" data-w="rain" type="button" style="padding: 2px 6px; font-size: 11px; border-radius: 4px; border: 1px solid #38bdf8; background: ${this.state.randomWeatherKey === 'rain' ? '#0284c7' : 'transparent'}; color: white; cursor: pointer;">🌧️ 陰雨天</button>
                <button class="dev-weather-quick-btn ${this.state.randomWeatherKey === 'hot' ? 'is-active' : ''}" data-w="hot" type="button" style="padding: 2px 6px; font-size: 11px; border-radius: 4px; border: 1px solid #38bdf8; background: ${this.state.randomWeatherKey === 'hot' ? '#0284c7' : 'transparent'}; color: white; cursor: pointer;">☀️ 大熱天</button>
                <button class="dev-weather-quick-btn ${this.state.randomWeatherKey === 'cold' ? 'is-active' : ''}" data-w="cold" type="button" style="padding: 2px 6px; font-size: 11px; border-radius: 4px; border: 1px solid #38bdf8; background: ${this.state.randomWeatherKey === 'cold' ? '#0284c7' : 'transparent'}; color: white; cursor: pointer;">❄️ 寒冷天</button>
              </div>
            </div>
          `;
        }

        this.els.devBranchGrid.innerHTML = weatherQuickHtml + choicesList.map(c => {
          const isCurrent = this.state.selectedChoiceId === c.id || this.state.selectedTargetBranchId === c.targetBranchId;
          return `
            <button class="dev-branch-btn ${isCurrent ? 'is-active' : ''}" type="button" data-choice-id="${c.id}" data-target-branch="${c.targetBranchId}" data-zone-code="${c.zoneCode || ''}">
              <span>${c.title}</span>
              <span>➔ 切換</span>
            </button>
          `;
        }).join("");

        // 綁定天氣隨機切換按鈕
        this.els.devBranchGrid.querySelectorAll(".dev-weather-quick-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            SoundFX.select();
            this.state.applyRandomWeather(btn.dataset.w);
            this.render();
          });
        });

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

            if (scenario.id === "weather_outfit" && WEATHER_RANDOM_PRESETS[choiceId]) {
              this.state.applyRandomWeather(choiceId);
            }

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

    // 關鍵字標籤 (依據當前華語/客語模式顯示對應關鍵字，若為分支選擇關卡則依分支分組列出)
    if (this.els.devKeywordsList) {
      if (nodeConfig.nodeType === "選擇" && nodeConfig.choices) {
        const choicesHtml = nodeConfig.choices.map(c => {
          const kws = isMandarin ? (c.mandarinKeywords || c.keywords || []) : (c.keywords || []);
          return `
            <div style="margin-bottom: 8px; background: rgba(30, 41, 59, 0.6); border-radius: 6px; padding: 6px 8px; border: 1px solid rgba(148, 163, 184, 0.2);">
              <div style="font-size: 11px; font-weight: bold; color: #93c5fd; margin-bottom: 4px;">${c.title}</div>
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${kws.map(kw => `<span class="kw-tag">${kw}</span>`).join("")}
              </div>
            </div>
          `;
        }).join("");
        this.els.devKeywordsList.innerHTML = choicesHtml;
      } else {
        const kwList = isMandarin
          ? (nodeConfig.mandarinKeywords || nodeConfig.keywords || [])
          : (nodeConfig.keywords || []);
        this.els.devKeywordsList.innerHTML = kwList.map(kw => `<span class="kw-tag">${kw}</span>`).join("");
      }
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







