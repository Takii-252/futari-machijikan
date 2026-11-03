// ===== ③ せーので連想 =====
const W_MODES = [
  ["w2","2語（自由に連想）","2つの言葉をつなぐ言葉を、せーので同時に言う。答えが広いぶん、そろうと気持ちいいし、ずれても「なんでそれ？」で話が広がる。"],
  ["w3","3語（そろいやすい）","3つの言葉に共通するものを、せーので同時に言う。答えが絞られるので、2語よりそろいやすい。"],
  ["w4","4語（かなりそろう）","4つの言葉に共通するものを、せーので同時に言う。いちばんやさしいモード。"],
  ["guess","当てっこ（出題と質問）","ひとりが答えを決め、もうひとりが当てる。ヒントは1つずつ増やせて、「はい・いいえ」で答えられる質問が3回まで。少ないヒントで当てるほど高得点。"]
];
const G_MAXQ = 3;
const gPoints = h => Math.max(1, 6-h);   // ヒント1つで当てたら5点 … 5つ以上で1点
function wBuildDeck(mode, n){
  if(mode==="w2") return shuffle(WORD_PAIRS).slice(0,n).map(p=>({words:[p[0],p[1]], ans:p[2]}));
  const k = mode==="w3"?3:4;
  return shuffle(TARGETS).slice(0,n).map(t=>({words:shuffle(t[1]).slice(0,k), ans:[t[0],...(t[2]||[])], t}));
}
V.wSetup = () => { const mode=S.wMode; return `
  <div><p class="eyebrow">せーので連想</p><h2>同じ言葉が言えるかな</h2></div>
  <div class="panel"><p class="eyebrow">モード</p>
    <div class="row">${W_MODES.map(([k,l])=>`<button class="chip ${mode===k?"on":""}" data-act="wMode" data-k="${k}">${l}</button>`).join("")}</div>
    <p class="sub">${W_MODES.find(m=>m[0]===mode)[2]}</p>
    ${mode==="guess"?"":`<p class="sub">そろったら1点。そろわなかったら答えの例が出ます。スマホは置いたままでOK。</p>`}
  </div>
  <div class="panel"><p class="eyebrow">問題数</p>
    <div class="row">${[3,5,10].map(n=>`<button class="chip ${S.wRounds===n?"on":""}" data-act="wRounds" data-n="${n}">${n}問</button>`).join("")}</div></div>
  <button class="main" data-act="wStart">はじめる</button>`; };

// --- 同時に言うモード（2語・3語・4語）
V.wPlay = () => { const w=S.w, ws=w.cur.words; return `
  <div><p class="eyebrow">${w.r+1}/${w.rounds}問目</p><h2>${ws.length===2?"この2つをつなぐ言葉は？":`この${ws.length}つに共通するものは？`}</h2></div>
  <div class="words">${ws.map(x=>`<span class="word">${wordIcon(x)?`<i class="wi">${wordIcon(x)}</i>`:""}${esc(x)}</span>`).join(`<span class="plus">＋</span>`)}</div>
  <p class="sub">心の中で1つ決めたら、カウントダウンを押してね。</p>
  <button class="main" data-act="wCount">3・2・1</button>`; };
// 数字が拡大する瞬間に横へはみ出さないよう、外側の箱で切り取る（見た目は同じ）
V.wCount = () => `<div class="countbox"><div class="count" id="cnt">3</div></div>`;
V.wJudge = () => `
  <div><p class="eyebrow">${S.w.r+1}/${S.w.rounds}問目　${S.w.cur.words.map(esc).join(" ＋ ")}</p><h2>同じ言葉だった？</h2></div>
  <p class="sub">言い方がちがっても、ふたりが「同じ」と思えばそろったことにしてOK。</p>
  <div class="row"><button class="main grow" data-act="wHit">そろった！</button><button class="grow" data-act="wMiss">ちがった</button></div>`;
V.wAfter = () => { const w=S.w, hit=w.last>0, words=w.cur.words.map(esc).join(" ＋ "); return `
  <p class="eyebrow">${w.r+1}/${w.rounds}問目</p>
  ${hero(hit?"🎉":"🤔", hit?"そろった！":"ちがった！", `${w.cur.words.map(v=>`${wordIcon(v)}${esc(v)}`).join(" ＋ ")}`, hit)}
  ${statGrid([["いまの成績",`${w.score}<small>/${w.r+1}問</small>`],["連続",(()=>{let c=0;for(let i=w.log.length-1;i>=0&&w.log[i].hit;i--)c++;return c+"問";})()],["残り",(w.rounds-w.r-1)+"問"]])}
  ${hit?`<div class="panel"><p class="big ok">＋1点</p><p>息ぴったり。どうしてその言葉が浮かんだ？</p>
      ${w.showAns?`<p class="eyebrow">ほかの答えの例</p>${chips(w.cur.ans)}`:`<button data-act="wShowAns">ほかの答えの例を見る</button>`}</div>`
    :`<div class="panel"><p class="eyebrow">${words}　答えの例</p>${chips(w.cur.ans)}
      <p>それぞれ、なんでその言葉にした？ 例の中に「それもあるか」はあった？</p></div>`}
  <button class="main" data-act="wNext">${w.r+1<w.rounds?"次のお題":"結果を見る"}</button>`; };

// --- 当てっこモード
const gGiver = () => S.w.r%2, gTaker = () => 1-S.w.r%2;
V.wSecret = () => { const w=S.w, g=gGiver(); return `
  <div><p class="eyebrow ${pc(g)}">${w.r+1}/${w.rounds}問目・出題：${nm(g)}さん</p><h2>答えを決めよう</h2></div>
  <div class="panel"><p class="eyebrow">お題カードの答え（${nm(gTaker())}さんに見せない）</p>
    <p class="big">${esc(w.t[0])}</p>
    <p class="eyebrow">画面に出るヒントの順番</p>
    <div class="wchips">${w.t[1].map((c,i)=>`<span>${i+1}. ${esc(c)}</span>`).join("")}</div>
    <div class="row"><button class="main grow" data-act="gUseCard">この答えで出題</button><button class="grow" data-act="gOther">別のお題</button></div>
  </div>
  <div class="panel"><p class="eyebrow">自分で答えを決める</p>
    <label>答え（画面には出ません）<input type="text" id="ownAns" maxlength="20" value="${esc(w.own)}" placeholder="例：初デートで行った店"></label>
    <p class="sub">この場合ヒントは口で出します。画面では、出したヒントの数と質問の回数だけ数えます。</p>
    <button id="ownBtn" data-act="gUseOwn" ${w.own?"":"disabled"}>自分の答えで出題</button>
  </div>`; };
V.wBoard = () => { const w=S.w, card=!w.own, t=gTaker(); return `
  <div><p class="eyebrow ${pc(t)}">${w.r+1}/${w.rounds}問目・当てる人：${nm(t)}さん</p><h2>答えはなんでしょう？</h2></div>
  <p class="sub">スマホはふたりの間に置いてOK。答えは画面に出ていません。</p>
  <div class="panel"><p class="eyebrow">ヒント（${w.h}個目）</p>
    ${card?`<div class="wchips">${w.t[1].slice(0,w.h).map((c,i)=>`<span>${i+1}. ${esc(c)}</span>`).join("")}</div>
      <button data-act="gNextHint" ${w.h>=w.t[1].length?"disabled":""}>次のヒントを出す</button>`
    :`<p>${nm(gGiver())}さんが口でヒントを出してね。</p><button data-act="gNextHint">ヒントをもう1つ出した</button>`}
    <p class="sub">いま当てたら <b>${gPoints(w.h)}点</b>。答えは何回言ってもOK。</p>
  </div>
  <div class="panel"><p class="eyebrow">「はい・いいえ」の質問</p>
    <p>残り <b class="big" style="font-size:28px">${w.q}</b> 回　<span class="sub">例：それって食べもの？</span></p>
    <button data-act="gAsk" ${w.q?"":"disabled"}>質問した（残りを1つ減らす）</button>
  </div>
  <div class="row"><button class="main grow" data-act="gHit">当たった！</button><button class="grow" data-act="gGiveUp">ギブアップ</button></div>`; };
V.wGuessAfter = () => { const w=S.w; return `
  <p class="eyebrow">${w.r+1}/${w.rounds}問目</p>
  ${hero(w.last?(w.last>=4?"🎯":"🎉"):"🏳️", w.last?(w.last>=4?"一発で見抜いた！":"当たり！"):"ギブアップ", `${nm(gTaker())}さんが挑戦`, !!w.last)}
  <div class="score2">${[0,1].map(p=>`<div class="sc ${pc(p)} ${gTaker()===p&&w.last?"up":""}"><span>${nm(p)}</span><b>${w.log.filter(x=>x.taker===p).reduce((a,x)=>a+x.pts,0)}</b><small>点</small></div>`).join("")}</div>
  <div class="panel"><p class="eyebrow">答え</p><p class="big">${esc(w.own||w.t[0])}</p>
    <p class="${w.last?"ok":"ng"}"><b>${w.last}点</b>（ヒント${w.h}個・質問${G_MAXQ-w.q}回）</p>
    <p>${w.last?"どのヒントでピンときた？":"どのヒントがあればわかった？"}</p></div>
  <button class="main" data-act="wNext">${w.r+1<w.rounds?"次の問題（出題を交代）":"結果を見る"}</button>`; };

function gLog(){ const w=S.w; w.log.push({ans:w.own||w.t[0], pts:w.last, h:w.h, q:G_MAXQ-w.q, giver:gGiver(), taker:gTaker(), hints:w.own?[]:w.t[1].slice(0,w.h)}); }
function wBeginRound(){ const w=S.w;
  if(w.mode==="guess"){ w.t=w.deck[w.r % w.deck.length]; w.own=""; w.h=1; w.q=G_MAXQ; handoff(gGiver(), ()=>go("wSecret")); }
  else { w.cur=w.deck[w.r % w.deck.length]; w.showAns=false; go("wPlay"); } }

// --- ③ せーので連想
V.wResult = () => { const w=S.w, guess=w.mode==="guess", max=guess?w.rounds*5:w.rounds, r=w.score/max;
  const title = r>=.7?"脳内つながってる":r>=.4?"波長あってきた":"発想が自由なふたり";
  const em = r>=.7?"🧠":r>=.4?"📡":"🎨";
  const modeName = W_MODES.find(x=>x[0]===w.mode)[1];
  if(guess){ const by = p => w.log.filter(x=>x.taker===p);
    return `
  ${hero(em, title, `せーので連想（${modeName}）・${w.rounds}問`, r>=.5)}
  ${statGrid([["ふたりの合計",`${w.score}<small>/${max}</small>`],["当たり",w.log.filter(x=>x.pts>0).length+"問"],["ヒント1つで正解",w.log.filter(x=>x.pts===5).length+"問"]])}
  <div class="score2">${[0,1].map(p=>`<div class="sc ${pc(p)}"><span>${nm(p)}が当てた点</span><b>${by(p).reduce((s,x)=>s+x.pts,0)}</b></div>`).join("")}</div>
  <div class="panel"><p class="eyebrow">1問ごとの記録</p>
    ${w.log.map((x,k)=>`<div class="logrow"><div class="logh"><b>${k+1}.</b> 答え「${esc(x.ans)}」<span class="pt ${x.pts?"ok":"ng"}">${x.pts?x.pts+"点":"ギブアップ"}</span></div>
      <p class="sub">出題：${nm(x.giver)}さん → 当てる人：${nm(x.taker)}さん・ヒント${x.h}個・質問${x.q}回</p>
      ${x.hints.length?chips(x.hints):""}</div>`).join("")}
  </div>
  <div class="row"><button class="main grow" data-act="wStart">もう一回</button><button class="grow" data-act="wSetup">設定を変える</button></div>`; }
  return `
  ${hero(em, title, `せーので連想（${modeName}）・${w.rounds}問`, r>=.5)}
  ${statGrid([["そろった",`${w.score}<small>/${w.rounds}問</small>`],["そろった率",Math.round(r*100)+"%"],["最長連続",(()=>{let b=0,c=0;w.log.forEach(x=>{c=x.hit?c+1:0;b=Math.max(b,c)});return b+"問";})()]])}
  <div class="panel"><p class="eyebrow">1問ごとの記録</p>
    ${w.log.map((x,k)=>`<div class="logrow"><div class="logh"><b>${k+1}.</b> ${x.words.map(v=>`${wordIcon(v)}${esc(v)}`).join(" ＋ ")}<span class="pt ${x.hit?"ok":"ng"}">${x.hit?"◎ そろった":"× ちがった"}</span></div>
      <p class="sub">答えの例：${x.ans.map(esc).join("、")}</p></div>`).join("")}
  </div>
  <div class="row"><button class="main grow" data-act="wStart">もう一回</button><button class="grow" data-act="wSetup">設定を変える</button></div>`; };

