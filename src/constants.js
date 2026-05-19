/**
 * constants.js — 全局常量与示例数据。
 *
 * 改什么来这里：
 *   - 改打卡用的 6 个情绪选项（图标、颜色、安慰语）→ EMOTIONS
 *   - 改发心语时的预设标签（"今天有件小事让我开心"等）→ PRESET_TAGS
 *   - 改"星际回音"展示的 5 条示例心语 → MOCK_WHISPERS
 *   - 改性格测试 16 型的名字、标签、描述 → COSMIC_PERSONALITIES
 *   - 改成长里程碑（每个阶段叫什么、要几天解锁）→ MILESTONES
 *   - 加 / 改"宇宙寄语"池（梦境舱里随机抽的那些诗意短句）→ COSMIC_DREAM_INTERPRETATIONS
 *   - 改"称号徽章"门槛和名字（送暖几次解锁哪个徽章）→ TITLES
 *   - 加 / 删可选头像 emoji → AVATAR_EMOJIS
 *   - 改"明日"tab 的温柔建议（emoji + 主标题 + 副文）→ TOMORROW_SUGGESTIONS
 *   - 加 / 改星愿池商品 → WISH_PRODUCTS；改别人许过的愿望示例 → MOCK_WISHES
 *
 * 这个文件全是纯数据，没有逻辑，改起来安全。
 */

// --- 全局常量及模拟数据 ---

export const EMOTIONS = [
  { id: 'warm', name: '余温', symbol: '◐', color: '#FFB347', texts: ['今天尚有余温，请好好珍藏。', '带着这份温暖的记忆入睡吧。', '世界偶尔温柔，今天你也是。'] },
  { id: 'calm', name: '静谧', symbol: '◯', color: '#87CEEB', texts: ['安静的夜晚，适合倾听自己的心跳。', '让一切归于平静，晚安。', '这一刻，世界只属于你。'] },
  { id: 'unclear', name: '星尘', symbol: '◌', color: '#E6E6FA', texts: ['说不清也没关系，宇宙包容一切。', '纷乱的思绪，就化作星尘吧。', '有些情绪，不需要急着去定义。'] },
  { id: 'joyful', name: '欢愉', symbol: '◠', color: '#FFD700', texts: ['真开心你度过了美好的一天。', '将这份喜悦打包，送进梦乡。', '你的快乐，让星空也变得明亮。'] },
  { id: 'anxious', name: '忐忑', symbol: '◡', color: '#FFA07A', texts: ['深呼吸，不用害怕，我们都在这里。', '不安是暂时的，夜晚会抚平它。', '哪怕在黑夜里，也有微光指引。'] },
  { id: 'tired', name: '疲惫', symbol: '◔', color: '#B0C4DE', texts: ['辛苦了，今天你已经做得很好了。', '卸下疲惫，安心睡个好觉吧。', '闭上眼睛，让一切重新充电。'] }
];

export const PRESET_TAGS = {
  positive: ['今天有一件小事让我开心', '我想感谢', '今天我被治愈了', '我想记住今天的感觉'],
  neutral: ['其实我有点累了', '最近有件事一直压在心上', '有时候觉得挺孤独的']
};

export const MOCK_WHISPERS = [
  { id: 1, text: '今天下班路上看到了一场很美的晚霞，想分享给不知道在哪里的你。', emotion: '小确幸', isPositive: true },
  { id: 2, text: '面试又失败了，感觉自己好没用。但是今晚的星星很亮。', emotion: '失落', isPositive: false },
  { id: 3, text: '买到了最后一块草莓蛋糕，开心！', emotion: '治愈', isPositive: true },
  { id: 4, text: '突然觉得，平平淡淡的日子才是最难得的。', emotion: '平静', isPositive: true },
  { id: 5, text: '想家了，不敢给爸妈打电话怕哭出来。', emotion: '孤独', isPositive: false }
];

// 16种宇宙睡眠人格图谱
export const COSMIC_PERSONALITIES = {
  'ISTJ': { name: '恒定白矮星', tags: ['极其自律', '深度休眠', '无梦之境'], desc: '你的睡眠如同白矮星般稳定且致密。作息规律，雷打不动，外界的喧嚣很难干扰你纯粹的休息。' },
  'ISFJ': { name: '温柔引力波', tags: ['准时安静', '感性梦境', '守护者'], desc: '你习惯在安静中规律入睡，但潜意识里充满了温柔的涟漪，常在梦中重温现实中的感动与羁绊。' },
  'INFJ': { name: '深空观测者', tags: ['规律作息', '清醒梦境', '直觉敏锐'], desc: '你在规律的表象下，拥有极其活跃的潜意识。即使在浅睡的轨道上，你也在梦境中默默观测着宇宙的奥秘。' },
  'INTJ': { name: '秩序脉冲星', tags: ['精准自律', '高频浅睡', '理性大脑'], desc: '你的睡眠犹如脉冲星般精准。哪怕睡眠较浅，大脑也能在短暂的休眠中高效整理碎片信息，保持绝对理性。' },
  'ISTP': { name: '独行小行星', tags: ['随性而息', '深度沉浸', '不拘一格'], desc: '你不受固定轨道的束缚，困了就睡，一旦入睡便如同漂浮在深空的小行星，彻底切断与外界的联系。' },
  'ISFP': { name: '梦幻星云', tags: ['随性静默', '色彩斑斓', '感性漫游'], desc: '你的睡前时光宁静而随性，入睡后则化身为绚丽的星云，梦境中交织着极其丰富和浪漫的情感色彩。' },
  'INFP': { name: '浪漫流星雨', tags: ['熬夜修仙', '浅睡多梦', '天马行空'], desc: '你的作息像流星般难以捉摸。夜晚是你灵感迸发的主场，梦境更是你天马行空、构建奇幻平行宇宙的乐园。' },
  'INTP': { name: '游离暗物质', tags: ['随性潜行', '无梦观测', '思绪游离'], desc: '你像暗物质一样难以被规律捕捉。睡前习惯深度思考，哪怕处于浅睡边缘，你的大脑也在默默推演宇宙的真理。' },
  'ESTP': { name: '活跃超新星', tags: ['冲浪达人', '倒头就睡', '现实主义'], desc: '睡前你是活跃的星际冲浪者，但只要决定休息，就能像超新星爆发后一样瞬间切断电源，陷入无梦的深眠。' },
  'ESFP': { name: '绚烂极光', tags: ['睡前冲浪', '沉浸深睡', '梦境丰富'], desc: '你的夜晚总是丰富多彩。哪怕带着满脑子的星际电波入睡，也能快速沉浸，并在梦中继续上演快乐的极光狂欢。' },
  'ENFP': { name: '跳跃虫洞', tags: ['随性活跃', '浅睡多梦', '时空穿梭'], desc: '你的思维在睡前异常活跃，在各个网络黑洞中穿梭。入睡后往往睡眠较浅，梦境犹如虫洞般连接着无数奇幻场景。' },
  'ENTP': { name: '混沌星系', tags: ['随性冲浪', '浅睡少梦', '思维不息'], desc: '规则对你来说就是用来打破的。睡前还在吸收海量信息，导致睡眠常常处于浅轨运行状态，但大脑乐在其中。' },
  'ESTJ': { name: '导航北极星', tags: ['规律作息', '睡前摄入', '深度休眠'], desc: '你是自己宇宙的绝对掌控者。哪怕睡前还在处理信息，一到就寝时间也能准时闭眼，进入高效的深度休眠。' },
  'ESFJ': { name: '温暖伴星', tags: ['规律陪伴', '睡前冲浪', '梦境交织'], desc: '你习惯在睡前与世界保持连接，但又坚守健康的作息。你的梦境常常充满人情味，如同伴星般散发着温暖的光芒。' },
  'ENFJ': { name: '引力灯塔', tags: ['规律作息', '信息雷达', '多梦体质'], desc: '你关注着宇宙中发出的每一个信号。规律的作息让你保持能量，但在浅睡的夜晚，梦境总是映照出你对他人的关怀。' },
  'ENTJ': { name: '主序星核', tags: ['高效掌控', '睡前规划', '浅睡少梦'], desc: '你像星核一样充满能量并掌控全局。睡前的时间常被用来规划明天，高效的浅睡足以支撑你应对现实的引力。' }
};

export const MILESTONES = [
  { id: 0, days: 0, name: '虚空尘埃', desc: '深灰虚空，微光闪烁' },
  { id: 1, days: 1, name: '星雾聚集', desc: '紫色高斯模糊光晕' },
  { id: 2, days: 7, name: '初生星核', desc: '中央主星体出现' },
  { id: 3, days: 14, name: '星环觉醒', desc: '倾斜环形边框' },
  { id: 4, days: 21, name: '伴星环绕', desc: '顺时针公转小黄星' },
  { id: 5, days: 30, name: '双月引力', desc: '逆时针公转小紫星' },
  { id: 6, days: 60, name: '宁静星系', desc: '整体极慢自转' }
];

// 本地"宇宙寄语"池：替代之前对外发请求的 AI 解梦，确保隐私协议承诺
// "所有梦境只在本机处理、不离开你的设备"始终成立
export const COSMIC_DREAM_INTERPRETATIONS = [
  '在你心海最深处，有一颗未被命名的星正在自转。这场梦只是它发出的微光。',
  '梦境是潜意识写给你的情诗——不用读懂每一行，只需感谢它愿意书写。',
  '今夜你触碰到了平行宇宙的边界。带回那一缕惊奇，把疲惫留在那里。',
  '梦中的画面，是白日里没来得及说完的话，宇宙替你接续了下去。',
  '不要急着解读这场梦。先让它像潮水一样退去，留下被它打磨过的你。',
  '当你忘记一个梦的细节，那是宇宙在帮你保管它最柔软的部分。',
  '梦中的人和事，是你生命中曾真诚拥抱过的碎片，它们在向你致意。',
  '哪怕这场梦让你慌乱，醒来时世界依然温柔——这就是夜晚的善意。',
  '潜意识从不撒谎，它只是用比喻说话。给自己一些时间慢慢翻译。',
  '你梦到的不是预言，而是你内心愿意去往的方向。',
  '今夜你的灵魂去过远方，又安全回到了枕边。这本身就已足够。',
  '梦境是你和自己最诚实的一次对话。无论说了什么，都值得被温柔接住。',
];

export const TITLES = [
  { id: 'starter', title: '星辰初学者', count: 5, icon: '🌟' },
  { id: 'comforter', title: '温暖使者', count: 20, icon: '💫' },
  { id: 'guardian', title: '宇宙守护者', count: 50, icon: '🌙' },
  { id: 'master', title: '星系大师', count: 100, icon: '✨' },
  // v4.2.1 新增
  { id: 'comet', title: '暖意流星', count: 200, icon: '☄️' },     // 用温度划过别人的夜
  { id: 'eternal', title: '永恒银河', count: 500, icon: '🌌' }    // 你的温暖已融入银河
];

// 头像可选 emoji
export const AVATAR_EMOJIS = ['🪐', '🌙', '⭐', '🌟', '✨', '💫', '🌠', '🌌', '☄️', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🛸', '🚀', '🌈', '☁️', '🦄'];

// "明日" tab 的温柔建议 —— 不是任务，是几颗用户随手就能拾起的小光点。
// 原则：不逼用户改变，只陪着慢慢变好。
// 加新建议直接在数组里追加即可；想换文案改 main / sub 字段。
export const TOMORROW_SUGGESTIONS = [
  { id: 'meal',    emoji: '🍚', main: '好好吃一顿饭',          sub: '慢一点，给胃和心都一些空气。' },
  { id: 'walk',    emoji: '🌿', main: '散步十五分钟',          sub: '走一段路，看一眼你没注意过的天空。' },
  { id: 'no',      emoji: '✋', main: '拒绝一件正在消耗你的事', sub: '把今晚的力气，留给真正在乎的事情。' },
  { id: 'pause',   emoji: '⏳', main: '给自己留二十分钟',      sub: '不刷手机，不被任何人打扰。' },
  { id: 'book',    emoji: '📖', main: '翻开一本想读的书',      sub: '哪怕只读三页，也算把它从书架上接住。' },
  { id: 'tidy',    emoji: '✨', main: '整理一个小角落',        sub: '让一处空间为你重新呼吸。' },
  { id: 'reach',   emoji: '💌', main: '联系一个让你舒服的人',  sub: '一句"在吗"也算抵达。' },
  { id: 'rest',    emoji: '🌙', main: '什么也不做，好好休息',  sub: '休息也是一种被允许的完成。' },
];

// 星愿池 — 睡眠相关商品（mock 数据，价格用星尘 + 元两种单位）
// 真接通后端 / 支付时，再把这里换成接口拉取
export const WISH_PRODUCTS = [
  { id: 'oil',    emoji: '🌿', name: '薰衣草助眠精油', spec: '30 ml', stardust: 89,  price: 79 },
  { id: 'pillow', emoji: '🛏️', name: '凉感记忆枕',     spec: '颈椎友好',  stardust: 269, price: 239 },
  { id: 'phones', emoji: '🎧', name: '白噪音助眠耳机', spec: '蓝牙降噪',  stardust: 199, price: 169 },
  { id: 'lamp',   emoji: '🌙', name: '月光床头灯',     spec: '渐亮唤醒',  stardust: 159, price: 139 },
  { id: 'mask',   emoji: '👁️', name: '真丝助眠眼罩',   spec: '桑蚕丝',    stardust: 49,  price: 45  },
  { id: 'candle', emoji: '🕯️', name: '雪松香薰蜡烛',   spec: '8 oz',     stardust: 79,  price: 69  },
  { id: 'blanket',emoji: '☁️', name: '重力毯',         spec: '4 kg 静谧蓝', stardust: 399, price: 359 },
  { id: 'tea',    emoji: '🍯', name: '助眠草本茶',     spec: '30 包',    stardust: 39,  price: 35  },
];

// 别人许下的愿望（mock 数据，模拟真实社区氛围）
// productId 对应 WISH_PRODUCTS 的 id
export const MOCK_WISHES = [
  { id: 1, userName: '星海旅人', userId: 'TR0312', avatar: '🌌', productId: 'mask',    wish: '最近睡得太轻了，希望它能帮我屏蔽掉清晨的光。', daysAgo: 3, joined: 12 },
  { id: 2, userName: '星海旅人', userId: 'TR1989', avatar: '🌠', productId: 'oil',     wish: '送给我妈，她最近失眠很严重。',               daysAgo: 0, joined: 5  },
  { id: 3, userName: '星海旅人', userId: 'TR0007', avatar: '🪐', productId: 'pillow',  wish: '换了三个枕头都不行，希望这是最后一个。',     daysAgo: 2, joined: 8  },
  { id: 4, userName: '星海旅人', userId: 'TR2024', avatar: '☄️', productId: 'phones',  wish: '室友打呼太大，每晚都崩溃。',                 daysAgo: 1, joined: 23 },
  { id: 5, userName: '星海旅人', userId: 'TR0411', avatar: '🌙', productId: 'tea',     wish: '想试试不靠药物的方式入睡。',                 daysAgo: 4, joined: 7  },
  { id: 6, userName: '星海旅人', userId: 'TR8888', avatar: '✨', productId: 'blanket', wish: '听说像被温柔抱住一样，今天好想被抱抱。',     daysAgo: 7, joined: 41 },
  { id: 7, userName: '星海旅人', userId: 'TR0521', avatar: '💫', productId: 'lamp',    wish: '不喜欢闹钟突然响起，希望被晨光慢慢叫醒。',   daysAgo: 2, joined: 16 },
  { id: 8, userName: '星海旅人', userId: 'TR1101', avatar: '🌟', productId: 'candle',  wish: '想找回小时候在森林里露营的味道。',           daysAgo: 5, joined: 9  },
];
