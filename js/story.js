/**
 * story.js
 * 故事節點系統 — 江雪·問天
 *
 * node 結構：
 * {
 *   id: string,
 *   chapter: string,          // 章節標題
 *   scene: { icon, title },   // 場景圖示
 *   speaker: characterId,     // 說話者
 *   text: string,             // 對話文本（靜態）
 *   useAI: bool,              // 是否用 Qwen AI 動態生成
 *   aiPrompt: string,         // 傳給 AI 的提示（context）
 *   choices: [                // 選項（空陣列 = 繼續按鈕）
 *     { text, nextId, fateDelta, flag }
 *   ],
 *   next: string,             // 無選項時的下一節點
 *   ending: endingId,         // 觸發結局
 * }
 */

const STORY = {

  /* ============================================================
     序章：寒江垂釣
  ============================================================ */
  start: {
    id: 'start',
    chapter: '序章·寒江',
    scene: { icon: '雪', title: '永州·寒江之畔' },
    speaker: 'liuzongyuan',
    text: '千山都沒有鳥的蹤跡，萬條小路也沒有人的足跡。\n我柳宗元，獨自坐在這艘小船上，在白雪覆蓋的江面垂釣……\n已經是被貶謫的第五年了，京城，是否還記得我？',
    choices: [],
    next: 'ch1_messenger_arrive',
  },

  /* ============================================================
     第一章：王叔文的信使
  ============================================================ */
  ch1_messenger_arrive: {
    id: 'ch1_messenger_arrive',
    chapter: '第一章·舊夢',
    scene: { icon: '令', title: '信使抵達' },
    speaker: 'wangshuwwen',
    text: '子厚！我雖然已經不在人世，但昔日的同伴仍然記掛著你。\n革新雖然失敗了，但改革的志向不能熄滅——\n有人帶著我的遺書前來，希望你能繼承我未完成的志向。',
    useAI: true,
    aiPrompt: '王叔文已死，以靈魂或夢境的形式出現。他鼓勵柳宗元繼承改革意志，充滿激情但也帶著遺憾。說一段鼓勵柳宗元的話，提到永貞革新的理想。',
    choices: [
      {
        text: '叔文的志向，我銘記在心，一定會繼承下去。',
        nextId: 'ch1_accept_legacy',
        fateDelta: +15,
        flag: 'reform_spirit',
      },
      {
        text: '改革已敗，再爭只會招來更多貶謫，不如安心著書。',
        nextId: 'ch1_decline_legacy',
        fateDelta: -5,
        flag: 'literary_path',
      },
      {
        text: '我已心灰意冷，連這漁翁的日子也不知能撐幾日……',
        nextId: 'ch1_despair',
        fateDelta: -15,
        flag: 'despair',
      },
    ],
  },

  ch1_accept_legacy: {
    id: 'ch1_accept_legacy',
    chapter: '第一章·舊夢',
    scene: { icon: '炎', title: '燃起鬥志' },
    speaker: 'liuzongyuan',
    text: '叔文的靈魂，我聽見了。\n即使身在永州，我的筆，仍然可以指向時代的弊病。\n《封建論》《捕蛇者說》——都是我的武器。',
    choices: [],
    next: 'ch2_liuyuxi_letter',
  },

  ch1_decline_legacy: {
    id: 'ch1_decline_legacy',
    chapter: '第一章·舊夢',
    scene: { icon: '書', title: '選擇筆墨' },
    speaker: 'liuzongyuan',
    text: '政治的道路已經斷絕，但文字卻永遠不會磨滅。\n我要用筆記錄永州的山水，保留百姓的疾苦，\n也許，這才是我真正的使命。',
    choices: [],
    next: 'ch2_liuyuxi_letter',
  },

  ch1_despair: {
    id: 'ch1_despair',
    chapter: '第一章·舊夢',
    scene: { icon: '雨', title: '心灰意冷' },
    speaker: 'liuzongyuan',
    text: '……我連那個漁翁都不如。\n他至少還有自由，而我，不過是朝廷拋棄的人。\n這漫天的江雪，恐怕要埋葬我的一生了。',
    choices: [],
    next: 'ch2_fisherman_early',
  },

  /* ============================================================
     第二章：劉禹錫的問候
  ============================================================ */
  ch2_liuyuxi_letter: {
    id: 'ch2_liuyuxi_letter',
    chapter: '第二章·友情',
    scene: { icon: '信', title: '夢得來信' },
    speaker: 'liuyuxi',
    text: '子厚！我劉夢得也在朗州受苦，但看看這裡的巴山楚水，竟也別有詩意！\n聽聞你在永州著書立說，痛快！\n咱們兩個，被貶也要把詩寫得比那些達官貴人強十倍！',
    useAI: true,
    aiPrompt: '劉禹錫寫信給柳宗元，充滿樂觀豪情。他分享自己在朗州的生活，鼓勵柳宗元振作，引用或化用他自己的名句，充滿豪氣。',
    choices: [
      {
        text: '夢得說得對！我要寫成《永州八記》，讓天下人都知道這裡的美麗。',
        nextId: 'ch2_writing_spirit',
        fateDelta: +10,
        flag: 'wenxue_achievement',
      },
      {
        text: '夢得，你可有法子向朝廷申訴，盼早日回京？',
        nextId: 'ch2_seek_return',
        fateDelta: +5,
        flag: 'seek_recall',
      },
    ],
  },

  ch2_fisherman_early: {
    id: 'ch2_fisherman_early',
    chapter: '第二章·問道',
    scene: { icon: '釣', title: '江上遇漁翁' },
    speaker: 'fisherman',
    text: '年輕人，你盯著這片江雪看了很長時間了。\n你知道嗎，這雪落入江中，就不再是雪了，\n而你落入官場，你還是你自己嗎？',
    useAI: true,
    aiPrompt: '漁翁以道家哲學開導沉浸於失意的柳宗元。用水、雪、魚等自然意象說明得失之道，充滿禪意。',
    choices: [
      {
        text: '漁翁說的話，讓我豁然開朗。得與失不過是一念之間，我的心安定了。',
        nextId: 'ch2_enlightened',
        fateDelta: +20,
        flag: 'dao_wisdom',
      },
      {
        text: '我還有大志未能實現，怎能這樣逍遙自在？',
        nextId: 'ch2_liuyuxi_letter',
        fateDelta: +5,
        flag: 'reform_spirit',
      },
    ],
  },

  ch2_writing_spirit: {
    id: 'ch2_writing_spirit',
    chapter: '第二章·筆耕',
    scene: { icon: '墨', title: '揮毫永州' },
    speaker: 'liuzongyuan',
    text: '（柳宗元提起筆，望向窗外的小石潭……）\n山水有情，我也有情。\n《永州八記》，就從今天開始！',
    choices: [],
    next: 'ch3_hanyu_visit',
  },

  ch2_seek_return: {
    id: 'ch2_seek_return',
    chapter: '第二章·謀算',
    scene: { icon: '圖', title: '謀求回京' },
    speaker: 'liuyuxi',
    text: '回京？子厚，我們的名字至今仍讓那些守舊派感到不安。\n如果要回京，必須先讓皇上看見我們的才學，\n而不是政治主張……',
    useAI: true,
    aiPrompt: '劉禹錫分析柳宗元如何通過文學而非政治爭取回京的機會，語氣樂觀但也帶點謹慎，提到他們兩人需要避免再次觸怒朝廷。',
    choices: [],
    next: 'ch3_hanyu_visit',
  },

  ch2_enlightened: {
    id: 'ch2_enlightened',
    chapter: '第二章·悟道',
    scene: { icon: '葉', title: '心境開朗' },
    speaker: 'fisherman',
    text: '哈哈，年輕人終於想通了。\n這江裡的魚，從來不問自己是否在最深的深淵。\n只管游下去，就好了。',
    choices: [],
    next: 'ch3_hanyu_visit',
  },

  /* ============================================================
     第三章：韓愈的忠告
  ============================================================ */
  ch3_hanyu_visit: {
    id: 'ch3_hanyu_visit',
    chapter: '第三章·文壇',
    scene: { icon: '廟', title: '韓退之來訪' },
    speaker: 'hanyu',
    text: '子厚，你的《捕蛇者說》我已拜讀過了。\n文章確實很好，但這些言論傳到京城，恐怕……\n我並非要你沉默，只是——有些話，用文章說，比用奏折說，更加危險。',
    useAI: true,
    aiPrompt: '韓愈以長者身份勸告柳宗元，說明在政治敏感時期，批評時弊的文章雖然有力，但也可能帶來更嚴重的政治後果。韓愈對柳宗元的文才十分欣賞，但建議他謹慎。引用儒家思想。',
    choices: [
      {
        text: '退之說得有道理，我應該用山水遊記代替政論文章，明智地保護自己。',
        nextId: 'ch3_prudent_path',
        fateDelta: +10,
        flag: 'prudent',
      },
      {
        text: '文章如果不能說真話，與沉默有什麼分別？我的筆下，只有真情實感。',
        nextId: 'ch3_brave_path',
        fateDelta: +5,
        flag: 'brave_writing',
      },
      {
        text: '退之，你可以代我向皇上說幾句好話嗎？',
        nextId: 'ch3_ask_hanyu_help',
        fateDelta: +5,
        flag: 'seek_help',
      },
    ],
  },

  ch3_prudent_path: {
    id: 'ch3_prudent_path',
    chapter: '第三章·隱鋒',
    scene: { icon: '波', title: '收斂鋒芒' },
    speaker: 'hanyu',
    text: '這樣很好。你的才華可以在永州的山水中盡情揮灑，\n等到時機成熟，自然會有皇上召你回去的那一天。\n我在京城，一定會為你留意機會的。',
    choices: [],
    next: 'ch4_emperor_summon',
  },

  ch3_brave_path: {
    id: 'ch3_brave_path',
    chapter: '第三章·直筆',
    scene: { icon: '劍', title: '直筆不諱' },
    speaker: 'liuzongyuan',
    text: '我的文章，是百姓的聲音。\n如果連這個也要隱藏，那永州的十年，不是白白浪費了嗎？\n我寧可再被貶謫，也不願意低頭屈服。',
    choices: [],
    next: 'ch4_emperor_summon',
  },

  ch3_ask_hanyu_help: {
    id: 'ch3_ask_hanyu_help',
    chapter: '第三章·求援',
    scene: { icon: '義', title: '求韓愈代言' },
    speaker: 'hanyu',
    text: '子厚……我與你是文壇好友，這份情誼我非常珍視。\n但在皇上面前，我也需要謹慎行事——\n不過我可以在文壇廣泛傳播你的佳作，讓皇上自然聽聞你的才名。',
    useAI: true,
    aiPrompt: '韓愈解釋他願意在文壇為柳宗元傳播聲譽，但對直接向皇帝求情有所保留。語氣真誠但帶著一點無奈和政治的複雜性。',
    choices: [],
    next: 'ch4_emperor_summon',
  },

  /* ============================================================
     第四章：皇帝的召見
  ============================================================ */
  ch4_emperor_summon: {
    id: 'ch4_emperor_summon',
    chapter: '第四章·天意',
    scene: { icon: '冠', title: '皇詔抵達' },
    speaker: 'emperor',
    text: '朕聽聞柳宗元才名，他的《永州八記》已傳至京城。\n朕念在他受苦十年，本有意……\n但永貞舊事，朕怎能忘記？\n柳宗元，你有什麼話可說？',
    useAI: true,
    aiPrompt: '唐憲宗召見柳宗元，態度威嚴，對永貞革新有所保留，但也對柳宗元的文才有所欣賞。他在考量是否召柳宗元回京或再貶。語氣要有帝王的威嚴和不確定性。',
    choices: [
      {
        text: '臣知道自己的過錯，當年年輕氣盛，一切都聽從陛下的裁決。',
        nextId: 'ch4_submit',
        fateDelta: +20,
        flag: 'submit_emperor',
      },
      {
        text: '陛下，永貞革新是為了大唐百姓，臣並不後悔，只希望陛下能明察。',
        nextId: 'ch4_defend',
        fateDelta: -5,
        flag: 'defend_reform',
      },
      {
        text: '臣不求恢復官職，只求在柳州盡力治理百姓，報答陛下的恩情。',
        nextId: 'ch4_offer_service',
        fateDelta: +15,
        flag: 'liuzhou_path',
      },
    ],
  },

  ch4_submit: {
    id: 'ch4_submit',
    chapter: '第四章·折腰',
    scene: { icon: '詔', title: '俯首稱臣' },
    speaker: 'emperor',
    text: '柳宗元能知錯改過，這是非常好的事情。\n但京中舊事未息，朕命你擔任柳州刺史，\n好好治理百姓，不要再生事端。',
    choices: [],
    next: 'ending_check',
  },

  ch4_defend: {
    id: 'ch4_defend',
    chapter: '第四章·直諫',
    scene: { icon: '鳴', title: '直言陳情' },
    speaker: 'emperor',
    text: '（皇上微微動怒）\n柳宗元，你這是……\n算了。你的文章朕都讀過，確實是個人才。\n但這件事，讓朕再考慮考慮。',
    choices: [],
    next: 'ending_check',
  },

  ch4_offer_service: {
    id: 'ch4_offer_service',
    chapter: '第四章·柳州',
    scene: { icon: '葉', title: '請命柳州' },
    speaker: 'emperor',
    text: '柳州……確實偏遠。\n你既然有這份心意，就去吧。\n朕要看看你在柳州能有什麼作為。',
    choices: [],
    next: 'ending_check',
  },

  /* ============================================================
     結局分配節點
  ============================================================ */
  ending_check: {
    id: 'ending_check',
    chapter: '尾聲',
    scene: { icon: '星', title: '命運揭曉' },
    speaker: 'liuzongyuan',
    text: '（柳宗元靜靜望向那片江雪，心中已有了答案……）',
    choices: [],
    next: '__ending__', // 由 GameEngine 根據命運值與旗標決定
  },
};

/* ============================================================
   結局定義
============================================================ */
const ENDINGS = {
  historical: {
    id: 'historical',
    seal: '史',
    title: '歷史之路',
    poem: '孤舟蓑笠翁，獨釣寒江雪。\n此身雖貶謫，文章萬古傳。',
    desc: '柳宗元在柳州任刺史，興辦學校、釋放奴婢、鑿井引水，政績卓著。\n元和十四年（819年），柳宗元在柳州病逝，年僅四十七歲。\n然其《永州八記》《捕蛇者說》等文章，流傳千古，後世尊為唐宋八大家之一。',
    tags: ['文學成就', '柳州牧民', '歷史真實'],
    history: '⚠️ 這是柳宗元真實的歷史結局。他雖未能返京，卻以文學和地方政績留名青史。',
    minFate: 0,
    requiredFlags: [],
  },

  literary: {
    id: 'literary',
    seal: '文',
    title: '文壇宗師',
    poem: '十年永州筆不輟，\n山水之間見性靈。\n後世千載尊大家，\n江雪一首萬古情。',
    desc: '柳宗元選擇全心投入文學創作，《永州八記》成為中國山水文學的巔峰之作。\n他的文章影響了後世無數文人，成為唐宋古文運動的旗幟。\n雖未復官，但他的精神永遠活在文字之中。',
    tags: ['文學路線', '永州八記', '古文運動'],
    history: '📚 柳宗元的文學貢獻在歷史上確有記載，他與韓愈並稱古文運動的兩大旗手。',
    minFate: 40,
    requiredFlags: ['wenxue_achievement'],
  },

  reform: {
    id: 'reform',
    seal: '革',
    title: '改革復辟',
    poem: '革新雖敗猶有志，\n貶謫十年心不移。\n若得重回廟堂日，\n必使蒼生皆歡喜。',
    desc: '柳宗元繼承王叔文的遺志，在文章中持續倡議改革。\n最終感動了部分朝臣，在元和末年被短暫召回，\n雖然政治改革未能全面推行，但他的思想為後世改革奠定了基礎。',
    tags: ['改革路線', '政治理想', '假設歷史'],
    history: '🔮 這是假設的歷史分支。現實中柳宗元未能主導政治改革，但其政論文章影響深遠。',
    minFate: 65,
    requiredFlags: ['reform_spirit'],
  },

  hermit: {
    id: 'hermit',
    seal: '隱',
    title: '江湖歸隱',
    poem: '千山萬徑本無人，\n蓑笠漁翁自在身。\n名利浮雲皆散去，\n一竿釣盡古今春。',
    desc: '柳宗元受漁翁點化，看透了仕途的虛妄，\n選擇在永州山水間終老，著書立說，廣收弟子。\n他成為了那個時代最自由的靈魂，如《江雪》詩中的漁翁一般，超然物外。',
    tags: ['隱逸路線', '道家超脫', '假設歷史'],
    history: '葉 這是假設的歷史分支。現實中柳宗元並未真正歸隱，但詩中漁翁的意象被認為是他內心的投射。',
    minFate: 55,
    requiredFlags: ['dao_wisdom'],
  },

  tragedy: {
    id: 'tragedy',
    seal: '殤',
    title: '悲劇之路',
    poem: '千山獨行人已老，\n萬徑冰封夢難回。\n孤舟破碎寒江上，\n一生抱負付東流。',
    desc: '柳宗元因心灰意冷，加上政治壓力，健康每況愈下。\n未等到任何轉機，便在永州離世，\n留下未竟的文章與無盡的遺憾。',
    tags: ['悲劇結局', '命運弄人'],
    history: '💔 這個結局反映了柳宗元內心最深的恐懼。願每位讀者都能在逆境中找到前行的力量。',
    minFate: 0,
    requiredFlags: ['despair'],
  },
};

/**
 * 根據命運值和旗標決定結局
 * @param {number} fate
 * @param {Set} flags
 * @returns {object} ending
 */
function determineEnding(fate, flags) {
  if (flags.has('despair') && fate < 30) return ENDINGS.tragedy;
  if (flags.has('dao_wisdom') && fate >= 55) return ENDINGS.hermit;
  if (flags.has('reform_spirit') && fate >= 65) return ENDINGS.reform;
  if (flags.has('wenxue_achievement') && fate >= 40) return ENDINGS.literary;
  return ENDINGS.historical;
}
