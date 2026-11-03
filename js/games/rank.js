// ===== ⑤ 順位当て（役は競馬の買い方） =====
const R_ROLES = [["三連単",12,"上位3つが順番どおり"],["三連複",6,"上位3つの組み合わせ（順番は問わない）"],["馬単",5,"1位と2位が順番どおり"],["馬連",3,"1位と2位の組み合わせ（順番は問わない）"],["単勝",2,"1位が当たり"]];
const R_BONUS = 20;
function rJudge(a, p){
  const same = (x,y) => x.every(v=>y.includes(v));
  const perfect = a.every((v,i)=>v===p[i]);
  let role = null;
  if(a[0]===p[0] && a[1]===p[1] && a[2]===p[2]) role=0;
  else if(same(a.slice(0,3), p.slice(0,3))) role=1;
  else if(a[0]===p[0] && a[1]===p[1]) role=2;
  else if(same(a.slice(0,2), p.slice(0,2))) role=3;
  else if(a[0]===p[0]) role=4;
  return {role, perfect, pts:(role===null?0:R_ROLES[role][1]) + (perfect?R_BONUS:0)};
}
const roleName = j => j.perfect ? "完全的中" : j.role===null ? "ハズレ" : R_ROLES[j.role][0];
const rAns = () => S.r.i%2, rPred = () => 1-S.r.i%2;
function rNewRound(){ const r=S.r, t=r.topics[r.i % r.topics.length]; r.topic=t[0]; r.label=t[2]||"選ぶ順"; r.icon=t[3]||""; r.items=shuffle(t[1]).slice(0,5); r.ans=[]; r.pred=[]; r.cur="ans"; }
// 途中経過（ふたりの点数）
function rScoreHtml(highlight){ const r=S.r; const lead = r.pts[0]===r.pts[1] ? -1 : (r.pts[0]>r.pts[1]?0:1); return `
  <div class="score2">${[0,1].map(p=>`<div class="sc ${pc(p)} ${highlight===p?"up":""}"><span>${nm(p)}${lead===p?" ▲":""}</span><b>${r.pts[p]}</b><small>点</small></div>`).join("")}</div>`; }
function rPickerHtml(order){ const r=S.r, full=order.length>=5; return `
  <div class="panel"><p class="eyebrow">${esc(r.label)}</p>
    <ol class="rank">${[0,1,2,3,4].map(k=>`<li><span class="rk">${k+1}位</span>${order[k]!==undefined?`<b>${esc(r.items[order[k]])}</b>`:`<span class="sub">${k===order.length?"← 次はここ":"—"}</span>`}</li>`).join("")}</ol></div>
  ${full?"":`<div class="panel"><p class="eyebrow">${order.length+1}位にするものをタップ</p>
    <div class="row">${r.items.map((it,i)=>order.includes(i)?"":`<button class="chip" data-act="rPick" data-i="${i}">${esc(it)}</button>`).join("")}</div></div>`}
  <div class="row"><button class="grow" data-act="rUndo" ${order.length?"":"disabled"}>ひとつ戻す</button><button class="grow" data-act="rReset" ${order.length?"":"disabled"}>やり直し</button></div>`; }
const orderList = (items, order) => `<ol class="mini-rank">${order.map(i=>`<li>${esc(items[i])}</li>`).join("")}</ol>`;
V.rSetup = () => `
  <div><p class="eyebrow">順位当て</p><h2>あの人なら、どの順？</h2></div>
  <div class="panel"><p class="sub">「旅先で急に大雨。どうする？」のようなお題に、答える人が自分ならどうするかを5つ並べます。予想する人はその順位を5つ全部予想し、当たり方で役がつきます。点が入るのは予想した人。交代で答えて、最後に点数の多い方の勝ち！</p>
    <table class="roles">${R_ROLES.map(x=>`<tr><th>${x[0]}</th><td>${x[2]}</td><td class="pt">${x[1]}点</td></tr>`).join("")}
      <tr><th>完全的中</th><td>5つ全部が順番どおり</td><td class="pt">＋${R_BONUS}点</td></tr></table>
    <p class="sub">役は一番高いものだけ。</p></div>
  <div class="panel"><p class="eyebrow">回数（ひとり何回予想するか）</p>
    <div class="row">${[2,4,6].map(n=>`<button class="chip ${S.rRounds===n?"on":""}" data-act="rRounds" data-n="${n}">${n}回ずつ（全${n*2}回）</button>`).join("")}</div></div>
  <button class="main" data-act="rStart">はじめる</button>`;
V.rTopic = () => { const r=S.r, a=rAns(); return `
  <div class="topic-em">${r.icon}</div>
  <div><p class="eyebrow">${r.i+1}/${r.rounds}回目</p><h2>${esc(r.topic)}</h2></div>
  ${rScoreHtml()}
  <div class="panel"><p class="eyebrow">選択肢</p>${chips(r.items)}
    <p><b class="${pc(a)}">${nm(a)}さん</b>が、自分なら…で「${esc(r.label)}」に並べます。<b class="${pc(rPred())}">${nm(rPred())}さん</b>はそれを予想します。</p></div>
  <button class="main" data-act="rToAns">${nm(a)}さんに渡す</button>`; };
V.rAnswer = () => { const r=S.r, a=rAns(); return `
  <div><p class="eyebrow ${pc(a)}">${r.i+1}/${r.rounds}回目・答える人：${nm(a)}さん</p><h2>${esc(r.topic)}</h2></div>
  <p>あなたなら？「${esc(r.label)}」に並べてね。</p>
  ${rPickerHtml(r.ans)}
  <button class="main" data-act="rDone" ${r.ans.length===5?"":"disabled"}>決定して${nm(rPred())}さんに渡す</button>`; };
V.rPredict = () => { const r=S.r, a=rAns(), p=rPred(); return `
  <div><p class="eyebrow ${pc(p)}">${r.i+1}/${r.rounds}回目・予想する人：${nm(p)}さん</p><h2>${esc(r.topic)}</h2></div>
  <p>${nm(a)}さんなら、どの順？「${esc(r.label)}」を予想してね。</p>
  ${rPickerHtml(r.pred)}
  <button class="main" data-act="rDone" ${r.pred.length===5?"":"disabled"}>この予想で勝負</button>`; };
V.rReveal = () => { const r=S.r, a=rAns(), p=rPred(), j=r.last; return `
  <div><p class="eyebrow">${r.i+1}/${r.rounds}回目・答え合わせ</p><h2>${esc(r.topic)}</h2></div>
  <div class="panel ${j.perfect?"perfect":""}">
    <p class="eyebrow ${pc(p)}">${nm(p)}さんの予想</p>
    <p class="big ${j.pts?"ok":"ng"}">${j.perfect?"完全的中！":j.role===null?"ハズレ":R_ROLES[j.role][0]+" 的中"}</p>
    <p><b>＋${j.pts}点</b>${j.perfect?`（三連単 ${R_ROLES[0][1]}点 ＋ 完全的中ボーナス ${R_BONUS}点）`:j.role!==null?`（${R_ROLES[j.role][2]}）`:""}</p>
    ${j.perfect?`<p>5つ全部ぴったり。心が読めてる…！</p>`:""}
  </div>
  ${rScoreHtml(p)}
  <div class="panel" style="overflow-x:auto"><table class="rtable">
    <tr><th></th><th class="${pc(a)}">${nm(a)}さんの順位</th><th class="${pc(p)}">${nm(p)}さんの予想</th></tr>
    ${[0,1,2,3,4].map(k=>{ const hit=r.ans[k]===r.pred[k]; return `<tr class="${hit?"hit":""}"><td>${k+1}位</td><td>${esc(r.items[r.ans[k]])}</td><td>${esc(r.items[r.pred[k]])}${hit?" ◎":""}</td></tr>`; }).join("")}
  </table></div>
  <p>予想とずれたところを「なんでそこ？」と聞いてみよう。</p>
  <button class="main" data-act="rNext">${r.i+1<r.rounds?"次へ（出番を交代）":"結果を見る"}</button>`; };
V.rFinal = () => { const r=S.r, w = r.pts[0]===r.pts[1] ? -1 : (r.pts[0]>r.pts[1]?0:1);
  const per = p => r.log.filter(x=>x.pred===p);
  const best = p => { const l=per(p); if(!l.length) return "—"; const b=l.reduce((m,x)=>x.pts>m.pts?x:m); return b.pts?`${roleName(b.j)}（${b.pts}点）`:"—"; };
  const roles = p => { const l=per(p).filter(x=>x.pts>0); return l.length?l.map(x=>roleName(x.j)).join("、"):"なし"; };
  const hits = p => per(p).filter(x=>x.pts>0).length;
  return `
  ${hero(w<0?"🤝":"🏆", w<0?"引き分け！":`<span class="${pc(w)}">${nm(w)}さん</span>の勝ち！`, `順位当て・全${r.rounds}回`, true)}
  <div class="panel ${r.log.some(x=>x.j.perfect)?"perfect":""}">
    ${rScoreHtml(w<0?undefined:w)}
    <div style="overflow-x:auto"><table class="rtable">
      <tr><th></th><th class="pa">${nm(0)}</th><th class="pb">${nm(1)}</th></tr>
      <tr><td>的中した回数</td><td>${hits(0)}/${per(0).length}</td><td>${hits(1)}/${per(1).length}</td></tr>
      <tr><td>完全的中</td><td>${per(0).filter(x=>x.j.perfect).length}回</td><td>${per(1).filter(x=>x.j.perfect).length}回</td></tr>
      <tr><td>いちばんの当たり</td><td>${best(0)}</td><td>${best(1)}</td></tr>
      <tr><td>取った役</td><td>${roles(0)}</td><td>${roles(1)}</td></tr>
    </table></div>
  </div>
  <div class="panel"><p class="eyebrow">1回ごとの記録</p>
    <div style="overflow-x:auto"><table class="rtable">
      <tr><th>回</th><th>お題</th><th>予想</th><th>役</th><th>点</th></tr>
      ${r.log.map((x,k)=>`<tr class="${x.pts?"hit":""}"><td>${k+1}</td><td>${esc(x.topic)}</td><td class="nw ${pc(x.pred)}">${nm(x.pred)}</td><td class="nw">${roleName(x.j)}</td><td class="nw">${x.pts}</td></tr>`).join("")}
    </table></div></div>
  <div class="panel"><p class="eyebrow">こんな順で選んだね</p>
    ${r.log.map((x,k)=>`<details class="rlog"><summary>${k+1}. ${esc(x.topic)}　<span class="${pc(x.ans)}">${nm(x.ans)}さんの答え</span></summary>
      <div class="row" style="align-items:flex-start">
        <div class="grow"><p class="eyebrow ${pc(x.ans)}">${nm(x.ans)}さん（${esc(x.label)}）</p>${orderList(x.items,x.a)}</div>
        <div class="grow"><p class="eyebrow ${pc(x.pred)}">${nm(x.pred)}さんの予想</p>${orderList(x.items,x.p)}</div>
      </div></details>`).join("")}
  </div>
  <div class="row"><button class="main grow" data-act="rStart">もう一回</button><button class="grow" data-act="rSetup">設定を変える</button></div>`; };
