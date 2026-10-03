/* ぽけっとガチャ — ゲームデータ定義 */
'use strict';

/* ================================================================
 * リアルご褒美（当たり）の設定
 *   rate  … 1回まわしたときに当たる確率（0.08 = 8%）
 *   value … 1枚あたりの金額の目安（円）。平均の計算に使う
 * 1回あたりの平均は約50円。1か月に60回まわすと、平均 約3,000円 になる確率です。
 * （上限はありません。運が良い月は多め、悪い月は少なめになります）
 * ================================================================ */
const PRIZES = [
  { id: 'sweets', name: 'デザートチケット', emoji: '🍮', value: 300, rate: 0.08, desc: 'コンビニスイーツをひとつ' },
  { id: 'cafe', name: 'カフェチケット', emoji: '☕', value: 800, rate: 0.02, desc: 'カフェでケーキセット' },
  { id: 'sushi', name: 'お寿司チケット', emoji: '🍣', value: 4000, rate: 0.0025, desc: 'お寿司を食べに行こう' },
];
// 本物のガチャを1回がまんして認定されたときにもらえるガチャ券（管理ページで増減できる）
const GAMAN_TICKETS = 3;
// ログインボーナス（7日でひとまわり）
const LOGIN_TICKETS = [1, 1, 1, 1, 1, 1, 3];
// レベルアップでもらえるガチャ券
const LEVELUP_TICKETS = 1;

/* ================================================================
 * マスコット（はずれの時に出て、ずかんに登録される）
 * ================================================================ */
const RARITY = {
  N:  { label: 'ノーマル',     short: 'N',   weight: 100, xp: 0  },
  R:  { label: 'レア',         short: 'R',   weight: 45,  xp: 5  },
  SR: { label: 'スーパーレア', short: 'SR',  weight: 15,  xp: 20 },
  SE: { label: 'シークレット', short: '???', weight: 5,   xp: 50 },
};

// マスコットが PITY 回目まで続けてかぶると、次は未入手が確定
const PITY = 10;

// [key, 名前, 絵文字, レア度, ひとこと, 特殊効果(gold|rainbow)]
const MACHINES = [
  {
    id: 'sweets', name: 'ぷちスイーツマスコット', icon: '🧁', color: '#ff8fb8', unlock: 1,
    items: [
      ['shortcake', 'ショートケーキ', '🍰', 'N', 'いちごは最後に食べる派？'],
      ['pudding', 'とろけるプリン', '🍮', 'N', 'ぷるんとゆれるカラメル色。'],
      ['donut', 'ドーナツ', '🍩', 'N', 'まんなかの穴には夢がつまってる。'],
      ['cupcake', 'カップケーキ', '🧁', 'N', 'クリームたっぷり、ちょっとおめかし。'],
      ['cookie', 'クッキー', '🍪', 'N', 'サクサク。ついもう1枚。'],
      ['dango', '三色だんご', '🍡', 'N', '秋がないから「飽きない」んだって。'],
      ['choco', '板チョコ', '🍫', 'R', 'つかれた日のごほうび。'],
      ['pancake', 'ふわふわパンケーキ', '🥞', 'R', '3段重ねのしあわせタワー。'],
      ['birthday', 'バースデーケーキ', '🎂', 'SR', 'ろうそくの数はひみつ。'],
      ['parfait', '伝説の黄金パフェ', '🍨', 'SE', '食べると一日しあわせになれるらしい。', 'gold'],
    ],
  },
  {
    id: 'cats', name: 'ねこねこフェイス', icon: '😺', color: '#ffb35c', unlock: 1,
    items: [
      ['smile', 'にこにこねこ', '😺', 'N', 'きょうもごきげん。'],
      ['laugh', 'けらけらねこ', '😸', 'N', 'ツボにはいったらとまらない。'],
      ['tears', 'わらいなきねこ', '😹', 'N', 'おもしろすぎてなみだが…。'],
      ['love', 'ハートめねこ', '😻', 'N', 'かつおぶしを見つけたかお。'],
      ['smirk', 'ドヤねこ', '😼', 'N', 'なにかたくらんでいる。'],
      ['kiss', 'ちゅーねこ', '😽', 'N', 'すきなひとにだけ見せるかお。'],
      ['shock', 'びっくりねこ', '🙀', 'R', 'きゅうりを見ちゃった。'],
      ['sad', 'しょんぼりねこ', '😿', 'R', 'ごはんがすこし少なかった。'],
      ['black', 'くろねこ', '🐈‍⬛', 'SR', '前を横ぎると、いいことがあるかも。'],
      ['lucky', '金のまねきねこ', '🐈', 'SE', '福をまねく、ありがたいねこ。', 'gold'],
    ],
  },
  {
    id: 'sushi', name: 'まるごとおすしコレクション', icon: '🍣', color: '#ff6b6b', unlock: 1,
    items: [
      ['maguro', 'まぐろ', '🐟', 'N', 'おすしの王様。赤身がいちばん。'],
      ['ebi', 'えび', '🦐', 'N', 'ぷりっぷり。しっぽまで食べる？'],
      ['ika', 'いか', '🦑', 'N', 'すきとおるような白さ。'],
      ['tako', 'たこ', '🐙', 'N', 'かむほどにおいしい。'],
      ['tamago', 'たまご', '🥚', 'N', 'お店の味はたまごでわかる。'],
      ['onigiri', 'まかないおにぎり', '🍙', 'N', '板前さんのおやつ。'],
      ['kani', 'かに', '🦀', 'R', 'みんな無言になるやつ。'],
      ['iseebi', 'いせえび', '🦞', 'R', 'おめでたい日のごちそう。'],
      ['tokujo', '特上にぎり', '🍣', 'SR', '回らないお店の味。'],
      ['golden', '金のおすし', '🍣', 'SE', 'まばゆく光る、幻のひとかん。', 'gold'],
    ],
  },
  {
    id: 'animals', name: 'どうぶつおひるね', icon: '🐼', color: '#78c98a', unlock: 3,
    items: [
      ['dog', 'いぬ', '🐶', 'N', 'しっぽをふってお出むかえ。'],
      ['rabbit', 'うさぎ', '🐰', 'N', 'おみみをたたんでおやすみ。'],
      ['hamster', 'ハムスター', '🐹', 'N', 'ほっぺにひまわりのたね。'],
      ['panda', 'パンダ', '🐼', 'N', 'ささの葉をだいてすやすや。'],
      ['koala', 'コアラ', '🐨', 'N', '1日20時間ねるらしい。'],
      ['bear', 'くま', '🐻', 'N', 'はちみつのゆめを見ている。'],
      ['fox', 'きつね', '🦊', 'R', 'しっぽをまくらにしている。'],
      ['owl', 'ふくろう', '🦉', 'R', 'ひるまはねむい、よるはげんき。'],
      ['unicorn', 'ユニコーン', '🦄', 'SR', 'にじのたてがみがまぶしい。'],
      ['dragon', 'ちびドラゴン', '🐉', 'SE', 'ねごとで小さな火をふく。', 'rainbow'],
    ],
  },
  {
    id: 'wa', name: 'ほっこり和雑貨', icon: '🎐', color: '#3fb7a6', unlock: 5,
    items: [
      ['furin', 'ふうりん', '🎐', 'N', 'ちりん、とすずしい音。'],
      ['chochin', 'ちょうちん', '🏮', 'N', 'おまつりの夜をてらす。'],
      ['ocha', 'おちゃ', '🍵', 'N', 'ほっとひと息。'],
      ['tanabata', 'ささかざり', '🎋', 'N', 'ねがいごとはなににする？'],
      ['koinobori', 'こいのぼり', '🎏', 'N', 'やねより高く。'],
      ['tsukimi', 'おつきみ', '🎑', 'N', 'おだんごとすすき。'],
      ['hina', 'おひなさま', '🎎', 'R', 'ならんですまし顔。'],
      ['fuji', 'ふじさん', '🗻', 'R', '日本一の山。'],
      ['torii', 'とりい', '⛩️', 'SR', 'くぐるとちょっと背すじがのびる。'],
      ['sakura', '千年桜', '🌸', 'SE', '千年さきつづける、まぼろしの桜。', 'rainbow'],
    ],
  },
  {
    id: 'space', name: 'きらきらうちゅう', icon: '🪐', color: '#7480e0', unlock: 8,
    items: [
      ['moon', 'みかづき', '🌙', 'N', 'こよいもきれい。'],
      ['star', 'おほしさま', '⭐', 'N', 'いちばん星、みーつけた。'],
      ['kira', 'きらぼし', '🌟', 'N', 'ねがいをかなえるひかり。'],
      ['comet', 'すいせい', '☄️', 'N', 'ながいしっぽでかけぬける。'],
      ['earth', 'ちきゅう', '🌍', 'N', 'わたしたちのおうち。'],
      ['sun', 'たいよう', '☀️', 'N', 'きょうもぽかぽか。'],
      ['saturn', 'どせい', '🪐', 'R', 'すてきなわっかがじまん。'],
      ['rocket', 'ロケット', '🚀', 'R', '3、2、1…はっしゃ！'],
      ['galaxy', 'ぎんが', '🌌', 'SR', '星が2000億こ以上あつまっている。'],
      ['ufo', 'なぞのUFO', '🛸', 'SE', 'みつけた人はだれもいない…はず。', 'rainbow'],
    ],
  },
];

const ITEMS = {};
MACHINES.forEach((m) => {
  m.items = m.items.map(([key, name, emoji, rarity, desc, fx]) => {
    const it = { id: `${m.id}.${key}`, machine: m.id, name, emoji, rarity, desc, fx: fx || '' };
    ITEMS[it.id] = it;
    return it;
  });
});
const PRIZE_BY_ID = Object.fromEntries(PRIZES.map((p) => [p.id, p]));

const CAPSULE_COLORS = ['#ff6b8b', '#ffa94d', '#ffe066', '#7ed98a', '#5cc8ff', '#a98bff', '#ff8fd1', '#4dd4c6'];

const TITLES = [
  [1, 'ガチャ見習い'], [3, 'カプセルあつめ'], [5, 'ガチャ通'], [8, 'まわし上手'],
  [12, 'コレクター'], [16, 'ガチャマスター'], [20, 'ガチャの女王 👑'], [30, '伝説のガチャラー'],
];

const PRAISES = [
  'えらい！その我慢、ちゃんと届けるね✨',
  'ナイス我慢！認定されたらいっぱい回そう💕',
  'かっこいい…！本物より当たるのはこっちだよ🎰',
  'がまんできたあなたに拍手👏',
  'その意志のつよさ、SSR級です🌟',
];

function gamanCount(s) { return s.gaman.filter((g) => g.status === 'ok' || g.status === 'legacy').length; }
function ownedIn(s, items) { return items.filter((it) => (s.collection[it.id] || 0) > 0).length; }
function allItems() { return Object.values(ITEMS); }

// reward はガチャ券の枚数
const ACHIEVEMENTS = [
  { id: 'pull1', icon: '🎉', name: 'はじめの一回', desc: 'ガチャを1回まわす', reward: 1, test: (s) => s.totalPulls >= 1 },
  { id: 'pull10', icon: '🎰', name: 'ガチャ好き', desc: 'ガチャを10回まわす', reward: 1, test: (s) => s.totalPulls >= 10 },
  { id: 'pull50', icon: '🎡', name: 'まわし上手', desc: 'ガチャを50回まわす', reward: 2, test: (s) => s.totalPulls >= 50 },
  { id: 'pull100', icon: '🎠', name: 'ガチャ100回', desc: 'ガチャを100回まわす', reward: 3, test: (s) => s.totalPulls >= 100 },
  { id: 'pull300', icon: '🏰', name: 'ガチャの申し子', desc: 'ガチャを300回まわす', reward: 5, test: (s) => s.totalPulls >= 300 },
  { id: 'prize1', icon: '🎁', name: 'はじめての当たり', desc: 'リアルご褒美をはじめて当てる', reward: 1, test: (s) => s.prizes.length >= 1 },
  { id: 'prizeCafe', icon: '☕', name: 'カフェタイム', desc: 'カフェチケットを当てる', reward: 1, test: (s) => s.prizes.some((p) => p.prize === 'cafe') },
  { id: 'prizeSushi', icon: '🍣', name: 'お寿司だ！', desc: 'お寿司チケットを当てる', reward: 2, test: (s) => s.prizes.some((p) => p.prize === 'sushi') },
  { id: 'sr1', icon: '🌟', name: 'キラキラ発見', desc: 'スーパーレアのマスコットを手に入れる', reward: 1, test: (s) => ownedIn(s, allItems().filter((i) => i.rarity === 'SR')) >= 1 },
  { id: 'se1', icon: '🔮', name: 'ひみつのとびら', desc: 'シークレットのマスコットを手に入れる', reward: 3, test: (s) => ownedIn(s, allItems().filter((i) => i.rarity === 'SE')) >= 1 },
  { id: 'dup5', icon: '🔁', name: 'かぶりもまた楽し', desc: '同じマスコットを5こあつめる', reward: 1, test: (s) => Object.values(s.collection).some((c) => c >= 5) },
  { id: 'kind30', icon: '📚', name: 'コレクター', desc: 'ずかんを30種類うめる', reward: 3, test: (s) => ownedIn(s, allItems()) >= 30 },
  ...MACHINES.map((m) => ({
    id: `comp_${m.id}`, icon: m.icon, name: `${m.name} コンプ`, desc: `${m.name}を全種類あつめる`, reward: 3,
    test: (s) => ownedIn(s, m.items) === m.items.length,
  })),
  { id: 'compAll', icon: '👑', name: '完全制覇', desc: 'すべてのマスコットをあつめる', reward: 10, test: (s) => ownedIn(s, allItems()) === allItems().length },
  { id: 'gaman1', icon: '💪', name: 'はじめての我慢', desc: 'がまんをはじめて認定してもらう', reward: 2, test: (s) => gamanCount(s) >= 1 },
  { id: 'gaman5', icon: '🐷', name: 'がまん上手', desc: 'がまんを5回認定してもらう', reward: 2, test: (s) => gamanCount(s) >= 5 },
  { id: 'gaman10', icon: '🧘', name: 'がまんの達人', desc: 'がまんを10回認定してもらう', reward: 3, test: (s) => gamanCount(s) >= 10 },
  { id: 'gaman30', icon: '💎', name: 'がまんの神', desc: 'がまんを30回認定してもらう', reward: 5, test: (s) => gamanCount(s) >= 30 },
  { id: 'streak3', icon: '🔥', name: '3日連続', desc: '3日連続でログイン', reward: 1, test: (s) => s.login.best >= 3 },
  { id: 'streak7', icon: '📅', name: '1週間連続', desc: '7日連続でログイン', reward: 2, test: (s) => s.login.best >= 7 },
  { id: 'streak30', icon: '🗓️', name: '1か月連続', desc: '30日連続でログイン', reward: 5, test: (s) => s.login.best >= 30 },
];
