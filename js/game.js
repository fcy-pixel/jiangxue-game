/**
 * game.js
 * 江雪·問天 — 主遊戲引擎（角色養成版）
 * 新增：好感度系統、典籍收藏、心法技能、境界突破特效、成就系統
 */

const GameEngine = (() => {

  /* ====================================================
     常量定義
  ==================================================== */

  const START_MIND = { ideal: 35, solitude: 35, compassion: 35, writing: 35 };

  const MIND_LABELS = { ideal: '理想', solitude: '孤寂', compassion: '民心', writing: '文心' };

  const MIND_REALMS = [
    { min: 0,   title: '寒江初醒',   note: '仍在失意與理想之間徘徊' },
    { min: 165, title: '永州照心',   note: '開始用山水照見自己的痛苦' },
    { min: 195, title: '文以載道',   note: '懂得把苦難、民生與思想寫進文章' },
    { min: 225, title: '孤舟問天',   note: '在孤獨中仍守住人格與信念' },
    { min: 255, title: '子厚成章',   note: '把貶謫鍛造成文學與精神力量' },
  ];

  const FLAG_MIND_EFFECTS = {
    reform_spirit:     { ideal: 16, solitude: 4 },
    literary_path:     { writing: 15, solitude: 4 },
    despair:           { solitude: 18, ideal: -8 },
    wenxue_achievement:{ writing: 18, solitude: 6 },
    seek_recall:       { ideal: 8, writing: 6 },
    dao_wisdom:        { solitude: 10, writing: 8, compassion: 4 },
    prudent:           { writing: 8, solitude: 8 },
    brave_writing:     { ideal: 10, compassion: 12, writing: 8 },
    seek_help:         { writing: 8, compassion: 4 },
    submit_emperor:    { solitude: 8, ideal: -4 },
    defend_reform:     { ideal: 14, compassion: 8 },
    liuzhou_path:      { compassion: 18, writing: 4 },
    free_slaves:       { compassion: 20, ideal: 6 },
    build_wells:       { compassion: 16, writing: 4 },
    school_found:      { writing: 14, compassion: 10, ideal: 8 },
  };

  const FLAG_INSIGHTS = {
    reform_spirit:     '你把柳宗元心中的改革火種重新點起：即使身在永州，理想仍未熄滅。',
    literary_path:     '你讓柳宗元轉向文章與山水，把失意化成可以流傳後世的文字。',
    despair:           '你觸碰到柳宗元最深的黑暗：被貶不是單純離開京城，而是被時代拋下的孤獨。',
    wenxue_achievement:'你看見永州山水如何成為柳宗元的心靈出口，文心因此更清澈。',
    seek_recall:       '你仍盼望回到廟堂，這份期待讓柳宗元在現實與尊嚴之間拉扯。',
    dao_wisdom:        '漁翁的話使你明白：真正的超脫不是放棄人生，而是先安頓自己的心。',
    prudent:           '你學會把鋒芒藏入山水文字，柳宗元的沉着與忍耐因此增加。',
    brave_writing:     '你選擇讓文章替百姓發聲，柳宗元的文學不再只是抒情，而有了道義重量。',
    seek_help:         '你願意接受朋友的幫助，也看見文壇聲望可能成為柳宗元重回歷史中心的道路。',
    submit_emperor:    '你選擇低頭保存餘生，這不是單純懦弱，而是柳宗元在政治壓力下的艱難權衡。',
    defend_reform:     '你讓柳宗元直面皇權，說出改革初心；代價很高，但人格更清楚。',
    liuzhou_path:      '你把理想轉向地方治理，讓柳宗元從政治失敗走向真正貼近百姓的實踐。',
    free_slaves:       '你頒令釋放奴婢，讓數百個家庭重聚。這是柳宗元仁政最具體的體現。',
    build_wells:       '你用實際行動為百姓引入清水，把理想落實在每一口井裡。',
    school_found:      '你在偏遠的柳州點燃了知識之火，讓一代孩子看見了更廣闊的世界。',
  };

  /* ── 典籍收藏 ── */
  const WORKS = {
    jiangxue: {
      id: 'jiangxue', title: '《江雪》', type: '詩·抒情', rarity: 5,
      content: '千山鳥飛絕，萬徑人蹤滅。\n孤舟蓑笠翁，獨釣寒江雪。',
      note: '此詩作於永州被貶期間，是柳宗元最著名的作品。孤獨的漁翁獨釣寒江，被認為是詩人在政治逆境中精神堅守的象徵。短短二十字，勾勒出靜謐而孤絕的意境，被譽為唐詩絕唱。',
    },
    fengjianlu: {
      id: 'fengjianlu', title: '《封建論》', type: '政論·改革', rarity: 5,
      content: '天下之道，理安斯得人者也。使賢者居上，不肖者居下，而後可以理安。\n……郡縣制，非聖人意也，勢也。',
      note: '柳宗元最重要的政論文之一。以歷史唯物論的視角分析封建制度的演變，主張郡縣制的進步性，批判分封制的弊端。這一觀點在唐代極為超前，對後世政治思想影響深遠。',
    },
    bushezheshuo: {
      id: 'bushezheshuo', title: '《捕蛇者說》', type: '散文·批判', rarity: 4,
      content: '永州之野產異蛇，黑質而白章……\n「悍吏之來吾鄉，叫囂乎東西，隳突乎南北，嘩然而駭者，雖雞狗不得寧焉。」',
      note: '柳宗元在永州親歷百姓疾苦後所作。通過描寫捕蛇者寧可冒死捕蛇也不願繳稅，批判「苛政猛於虎」的社會現實，是中國古代批判性散文的代表作。',
    },
    xiaoshitanjie: {
      id: 'xiaoshitanjie', title: '《小石潭記》', type: '散文·山水', rarity: 4,
      content: '從小丘西行百二十步，隔篁竹，聞水聲，如鳴佩環，心樂之。\n坐潭上，四面竹樹環合，寂寥無人，悽神寒骨，悄愴幽邃。以其境過清，不可久居，乃記之而去。',
      note: '永州八記之一。表面描寫小石潭的清幽景色，實際寄托了詩人被貶後無法排遣的孤寂與悲涼。「以其境過清，不可久居」既是寫景，也是寫心。',
    },
    zhongliuxi: {
      id: 'zhongliuxi', title: '《種柳戲題》', type: '詩·柳州', rarity: 3,
      content: '柳州柳刺史，種柳柳江邊。\n談笑為故事，推移成昔年。\n垂蔭當覆地，聳幹會參天。\n好作思人樹，慚無惠化傳。',
      note: '柳宗元在柳州任刺史時所作。詩人以輕鬆口吻寫自己在柳江邊種柳樹，「好作思人樹」寄托了他希望百姓懷念他的心願，充滿了對百姓的深情。',
    },
    dengliuzhou: {
      id: 'dengliuzhou', title: '《登柳州城樓》', type: '詩·思念', rarity: 5,
      content: '城上高樓接大荒，海天愁思正茫茫。\n驚風亂颭芙蓉水，密雨斜侵薜荔牆。\n嶺樹重遮千里目，江流曲似九回腸。\n共來百越文身地，猶自音書滯一鄉。',
      note: '柳宗元登上柳州城樓，遙想五位同被貶謫的好友，盡抒天涯淪落人的相思之情。「江流曲似九回腸」是千古名句，把蜿蜒的江流比作九轉迴腸的思念，令人動容。',
    },
  };

  /* ── 心法技能 ── */
  const MIND_SKILLS = {
    reform_spirit:      { name: '改革之志', icon: '炎', color: '#d3583c', desc: '繼承王叔文的改革理想，文章充滿批判時弊的力量' },
    literary_path:      { name: '山水文心', icon: '筆', color: '#d1a33a', desc: '以永州山水淨化心靈，文字更具詩意與感染力' },
    dao_wisdom:         { name: '道家超脫', icon: '道', color: '#5d7fb0', desc: '悟得得失之道，心境平和自在，看淡名利浮雲' },
    wenxue_achievement: { name: '永州八記', icon: '山', color: '#5a8a50', desc: '以永州山水為題，創作出傳世的遊記散文' },
    brave_writing:      { name: '直筆千秋', icon: '劍', color: '#c0392b', desc: '不畏強權，以文章替百姓發聲，文章有道義重量' },
    liuzhou_path:       { name: '仁政惠民', icon: '民', color: '#5a8a50', desc: '把政治理想轉向地方治理，真正貼近百姓' },
    free_slaves:        { name: '釋奴之仁', icon: '仁', color: '#5a8a50', desc: '釋放奴婢，彰顯仁政，感化一方百姓' },
    school_found:       { name: '興學傳文', icon: '學', color: '#d1a33a', desc: '創辦學堂，讓文化之光照耀偏遠之地' },
    build_wells:        { name: '鑿井利民', icon: '水', color: '#5d7fb0', desc: '引入清泉，改善民生，以實際行動兌現理想' },
  };

  /* ── 成就定義 ── */
  const ACHIEVEMENTS_DEF = {
    first_step:       { id: 'first_step',       icon: '◎', title: '踏上旅程',   desc: '開始了柳宗元的心路歷程' },
    reform_fire:      { id: 'reform_fire',       icon: '炎', title: '改革之火',   desc: '繼承了王叔文的改革意志' },
    liuyuxi_bond:     { id: 'liuyuxi_bond',      icon: '友', title: '患難之交',   desc: '與劉禹錫書信往來，互相鼓勵' },
    dao_wisdom_ach:   { id: 'dao_wisdom_ach',    icon: '道', title: '江上悟道',   desc: '從漁翁的話語中得到了道家的智慧' },
    brave_pen:        { id: 'brave_pen',         icon: '筆', title: '直筆千秋',   desc: '選擇讓文章替百姓說出真相' },
    hanyu_respect:    { id: 'hanyu_respect',     icon: '文', title: '文壇知己',   desc: '在韓愈的忠告中找到了方向' },
    liuzhou_gov:      { id: 'liuzhou_gov',       icon: '冠', title: '柳州父母官', desc: '踏上了柳州刺史的征途' },
    free_slaves:      { id: 'free_slaves',       icon: '仁', title: '仁政惠民',   desc: '頒令釋放了柳州的典押奴婢' },
    build_wells_ach:  { id: 'build_wells_ach',   icon: '水', title: '鑿井利民',   desc: '為柳州百姓引入了清潔水源' },
    school_found_ach: { id: 'school_found_ach',  icon: '學', title: '興學育才',   desc: '在偏遠的柳州創辦了學堂' },
    realm_2:          { id: 'realm_2',           icon: '境', title: '永州照心',   desc: '心境達到第二境界' },
    realm_3:          { id: 'realm_3',           icon: '境', title: '文以載道',   desc: '心境達到第三境界' },
    realm_4:          { id: 'realm_4',           icon: '境', title: '孤舟問天',   desc: '心境達到第四境界' },
    realm_5:          { id: 'realm_5',           icon: '★', title: '子厚成章',   desc: '達到最高心境境界！' },
  };

  /* ── 好感度等級 ── */
  const REL_LEVELS = [
    { min: 0,  label: '陌路',     color: '#6b6b5a' },
    { min: 25, label: '相識',     color: '#5d7fb0' },
    { min: 50, label: '知己',     color: '#5a8a50' },
    { min: 70, label: '莫逆',     color: '#c8960c' },
    { min: 85, label: '生死之交', color: '#e8b84b' },
  ];

  const START_RELATIONS = {
    wangshuwwen: 40,
    liuyuxi: 65,
    hanyu: 45,
    fisherman: 30,
    emperor: 20,
  };

  const REL_NAMES = {
    wangshuwwen: '王叔文',
    liuyuxi: '劉禹錫',
    hanyu: '韓愈',
    fisherman: '江上漁翁',
    emperor: '唐憲宗',
  };

  /* ====================================================
     狀態
  ==================================================== */
  let state = {
    fate: 50,
    mind: { ...START_MIND },
    flags: new Set(),
    relations: { ...START_RELATIONS },
    collection: new Set(),
    achievements: new Set(),
    previousRealm: 0,
    currentNodeId: 'start',
    apiKey: '',
    isTyping: false,
    history: [],
    nodeMessages: [],
    currentChar: null,
    isSending: false,
    collectionTab: 'works',
  };

  /* ====================================================
     DOM 工具
  ==================================================== */
  const $ = id => document.getElementById(id);

  /* ====================================================
     畫面切換
  ==================================================== */
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });
    const screen = $(id);
    screen.style.display = 'flex';
    requestAnimationFrame(() => screen.classList.add('active'));
  }

  /* ====================================================
     開始遊戲
  ==================================================== */
  function startGame() {
    state.fate = 50;
    state.mind = { ...START_MIND };
    state.flags = new Set();
    state.relations = { ...START_RELATIONS };
    state.collection = new Set();
    state.achievements = new Set();
    state.previousRealm = 0;
    state.currentNodeId = 'start';
    state.history = [];
    state.nodeMessages = [];
    state.currentChar = null;

    showScreen('screen-game');
    updateMindPanel();
    renderNode('start');
  }

  /* ====================================================
     System Prompt 構建
  ==================================================== */
  const LANG_REMINDER = '\n\n（請用現代書面中文回答，不可用文言文，不可說「吾」「汝」「乃」「矣」等文言詞。）';

  function buildSystemPrompt(char) {
    const LANG_RULE =
      '【語言規定 — 這是最重要的規定，必須百分之百遵守】\n' +
      '本遊戲供中學生使用。雖然你扮演古代歷史人物，但你必須全程使用【現代書面中文（白話文）】交談，絕對禁止使用文言文。\n\n' +
      '禁止使用的文言詞（括號內是必須改用的現代詞）：\n' +
      '• 吾、余 → 改說「我」\n• 汝、爾、卿 → 改說「你」\n• 乃 → 改說「是」或「就是」\n' +
      '• 亦 → 改說「也」\n• 豈 → 改說「難道」\n• 焉、哉、矣、也（語氣詞）→ 刪去或換現代語氣詞\n\n' +
      '正確示範：「我是柳宗元，很高興跟你討論這些問題。」\n' +
      '錯誤示範：「吾乃柳宗元，願與爾共議天下大計。」\n\n' +
      '說話風格：像受過良好教育的現代人，用正式清晰的書面中文。每次回應不超過80字。\n\n' +
      '【角色代入規定】\n任何情況下都不能說「我是AI」。遇到不懂的問題，用角色的性格婉轉回應。\n\n' +
      '【對話對象】現在跟你說話的人就是柳宗元（字子厚）本人。\n' +
      '• 王叔文、劉禹錫應稱呼對方「子厚」\n' +
      '• 韓愈應稱呼對方「子厚賢弟」或「子厚」\n' +
      '• 江上漁翁應稱呼對方「年輕人」\n' +
      '• 唐憲宗應稱呼對方「柳宗元」或「愛卿」\n\n' +
      '【角色背景】\n';
    return LANG_RULE + char.systemPrompt;
  }

  /* ====================================================
     好感度系統
  ==================================================== */
  function getRelLevel(value) {
    return REL_LEVELS.reduce((best, lv) => value >= lv.min ? lv : best, REL_LEVELS[0]);
  }

  function applyRelDelta(delta) {
    if (!delta) return;
    Object.entries(delta).forEach(([id, val]) => {
      if (id in state.relations) {
        state.relations[id] = Math.max(0, Math.min(100, state.relations[id] + val));
      }
    });
  }

  function updateRelBar(charId) {
    const barEl = $('char-affinity');
    if (!barEl) return;
    if (!charId || !(charId in state.relations)) {
      barEl.style.display = 'none';
      return;
    }
    const value = state.relations[charId];
    const lv = getRelLevel(value);
    $('affinity-label').textContent = lv.label;
    $('affinity-label').style.color = lv.color;
    $('affinity-fill').style.width = value + '%';
    $('affinity-fill').style.background = `linear-gradient(90deg, #5d7fb0, ${lv.color})`;
    $('affinity-value').textContent = value;
    barEl.style.display = 'flex';
  }

  /* ====================================================
     典籍收藏系統
  ==================================================== */
  function collectWork(workId) {
    if (!workId || !WORKS[workId] || state.collection.has(workId)) return;
    state.collection.add(workId);
    showUnlockToast('📜', '典籍獲得', WORKS[workId].title);
  }

  function toggleCollection() {
    const panel = $('panel-collection');
    if (!panel) return;
    if (panel.style.display === 'none' || !panel.style.display) {
      state.collectionTab = 'works';
      document.querySelectorAll('.panel-tab').forEach(b => b.classList.remove('active'));
      document.querySelector('.panel-tab[data-tab="works"]')?.classList.add('active');
      renderCollectionBody();
      panel.style.display = 'flex';
    } else {
      panel.style.display = 'none';
    }
  }

  function switchCollectionTab(tab) {
    state.collectionTab = tab;
    document.querySelectorAll('.panel-tab').forEach(b => b.classList.remove('active'));
    document.querySelector(`.panel-tab[data-tab="${tab}"]`)?.classList.add('active');
    renderCollectionBody();
  }

  function renderCollectionBody() {
    const body = $('collection-body');
    if (!body) return;
    body.innerHTML = '';
    if (state.collectionTab === 'works') {
      body.className = 'panel-body collection-grid';
      Object.values(WORKS).forEach(work => {
        const unlocked = state.collection.has(work.id);
        const card = document.createElement('div');
        card.className = 'work-card' + (unlocked ? '' : ' locked');
        if (unlocked) {
          const stars = '★'.repeat(work.rarity) + '☆'.repeat(5 - work.rarity);
          card.innerHTML = `
            <div class="work-title">${work.title}</div>
            <div class="work-type">${work.type}</div>
            <div class="work-rarity">${stars}</div>
            <div class="work-excerpt">${work.content.split('\n')[0]}</div>`;
          card.onclick = () => showWorkDetail(work);
        } else {
          card.innerHTML = `
            <div class="work-title work-unknown">？？？</div>
            <div class="work-type">${work.type}</div>
            <div class="work-rarity">${'☆'.repeat(5)}</div>
            <div class="work-locked-text">繼續探索以解鎖</div>`;
        }
        body.appendChild(card);
      });
    } else {
      body.className = 'panel-body skills-grid';
      Object.entries(MIND_SKILLS).forEach(([flag, skill]) => {
        const unlocked = state.flags.has(flag);
        const card = document.createElement('div');
        card.className = 'skill-card' + (unlocked ? ' unlocked' : ' locked');
        card.innerHTML = unlocked
          ? `<div class="skill-icon" style="color:${skill.color};border-color:${skill.color}40">${skill.icon}</div>
             <div class="skill-name" style="color:${skill.color}">${skill.name}</div>
             <div class="skill-desc">${skill.desc}</div>`
          : `<div class="skill-icon locked-icon">？</div>
             <div class="skill-name locked-name">未習得</div>
             <div class="skill-desc">選擇特定路線以解鎖</div>`;
        body.appendChild(card);
      });
    }
  }

  function showWorkDetail(work) {
    let modal = $('work-detail-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'work-detail-modal';
      document.body.appendChild(modal);
    }
    const stars = '★'.repeat(work.rarity) + '☆'.repeat(5 - work.rarity);
    modal.className = 'work-modal-overlay';
    modal.innerHTML = `
      <div class="work-detail-inner">
        <div class="work-detail-title">${work.title}</div>
        <div class="work-detail-meta">${work.type} &nbsp;<span class="work-detail-stars">${stars}</span></div>
        <div class="work-detail-content">${work.content.replace(/\n/g, '<br>')}</div>
        <div class="work-detail-note">${work.note}</div>
        <button class="work-detail-close" onclick="document.getElementById('work-detail-modal').style.display='none'">收起典籍</button>
      </div>`;
    modal.style.display = 'flex';
  }

  /* ====================================================
     成就系統
  ==================================================== */
  function triggerAchievement(id) {
    if (!id || state.achievements.has(id) || !ACHIEVEMENTS_DEF[id]) return;
    state.achievements.add(id);
    const ach = ACHIEVEMENTS_DEF[id];
    showUnlockToast(ach.icon, '成就解鎖', ach.title);
  }

  function toggleAchievements() {
    const panel = $('panel-achievements');
    if (!panel) return;
    if (panel.style.display === 'none' || !panel.style.display) {
      renderAchievementsPanel();
      panel.style.display = 'flex';
    } else {
      panel.style.display = 'none';
    }
  }

  function renderAchievementsPanel() {
    const grid = $('achievement-grid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.values(ACHIEVEMENTS_DEF).forEach(ach => {
      const unlocked = state.achievements.has(ach.id);
      const card = document.createElement('div');
      card.className = 'ach-card ' + (unlocked ? 'unlocked' : 'locked');
      card.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-name">${ach.title}</div>
        <div class="ach-desc">${unlocked ? ach.desc : '???'}</div>`;
      grid.appendChild(card);
    });
  }

  /* ── 通用解鎖 Toast（排隊顯示）── */
  let _toastQueue = [];
  let _toastBusy = false;

  function showUnlockToast(icon, type, name) {
    _toastQueue.push({ icon, type, name });
    if (!_toastBusy) processToastQueue();
  }

  function processToastQueue() {
    if (_toastQueue.length === 0) { _toastBusy = false; return; }
    _toastBusy = true;
    const { icon, type, name } = _toastQueue.shift();
    const el = $('unlock-toast');
    if (!el) { _toastBusy = false; return; }
    $('unlock-toast-icon').textContent = icon;
    $('unlock-toast-type').textContent = type;
    $('unlock-toast-name').textContent = name;
    el.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => {
        el.style.display = 'none';
        setTimeout(processToastQueue, 200);
      }, 450);
    }, 3000);
  }

  /* ====================================================
     境界突破特效
  ==================================================== */
  function showRealmBreakthrough(realm) {
    const overlay = $('realm-breakthrough');
    if (!overlay) return;
    $('breakthrough-name').textContent = realm.title;
    $('breakthrough-note').textContent = realm.note;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('show')));
    setTimeout(() => {
      overlay.classList.remove('show');
      setTimeout(() => { overlay.style.display = 'none'; }, 700);
    }, 3200);
  }

  /* ====================================================
     渲染節點
  ==================================================== */
  async function renderNode(nodeId) {
    const node = STORY[nodeId];
    if (!node) { console.error('找不到節點：', nodeId); return; }
    state.currentNodeId = nodeId;
    state.nodeMessages = [];
    state.currentChar = CHARACTERS[node.speaker] || null;
    hideChatArea();

    $('chapter-title').textContent = node.chapter || '';
    updateFateBar();
    updateMindPanel();

    if (node.scene) {
      $('scene-icon').textContent = node.scene.icon;
      $('scene-title').textContent = node.scene.title;
    }

    if (state.currentChar) {
      const imgEl = $('portrait-img');
      const charEl = $('portrait-char');
      if (state.currentChar.portrait) {
        imgEl.src = state.currentChar.portrait;
        imgEl.alt = state.currentChar.name;
        imgEl.style.display = 'block';
        charEl.style.display = 'none';
      } else {
        imgEl.style.display = 'none';
        charEl.style.display = 'block';
        charEl.textContent = state.currentChar.char || state.currentChar.name[0];
      }
      $('portrait-name').textContent = state.currentChar.name;
      $('portrait-frame').style.borderColor = state.currentChar.color;
      updateRelBar(state.currentChar.id);
      applyPortraitGlow(state.currentChar.id);
    } else {
      const barEl = $('char-affinity');
      if (barEl) barEl.style.display = 'none';
    }

    $('choices-area').innerHTML = '';
    $('btn-continue').style.display = 'none';
    $('ai-badge').style.display = 'none';

    if (node.collectWork) collectWork(node.collectWork);
    if (node.achievement) setTimeout(() => triggerAchievement(node.achievement), 1200);

    let text = node.text;
    if (node.useAI) {
      $('ai-badge').style.display = 'block';
      text = await fetchInitialDialogue(node);
      $('ai-badge').style.display = 'none';
    }

    if (state.currentChar) {
      const initPrompt = node.useAI ? (node.aiPrompt || node.text) : node.text;
      state.nodeMessages = [
        { role: 'system',    content: buildSystemPrompt(state.currentChar) },
        { role: 'user',      content: initPrompt + LANG_REMINDER },
        { role: 'assistant', content: text },
      ];
    }

    await typeText(text);

    if (node.choices && node.choices.length > 0) {
      renderChoices(node.choices);
      if (node.useAI) showChatArea();
    } else if (node.next === '__ending__') {
      if (node.useAI) showChatArea();
      $('btn-continue').textContent = '揭曉命運 ›';
      $('btn-continue').style.display = 'block';
      $('btn-continue').onclick = triggerEnding;
    } else if (node.next) {
      if (node.useAI) showChatArea();
      $('btn-continue').textContent = '繼續故事 ›';
      $('btn-continue').style.display = 'block';
      $('btn-continue').onclick = () => renderNode(node.next);
    }
  }

  function applyPortraitGlow(charId) {
    const frame = $('portrait-frame');
    if (!frame || !state.currentChar) return;
    const val = charId in state.relations ? state.relations[charId] : 0;
    if (val >= 70) {
      frame.style.boxShadow = `0 0 20px ${state.currentChar.color}80, inset 0 0 10px rgba(200,150,12,0.15)`;
    } else {
      frame.style.boxShadow = 'inset 0 0 10px rgba(200,150,12,0.1), 0 0 15px rgba(200,150,12,0.15)';
    }
  }

  /* ====================================================
     自由對話
  ==================================================== */
  function showChatArea() {
    const area = $('chat-area');
    $('chat-history').innerHTML = '';
    $('chat-input').value = '';
    area.style.display = 'flex';

    const suggestEl = $('chat-suggestions');
    suggestEl.innerHTML = '';
    const suggestions = state.currentChar?.suggestions;
    if (suggestions && suggestions.length > 0) {
      suggestEl.style.display = 'flex';
      suggestions.forEach(q => {
        const btn = document.createElement('button');
        btn.className = 'suggestion-chip';
        btn.textContent = q;
        btn.onclick = () => { $('chat-input').value = q; sendChat(); };
        suggestEl.appendChild(btn);
      });
    } else {
      suggestEl.style.display = 'none';
    }

    $('chat-input').onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
    };
  }

  function hideChatArea() {
    $('chat-area').style.display = 'none';
    $('chat-history').innerHTML = '';
    if ($('chat-input')) $('chat-input').value = '';
    const suggestEl = $('chat-suggestions');
    if (suggestEl) { suggestEl.innerHTML = ''; suggestEl.style.display = 'none'; }
  }

  async function sendChat() {
    if (state.isSending) return;
    const input = $('chat-input');
    const userText = input.value.trim();
    if (!userText) return;

    state.isSending = true;
    const sendBtn = $('btn-send');
    sendBtn.disabled = true;
    input.value = '';

    appendBubble('player', null, userText);
    state.nodeMessages.push({ role: 'user', content: userText + LANG_REMINDER });

    const loadingBubble = appendLoadingBubble();
    const reply = await fetchChatReply();
    loadingBubble.remove();
    appendBubble('character', state.currentChar?.name || '角色', reply);
    state.nodeMessages.push({ role: 'assistant', content: reply });

    await typeText(reply);

    state.isSending = false;
    sendBtn.disabled = false;
    input.focus();
  }

  function appendBubble(type, name, text) {
    const history = $('chat-history');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${type}`;
    if (type === 'character' && name) {
      const nameEl = document.createElement('span');
      nameEl.className = 'bubble-name';
      nameEl.textContent = name + '：';
      bubble.appendChild(nameEl);
    }
    bubble.appendChild(document.createTextNode(text));
    history.appendChild(bubble);
    history.scrollTop = history.scrollHeight;
    return bubble;
  }

  function appendLoadingBubble() {
    const history = $('chat-history');
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble character';
    bubble.innerHTML = `<span class="bubble-name">${state.currentChar?.name || '角色'}：</span><span style="color:#6b6b5a;font-style:italic">正在回應……</span>`;
    history.appendChild(bubble);
    history.scrollTop = history.scrollHeight;
    return bubble;
  }

  /* ====================================================
     AI 請求
  ==================================================== */
  async function fetchInitialDialogue(node) {
    showLoading(true);
    const char = state.currentChar;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          apiKey: state.apiKey,
          messages: [
            { role: 'system', content: buildSystemPrompt(char) },
            { role: 'user',   content: (node.aiPrompt || node.text) + LANG_REMINDER },
          ],
          characterId: char?.id || '',
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || node.text;
    } catch (e) {
      if (e.name === 'AbortError') return node.text;
      console.error('Initial dialogue error:', e);
      return node.text;
    } finally {
      clearTimeout(timer);
      showLoading(false);
    }
  }

  async function fetchChatReply() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          apiKey: state.apiKey,
          messages: state.nodeMessages,
          characterId: state.currentChar?.id || '',
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || '（角色沉默不語……）';
    } catch (e) {
      if (e.name === 'AbortError') return '（回應逾時，請再試一次。）';
      return '（暫時無法取得回應，請稍後再試。）';
    } finally {
      clearTimeout(timer);
    }
  }

  /* ====================================================
     打字機效果
  ==================================================== */
  function typeText(text) {
    return new Promise(resolve => {
      state.isTyping = true;
      const el = $('dialogue-text');
      const cursor = $('typing-cursor');
      el.textContent = '';
      cursor.style.display = 'inline';
      let i = 0;
      function tick() {
        if (i < text.length) {
          el.textContent += text[i++];
          setTimeout(tick, 30);
        } else {
          cursor.style.display = 'none';
          state.isTyping = false;
          resolve();
        }
      }
      tick();
    });
  }

  /* ====================================================
     渲染選項
  ==================================================== */
  function renderChoices(choices) {
    const area = $('choices-area');
    area.innerHTML = '';
    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      const textEl = document.createElement('span');
      textEl.className = 'choice-text';
      textEl.textContent = choice.text;
      btn.appendChild(textEl);
      if (choice.relDelta) {
        const preview = Object.entries(choice.relDelta)
          .map(([id, v]) => `${REL_NAMES[id] || id} ${v > 0 ? '+' : ''}${v}`)
          .join('  ');
        if (preview) {
          const relEl = document.createElement('span');
          relEl.className = 'choice-rel-hint';
          relEl.textContent = '人情 ' + preview;
          btn.appendChild(relEl);
        }
      }
      btn.onclick = () => selectChoice(choice);
      area.appendChild(btn);
    });
  }

  /* ====================================================
     選項選擇
  ==================================================== */
  function selectChoice(choice) {
    if (choice.fateDelta) {
      state.fate = Math.max(0, Math.min(100, state.fate + choice.fateDelta));
    }
    applyMindDelta(getChoiceMindDelta(choice));
    if (choice.flag) state.flags.add(choice.flag);
    if (choice.relDelta) applyRelDelta(choice.relDelta);
    if (choice.collectWork) collectWork(choice.collectWork);
    if (choice.achievement) setTimeout(() => triggerAchievement(choice.achievement), 600);

    updateMindPanel();
    showMindInsight(choice);
    $('choices-area').innerHTML = '';
    renderNode(choice.nextId);
  }

  function nextNode() {
    const node = STORY[state.currentNodeId];
    if (node && node.next && node.next !== '__ending__') renderNode(node.next);
  }

  /* ====================================================
     結局
  ==================================================== */
  function triggerEnding() {
    const ending = determineEnding(state.fate, state.flags);
    showEnding(ending);
  }

  function showEnding(ending) {
    $('ending-seal').textContent = ending.seal;
    $('ending-title').textContent = ending.title;
    $('ending-poem').innerHTML = ending.poem.replace(/\n/g, '<br>');
    $('ending-desc').innerHTML = ending.desc.replace(/\n/g, '<br>');
    $('ending-mind').innerHTML = buildEndingMindSummary();
    $('ending-history').textContent = ending.history;

    const tagsEl = $('ending-tags');
    tagsEl.innerHTML = '';
    ending.tags.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      tagsEl.appendChild(span);
    });

    const relEl = $('ending-relations');
    if (relEl) relEl.innerHTML = buildEndingRelations();

    const statsEl = $('ending-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="ending-stat-row"><span>📚 典籍收藏</span><span>${state.collection.size} / ${Object.keys(WORKS).length}</span></div>
        <div class="ending-stat-row"><span>🏆 成就達成</span><span>${state.achievements.size} / ${Object.keys(ACHIEVEMENTS_DEF).length}</span></div>`;
    }

    showScreen('screen-ending');
  }

  function buildEndingRelations() {
    const badges = Object.entries(state.relations).map(([id, value]) => {
      const lv = getRelLevel(value);
      return `<div class="rel-badge">
        <div class="rel-badge-name">${REL_NAMES[id] || id}</div>
        <div class="rel-badge-level" style="color:${lv.color}">${lv.label}</div>
        <div class="rel-badge-bar"><div class="rel-badge-fill" style="width:${value}%;background:${lv.color}"></div></div>
      </div>`;
    }).join('');
    return `<div class="ending-relations-title">人脈情誼</div>
      <div class="relations-grid">${badges}</div>`;
  }

  /* ====================================================
     心境修行
  ==================================================== */
  function getMindTotal() {
    return Object.values(state.mind).reduce((sum, v) => sum + v, 0);
  }

  function getMindRealm() {
    const total = getMindTotal();
    return MIND_REALMS.reduce((best, r) => total >= r.min ? r : best, MIND_REALMS[0]);
  }

  function getChoiceMindDelta(choice) {
    return choice.mindDelta || FLAG_MIND_EFFECTS[choice.flag] || {};
  }

  function applyMindDelta(delta) {
    Object.entries(delta).forEach(([key, value]) => {
      const cur = state.mind[key] ?? 0;
      state.mind[key] = Math.max(0, Math.min(99, cur + value));
    });
  }

  function formatMindDelta(delta) {
    return Object.entries(delta)
      .map(([key, val]) => `${MIND_LABELS[key]} ${val > 0 ? '+' : ''}${val}`)
      .join(' · ');
  }

  function updateMindPanel() {
    const realm = getMindRealm();
    const realmIdx = MIND_REALMS.indexOf(realm);
    const titleEl = $('mind-realm-title');
    if (!titleEl) return;

    if (realmIdx > state.previousRealm) {
      state.previousRealm = realmIdx;
      setTimeout(() => {
        showRealmBreakthrough(realm);
        const achIds = ['', 'realm_2', 'realm_3', 'realm_4', 'realm_5'];
        if (achIds[realmIdx]) triggerAchievement(achIds[realmIdx]);
      }, 500);
    }

    titleEl.textContent = realm.title;
    $('mind-realm-note').textContent = realm.note;
    Object.keys(MIND_LABELS).forEach(key => {
      const value = state.mind[key];
      const valueEl = $(`mind-${key}-value`);
      const fillEl = $(`mind-${key}-fill`);
      if (valueEl) valueEl.textContent = value;
      if (fillEl) fillEl.style.width = value + '%';
    });
  }

  function showMindInsight(choice) {
    const insight = choice.insight || FLAG_INSIGHTS[choice.flag];
    const effectText = formatMindDelta(getChoiceMindDelta(choice));
    if (!insight && !effectText) return;

    let toast = document.getElementById('mind-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'mind-toast';
      toast.className = 'mind-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `
      <strong>心境變化</strong>
      ${effectText ? `<span>${effectText}</span>` : ''}
      ${insight ? `<p>${insight}</p>` : ''}`;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 4200);
  }

  function buildEndingMindSummary() {
    const realm = getMindRealm();
    const strongest = Object.keys(state.mind).sort((a, b) => state.mind[b] - state.mind[a])[0];
    const strongestText = {
      ideal:      '你塑造出的柳宗元，最強的是改革理想。他即使失勢，仍相信文章與行動可以回應時代。',
      solitude:   '你塑造出的柳宗元，最深的是孤獨感。他在寒江與永州山水之中，學會與失意共處。',
      compassion: '你塑造出的柳宗元，最重的是民心。他把自己的苦難連到百姓身上，關心制度如何影響人民。',
      writing:    '你塑造出的柳宗元，最亮的是文心。他把政治挫敗和山水體驗，鍛造成可傳千古的文字。',
    }[strongest];

    return `
      <div class="ending-mind-title">心境境界：${realm.title}</div>
      <p>${realm.note}。${strongestText}</p>
      <div class="ending-mind-stats">
        ${Object.entries(MIND_LABELS).map(([key, label]) => `<span>${label} ${state.mind[key]}</span>`).join('')}
      </div>`;
  }

  /* ====================================================
     命運指數
  ==================================================== */
  function updateFateBar() {
    $('fate-fill').style.width = state.fate + '%';
    $('fate-value').textContent = state.fate;
  }

  /* ====================================================
     重新開始
  ==================================================== */
  function restart() {
    showScreen('screen-intro');
  }

  function showLoading(show) {
    $('loading-overlay').style.display = show ? 'flex' : 'none';
  }

  /* ====================================================
     頁面初始化
  ==================================================== */
  window.addEventListener('DOMContentLoaded', () => {
    (function initSnow() {
      const container = document.getElementById('snow-container');
      const chars = ['❄', '❅', '❆', '·', '∘'];
      for (let i = 0; i < 40; i++) {
        const el = document.createElement('span');
        el.className = 'snowflake';
        el.textContent = chars[Math.floor(Math.random() * chars.length)];
        el.style.left = Math.random() * 100 + 'vw';
        el.style.fontSize = (0.6 + Math.random() * 0.8) + 'em';
        const dur = 8 + Math.random() * 14;
        const delay = Math.random() * 15;
        el.style.animation = `snowfall ${dur}s ${delay}s linear infinite`;
        container.appendChild(el);
      }
    })();

    document.querySelectorAll('.poem-line, .poem-author').forEach(el => {
      const delay = parseInt(el.dataset.delay || 0);
      el.style.animationDelay = delay + 'ms';
    });
  });

  /* ====================================================
     公開介面
  ==================================================== */
  return {
    startGame,
    nextNode,
    restart,
    sendChat,
    toggleCollection,
    toggleAchievements,
    switchCollectionTab,
  };
})();
