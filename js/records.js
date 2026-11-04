// ===== 記録（各ゲームの記録の付け方・リザルトの通算の一行・スロットを選ぶ画面・記録の画面） =====
// 記録の中では、人を「ひとりめ（0）／ふたりめ（1）」で持ち、表示するときに今のスロットの名前を当てはめる。
const REC_GAMES = [["ito","🃏","例えで並べる"],["meter","🎚️","メーター当て"],["words","💬","せーので連想"],["similo","🔍","似てる・違う"],["rank","🏇","順位当て"]];
const W_SHORT = { w2:"2語", w3:"3語", w4:"4語", guess:"当てっこ" };
const M_NAME = { hint:"ヒントで当てる", honne:"本音を当てる" };
const RANK_ROLE_ORDER = ["完全的中","三連単","三連複","馬単","馬連","単勝","ハズレ"];
const pad2 = n => String(n).padStart(2,"0");
const fmtTime = t => { const d=new Date(t); return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${pad2(d.getMinutes())}`; };
const fmtDay = t => { const d=new Date(t); return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`; };
const avg1 = (a, b) => b ? (Math.round(a/b*10)/10).toFixed(1) : "—";
const pct = (a, b) => b ? Math.round(100*a/b)+"%" : "—";

// ----- 記録を付ける（ゲームが最後まで終わったときに呼ぶ） -----
function recIto(ok, per, n){
  recAdd("ito", { ok, per, n }, st => { st.tries++;
    if(ok){ st.wins++; st.best=Math.max(st.best, n); st.streak++; st.bestStreak=Math.max(st.bestStreak, st.streak); } else st.streak=0; });
}
function recMeter(m){
  const best = m.log.reduce((b,x)=>(!b||x.d<b.d)?x:b, null);
  recAdd("meter", { mode:m.mode, rounds:m.rounds, pts:m.score }, st => {
    st.games++; st.rounds+=m.rounds; st.pts+=m.score; st.exact+=m.log.filter(x=>x.pts===3).length;
    if(best && (!st.best || best.d<st.best.d)) st.best={ d:best.d, q:best.q, honne:best.honne, taker:best.taker, lo:best.lo, hi:best.hi, t:Date.now() }; });
}
function recWords(w){
  const guess = w.mode==="guess", pts=[0,1].map(p=>w.log.filter(x=>x.taker===p).reduce((s,x)=>s+x.pts,0));
  recAdd("words", guess ? { mode:w.mode, rounds:w.rounds, pts } : { mode:w.mode, rounds:w.rounds, hit:w.score }, st => {
    const m=st[w.mode]; if(!m) return; m.games++; m.q+=w.rounds;
    if(guess) m.pts=[m.pts[0]+pts[0], m.pts[1]+pts[1]]; else m.hit+=w.score; });
}
function recSimilo(x){
  recAdd("similo", { theme:x.theme, card:x.secretCard, ok:x.ok, giver:x.giver }, st => {
    st.games++; if(x.ok) st.wins++;
    const t = st.themes[x.theme] || (st.themes[x.theme]={ games:0, wins:0 }); t.games++; if(x.ok) t.wins++; });
}
function recRank(r){
  const win = r.pts[0]===r.pts[1] ? -1 : (r.pts[0]>r.pts[1]?0:1);
  recAdd("rank", { win, pts:[...r.pts], rounds:r.log.map(x=>({ topic:x.topic, label:x.label, items:x.items, a:x.a, p:x.p, ans:x.ans, pred:x.pred, role:roleName(x.j), pts:x.pts })) }, st => {
    st.games++; if(win<0) st.draws++; else st.wins[win]++;
    r.log.forEach(x=>{ if(x.j.perfect) st.perfect++; const k=roleName(x.j); st.roles[k]=(st.roles[k]||0)+1; }); });
}

// ----- リザルトに出す「通算」の一行と「📒 きろくを見る」 -----
function recLineText(g, mode){ const st=curStats(g);
  switch(g){
    case "ito": return `通算：成功 ${st.wins}／${st.tries}`;
    case "meter": return `通算：${st.games}ゲーム・1回あたり平均 ${avg1(st.pts, st.rounds)}点`;
    case "words": { const m=st[mode]; if(!m) return "";
      return mode==="guess" ? `通算（当てっこ）：${nm(0)} ${m.pts[0]}点・${nm(1)} ${m.pts[1]}点` : `通算（${W_SHORT[mode]}）：そろった ${m.hit}／${m.q}問`; }
    case "similo": return `通算：成功 ${st.wins}／${st.games}`;
    case "rank": return `通算：${nm(0)} ${st.wins[0]}勝・${nm(1)} ${st.wins[1]}勝・引き分け ${st.draws}`;
  } return ""; }
const recLine = (g, mode) => `<div class="panel recline"><p>${recLineText(g, mode)}</p><button class="chip" data-act="recOpen" data-g="${g}">📒 きろくを見る</button></div>`;

// ----- スロットを選ぶ画面 -----
V.slots = () => { const d=SV.data; return `
  <div><p class="eyebrow">スロット</p><h2>スロットを選ぶ</h2></div>
  <p class="sub">${SV.ok ? "名前と記録は、スロットごとにこの端末の中だけに保存します。" : "この環境では保存できないため、名前と記録はページを閉じると消えます。"}</p>
  ${d.slots.map((s,i)=>{ const cur=i===d.cur, armed=S.armKey==="slot"+i; return `
  <div class="panel slotcard ${cur?"cur":""}">
    <p class="eyebrow">スロット${i+1}${cur?"（使用中）":""}</p>
    ${s ? `<p><b class="pa">${esc(s.names[0])}</b> ＆ <b class="pb">${esc(s.names[1])}</b></p>
      <p class="sub">遊んだ回数 ${s.plays}回・最後に遊んだ日 ${s.last?fmtDay(s.last):"—"}</p>` : `<p class="sub">（空き）</p>`}
    <div class="row">
      <button class="main grow" data-act="slotUse" data-i="${i}" ${cur?"disabled":""}>このスロットを使う</button>
      <button class="grow ${armed?"armed":""}" data-act="slotDel" data-i="${i}" ${s?"":"disabled"}>${armed?"本当に消す？（もう一度タップ）":"このスロットを消す"}</button>
    </div>
  </div>`; }).join("")}`; };

// ----- 記録の画面 -----
const recGameName = g => { const x=REC_GAMES.find(k=>k[0]===g); return x ? `${x[1]} ${x[2]}` : ""; };
function recSummary(x){ try{
  switch(x.g){
    case "ito": return `${x.ok?"成功":"失敗"}（ひとり${x.per}枚・全${x.n}枚）`;
    case "meter": return `${M_NAME[x.mode]||""}・${x.rounds}回　${x.pts}／${x.rounds*3}点`;
    case "words": return x.mode==="guess" ? `当てっこ・${x.rounds}問　${nm(0)} ${x.pts[0]}点・${nm(1)} ${x.pts[1]}点` : `${W_SHORT[x.mode]||""}・そろった ${x.hit}／${x.rounds}問`;
    case "similo": return `${x.ok?"成功":"失敗"}・「${esc(x.theme)}」・正解 ${x.card[0]||""}${esc(x.card[1])}・出題 ${nm(x.giver)}`;
    case "rank": return x.win<0 ? `引き分け ${x.pts[0]}-${x.pts[1]}` : `${nm(x.win)}の勝ち ${x.pts[x.win]}-${x.pts[1-x.win]}`;
  } }catch(e){} return ""; }
const recRowHead = (x, withGame) => `<span class="rt">${fmtTime(x.t)}</span>${withGame?`<span class="rg">${recGameName(x.g)}</span>`:""}<span class="rs">${recSummary(x)}</span>`;
// 順位当ては開くと「こんな順で選んだね」
function recRankRow(x, withGame){ let body="";
  try{ body = x.rounds.map((k,i)=>`<div class="recround"><p class="eyebrow">${i+1}. ${esc(k.topic)}　<span class="${pc(k.pred)}">${nm(k.pred)}さん：${esc(k.role)} ${k.pts}点</span></p>
      <div class="row" style="align-items:flex-start">
        <div class="grow"><p class="eyebrow ${pc(k.ans)}">${nm(k.ans)}さん（${esc(k.label)}）</p>${orderList(k.items,k.a)}</div>
        <div class="grow"><p class="eyebrow ${pc(k.pred)}">${nm(k.pred)}さんの予想</p>${orderList(k.items,k.p)}</div>
      </div></div>`).join(""); }catch(e){}
  return `<details class="rlog recrow"><summary>${recRowHead(x, withGame)}</summary><p class="eyebrow">こんな順で選んだね</p>${body}</details>`; }
const recRow = (x, withGame) => x.g==="rank" ? recRankRow(x, withGame) : `<div class="recrow">${recRowHead(x, withGame)}</div>`;

function recTotals(g){ const st=curStats(g);
  switch(g){
    case "ito": return statGrid([["成功／挑戦",`${st.wins}<small>/${st.tries}</small>`],["最高枚数",st.best?st.best+"枚":"—"],["最長連続成功",st.bestStreak+"回"]]);
    case "meter": { const b=st.best; return statGrid([["遊んだ回数",st.games+"ゲーム"],["1回あたりの平均点",avg1(st.pts, st.rounds)],["ぴったり（3点）",st.exact+"回"]])
      + (b?`<div class="panel"><p class="eyebrow">ベストショット</p><p><b class="${pc(b.taker)}">${nm(b.taker)}さん</b>が${b.honne?"質問":"ヒント"}「${esc(b.q)}」で差${b.d}！</p><p class="sub">${esc(b.lo)} ↔ ${esc(b.hi)}・${fmtDay(b.t)}</p></div>`:""); }
    case "words": return `<div class="panel" style="overflow-x:auto"><table class="rtable">
        <tr><th>モード</th><th>ゲーム</th><th>問題</th><th>そろった</th></tr>
        ${["w2","w3","w4"].map(k=>{ const m=st[k]; return `<tr><td class="nw">${W_SHORT[k]}</td><td>${m.games}</td><td>${m.q}</td><td>${m.hit}（${pct(m.hit,m.q)}）</td></tr>`; }).join("")}
      </table></div>
      <div class="panel"><p class="eyebrow">当てっこ（${st.guess.games}ゲーム・${st.guess.q}問）の通算点</p>
        <div class="score2">${[0,1].map(p=>`<div class="sc ${pc(p)}"><span>${nm(p)}</span><b>${st.guess.pts[p]}</b><small>点</small></div>`).join("")}</div></div>`;
    case "similo": { const th=Object.entries(st.themes); return statGrid([["成功",`${st.wins}<small>/${st.games}</small>`],["成功率",pct(st.wins, st.games)],["遊んだテーマ",th.length+"種類"]])
      + (th.length?`<div class="panel" style="overflow-x:auto"><table class="rtable"><tr><th>テーマ</th><th>成功／ゲーム</th></tr>
        ${th.map(([k,v])=>`<tr><td>${esc(k)}</td><td class="nw">${v.wins}／${v.games}</td></tr>`).join("")}</table></div>`:""); }
    case "rank": { const roles=RANK_ROLE_ORDER.filter(k=>st.roles[k]).concat(Object.keys(st.roles).filter(k=>!RANK_ROLE_ORDER.includes(k)));
      return `<div class="score2">${[0,1].map(p=>`<div class="sc ${pc(p)}"><span>${nm(p)}の勝ち</span><b>${st.wins[p]}</b></div>`).join("")}</div>`
      + statGrid([["対戦数",st.games+"回"],["引き分け",st.draws+"回"],["完全的中",st.perfect+"回"]])
      + (roles.length?`<div class="panel"><p class="eyebrow">役ごとの回数</p><table class="roles">${roles.map(k=>`<tr><th>${esc(k)}</th><td class="pt">${st.roles[k]}回</td></tr>`).join("")}</table></div>`:""); }
  } return ""; }

V.rec = () => { const d=SV.data, s=curSlot(), tab=S.recTab||"all", log=s?s.log:[], armed=S.armKey==="rec";
  const list = (tab==="all" ? log : log.filter(x=>x.g===tab)).slice().reverse();
  return `
  ${S.recBack?`<button data-act="recBack">← リザルトに戻る</button>`:""}
  <div><p class="eyebrow">📒 きろく・スロット${d.cur+1}</p><h2><span class="pa">${nm(0)}</span> ＆ <span class="pb">${nm(1)}</span></h2></div>
  ${SV.ok?"":`<p class="sub">この環境では保存できないため、記録はページを閉じると消えます。</p>`}
  <div class="row">${[["all","全部"],...REC_GAMES.map(x=>[x[0],x[2]])].map(([k,l])=>`<button class="chip ${tab===k?"on":""}" data-act="recTab" data-g="${k}">${l}</button>`).join("")}</div>
  ${tab==="all" ? "" : recTotals(tab)}
  <div class="panel"><p class="eyebrow">${tab==="all"?"直近の遊び":"1回ごとの記録"}（新しい順・直近${LOG_MAX}件まで）</p>
    ${list.length ? list.map(x=>recRow(x, tab==="all")).join("") : `<p class="sub">まだ記録がありません。</p>`}
  </div>
  <button class="${armed?"armed":""}" data-act="recClear" ${s && (s.plays || s.log.length) ? "" : "disabled"}>${armed?"本当に消す？（もう一度タップ。名前は残ります）":"このスロットの記録を消す"}</button>`; };
