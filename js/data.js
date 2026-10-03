/* ぽけっとガチャ — ゲームデータ定義 */
'use strict';

const RARITY = {
  N:  { label: 'ノーマル',     short: 'N',   weight: 100, shards: 1,  cost: 10,  xp: 0  },
  R:  { label: 'レア',         short: 'R',   weight: 45,  shards: 3,  cost: 30,  xp: 5  },
  SR: { label: 'スーパーレア', short: 'SR',  weight: 15,  shards: 10, cost: 80,  xp: 20 },
  SE: { label: 'シークレット', short: '???', weight: 5,   shards: 30, cost: 200, xp: 50 },
};

// 同じアイテムが連続でかぶった時の救済: PITY 回目は未入手アイテムが確定
const PITY = 10;

// [key, 名前, 絵文字, レア度, ひとこと, 特殊効果(gold|rainbow)]
const MACHINES = [
  {
    id: 'sweets', name: 'ぷちスイーツマスコット', icon: '🧁', price: 200, color: '#ff8fb8', unlock: 1,
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
    id: 'cats', name: 'ねこねこフェイス', icon: '😺', price: 300, color: '#ffb35c', unlock: 1,
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
    id: 'sushi', name: 'まるごとおすしコレクション', icon: '🍣', price: 300, color: '#ff6b6b', unlock: 1,
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
    id: 'animals', name: 'どうぶつおひるね', icon: '🐼', price: 400, color: '#78c98a', unlock: 3,
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
    id: 'wa', name: 'ほっこり和雑貨', icon: '🎐', price: 400, color: '#3fb7a6', unlock: 5,
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
    id: 'space', name: 'きらきらうちゅう', icon: '🪐', price: 500, color: '#7480e0', unlock: 8,
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

const CAPSULE_COLORS = ['#ff6b8b', '#ffa94d', '#ffe066', '#7ed98a', '#5cc8ff', '#a98bff', '#ff8fd1', '#4dd4c6'];

// ログインボーナス (7日でひとまわり)。毎日さらに無料チケットが1枚もらえる
const LOGIN_REWARDS = [
  { coins: 100 }, { coins: 150 }, { coins: 200 }, { coins: 250 },
  { coins: 300 }, { coins: 400 }, { coins: 500, tickets: 2 },
];

const DAILY_MISSIONS = [
  { id: 'pull3', icon: '🎰', label: 'ガチャを3回まわす', key: 'pulls', goal: 3, reward: 100 },
  { id: 'save1', icon: '💪', label: 'リアルガチャを1回がまんする', key: 'saves', goal: 1, reward: 150 },
  { id: 'zukan', icon: '📖', label: 'ずかんをながめる', key: 'opened', goal: 1, reward: 50 },
  { id: 'new1', icon: '✨', label: '新しいアイテムを1つゲット', key: 'newItems', goal: 1, reward: 100 },
];
const ALL_CLEAR_BONUS = { coins: 200, tickets: 1 };

const TITLES = [
  [1, 'ガチャ見習い'], [3, 'カプセルあつめ'], [5, 'ガチャ通'], [8, 'まわし上手'],
  [12, 'コレクター'], [16, 'ガチャマスター'], [20, 'ガチャの女王 👑'], [30, '伝説のガチャラー'],
];

const PRAISES = [
  'えらい！その我慢、ちゃんと貯まってるよ✨',
  'ナイス我慢！未来の自分がよろこんでる💕',
  'かっこいい…！その分ここで思いっきりまわそう🎰',
  'がまんできたあなたに拍手👏',
  'すごい！ご褒美にまた一歩ちかづいた🎁',
  '本物は家計にやさしく、こっちは心ゆくまで🪙',
  'その意志のつよさ、SSR級です🌟',
];

function savedTotal(s) { return s.savings.reduce((a, x) => a + x.amount, 0); }
function ownedIn(s, items) { return items.filter((it) => (s.collection[it.id] || 0) > 0).length; }
function allItems() { return Object.values(ITEMS); }

const ACHIEVEMENTS = [
  { id: 'pull1', icon: '🎉', name: 'はじめの一回', desc: 'ガチャを1回まわす', reward: 100, test: (s) => s.totalPulls >= 1 },
  { id: 'pull10', icon: '🎰', name: 'ガチャ好き', desc: 'ガチャを10回まわす', reward: 200, test: (s) => s.totalPulls >= 10 },
  { id: 'pull50', icon: '🎡', name: 'まわし上手', desc: 'ガチャを50回まわす', reward: 500, test: (s) => s.totalPulls >= 50 },
  { id: 'pull100', icon: '🎠', name: 'ガチャ100回', desc: 'ガチャを100回まわす', reward: 1000, test: (s) => s.totalPulls >= 100 },
  { id: 'pull300', icon: '🏰', name: 'ガチャの申し子', desc: 'ガチャを300回まわす', reward: 2000, test: (s) => s.totalPulls >= 300 },
  { id: 'r1', icon: '💙', name: 'レアもの', desc: 'レアをはじめて手に入れる', reward: 100, test: (s) => ownedIn(s, allItems().filter((i) => i.rarity === 'R')) >= 1 },
  { id: 'sr1', icon: '🌟', name: 'キラキラ発見', desc: 'スーパーレアをはじめて手に入れる', reward: 300, test: (s) => ownedIn(s, allItems().filter((i) => i.rarity === 'SR')) >= 1 },
  { id: 'se1', icon: '🔮', name: 'ひみつのとびら', desc: 'シークレットをはじめて手に入れる', reward: 1000, test: (s) => ownedIn(s, allItems().filter((i) => i.rarity === 'SE')) >= 1 },
  { id: 'dup5', icon: '🔁', name: 'かぶりもまた楽し', desc: '同じアイテムを5こあつめる', reward: 300, test: (s) => Object.values(s.collection).some((c) => c >= 5) },
  { id: 'kind30', icon: '📚', name: 'コレクター', desc: 'ずかんを30種類うめる', reward: 1500, test: (s) => ownedIn(s, allItems()) >= 30 },
  ...MACHINES.map((m) => ({
    id: `comp_${m.id}`, icon: m.icon, name: `${m.name} コンプ`, desc: `${m.name}を全種類あつめる`, reward: 1000,
    test: (s) => ownedIn(s, m.items) === m.items.length,
  })),
  { id: 'compAll', icon: '👑', name: '完全制覇', desc: 'すべてのアイテムをあつめる', reward: 5000, test: (s) => ownedIn(s, allItems()) === allItems().length },
  { id: 'save1', icon: '💪', name: 'はじめての我慢', desc: 'リアルガチャを1回がまんする', reward: 100, test: (s) => s.savings.length >= 1 },
  { id: 'save10', icon: '🧘', name: 'がまんの達人', desc: 'リアルガチャを10回がまんする', reward: 500, test: (s) => s.savings.length >= 10 },
  { id: 'yen1000', icon: '🐷', name: '我慢貯金 1,000円', desc: '我慢貯金が1,000円になる', reward: 300, test: (s) => savedTotal(s) >= 1000 },
  { id: 'yen5000', icon: '💰', name: '我慢貯金 5,000円', desc: '我慢貯金が5,000円になる', reward: 1000, test: (s) => savedTotal(s) >= 5000 },
  { id: 'yen10000', icon: '💎', name: '我慢貯金 1万円', desc: '我慢貯金が10,000円になる', reward: 2000, test: (s) => savedTotal(s) >= 10000 },
  { id: 'yen30000', icon: '🏦', name: '我慢貯金 3万円', desc: '我慢貯金が30,000円になる', reward: 5000, test: (s) => savedTotal(s) >= 30000 },
  { id: 'goal1', icon: '🏆', name: 'ご褒美ゲット', desc: 'ご褒美目標を達成する', reward: 1000, test: (s) => s.goalsDone.length >= 1 || !!(s.goal && s.goal.doneAt) },
  { id: 'streak3', icon: '🔥', name: '3日連続', desc: '3日連続でログイン', reward: 200, test: (s) => s.login.best >= 3 },
  { id: 'streak7', icon: '📅', name: '1週間連続', desc: '7日連続でログイン', reward: 700, test: (s) => s.login.best >= 7 },
  { id: 'streak30', icon: '🗓️', name: '1か月連続', desc: '30日連続でログイン', reward: 3000, test: (s) => s.login.best >= 30 },
];
