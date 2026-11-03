// ===== ④ 似てる・違う（Similoの仕組み） =====
const S_REMOVE = [1,2,3,4,1];   // 各回に外す枚数（12枚→残り1枚）
const picCard = (c, cls="", attrs="", tag="div") => `<${tag} class="pc ${c[0]?"":"txt "}${cls}" ${attrs}>${c[0]?`<span class="em">${c[0]}</span>`:""}<span class="nm">${esc(c[1])}</span></${tag}>`;
function sNewGame(){ const s=S.s, th = s.themeIdx>=0 ? PIC_THEMES[s.themeIdx] : pick(PIC_THEMES), deck=shuffle(th.cards); s.theme=th.name;
  s.grid=deck.slice(0,12); s.secret=Math.floor(Math.random()*12); s.pile=deck.slice(12); s.hand=s.pile.splice(0,5);
  s.clues=[]; s.removed=[]; s.sel=[]; s.round=0; s.pickH=-1; s.failed=false; }
const sGiver = () => S.s.g%2, sTaker = () => 1-S.s.g%2;
const sCluesHtml = () => { const s=S.s; if(!s.clues.length) return "";
  return `<div class="panel"><p class="eyebrow">これまでのヒント（ずっと有効）</p><div class="clues">${s.clues.map(k=>`<div class="clue ${k.t}">${picCard(k.c)}<b class="${k.t==="sim"?"ok":"ng"}">${k.t==="sim"?"似てる":"違う"}</b></div>`).join("")}</div></div>`; };
V.sSetup = () => `
  <div><p class="eyebrow">似てる・違う</p><h2>12枚から正解を見つけよう</h2></div>
  <div class="panel"><p class="sub">同じテーマの12枚のカードの中に、出題者だけが知っている正解が1枚あります。出題者は手札から1枚選び、「似てる」か「違う」をつけて出すだけ（言葉や身ぶりのヒントはなし）。当てる人は、ヒントを頼りに候補を 1→2→3→4→1枚 と外していきます。最後に正解が残れば成功、途中で正解を外したら失敗です。</p>
    <p class="sub">「似てる」の意味は自由。見た目、色、季節、気分…なんでもOK。外す前に「なんでそれを外す？」を声に出してね。</p>
    <p><b>協力ゲームです。</b>出題者と当てる人は一緒に勝つか、一緒に負けるか。出題者は「相手が正解を残せるように」いちばん伝わる1枚と置き方を選びます。</p></div>
  <div class="panel"><p class="eyebrow">テーマ（候補もヒントも、このテーマのカードだけで遊びます）</p>
    <div class="row"><button class="chip ${S.sTheme<0?"on":""}" data-act="sTheme" data-n="-1">おまかせ</button>${PIC_THEMES.map((t,i)=>`<button class="chip ${S.sTheme===i?"on":""}" data-act="sTheme" data-n="${i}">${esc(t.name)}</button>`).join("")}</div></div>
  <div class="panel"><p class="eyebrow">手札の補充</p>
    <div class="row"><button class="chip ${S.sRefill?"on":""}" data-act="sRefill" data-n="1">あり（1枚出したら1枚引く）</button><button class="chip ${S.sRefill?"":"on"}" data-act="sRefill" data-n="0">なし（最初の5枚だけ）</button></div>
    <p class="sub">確認したルール資料は「あり」。「なし」だと後半ほど出せるカードが減って、悩みどころが増えます。</p></div>
  <div class="panel"><p class="eyebrow">ゲーム数（出題は交代）</p>
    <div class="row">${[1,2,4].map(n=>`<button class="chip ${S.sGames===n?"on":""}" data-act="sGames" data-n="${n}">${n}ゲーム</button>`).join("")}</div></div>
  <button class="main" data-act="sStart">はじめる</button>`;
V.sClue = () => { const s=S.s, g=sGiver(); return `
  <div><p class="eyebrow ${pc(g)}">${s.g+1}/${s.games}ゲーム・${s.round+1}/5回目・出題：${nm(g)}さん</p><h2>テーマ「${esc(s.theme)}」　手札から1枚出そう</h2></div>
  <div class="row" style="align-items:center"><span class="sub">正解は</span>${picCard(s.grid[s.secret],"secret solo")}<span class="sub">このあと外すのは${S_REMOVE[s.round]}枚</span></div>
  <div class="pgrid mini">${s.grid.map((c,i)=>picCard(c,(s.removed.includes(i)?"out ":"")+(i===s.secret?"secret":""))).join("")}</div>
  ${sCluesHtml()}
  <div class="panel"><p class="eyebrow">手札${s.refill?"":`（残り${s.hand.length}枚・補充なし）`}　${nm(sTaker())}さんには見せない</p>
    <div class="hand">${s.hand.map((c,i)=>picCard(c,s.pickH===i?"sel":"",`data-act="sPickH" data-i="${i}"`,"button")).join("")}</div>
    <div class="row"><button class="main grow" data-act="sGive" data-t="sim" ${s.pickH<0?"disabled":""}>似てる で出す</button><button class="main grow" data-act="sGive" data-t="diff" ${s.pickH<0?"disabled":""}>違う で出す</button></div>
    <p class="sub">協力ゲームなので、相手に一番伝わる1枚を。「違う」ばかりだと情報が少なくて、ふたりとも負けやすくなります。出したら、スマホをふたりの間に置いてOK（次の画面に正解は出ません）。</p>
  </div>`; };
V.sBoard = () => { const s=S.s, n=S_REMOVE[s.round], t=sTaker(); return `
  <div><p class="eyebrow ${pc(t)}">${s.g+1}/${s.games}ゲーム・${s.round+1}/5回目・テーマ「${esc(s.theme)}」・当てる人：${nm(t)}さん</p><h2>正解じゃないと思うカードを${n}枚外そう</h2></div>
  ${sCluesHtml()}
  <div class="pgrid">${s.grid.map((c,i)=> s.removed.includes(i) ? picCard(c,"out") : picCard(c,s.sel.includes(i)?"sel":"",`data-act="sSel" data-i="${i}"`,"button")).join("")}</div>
  <p class="sub">${nm(sGiver())}さんはヒントを言わずに見守ってね。</p>
  <button class="main" data-act="sRemove" ${s.sel.length===n?"":"disabled"}>選んだ ${s.sel.length}/${n} 枚を外す</button>`; };


// --- ④ 似てる・違う
const sTimeline = x => `<div class="tl">${x.clues.map((k,i)=>`<div class="tlrow">
    <span class="tln">${i+1}</span>
    <div class="clue ${k.t}">${picCard(k.c)}<b class="${k.t==="sim"?"ok":"ng"}">${k.t==="sim"?"似てる":"違う"}</b></div>
    <div class="grow"><p class="sub">外した ${k.removed?k.removed.length:0}枚</p>
      <div class="wchips">${(k.removed||[]).map(c=>`<span class="${c===x.secretCard?"bad":""}">${c[0]}${esc(c[1])}</span>`).join("")}</div></div>
  </div>`).join("")}</div>`;
V.sResult = () => { const s=S.s, ok=!s.failed, x=s.log[s.log.length-1]; return `
  ${hero(ok?"🎉":"💥", ok?"成功！正解が残った":"失敗…正解を外しちゃった", `テーマ「${esc(s.theme)}」・出題 ${nm(x.giver)}さん → 当てる人 ${nm(x.taker)}さん`, ok)}
  <div class="panel center"><p class="eyebrow">正解はこれ</p>${picCard(x.secretCard,"secret big-card")}
    ${ok?`<p>5回のヒントで、11枚を外しきりました！</p>`:`<p>${x.clues.length}回目に外してしまいました。</p>`}</div>
  <div class="panel"><p class="eyebrow">ヒントと外したカードの流れ</p>${sTimeline(x)}</div>
  <div class="panel"><p>「なんでそのカードを似てる（違う）にした？」「どれで迷った？」を話してみよう。</p></div>
  <button class="main" data-act="sNext">${s.g+1<s.games?"次のゲーム（出題を交代）":"結果を見る"}</button>`; };
V.sFinal = () => { const s=S.s, r=s.wins/s.games;
  const title = r>=1?"ツーカーのふたり":r>=.5?"感覚が近いふたり":"見ている世界がちがうふたり";
  const asGiver = p => { const l=s.log.filter(x=>x.giver===p); return `${l.filter(x=>x.ok).length}/${l.length}`; };
  const simRate = Math.round(100*s.log.flatMap(x=>x.clues).filter(k=>k.t==="sim").length/Math.max(1,s.log.flatMap(x=>x.clues).length));
  return `
  ${hero(r>=1?"🏆":r>=.5?"🤝":"🌀", title, `似てる・違う・${s.games}ゲーム`, r>=.5)}
  ${statGrid([["成功",`${s.wins}<small>/${s.games}</small>`],["「似てる」で出した割合",simRate+"%"],["出したヒント",s.log.reduce((n,x)=>n+x.clues.length,0)+"枚"]])}
  <div class="score2">${[0,1].map(p=>`<div class="sc ${pc(p)}"><span>${nm(p)}が出題して成功</span><b>${asGiver(p)}</b></div>`).join("")}</div>
  <div class="panel"><p class="eyebrow">ゲームごとの記録</p>
    ${s.log.map((x,k)=>`<details class="rlog" ${k===s.log.length-1?"open":""}><summary>${k+1}. ${x.ok?"◎":"×"} テーマ「${esc(x.theme)}」　正解 ${x.secretCard[0]}${esc(x.secretCard[1])}　<span class="${pc(x.giver)}">出題 ${nm(x.giver)}</span></summary>${sTimeline(x)}</details>`).join("")}
  </div>
  ${recLine("similo")}
  <div class="row"><button class="main grow" data-act="sStart">もう一回</button><button class="grow" data-act="sSetup">設定を変える</button></div>`; };

