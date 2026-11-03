// ===== ② メーター当て =====
const points = d => d<=5?3:d<=10?2:d<=20?1:0;
const meterHtml = inner => `<div class="meter">${inner||""}</div>`;
const mark = (v,label,cls="") => `<div class="mk ${cls}" style="left:${v}%"><span>${label}</span></div>`;
const band = v => `<div class="band" style="left:${Math.max(0,v-5)}%;width:${Math.min(100,v+5)-Math.max(0,v-5)}%"></div>`;
const pairScale = p => `<div class="scale"><b>◀ ${esc(p.lo)}</b><b>${esc(p.hi)} ▶</b></div>`;
function newRound(){ const m=S.m; m.pair=m.pairs[m.r % m.pairs.length]; m.guess=50; m.hints=["",""]; m.used2=false;
  if(m.mode==="honne"){ m.item=pick(m.pair.ex)[1]; m.target=50; } else m.target=5+Math.floor(Math.random()*91); }
const giver = () => S.m.r%2, taker = () => 1-S.m.r%2;
V.mSetup = () => `
  <div><p class="eyebrow">メーター当て</p><h2>メーターの位置を当てよう</h2></div>
  <div class="panel"><p class="eyebrow">モード</p>
    <div class="row">${[["hint","ヒントで当てる"],["honne","本音を当てる"]].map(([k,l])=>`<button class="chip ${S.mMode===k?"on":""}" data-act="mMode" data-k="${k}">${l}</button>`).join("")}</div>
    <p class="sub">${S.mMode==="honne"
      ? "出題する人が「◯◯は、許せる？許せない？」のような質問に、自分の本音で位置を決めます。相手はその本音を予想して当てます。"
      : "出題する人だけがランダムな正解の位置を見て、ヒントを最大2つ用意します。相手は1つ目のヒントで当てるか、2つ目も見るか（満点が3→2点に）を選べます。"}</p>
    <p class="sub">差5以内で3点・10以内で2点・20以内で1点。出題は交代です。</p>
  </div>
  <div class="panel"><p class="eyebrow">回数</p>
    <div class="row">${[1,3,5].map(n=>`<button class="chip ${S.mRounds===n?"on":""}" data-act="mRounds" data-n="${n}">${n}回</button>`).join("")}</div></div>
  <button class="main" data-act="mStart">はじめる</button>`;
V.mGive = () => { const m=S.m, g=giver(); const cands=nearest(m.pair.ex,m.target,6); return `
  <div><p class="eyebrow ${pc(g)}">${m.r+1}/${m.rounds}回目・出題：${nm(g)}さん</p><h2>正解の位置はここ</h2></div>
  ${pairScale(m.pair)}
  ${meterHtml(band(m.target)+mark(m.target,"正解 "+m.target))}
  <div class="panel"><p class="eyebrow">ヒントを用意しよう（2つまで）</p>
    <div class="row">${cands.map(e=>`<button class="chip ${m.hints.includes(e[1])?"on":""}" data-act="mHint" data-h="${esc(e[1])}">${esc(e[1])}</button>`).join("")}</div>
    <label>ヒント1（必須）<input type="text" id="hint1" maxlength="20" value="${esc(m.hints[0])}" placeholder="候補をタップ or 自分で書く"></label>
    <label>ヒント2（任意・相手が見ると満点が2点に）<input type="text" id="hint2" maxlength="20" value="${esc(m.hints[1])}" placeholder="例：あの日のラーメン屋"></label>
    <p class="sub">コツ：1つ目はちょっとずらしたヒント、2つ目は決め手になるヒントにすると盛り上がります。</p>
  </div>
  <button class="main" id="passBtn" data-act="mPass" ${m.hints[0]?"":"disabled"}>${nm(taker())}さんに渡す</button>`; };
V.mHonne = () => { const m=S.m, g=giver(); return `
  <div><p class="eyebrow ${pc(g)}">${m.r+1}/${m.rounds}回目・本音：${nm(g)}さん</p><h2>「${esc(m.item)}」は？</h2></div>
  ${pairScale(m.pair)}
  ${meterHtml(mark(m.target,"本音 "+m.target,"guess"))}
  <input type="range" id="honne" min="0" max="100" value="${m.target}" aria-label="本音の位置">
  <p class="sub">正直な位置にしてね。答え合わせのあと「なんでそこ？」を話します。</p>
  <button class="main" data-act="mHonneDone">決めた。${nm(taker())}さんに渡す</button>`; };
V.mGuess = () => { const m=S.m, t=taker(), g=giver(); const honne=m.mode==="honne"; return `
  <div><p class="eyebrow ${pc(t)}">${m.r+1}/${m.rounds}回目・回答：${nm(t)}さん</p>
    <h2>${honne?`${nm(g)}さんにとって「${esc(m.item)}」は？`:"ヒントから位置を当てよう"}</h2></div>
  ${honne?"":`<div class="hintbox">${esc(m.hints[0])}</div>
    ${m.hints[1]?(m.used2?`<div class="hintbox">${esc(m.hints[1])}</div>`:`<button data-act="mHint2">2つ目のヒントを見る（満点 3→2点）</button>`):""}`}
  ${pairScale(m.pair)}
  ${meterHtml(mark(m.guess,"予想 "+m.guess,"guess"))}
  <input type="range" id="guess" min="0" max="100" value="${m.guess}" aria-label="予想の位置">
  <button class="main" data-act="mDecide">これで決定</button>`; };
V.mReveal = () => { const m=S.m, d=Math.abs(m.guess-m.target), honne=m.mode==="honne"; const lab=honne?"本音":"正解"; return `
  <div><p class="eyebrow">${m.r+1}/${m.rounds}回目・答え合わせ</p>
    <h2>${honne?`「${esc(m.item)}」は？`:`ヒント「${esc(m.hints[0])}」${m.used2?`＋「${esc(m.hints[1])}」`:""}`}</h2></div>
  <div class="reveal stack" id="rv">
    ${pairScale(m.pair)}
    ${meterHtml(band(m.target)+mark(m.guess,lab+" "+m.target,"target")+mark(m.guess,"予想 "+m.guess,"guess"))}
    <div class="panel after"><p class="big ${m.last?"ok":"ng"}">${m.last}点${m.used2&&points(d)>2?"<span class=\"sub\">（ヒント2を使ったので満点2）</span>":""}</p>
      <p>差は${d}。${honne?`「なんでそこ？」「そう思ってたんだ」を話してみよう。`:`「なんでそのヒント？」「どうしてそこにした？」を話してみよう。`}</p></div>
  </div>
  <button class="main" data-act="mNext">${m.r+1<m.rounds?"次へ（出題を交代）":"結果を見る"}</button>`; };
function mBeginRound(){ newRound(); handoff(giver(), ()=>go(S.m.mode==="honne"?"mHonne":"mGive")); }

// --- ② メーター当て
V.mResult = () => { const m=S.m, max=m.rounds*3, r=m.score/max;
  const title = r>=.8?"以心伝心":r>=.5?"いい感じのふたり":r>=.25?"伸びしろたっぷり":"ここから知り合おう";
  const em = r>=.8?"💞":r>=.5?"😊":r>=.25?"🌱":"🔍";
  const best = m.log.reduce((b,x)=>(!b||x.d<b.d)?x:b, null);
  const byTaker = p => m.log.filter(x=>x.taker===p).reduce((s,x)=>s+x.pts,0);
  return `
  ${hero(em, title, `メーター当て（${m.mode==="honne"?"本音を当てる":"ヒントで当てる"}）・${m.rounds}回`, r>=.5)}
  ${statGrid([["ふたりの合計",`${m.score}<small>/${max}</small>`],["ぴったり（3点）",m.log.filter(x=>x.pts===3).length+"回"],["いちばん近かった差",best?best.d:"—"]])}
  <div class="score2">${[0,1].map(p=>`<div class="sc ${pc(p)}"><span>${nm(p)}が当てた点</span><b>${byTaker(p)}</b></div>`).join("")}</div>
  ${best?`<div class="panel"><p class="eyebrow">ベストショット</p><p><b class="${pc(best.taker)}">${nm(best.taker)}さん</b>が「${esc(best.q)}」で差${best.d}！</p></div>`:""}
  <div class="panel"><p class="eyebrow">1回ごとの記録</p>
    ${m.log.map((x,k)=>`<div class="logrow">
      <div class="logh"><b>${k+1}.</b> ${esc(x.lo)} ↔ ${esc(x.hi)}<span class="pt ${x.pts?"ok":"ng"}">${x.pts}点</span></div>
      <p class="sub">${x.honne?`質問「${esc(x.q)}」・本音：${nm(x.giver)}さん`:`ヒント「${esc(x.q)}」・出題：${nm(x.giver)}さん`}</p>
      <div class="mtrack"><i class="t" style="left:${x.target}%"></i><i class="g ${pc(x.taker)}" style="left:${x.guess}%"></i></div>
      <p class="sub">${x.honne?"本音":"正解"} ${x.target} ／ ${nm(x.taker)}さんの予想 ${x.guess}（差${x.d}）</p></div>`).join("")}
  </div>
  ${recLine("meter")}
  <div class="row"><button class="main grow" data-act="mStart">もう一回</button><button class="grow" data-act="mSetup">設定を変える</button></div>`; };

