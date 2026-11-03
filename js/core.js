// ===== 共通部品（状態・画面の切り替え・小さな道具・リザルトの部品） =====
const DEFAULT_NAMES = ["ゲストA","ゲストB"];
let S = {screen:"home", names:[...DEFAULT_NAMES]};
let TIMERS = [];
const app = document.getElementById("app");
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nm = p => esc(S.names[p] || DEFAULT_NAMES[p]);
const pc = p => p===0 ? "pa" : "pb";
const pick = a => a[Math.floor(Math.random()*a.length)];
const pickOther = (a, not) => { const b=a.filter(x=>x!==not); return pick(b.length?b:a); };
const shuffle = a => { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; };
const nearest = (ex, v, n=3) => [...ex].sort((x,y)=>Math.abs(x[0]-v)-Math.abs(y[0]-v)).slice(0,n).sort((x,y)=>x[0]-y[0]);
const chips = words => `<div class="wchips">${words.map(w=>`<span>${esc(w)}</span>`).join("")}</div>`;
const SAFE_HOME = ["itoSetup","mSetup","wSetup","mResult","wResult","sSetup","sFinal","rSetup","rFinal","slots","rec"];
// armKey＝「2回タップで確定」のボタンの1回目が押された状態（画面を切り替えたら戻す）。updated＝更新のお知らせ（ホームを離れたら消す）
function go(screen){ TIMERS.forEach(clearTimeout); TIMERS=[]; S.homeArmed=false; S.armKey=null; if(screen!=="home") S.updated=false; S.screen = screen; render(); window.scrollTo(0,0); }
// スマホを渡す画面（渡す＋のぞき見防止を1画面で）
function handoff(p, next){ S.hand = {p, next}; go("handoff"); }

const V = {};
V.home = () => `
  ${S.updated?`<p class="notice">新しい版にしました</p>`:""}
  <div><p class="eyebrow">スマホ1台・ふたり用</p><h1>ふたりの待ち時間</h1></div>
  <div class="slotbar"><span>スロット${SV.data.cur+1}：<b class="pa" id="sbA">${nm(0)}</b> ＆ <b class="pb" id="sbB">${nm(1)}</b></span><button class="chip" data-act="slots">切り替え</button></div>
  <div class="panel">
    <div class="row">
      <label class="grow">ひとりめ<input type="text" id="nameA" maxlength="8" value="${esc(S.names[0])}"></label>
      <label class="grow">ふたりめ<input type="text" id="nameB" maxlength="8" value="${esc(S.names[1])}"></label>
    </div>
    <p class="sub">${SV.ok ? "名前は、この端末の中（今のスロット）にだけ保存します。" : "この環境では保存できないため、名前と記録はページを閉じると消えます。"}</p>
  </div>
  <div class="stack">
    <button class="game" data-act="itoSetup"><b>🃏 例えで並べる</b><span>秘密の数字を「例え」で伝え合って、ふたりで小さい順に並べる協力ゲーム</span></button>
    <button class="game" data-act="mSetup"><b>🎚️ メーター当て</b><span>ヒントや本音から、メーターの位置を当てる。交代で遊ぶ</span></button>
    <button class="game" data-act="wSetup"><b>💬 せーので連想</b><span>言葉をつなぐ言葉を、せーので同時に言う。当てっこモードもあり</span></button>
    <button class="game" data-act="sSetup"><b>🔍 似てる・違う</b><span>12枚の絵カードの正解を、出題者の「似てる／違う」カードだけで絞り込む協力ゲーム</span></button>
    <button class="game" data-act="rSetup"><b>🏇 順位当て</b><span>相手の「好きな順」を予想。三連単・馬単など競馬の買い方で役がつく</span></button>
  </div>
  <button data-act="recOpen" data-g="all">📒 きろく</button>`;

V.handoff = () => { const p=S.hand.p, o=1-p; return `
  <div class="panel handoff">
    <p class="eyebrow">スマホを渡してね</p>
    <p class="big ${pc(p)}">${nm(p)}さんへ</p>
    <p class="sub">${nm(o)}さんは画面を見ないでね</p>
    <button class="main" data-act="handOk">${nm(p)}です。見る</button>
  </div>`; };

function confetti(){
  try{ if(matchMedia("(prefers-reduced-motion: reduce)").matches) return; }catch(e){}
  const box=document.createElement("div"); box.className="confetti";
  const cols=["var(--pa)","var(--pb)","var(--gold)","var(--ok)"];
  for(let i=0;i<80;i++){ const s=document.createElement("i"); s.style.left=Math.random()*100+"%"; s.style.background=cols[i%4];
    s.style.animationDelay=(Math.random()*0.8)+"s"; s.style.animationDuration=(2+Math.random()*1.5)+"s"; box.appendChild(s); }
  document.body.appendChild(box); setTimeout(()=>box.remove(), 4500);
}

// ===== リザルトの共通部品 =====
// 大きな絵＋見出し。good=true で金色の枠（紙吹雪は操作側で confetti() を呼ぶ）
const hero = (emoji, title, sub, good) => `<div class="hero ${good?"good":""}"><div class="hero-em">${emoji}</div><p class="hero-t">${title}</p>${sub?`<p class="sub">${sub}</p>`:""}</div>`;
const statGrid = items => `<div class="stats">${items.map(([k,v])=>`<div class="stat"><b>${v}</b><span>${k}</span></div>`).join("")}</div>`;

// 画面を描き直す（ホーム以外では下に「ホームに戻る」を出す）
function render(){ app.innerHTML = (V[S.screen]||V.home)() + (S.screen==="home" ? "" : `<div class="homebar"><button class="ghost" id="homeBtn" data-act="homeAsk">ホームに戻る</button></div>`); }
