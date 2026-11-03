// ===== ① 例えで並べる =====
function drawLens(){ const it=S.ito; it.lens=pickOther(LENSES, it.lens); it.lensWords=shuffle(it.lens.words); }
function newIto(per){ S.ito = {per, cards:[], order:[], revealed:0, peeks:[1,1], lens:S.ito?S.ito.lens:null}; }
function deal(){
  const it=S.ito, nums=new Set();
  while(nums.size < it.per*2) nums.add(1+Math.floor(Math.random()*100));
  it.cards = [...nums].map((num,k)=>({id:k, owner:k<it.per?0:1, i:(k%it.per)+1, num}));
  it.order=[]; it.revealed=0; it.peeks=[1,1]; drawLens();
}
const circ = i => "①②③④⑤"[i-1];
function tagHtml(c, face, extra="", tagName="div", attrs=""){
  return `<${tagName} class="tag ${face?"":"back"} ${extra}" style="--c:var(--${c.owner?"pb":"pa"})" ${attrs}>
    <span class="who">${nm(c.owner)}${circ(c.i)}</span>
    <span class="num">${face?c.num:"？"}</span>
  </${tagName}>`;
}
const myCardsHtml = p => `<div class="tags">${S.ito.cards.filter(c=>c.owner===p).map(c=>tagHtml(c,true,"flip")).join("")}</div>`;
const lensPanel = it => `<div class="panel"><p class="eyebrow">ものさしカード</p>
    <h2>${LENS_ICON[it.lens.name]||""} 「${esc(it.lens.name)}」で例えると？</h2>
    ${chips(it.lensWords)}
    <p class="sub">並び順はバラバラです。どれが上かは、ふたりの感覚しだい。ここにない言葉で例えてもOK。</p>
    <button data-act="itoLens">別のものさしを引く</button>
  </div>`;

V.itoSetup = () => `
  <div><p class="eyebrow">例えで並べる</p><h2>例えで並べる</h2></div>
  <div class="panel">
    <p class="sub">ふたりに秘密の数字（1〜100）が配られます。数字は言わずに、「ものさしカード」（動物の強さ・音の大きさなど）の言葉で例えて伝え合い、全部のカードを小さい順に並べられたら成功です。</p>
  </div>
  <div class="panel"><p class="eyebrow">ひとりのカードの枚数</p>
    <div class="row">${[2,3,4].map(n=>`<button class="chip ${S.ito.per===n?"on":""}" data-act="itoPer" data-n="${n}">${n}枚</button>`).join("")}</div>
  </div>
  <button class="main" data-act="itoStart">はじめる</button>`;

V.itoMemo = () => { const p=S.memoP; return `
  <div><p class="eyebrow ${pc(p)}">${nm(p)}さんのカード</p><h2>この数字を覚えよう</h2></div>
  ${myCardsHtml(p)}
  <button class="main" data-act="itoMemoDone">覚えた！裏返す</button>`; };

V.itoPeek = () => { const p=S.memoP; return `
  <div><p class="eyebrow ${pc(p)}">${nm(p)}さんの のぞき見</p><h2>例えで並べる</h2></div>
  ${myCardsHtml(p)}
  <button class="main" data-act="itoField">閉じる</button>`; };

V.itoField = () => { const it=S.ito; return `
  <div><p class="eyebrow">話し合い</p><h2>例えで並べる</h2></div>
  <div class="tags">${it.cards.map(c=>tagHtml(c,false)).join("")}</div>
  <div class="panel"><p class="eyebrow">話し方</p>
    <p>自分のカードを1枚ずつ、ものさしの言葉で例えてみよう。「①は${esc(it.lensWords[0])}くらい」「え、それって${esc(it.lensWords[1])}より上？」のように。</p></div>
  ${lensPanel(it)}
  <div class="row">${[0,1].map(p=>`<button class="grow" data-act="itoPeekGo" data-p="${p}" ${it.peeks[p]?"":"disabled"}>${nm(p)}の のぞき見（残り${it.peeks[p]}）</button>`).join("")}</div>
  <button class="main" data-act="itoOrder">並べる</button>`; };

V.itoOrder = () => { const it=S.ito; const rest=it.cards.filter(c=>!it.order.includes(c.id)); return `
  <div><p class="eyebrow">並べ替え</p><h2>小さいと思う順にタップ</h2></div>
  <div class="panel"><p class="eyebrow">並び（左が小さい）</p>
    <div class="tags">${it.order.map(id=>tagHtml(it.cards[id],false)).join("")}${rest.map(()=>`<div class="slot">ここ</div>`).join("")}</div>
  </div>
  ${rest.length?`<div class="panel"><p class="eyebrow">残りのカード</p><div class="tags">${rest.map(c=>tagHtml(c,false,"","button",`data-act="itoPut" data-id="${c.id}"`)).join("")}</div></div>`:""}
  <div class="row"><button class="grow" data-act="itoUndo" ${it.order.length?"":"disabled"}>ひとつ戻す</button><button class="grow" data-act="itoField">話し合いに戻る</button></div>
  <button class="main" data-act="itoReveal" ${rest.length?"disabled":""}>めくる</button>`; };

V.itoReveal = () => { const it=S.ito, n=it.order.length; let mx=0, ok=true;
  const tags=it.order.map((id,k)=>{ const c=it.cards[id]; if(k>=it.revealed) return tagHtml(c,false);
    const bad=c.num<mx; if(bad) ok=false; mx=Math.max(mx,c.num); return tagHtml(c,true,(bad?"bad":"good")+(k===it.revealed-1?" flip":"")); }).join("");
  const done = it.revealed>=n; return `
  <div><p class="eyebrow">答え合わせ</p><h2>例えで並べる</h2></div>
  <div class="tags">${tags}</div>
  ${!done?`<button class="main" data-act="itoFlip">めくる（${it.revealed+1}/${n}）</button>`:`
  ${hero(ok?"🎉":"🔀", ok?"成功！":"おしい！", ok?`${it.per*2}枚、ぴったり伝わりました。`:"赤いカードで順番が入れ替わりました。", ok)}
  ${(()=>{ const L=S.itoLog||[], okL=L.filter(x=>x.ok), best=okL.length?Math.max(...okL.map(x=>x.n)):0; let st=0; for(let i=L.length-1;i>=0&&L[i].ok;i--) st++;
    return statGrid([["成功／挑戦",`${okL.length}<small>/${L.length}</small>`],["最高枚数",best?best+"枚":"—"],["連続成功",st+"回"]]); })()}
  <div class="panel"><p class="eyebrow">今回のものさし</p><p>${LENS_ICON[it.lens.name]||""} ${esc(it.lens.name)}</p><p>どの例えが意外だった？ 話してみよう。</p></div>
  ${recLine("ito")}
  ${ok && it.per<4?`<button class="main" data-act="itoAgain" data-n="${it.per+1}">${it.per+1}枚に増やしてもう一回</button>`:""}
  <button ${ok && it.per<4?"":"class=\"main\""} data-act="itoAgain" data-n="${it.per}">${it.per}枚でもう一回</button>`}`; };

