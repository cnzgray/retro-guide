/* =========================================================
   数据
   ========================================================= */
const GAMES = (window.RETRO_GAME_IDS || []).map((id) => (window.RETRO_GAMES || {})[id]).filter(Boolean);

/* =========================================================
   状态
   ========================================================= */
const KEY="retroGuide.v1";
let state={game:"minish",done:{},checks:{},quests:{},bonds:{},npcs:{}};
try{
  const raw=localStorage.getItem(KEY);
  if(raw){
    const p=JSON.parse(raw);
    if(p&&p.done&&p.checks){state=p; if(!state.game)state.game="minish";}
  }
}catch(e){}
if(!state.done)state.done={};
if(!state.checks)state.checks={};
if(!state.quests)state.quests={};
if(!state.bonds)state.bonds={};
if(!state.npcs)state.npcs={};
if(!state.views)state.views={};
let questFilter="all";
let bondFilter="all";
let bondChar="";
let bondLv="";
let npcFilter="all";
let npcArea="";
let npcRace="";
let npcTime="";
let itemFilter="all";
let itemUser="";
let itemClass="";
let itemSort="value";
let itemsFilter="all";
let itemsPlace="";
let itemsWay="";
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}

const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const gid=()=>state.game;
const game=()=>GAMES.find(g=>g.id===state.game);
const doneList=()=>state.done[gid()]||(state.done[gid()]=[]);
const isDone=id=>doneList().includes(id);
const questList=()=>state.quests[gid()]||(state.quests[gid()]={});
const isQuestDone=id=>!!questList()[String(id)];
const bondList=()=>state.bonds[gid()]||(state.bonds[gid()]={});
const isBondDone=id=>!!bondList()[String(id)];
const npcList=()=>state.npcs[gid()]||(state.npcs[gid()]={});
const isNpcDone=id=>!!npcList()[String(id)];
const ARMOR_CLASS={"轻":"轻型","中":"中型","重":"重型","机":"机界"};
function panels(g){
  return [["flow","流程"],...(g.quests?[["quests","任务"]]:[]),...(g.bonds?[["bonds",g.bondMeta?.tab||"牵绊"]]:[]),...(g.npcs?[["npcs",g.npcMeta?.tab||"NPC"]]:[]),...(g.bestiary?[["bestiary",g.bestiaryMeta?.tab||"珍稀种"]]:[]),...(g.systems?[["systems",g.systemsMeta?.tab||"系统"]]:[]),["help",g.tips?"急救与技巧":"急救"],...(g.catalog?[["catalog",g.catalogMeta?.tab||"物品"]]:[]),...(g.items?[["items",g.itemsMeta?.tab||"物品"]]:[]),["collect","收集"],["boss",g.bossMeta?.tab||"Boss"]];
}
function showPanel(id,remember=true){
  const g=game();
  if(!panels(g).some(p=>p[0]===id))id="flow";
  document.body.dataset.panel=id;
  document.querySelectorAll("#main [data-panel]").forEach(el=>el.classList.toggle("hidden",el.dataset.panel!==id));
  document.querySelectorAll("#ptabs [data-view]").forEach(b=>b.classList.toggle("on",b.dataset.view===id));
  if(remember){state.views[gid()]=id;save();}
}

/* =========================================================
   渲染
   ========================================================= */
function renderTabs(){
  $("#gtabs").innerHTML=GAMES.map(g=>
    `<button class="gtab ${g.id===state.game?"on":""}" data-g="${g.id}" style="--dot:${g.theme["--acc"]}"><b>${esc(g.short)}</b><span>${esc(g.tabs)}</span></button>`
  ).join("");
  $("#gtabs").querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{state.game=b.dataset.g;save();build();window.scrollTo({top:0});});
  const on=$("#gtabs .gtab.on");
  if(on){
    const strip=$("#gtabs");
    if(strip.scrollWidth>strip.clientWidth+1){
      const a=on.getBoundingClientRect(),s=strip.getBoundingClientRect();
      strip.scrollLeft+=(a.left-s.left)-(s.width-a.width)/2;
    }
  }
}

function renderToc(){
  const g=game();
  let h=`<div class="tgroup">本作</div>
    <a href="#top" data-go="top">概览</a>
    <a href="#flow" data-go="flow">流程（${g.chapters.length} 章）</a>
    ${g.quests?`<a href="#quests" data-go="quests">全任务</a>`:""}
    ${g.bonds?`<a href="#bonds" data-go="bonds">${esc(g.bondMeta?.title||"全牵绊对话")}</a>`:""}
    ${g.npcs?`<a href="#npcs" data-go="npcs">${esc(g.npcMeta?.title||"全 NPC 一览")}</a>`:""}
    ${g.bestiary?`<a href="#bestiary" data-go="bestiary">${esc(g.bestiaryMeta?.title||"珍稀种速查")}</a>`:""}
    ${g.systems?`<a href="#systems" data-go="systems">${esc(g.systemsMeta?.title||"系统速查")}</a>`:""}
    <a href="#help" data-go="help">卡关急救</a>
    ${g.tips?`<a href="#tips" data-go="tips">小技巧</a>`:""}
    ${g.catalog?`<a href="#catalog" data-go="catalog">${esc(g.catalogMeta?.title||"全物品")}</a>`:""}
    ${g.items?`<a href="#items" data-go="items">${esc(g.itemsMeta?.title||"物品出处")}</a>`:""}
    <a href="#collect" data-go="collect">收集清单</a>
    <a href="#boss" data-go="boss">${esc(g.bossMeta?.title||"Boss 速查")}</a>
    <div class="tgroup">章节</div>`;
  h+=g.chapters.map(c=>`<a href="#ch-${c.id}" data-go="ch-${c.id}" class="sub ${isDone(c.id)?"done":""}">${c.n}. ${esc(c.title)}</a>`).join("");
  $("#toc").innerHTML=h;
  $("#toc").querySelectorAll("[data-go]").forEach(a=>a.onclick=e=>{
    e.preventDefault();
    const t=document.getElementById(a.dataset.go);
    if(t){
      const panel=t.closest("[data-panel]");
      if(panel){$("#search").value="";applySearch("");showPanel(panel.dataset.panel);}
      const card=t.closest(".chapter"); if(card)card.classList.add("open");
      t.scrollIntoView({behavior:"smooth",block:"start"});
    }
  });
}

function renderProgress(){
  const g=game();
  const total=g.chapters.length;
  const done=g.chapters.filter(c=>isDone(c.id)).length;
  const pct=total?Math.round(done/total*100):0;
  $("#pfill").style.width=pct+"%";
  $("#ptext").textContent=done+" / "+total;
}

let xrefCache=null;
function xrefIndex(g){
  if(xrefCache&&xrefCache.id===g.id)return xrefCache;
  const map=new Map();
  const add=(name,kind)=>{
    if(!name||name.length<2||!/[\u4e00-\u9fff]/.test(name))return;
    if(!map.has(name))map.set(name,kind);
  };
  for(const grp of g.catalog||[]){
    for(const it of grp.items){
      const raw=(it.n||"").replace(/^#\d+\s*/,"");
      const m=raw.match(/^(.+?)(?: [A-Za-z].*)?$/);
      add(m?m[1]:raw,"catalog");
    }
  }
  for(const grp of g.items||[]){
    for(const it of grp.items)add(it.n,"items");
  }
  const keys=[...map.keys()].sort((a,b)=>b.length-a.length);
  const re=keys.length?new RegExp("("+keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")","g"):null;
  xrefCache={id:g.id,map,re};
  return xrefCache;
}

function xrefHTML(html,g){
  if(!html)return html;
  const {map,re}=xrefIndex(g);
  if(!re)return html;
  return html.split(/(<[^>]*>)/).map(part=>{
    if(!part||part[0]==="<")return part;
    return part.replace(re,m=>{
      const kind=map.get(m);
      if(!kind)return m;
      return `<a class="xref" href="#" title="查看「${esc(m)}」的资料" data-xref="${kind}" data-q="${esc(m)}">${m}</a>`;
    });
  }).join("");
}

function xrefJump(kind,q){
  const input=$("#search");
  input.value=q;
  applySearch(q);
  showPanel(kind);
  const hit=document.querySelector(`#${kind} .citem:not(.hidden)`);
  if(hit){
    const d=hit.closest("details.qgroup");
    if(d)d.open=true;
    hit.scrollIntoView({behavior:"smooth",block:"center"});
  }
}

function chapterHTML(c,g){
  const done=isDone(c.id);
  const searchTxt=[c.title,c.area,c.goal,(c.steps||[]).join(" "),(c.items||[]).join(" "),(c.warn||[]).join(" "),c.boss?c.boss.name+" "+c.boss.tip:""].join(" ").replace(/<[^>]+>/g," ").toLowerCase();
  return `<article class="card chapter ${done?"done":""}" id="ch-${c.id}" data-search="${esc(searchTxt)}">
    <header class="chead" data-toggle="${c.id}">
      <span class="cnum">${c.n}</span>
      <div class="ctitle"><h3>${esc(c.title)}</h3><span class="carea">${esc(c.area)}</span></div>
      <button class="donebtn" data-done="${c.id}" aria-pressed="${done}" title="标记完成">✓</button>
    </header>
    <div class="cbody">
      <p class="goal"><b>目标</b>　${xrefHTML(c.goal,g)}</p>
      <ol class="steps">${(c.steps||[]).map(s=>`<li>${xrefHTML(s,g)}</li>`).join("")}</ol>
      ${(c.items&&c.items.length)?`<div class="chips">${c.items.map(i=>`<span class="chip key">${esc(i)}</span>`).join("")}</div>`:""}
      ${(c.warn||[]).map(w=>`<div class="warn"><b>易漏 / 卡点</b>　${xrefHTML(w,g)}</div>`).join("")}
      ${c.boss?`<div class="bossbox"><b>${esc(c.boss.name)}</b>　${xrefHTML(c.boss.tip,g)}</div>`:""}
      ${c.tip?`<div class="tip"><b>提示</b>　${xrefHTML(c.tip,g)}</div>`:""}
    </div>
  </article>`;
}

function buildQuestPrereqs(g){
  const all=g.quests.flatMap(grp=>grp.items.map(it=>({...it,area:grp.area})));
  const byArea=new Map(),byName=new Map();
  for(const it of all){
    const ak=it.area+"|"+it.n;
    if(!byArea.has(ak))byArea.set(ak,[]);
    byArea.get(ak).push(it);
    if(!byName.has(it.n))byName.set(it.n,[]);
    byName.get(it.n).push(it);
  }
  const map=new Map();
  for(const it of all){
    if(!it.c||!it.c.includes("前置任务"))continue;
    const expr=it.c.split("前置任务")[1].trim().replace(/\s*·\s*第\s*\d+\s*章后$/,"").trim();
    const names=expr.split(/\s*或\s*/).map(x=>x.trim()).filter(Boolean);
    const ids=[];
    for(const name of names){
      const local=byArea.get(it.area+"|"+name)||[];
      const cand=local.length?local:(byName.get(name)||[]);
      if(cand.length)ids.push(String(cand[0].id));
    }
    if(ids.length)map.set(String(it.id),[...new Set(ids)]);
  }
  return map;
}

function questSectionHTML(g){
  const all=g.quests.flatMap(grp=>grp.items);
  const prereqMap=buildQuestPrereqs(g);
  const nameById=new Map(all.map(it=>[String(it.id),it.n]));
  const pairIds=new Set(all.filter(it=>it.x).map(it=>it.x));
  const pairMap={};
  all.forEach(it=>{ if(it.x)(pairMap[it.x]??=[]).push(it); });
  const timed=all.filter(it=>it.t).length;
  const done=all.filter(it=>isQuestDone(it.id)).length;
  const max=all.length-pairIds.size;
  const pct=max?(done/max*100).toFixed(2):"0";
  let body="";
  g.quests.forEach((grp,gi)=>{
    const items=grp.items.map(it=>{
      const other=it.x?pairMap[it.x].find(x=>String(x.id)!==String(it.id)):null;
      const pairLocked=!!other&&!isQuestDone(it.id)&&isQuestDone(other.id);
      const preIds=prereqMap.get(String(it.id))||[];
      const preNames=preIds.map(x=>nameById.get(x)).filter(Boolean);
      const preLocked=preIds.length>0&&!isQuestDone(it.id)&&!preIds.some(x=>isQuestDone(x));
      const locked=pairLocked||preLocked;
      const flags=[it.t?"t":"",it.x?"x":"",it.s?"s":"",it.ns2?"ns2":""].filter(Boolean).join(" ");
      const giver=it.s?"剧情任务":it.g;
      const reward=[];
      if(it.m)reward.push(it.m+"G");
      if(it.e)reward.push(it.e+"EXP");
      if(it.f)reward.push("评价+"+it.f);
      if(it.rw&&it.rw.length)reward.push(...it.rw);
      const rewardText=reward.length?reward.join(" · "):(it.s?"剧情任务，无报酬":"无报酬");
      const condText=it.c?"接取："+it.c:"";
      const objText=it.o&&it.o.length?"目标："+it.o.slice(0,4).join(" / ")+(it.o.length>4?" …":""):"";
      const search=[it.n,giver,grp.area,it.d,rewardText,it.c,objText,it.t?"限时":"",it.x?"二选一":"",it.s?"剧情":"",it.ns2?"NS2":""].filter(Boolean).join(" ").toLowerCase();
      return `<label class="chk qitem ${locked?"locked":""}" data-search="${esc(search)}" data-qid="${esc(String(it.id))}" data-qflags="${flags}"${other?` data-qother="${esc(String(other.id))}"`:""}${preIds.length?` data-prereq="${esc(preIds.join(","))}"`:""}>
        <input type="checkbox" data-q="${esc(String(it.id))}" ${isQuestDone(it.id)?"checked":""} ${locked?"disabled":""}>
        <span class="qbody">
          <span class="qname">${esc(it.n)}${it.t?' <i class="qbadge t">限时</i>':""}${it.x?' <i class="qbadge x">二选一</i>':""}${it.s?' <i class="qbadge s">剧情</i>':""}${it.ns2?' <i class="qbadge ns2">NS2</i>':""}${it.v?' <i class="qbadge v" title="中文译名待核">?</i>':""}${preIds.length?` <i class="qbadge lock" data-lockbadge style="${preLocked?"":"display:none"}" title="前置：${esc(preNames.join(" / "))}">前置未完成</i>`:""}</span>
          <span class="qmeta">${giver?`<span class="qgiver">${esc(giver)}</span>`:""}${it.d?`<span class="qdeadline">期限：${esc(it.d)}</span>`:""}</span>
          ${condText?`<span class="qcond">${esc(condText)}</span>`:""}
          <span class="qreward">奖励：${esc(rewardText)}</span>
          ${objText?`<span class="qobj">${esc(objText)}</span>`:""}
        </span>
      </label>`;
    }).join("");
    const grpDone=grp.items.filter(it=>isQuestDone(it.id)).length;
    body+=`<details class="qgroup"><summary><span class="qarea">${esc(grp.area)}</span><span class="qcnt${grpDone===grp.items.length?" full":""}" data-qcnt="${gi}">${grpDone} / ${grp.items.length}</span></summary><div class="qitems">${items}</div></details>`;
  });
  return `<div class="qhead">
    <div class="qstats"><b id="qdone">${done}</b><span>/ ${max} 可完成</span><span class="qmax">全 ${all.length} 条</span></div>
    <div class="qbar"><i id="qfill" style="width:${pct}%"></i></div>
    <div class="qnote">${all.length} 条任务：<b>${timed}</b> 条限时、<b>${pairIds.size}</b> 组二选一。单周目可完成 <b>${max}</b> 条（NS1 版 455）；二选一每完成一条，另一条自动锁定。</div>
  </div>
  <div class="qchips" id="qfilters">
    <button class="qchip on" data-qfilter="all">全部</button>
    <button class="qchip" data-qfilter="timed">限时</button>
    <button class="qchip" data-qfilter="exclusive">二选一</button>
    <button class="qchip" data-qfilter="undone">未完成</button>
    <button class="qchip" data-qfilter="done">已完成</button>
    <button class="qchip" data-qnext="1">下一个未完成</button>
    <button class="qchip sep" data-qexpand="1">展开全部</button>
    <button class="qchip" data-qexpand="0">收起全部</button>
  </div>
  <div id="qgroups">${body}</div>
  <p class="qfoot"><span class="star">?</span> 标记的 6 条是中文维基缺页或 NS2 新增，中文名与奖励名为暂拟，游戏内以实际显示为准。奖励列任务菜单里的金钱 / EXP / 评价 / 道具；道具名后的 [0]/[1]/[2] 是装备插槽数，第５性格等额外解锁标在奖励末尾，未标出的以游戏内为准。勾选「二选一」中的一条后，另一条会自动锁定；想换分支，先取消已勾的那条。带「前置未完成」的任务，完成前置后自动解锁。本表不含《相连的未来》的 43 个支线（均无时限、无二选一）。</p>`;
}

function fvSectionHTML(g){
  const root=g.fvQuests;
  const done=root.filter(it=>isQuestDone(it.id)).length;
  const items=root.map(it=>{
    const meta=[it.type,it.loc,it.g?"委托人 "+it.g:"",it.lv?"推荐 Lv"+it.lv:""].filter(Boolean).join(" · ");
    const reward=it.rw&&it.rw.length?it.rw.join(" · "):"无报酬";
    const pre=it.pre&&it.pre.length?`<span class="qcond">${esc(it.pre.join(" · "))}</span>`:"";
    const obj=it.o&&it.o.length?`<span class="qobj">目标：${esc(it.o.slice(0,4).join(" / "))}${it.o.length>4?" …":""}</span>`:"";
    const search=[it.n,it.type,it.loc,it.g,it.lv,it.pre&&it.pre.join(" "),it.o&&it.o.join(" "),reward].filter(Boolean).join(" ").toLowerCase();
    return `<label class="chk fitem" data-search="${esc(search)}">
      <input type="checkbox" data-fv="${esc(it.id)}" ${isQuestDone(it.id)?"checked":""}>
      <span class="qbody">
        <span class="qname">${esc(it.n)} <i class="qbadge s">${esc(it.type)}</i></span>
        <span class="qmeta">${esc(meta)}</span>
        ${pre}${obj}
        <span class="qreward">奖励：${esc(reward)}</span>
      </span>
    </label>`;
  }).join("");
  return `<div class="qhead">
    <div class="qstats"><b id="fvdone">${done}</b><span>/ ${root.length} 条</span><span class="qmax">不计入主任务统计</span></div>
    <div class="qnote">${g.fvMeta?.note||""}</div>
  </div>
  <details class="qgroup" open><summary><span class="qarea">相连的未来 · 支线</span><span class="qcnt">${root.length}</span></summary><div class="qitems">${items}</div></details>
  <p class="qfoot">${g.fvMeta?.foot||""}</p>`;
}

function bestiaryHTML(g){
  const all=g.bestiary.flatMap(grp=>grp.items);
  const fv=g.bestiary.find(x=>x.area==="巨神肩");
  const fvN=fv?fv.items.length:0;
  const body=g.bestiary.map(grp=>{
    const items=grp.items.map(it=>{
      const search=[it.n,grp.area,"Lv"+it.lv,"HP"+it.hp,...it.d].join(" ").toLowerCase();
      const chips=it.d.map(x=>{
        const k=x.split(" ")[0];
        return `<span class="dchip" data-k="${esc(k)}">${esc(x)}</span>`;
      }).join("");
      return `<div class="btem" data-search="${esc(search)}">
        <div class="bhead"><b>${esc(it.n)}</b><span class="qbadge lv">Lv ${it.lv}</span><span class="bhp">HP ${it.hp.toLocaleString()}</span></div>
        <div class="dchips">${chips}</div>
      </div>`;
    }).join("");
    return `<details class="qgroup"><summary><span class="qarea">${esc(grp.area)}</span><span class="qcnt">${grp.items.length} 只</span></summary><div class="qitems">${items}</div></details>`;
  }).join("");
  return `<div class="qhead">
    <div class="qstats"><b>${all.length}</b><span>只珍稀种</span><span class="qmax">本篇 ${all.length-fvN} · 相连的未来 ${fvN}</span></div>
    <div class="qnote">${g.bestiaryMeta?.note||""}</div>
  </div>
  <div id="bgroups">${body}</div>
  <p class="qfoot">${g.bestiaryMeta?.foot||""}</p>`;
}

function systemsHTML(g){
  return g.systems.map(sys=>{
    const cnt=sys.groups.reduce((n,x)=>n+x.items.length,0);
    const groups=sys.groups.map(grp=>{
      const items=grp.items.map(it=>{
        const search=[it.n,it.meta,it.desc,grp.t,sys.t].filter(Boolean).join(" ").toLowerCase();
        return `<div class="sitem" data-search="${esc(search)}"><b>${esc(it.n)}</b>${it.meta?`<span class="smeta">${esc(it.meta)}</span>`:""}${it.desc?`<span class="sdesc">${esc(it.desc)}</span>`:""}</div>`;
      }).join("");
      return `<details class="qgroup"><summary><span class="qarea">${esc(grp.t)}</span><span class="qcnt">${grp.items.length}</span></summary><div class="qitems">${items}</div></details>`;
    }).join("");
    return `<section class="sblock"><h3 class="ssec">${esc(sys.t)}<span>${cnt}</span></h3>${sys.note?`<p class="qnote">${esc(sys.note)}</p>`:""}${groups}</section>`;
  }).join("");
}

function affinityLevel(pts){
  return pts>=5000?"粉":pts>=3000?"紫":pts>=2000?"青":pts>=1000?"绿":"黄";
}

function bondsHTML(g){
  const meta=g.bondMeta||{};
  const all=g.bonds.flatMap(grp=>grp.items);
  const done=all.filter(it=>isBondDone(it.id)).length;
  const night=all.filter(it=>it.night).length;
  const pct=all.length?(done/all.length*100).toFixed(2):"0";
  const charList=meta.chars&&meta.chars.length?meta.chars:[...new Set(all.flatMap(it=>it.chars))];
  const levelList=["黄","绿","青","紫","粉"];
  const body=g.bonds.map((grp,gi)=>{
    const items=grp.items.map(it=>{
      const lv=affinityLevel(it.pts);
      const who=it.chars.join(" × ");
      const search=[it.n,grp.area,it.loc,who,...it.chars,lv,it.pts+"点",it.night?"仅夜间":"",it.unlock,it.req,it.alt,"牵绊对话","羁绊对话","羁绊任务"].filter(Boolean).join(" ").toLowerCase();
      return `<label class="chk qitem" data-search="${esc(search)}" data-bid="${esc(it.id)}" data-bchars="${esc(it.chars.join("|"))}" data-blv="${lv}"${it.night?' data-bnight="1"':""}>
        <input type="checkbox" data-b="${esc(it.id)}" ${isBondDone(it.id)?"checked":""}>
        <span class="qbody">
          <span class="qname">${esc(it.n)}${it.night?' <i class="qbadge night">仅夜间</i>':""}${it.alt?' <i class="qbadge v" title="有另一版本，见下方说明">另一版</i>':""}</span>
          <span class="qmeta"><span class="qgiver">${esc(who)}</span><span class="qdeadline">牵绊：${lv}（${it.pts}）</span>${it.req?`<span class="qdeadline">${esc(it.req)}</span>`:""}</span>
          <span class="qreward">${esc(it.loc)} · ${esc(it.unlock)}</span>
          ${it.alt?`<span class="qreward">${esc(it.alt)}</span>`:""}
        </span>
      </label>`;
    }).join("");
    const grpDone=grp.items.filter(it=>isBondDone(it.id)).length;
    return `<div class="bgroup" data-bgrp="${gi}">
      ${grp.warn?`<div class="warn"><b>易漏 / 时限</b>　${esc(grp.warn)}</div>`:""}
      <details class="qgroup"><summary><span class="qarea">${esc(grp.area)}</span><span class="qcnt${grpDone===grp.items.length?" full":""}" data-bcnt="${gi}">${grpDone} / ${grp.items.length}</span></summary><div class="qitems">${items}</div></details>
    </div>`;
  }).join("");
  return `<div class="qhead">
    <div class="qstats"><b id="bdone">${done}</b><span>/ ${all.length} 已看</span><span class="qmax">${g.bonds.length} 区域 · ${night} 条仅夜间</span></div>
    <div class="qbar"><i id="bfill" style="width:${pct}%"></i></div>
    <div class="qnote">${meta.note||""}</div>
  </div>
  <div class="qchips" id="bfilters">
    <button class="qchip on" data-bfilter="all">全部</button>
    <button class="qchip" data-bfilter="undone">未完成</button>
    <button class="qchip" data-bfilter="done">已完成</button>
    <button class="qchip" data-bfilter="night">仅夜间</button>
    <button class="qchip" data-bnext="1">下一个未完成</button>
    <button class="qchip sep" data-bexpand="1">展开全部</button>
    <button class="qchip" data-bexpand="0">收起全部</button>
  </div>
  <div class="qchips" id="bchars">
    <button class="qchip on" data-bchar="">全部角色</button>
    ${charList.map(c=>`<button class="qchip" data-bchar="${esc(c)}">${esc(c)}</button>`).join("")}
  </div>
  <div class="qchips" id="blevels">
    <button class="qchip on" data-blv="">全部等级</button>
    ${levelList.map(l=>`<button class="qchip" data-blv="${l}">${l}</button>`).join("")}
  </div>
  <div id="bgroups">${body}</div>
  <p class="qfoot">${meta.foot||""}</p>`;
}

function scheduleFlags(s,e){
  let day=false,night=false;
  for(let h=0;h<24;h++){
    const active=s===e||(s<e?(h>=s&&h<e):(h>=s||h<e));
    if(active){if(h>=6&&h<18)day=true;else night=true;}
  }
  return {day,night};
}

function questsByGiver(g){
  const map={};
  for(const grp of g.quests||[]) for(const q of grp.items){
    if(q.g)(map[q.g]??=[]).push(q.n);
  }
  return map;
}

function npcsHTML(g){
  const meta=g.npcMeta||{};
  const all=g.npcs.flatMap(grp=>grp.items);
  const done=all.filter(it=>isNpcDone(it.id)).length;
  const pct=all.length?(done/all.length*100).toFixed(2):"0";
  const presentAreas=new Set(g.npcs.flatMap(grp=>[grp.area,...grp.items.flatMap(it=>it.schedules.map(s=>s.a))]));
  const areaList=(meta.areas&&meta.areas.length?meta.areas:[...presentAreas]).filter(a=>presentAreas.has(a));
  for(const a of presentAreas) if(!areaList.includes(a)) areaList.push(a);
  const raceList=meta.races&&meta.races.length?meta.races:[...new Set(all.map(it=>it.race))];
  const qmap=questsByGiver(g);
  const body=g.npcs.map((grp,gi)=>{
    const items=grp.items.map(it=>{
      const quests=qmap[it.n]||[];
      const areas=[...new Set(it.schedules.map(s=>s.a))];
      const flags=it.schedules.map(s=>scheduleFlags(Number(s.t.split(":")[0]),Number(s.t.split("–")[1].split(":")[0])));
      const day=flags.some(f=>f.day),night=flags.some(f=>f.night);
      const jobs=(it.jobs||[]).join(" / ");
      const gifts=(it.gifts||[]).join(" / ");
      const tradeTop=(it.tradeTop||[]).join(" / ");
      const search=[it.n,it.race,it.sex,it.age+"岁",jobs,gifts,tradeTop,it.tradeCount?it.tradeCount+"件":"",it.tradeMax?"★"+it.tradeMax:"",...areas,...it.schedules.flatMap(s=>[s.a,s.l,s.t]),...quests,"NPC","NPC一览"].filter(Boolean).join(" ").toLowerCase();
      return `<label class="chk qitem" data-search="${esc(search)}" data-nid="${esc(it.id)}" data-nareas="${esc(areas.join("|"))}" data-nrace="${esc(it.race)}" data-nquest="${quests.length?"1":"0"}" data-ntrade="${it.tradeCount?"1":"0"}" data-nday="${day?"1":"0"}" data-nnight="${night?"1":"0"}">
        <input type="checkbox" data-n="${esc(it.id)}" ${isNpcDone(it.id)?"checked":""}>
        <span class="qbody">
          <span class="qname">${esc(it.n)}${it.variant?' <i class="qbadge v" title="含剧情/移民/任务分支状态，按当前进度取用">状态</i>':""}${quests.length?` <i class="qbadge s">任务 ${quests.length}</i>`:""}</span>
          <span class="qmeta"><span class="qgiver">${esc(it.race)} · ${esc(it.sex)} · ${it.age} 岁</span>${jobs?`<span class="qgiver">${esc(jobs)}</span>`:""}</span>
          ${it.schedules.map(s=>`<span class="qreward">${esc(s.a)} · ${esc(s.l)} · ${esc(s.t)}</span>`).join("")}
          ${gifts?`<span class="qreward">喜欢：${esc(gifts)}</span>`:""}
          ${it.tradeCount?`<span class="qreward">交易：${it.tradeCount} 件 · 最高 ★${it.tradeMax}${tradeTop?`（${esc(tradeTop)}）`:""}</span>`:""}
          ${quests.length?`<span class="qreward">任务：${esc(quests.join("、"))}</span>`:""}
        </span>
      </label>`;
    }).join("");
    const grpDone=grp.items.filter(it=>isNpcDone(it.id)).length;
    return `<details class="qgroup"><summary><span class="qarea">${esc(grp.area)}</span><span class="qcnt${grpDone===grp.items.length?" full":""}" data-ncnt="${gi}">${grpDone} / ${grp.items.length}</span></summary><div class="qitems">${items}</div></details>`;
  }).join("");
  return `<div class="qhead">
    <div class="qstats"><b id="ndone">${done}</b><span>/ ${all.length} 已登记</span><span class="qmax">${areaList.length} 个活动区域 · ${raceList.length} 种族</span></div>
    <div class="qbar"><i id="nfill" style="width:${pct}%"></i></div>
    <div class="qnote">${meta.note||""}</div>
  </div>
  <div class="qchips" id="nfilters">
    <button class="qchip on" data-nfilter="all">全部</button>
    <button class="qchip" data-nfilter="undone">未登记</button>
    <button class="qchip" data-nfilter="done">已登记</button>
    <button class="qchip" data-nfilter="quest">有任务</button>
    <button class="qchip" data-nfilter="trade">可交易</button>
    <button class="qchip" data-nnext="1">下一个未登记</button>
    <button class="qchip sep" data-nexpand="1">展开全部</button>
    <button class="qchip" data-nexpand="0">收起全部</button>
  </div>
  <div class="qchips" id="nareas">
    <button class="qchip on" data-narea="">全部区域</button>
    ${areaList.map(a=>`<button class="qchip" data-narea="${esc(a)}">${esc(a)}</button>`).join("")}
  </div>
  <div class="qchips" id="nraces">
    <button class="qchip on" data-nrace="">全部种族</button>
    ${raceList.map(r=>`<button class="qchip" data-nrace="${esc(r)}">${esc(r)}</button>`).join("")}
  </div>
  <div class="qchips" id="ntimes">
    <button class="qchip on" data-ntime="">全部时间</button>
    <button class="qchip" data-ntime="day">白天（6–18）</button>
    <button class="qchip" data-ntime="night">夜晚（18–6）</button>
  </div>
  <div id="ngroups">${body}</div>
  <p class="qfoot">${meta.foot||""}</p>`;
}

function tipsHTML(g){
  return `<div class="tipgrid">${g.tips.map(t=>{
    const txt=(t.t+" "+t.a).replace(/<[^>]+>/g," ").toLowerCase();
    return `<details class="tipcard" data-search="${esc(txt)}"><summary><h4>${esc(t.t)}</h4></summary><p>${t.a}</p></details>`;
  }).join("")}</div>`;
}

function itemSortAttrs(it){
  const a=it.a||"";
  const atk=a.match(/^攻 (\d+)–(\d+)/);
  const def=a.match(/^物防 (\d+) \/ 以太防 (\d+)/);
  const value=atk?Number(atk[2])*10000+Number(atk[1]):def?Number(def[1])+Number(def[2]):-1;
  return {ivalue:String(value),iprice:String(it.p??-1),iname:it.n,iarea:atk||def?"":a};
}
function compareItems(a,b,sort){
  const byName=()=>a.iname.localeCompare(b.iname,"zh-Hans-CN");
  if(sort==="name")return byName();
  if(sort==="price")return Number(b.iprice)-Number(a.iprice)||byName();
  return Number(b.ivalue)-Number(a.ivalue)||a.iarea.localeCompare(b.iarea,"zh-Hans-CN")||byName();
}
function applyItemSort(sort){
  itemSort=sort;
  document.querySelectorAll("#catalog .qitems").forEach(box=>{
    [...box.querySelectorAll(".citem")].sort((x,y)=>compareItems(x.dataset,y.dataset,sort)).forEach(el=>box.appendChild(el));
  });
  document.querySelectorAll("#isorts [data-isort]").forEach(b=>b.classList.toggle("on",b.dataset.isort===sort));
}

function favTags(it,g){
  return (it.l||[]).map(x=>{
    const en=g.itemsMeta?.favMap?.[x];
    return `<span class="ctag"${en?` title="${esc(en)}"`:""}>${esc(x)}</span>`;
  }).join("");
}
function favSearch(it,g){
  return (it.l||[]).flatMap(x=>[x,g.itemsMeta?.favMap?.[x]||""]);
}

function catalogHTML(g){
  const meta=g.catalogMeta;
  const unit=meta?.unit||"件";
  const all=g.catalog.flatMap(grp=>grp.items);
  const body=g.catalog.map((grp,gi)=>{
    const items=(meta?grp.items:[...grp.items].sort((x,y)=>compareItems(itemSortAttrs(x),itemSortAttrs(y),"value"))).map(it=>{
      const sa=itemSortAttrs(it);
      const cls=it.w?ARMOR_CLASS[it.w]:"";
      const search=[it.n,it.a,it.p?it.p+"G":"",grp.t,it.u,cls,...favSearch(it,g)].filter(Boolean).join(" ").toLowerCase();
      const meta=[it.u?`<span class="cuser">${esc(it.u)}</span>`:"",cls?`<span class="cuser">${cls}</span>`:"",it.p?`<span class="cprice">${it.p}G</span>`:"",it.a?esc(it.a):"",favTags(it,g)].filter(Boolean).join(" · ");
      return `<div class="citem" data-search="${esc(search)}" data-igroup="${esc(grp.t)}" data-ivalue="${sa.ivalue}" data-iprice="${sa.iprice}" data-iname="${esc(sa.iname)}" data-iarea="${esc(sa.iarea)}"${it.u?` data-iuser="${esc(it.u)}"`:""}${it.w?` data-iclass="${it.w}"`:""}><span class="cname">${esc(it.n)}<i class="qbadge v cneed">需技能</i></span><span class="cmeta">${meta}</span></div>`;
    }).join("");
    return `<details class="qgroup" data-igroup="${esc(grp.t)}"><summary><span class="qarea">${esc(grp.t)}</span><span class="qcnt" data-icnt="${gi}">${grp.items.length} ${esc(unit)}</span></summary><div class="qitems">${items}</div></details>`;
  }).join("");
  return `<div class="qhead">
    <div class="qstats"><b>${all.length}</b><span>${esc(meta?.stat||"件装备与收藏品")}</span><span class="qmax">按类型折叠</span></div>
    <div class="qnote">${meta?.note||"武器 / 防具 / 收藏品；素材与关键物品没有独立物品页，散落在任务报酬和殖民地6 清单里。装备行显示价格与基础数值，收藏品行显示区域与类别。"}</div>
  </div>
  <div class="qchips" id="ifilters">
    <button class="qchip on" data-ifilter="all">全部</button>
    ${(meta?.filters||["武器","防具","收藏品"]).map(f=>`<button class="qchip" data-ifilter="${esc(f)}">${esc(f)}</button>`).join("")}
    <button class="qchip sep" data-iexpand="1">展开全部</button>
    <button class="qchip" data-iexpand="0">收起全部</button>
  </div>
  ${meta?"":`<div class="qchips" id="isorts">
    <button class="qchip on" data-isort="value">按数值</button>
    <button class="qchip" data-isort="price">按价格</button>
    <button class="qchip" data-isort="name">按名称</button>
  </div>`}
  ${g.catalogUsers?`<div class="qchips" id="iusers">
    <button class="qchip on" data-iuser="">全部角色</button>
    ${g.catalogUsers.map(u=>`<button class="qchip" data-iuser="${esc(u.n)}">${esc(u.n)}</button>`).join("")}
  </div>
  <div class="qchips" id="iclasses">
    <button class="qchip on" data-iclass="">全部重量</button>
    ${Object.entries(ARMOR_CLASS).map(([k,v])=>`<button class="qchip" data-iclass="${k}">${v}</button>`).join("")}
  </div>
  <p class="qfoot" id="iusernote" hidden></p>`:""}
  <div id="igroups">${body}</div>
  <p class="qfoot">${meta?.foot||""}${meta?"":"物品名为官方中文；[0]/[1]/[2] 是装备插槽数。默认按数值从高到低：武器看最大攻击，防具看物防加以太防，收藏品按区域与类别。基础数值只列攻击/防御，宝珠、特性等细节以游戏内为准。"}${g.catalogUsers?"武器为角色专属。轻型防具全员可穿；中型只有修尔克、莱恩、卡露娜、丹邦一开始就能穿，其他角色和重型防具都要靠技能或技能连接解锁；机界防具仅菲奥伦可穿。标「需技能」的条目是否已解锁、具体能否装备以游戏内为准。":""}</p>`;
}

function itemsHTML(g){
  const meta=g.itemsMeta||{};
  const unit=meta.unit||"件";
  const all=g.items.flatMap(grp=>grp.items);
  const body=g.items.map((grp,gi)=>{
    const items=grp.items.map(it=>{
      const tags=favTags(it,g);
      const en=(it.en&&it.en!==it.n)?`<span class="cen">${esc(it.en)}</span>`:"";
      const raw=(it.en&&it.en===it.n)?` <i class="qbadge v" title="暂无可靠简中名">原名</i>`:"";
      const search=[it.n,it.en,it.a,grp.t,...(it.p||[]),...(it.w||[]),...favSearch(it,g)].filter(Boolean).join(" ").toLowerCase();
      return `<div class="citem" data-search="${esc(search)}" data-igroup="${esc(grp.t)}" data-places="${esc((it.p||[]).join("|"))}" data-ways="${esc((it.w||[]).join("|"))}"><span class="cname">${esc(it.n)}${en}${raw}</span><span class="cmeta">${it.a?esc(it.a):""}${tags?`<span class="ctags">${tags}</span>`:""}</span></div>`;
    }).join("");
    return `<details class="qgroup" data-igroup="${esc(grp.t)}"><summary><span class="qarea">${esc(grp.t)}</span><span class="qcnt">${grp.items.length} ${esc(unit)}</span></summary><div class="qitems">${items}</div></details>`;
  }).join("");
  return `<div class="qhead">
    <div class="qstats"><b>${all.length}</b><span>${esc(meta.stat||"件物品")}</span><span class="qmax">按类型折叠</span></div>
    <div class="qnote">${meta.note||""}</div>
  </div>
  <div class="qchips" id="ifilters2">
    <button class="qchip on" data-xfilter="all">全部</button>
    ${(meta.filters||[]).map(f=>`<button class="qchip" data-xfilter="${esc(f)}">${esc(f)}</button>`).join("")}
    <button class="qchip sep" data-xexpand="1">展开全部</button>
    <button class="qchip" data-xexpand="0">收起全部</button>
  </div>
  <div class="qchips" id="ifilters3">
    <button class="qchip on" data-pfilter="">全部地点</button>
    ${(meta.places||[]).map(f=>`<button class="qchip" data-pfilter="${esc(f)}">${esc(f)}</button>`).join("")}
  </div>
  <div class="qchips" id="ifilters4">
    <button class="qchip on" data-wfilter="">全部方式</button>
    ${(meta.ways||[]).map(f=>`<button class="qchip" data-wfilter="${esc(f)}">${esc(f)}</button>`).join("")}
  </div>
  <div id="xgroups">${body}</div>
  <p class="qfoot">${meta.foot||""}</p>`;
}

function itemUserAllows(el,u){
  if(!u)return {ok:true,need:false};
  const type=el.dataset.igroup||"",cls=el.dataset.iclass||"";
  if(type==="收藏品")return {ok:false,need:false};
  if(!cls)return {ok:el.dataset.iuser===u.n,need:false};
  if(!u.armor)return {ok:false,need:false};
  if(cls==="机")return {ok:!!u.mech,need:false};
  if(cls==="轻")return {ok:true,need:false};
  return {ok:true,need:!(cls==="中"&&u.medium)};
}

function applyItemFilter(filter){
  const root=$("#catalog"); if(!root)return;
  itemFilter=filter||"all";
  const user=(game().catalogUsers||[]).find(u=>u.n===itemUser)||null;
  const q=($("#search").value||"").trim().toLowerCase();
  const armor=new Set(["头部防具","身体防具","手臂防具","腰部防具","腿部防具"]);
  document.querySelectorAll("#catalog .citem").forEach(el=>{
    const type=el.dataset.igroup||"";
    let ok=true;
    if(itemFilter==="武器")ok=type==="武器";
    else if(itemFilter==="防具")ok=armor.has(type);
    else if(itemFilter==="收藏品")ok=type==="收藏品";
    else if(itemFilter!=="all")ok=type===itemFilter;
    const allow=itemUserAllows(el,user);
    if(ok)ok=allow.ok;
    if(ok&&itemClass)ok=el.dataset.iclass===itemClass;
    if(ok&&q)ok=el.dataset.search.includes(q);
    el.classList.toggle("hidden",!ok);
    el.classList.toggle("need",ok&&allow.need);
  });
  const narrowed=q||itemFilter!=="all"||itemUser||itemClass;
  document.querySelectorAll("#catalog details.qgroup").forEach(d=>{
    const any=[...d.querySelectorAll(".citem")].some(el=>!el.classList.contains("hidden"));
    d.classList.toggle("hidden",!any);
    if(narrowed&&any)d.open=true;
  });
  const any=document.querySelectorAll("#catalog .citem:not(.hidden)").length;
  let nr=document.getElementById("inores");
  if(!any&&narrowed){
    if(!nr){nr=document.createElement("div");nr.id="inores";nr.className="nores";nr.textContent="没有匹配的条目";$("#igroups").appendChild(nr);}
  }else if(nr)nr.remove();
  document.querySelectorAll("#ifilters [data-ifilter]").forEach(b=>b.classList.toggle("on",b.dataset.ifilter===itemFilter));
  document.querySelectorAll("#iusers [data-iuser]").forEach(b=>b.classList.toggle("on",b.dataset.iuser===itemUser));
  document.querySelectorAll("#iclasses [data-iclass]").forEach(b=>b.classList.toggle("on",b.dataset.iclass===itemClass));
  const note=$("#iusernote");
  if(note){
    const text=!user?"":!user.armor?`${user.n}只列专属武器；防具规则未核实，暂不列出。`:user.mech?"菲奥伦的机械身体除少数例外只能穿机界防具；其他防具能否装备以游戏内为准。":"";
    note.textContent=text;note.hidden=!text;
  }
}

function bindCatalogEvents(){
  const root=$("#catalog"); if(!root)return;
  root.addEventListener("click",e=>{
    const f=e.target.closest("[data-ifilter]");
    if(f){applyItemFilter(f.dataset.ifilter);return;}
    const s=e.target.closest("[data-isort]");
    if(s){applyItemSort(s.dataset.isort);return;}
    const u=e.target.closest("#iusers [data-iuser]");
    if(u){itemUser=u.dataset.iuser;applyItemFilter(itemFilter);return;}
    const c=e.target.closest("#iclasses [data-iclass]");
    if(c){itemClass=c.dataset.iclass;applyItemFilter(itemFilter);return;}
    const x=e.target.closest("[data-iexpand]");
    if(x){
      const open=x.dataset.iexpand==="1";
      root.querySelectorAll("details.qgroup").forEach(d=>{if(!d.classList.contains("hidden"))d.open=open;});
    }
  });
}

function applyItemsFilter(filter){
  const root=$("#items"); if(!root)return;
  itemsFilter=filter||"all";
  const q=($("#search").value||"").trim().toLowerCase();
  document.querySelectorAll("#items .citem").forEach(el=>{
    let ok=itemsFilter==="all"||el.dataset.igroup===itemsFilter;
    if(ok&&itemsPlace)ok=(el.dataset.places||"").split("|").includes(itemsPlace);
    if(ok&&itemsWay)ok=(el.dataset.ways||"").split("|").includes(itemsWay);
    if(ok&&q)ok=el.dataset.search.includes(q);
    el.classList.toggle("hidden",!ok);
  });
  const narrowed=q||itemsFilter!=="all"||itemsPlace||itemsWay;
  document.querySelectorAll("#items details.qgroup").forEach(d=>{
    const any=[...d.querySelectorAll(".citem")].some(el=>!el.classList.contains("hidden"));
    d.classList.toggle("hidden",!any);
    if(narrowed&&any)d.open=true;
  });
  const any=document.querySelectorAll("#items .citem:not(.hidden)").length;
  let nr=document.getElementById("inores");
  if(!any&&narrowed){
    if(!nr){nr=document.createElement("div");nr.id="inores";nr.className="nores";nr.textContent="没有匹配的条目";$("#xgroups").appendChild(nr);}
  }else if(nr)nr.remove();
  document.querySelectorAll("#ifilters2 [data-xfilter]").forEach(b=>b.classList.toggle("on",b.dataset.xfilter===itemsFilter));
  document.querySelectorAll("#ifilters3 [data-pfilter]").forEach(b=>b.classList.toggle("on",b.dataset.pfilter===itemsPlace));
  document.querySelectorAll("#ifilters4 [data-wfilter]").forEach(b=>b.classList.toggle("on",b.dataset.wfilter===itemsWay));
}

function bindItemsEvents(){
  const root=$("#items"); if(!root)return;
  root.addEventListener("click",e=>{
    const f=e.target.closest("[data-xfilter]");
    if(f){applyItemsFilter(f.dataset.xfilter);return;}
    const p=e.target.closest("#ifilters3 [data-pfilter]");
    if(p){itemsPlace=p.dataset.pfilter;applyItemsFilter(itemsFilter);return;}
    const w=e.target.closest("#ifilters4 [data-wfilter]");
    if(w){itemsWay=w.dataset.wfilter;applyItemsFilter(itemsFilter);return;}
    const x=e.target.closest("[data-xexpand]");
    if(x){
      const open=x.dataset.xexpand==="1";
      root.querySelectorAll("details.qgroup").forEach(d=>{if(!d.classList.contains("hidden"))d.open=open;});
    }
  });
}

function renderQuestProgress(){
  const g=game(); if(!g.quests)return;
  const all=g.quests.flatMap(grp=>grp.items);
  const pairIds=new Set(all.filter(it=>it.x).map(it=>it.x));
  const max=all.length-pairIds.size;
  const done=all.filter(it=>isQuestDone(it.id)).length;
  const pct=max?(Math.min(done,max)/max*100).toFixed(2):0;
  const el=$("#qdone"); if(el)el.textContent=done;
  const fill=$("#qfill"); if(fill)fill.style.width=pct+"%";
  const rt=$("#qptext"); if(rt)rt.textContent=done+" / "+max;
  const rf=$("#qfillrail"); if(rf)rf.style.width=pct+"%";
}

function updateQuestCounts(){
  const g=game(); if(!g.quests)return;
  document.querySelectorAll("#quests details.qgroup").forEach((d,gi)=>{
    const grp=g.quests[gi]; if(!grp)return;
    const done=grp.items.filter(it=>isQuestDone(it.id)).length;
    const c=d.querySelector("[data-qcnt]");
    if(c){c.textContent=done+" / "+grp.items.length;c.classList.toggle("full",done===grp.items.length);}
  });
}

function syncQuestLocks(){
  document.querySelectorAll("#quests .qitem").forEach(el=>{
    const self=el.dataset.qid;
    const other=el.dataset.qother;
    const prereq=(el.dataset.prereq||"").split(",").filter(Boolean);
    const pairLocked=!!other&&!isQuestDone(self)&&isQuestDone(other);
    const preLocked=prereq.length>0&&!isQuestDone(self)&&!prereq.some(x=>isQuestDone(x));
    const locked=pairLocked||preLocked;
    el.classList.toggle("locked",locked);
    el.dataset.lockreason=pairLocked?"exclusive":(preLocked?"prereq":"");
    const cb=el.querySelector("input[data-q]"); if(cb)cb.disabled=locked;
    const badge=el.querySelector("[data-lockbadge]");
    if(badge)badge.style.display=preLocked?"":"none";
  });
}

function applyQuestFilter(filter){
  const root=$("#quests"); if(!root)return;
  questFilter=filter||"all";
  const q=($("#search").value||"").trim().toLowerCase();
  document.querySelectorAll("#quests .qitem").forEach(el=>{
    const flags=el.dataset.qflags||"";
    const done=isQuestDone(el.dataset.qid);
    let ok=true;
    if(questFilter==="timed")ok=flags.includes("t");
    else if(questFilter==="exclusive")ok=flags.includes("x");
    else if(questFilter==="undone")ok=!done;
    else if(questFilter==="done")ok=done;
    if(ok&&q)ok=el.dataset.search.includes(q);
    el.classList.toggle("hidden",!ok);
  });
  document.querySelectorAll("#quests .fitem").forEach(el=>{
    const ok=!q||el.dataset.search.includes(q);
    el.classList.toggle("hidden",!ok);
  });
  document.querySelectorAll("#quests details.qgroup").forEach(d=>{
    const any=[...d.querySelectorAll(".qitem,.fitem")].some(el=>!el.classList.contains("hidden"));
    d.classList.toggle("hidden",!any);
    if((q||questFilter!=="all")&&any)d.open=true;
  });
  const any=document.querySelectorAll("#quests .qitem:not(.hidden),#quests .fitem:not(.hidden)").length;
  let nr=document.getElementById("qnores");
  if(!any&&(q||questFilter!=="all")){
    if(!nr){nr=document.createElement("div");nr.id="qnores";nr.className="nores";nr.textContent="没有匹配的任务，换个筛选或关键词";$("#qgroups").appendChild(nr);}
  }else if(nr)nr.remove();
  document.querySelectorAll("#qfilters [data-qfilter]").forEach(b=>b.classList.toggle("on",b.dataset.qfilter===questFilter));
}

function bindQuestEvents(){
  const root=$("#quests"); if(!root)return;
  root.addEventListener("change",e=>{
    const cb=e.target.closest("input[data-q]"); if(!cb)return;
    const id=cb.dataset.q;
    const other=cb.closest(".qitem")?.dataset.qother;
    const list=questList();
    if(cb.checked){
      list[String(id)]=1;
      if(other&&list[String(other)]){
        delete list[String(other)];
        const ocb=[...root.querySelectorAll("input[data-q]")].find(x=>x.dataset.q===String(other));
        if(ocb)ocb.checked=false;
      }
    }else delete list[String(id)];
    save();syncQuestLocks();renderQuestProgress();updateQuestCounts();applyQuestFilter(questFilter);
  });
  root.addEventListener("click",e=>{
    const f=e.target.closest("[data-qfilter]");
    if(f){applyQuestFilter(f.dataset.qfilter);return;}
    if(e.target.closest("[data-qnext]")){
      const next=[...root.querySelectorAll(".qitem:not(.hidden):not(.locked)")].find(el=>!isQuestDone(el.dataset.qid));
      if(next){next.closest("details").open=true;next.scrollIntoView({behavior:"smooth",block:"center"});}
      return;
    }
    const x=e.target.closest("[data-qexpand]");
    if(x){
      const open=x.dataset.qexpand==="1";
      root.querySelectorAll("details.qgroup").forEach(d=>{if(!d.classList.contains("hidden"))d.open=open;});
    }
  });
}

function bindFvEvents(){
  const root=$("#quests"); if(!root)return;
  root.querySelectorAll("input[data-fv]").forEach(cb=>{
    cb.onchange=()=>{
      const list=questList();
      if(cb.checked)list[cb.dataset.fv]=1;else delete list[cb.dataset.fv];
      save();
      const el=$("#fvdone");
      if(el)el.textContent=root.querySelectorAll("input[data-fv]:checked").length;
    };
  });
}

function renderBondProgress(){
  const g=game(); if(!g.bonds)return;
  const all=g.bonds.flatMap(grp=>grp.items);
  const done=all.filter(it=>isBondDone(it.id)).length;
  const pct=all.length?(done/all.length*100).toFixed(2):0;
  const el=$("#bdone"); if(el)el.textContent=done;
  const fill=$("#bfill"); if(fill)fill.style.width=pct+"%";
}

function updateBondCounts(){
  const g=game(); if(!g.bonds)return;
  document.querySelectorAll("#bonds details.qgroup").forEach((d,gi)=>{
    const grp=g.bonds[gi]; if(!grp)return;
    const done=grp.items.filter(it=>isBondDone(it.id)).length;
    const c=d.querySelector("[data-bcnt]");
    if(c){c.textContent=done+" / "+grp.items.length;c.classList.toggle("full",done===grp.items.length);}
  });
}

function applyBondFilter(filter){
  const root=$("#bonds"); if(!root)return;
  bondFilter=filter||"all";
  const q=($("#search").value||"").trim().toLowerCase();
  document.querySelectorAll("#bonds .qitem").forEach(el=>{
    const done=isBondDone(el.dataset.bid);
    let ok=true;
    if(bondFilter==="undone")ok=!done;
    else if(bondFilter==="done")ok=done;
    else if(bondFilter==="night")ok=!!el.dataset.bnight;
    if(ok&&bondChar)ok=(el.dataset.bchars||"").split("|").includes(bondChar);
    if(ok&&bondLv)ok=el.dataset.blv===bondLv;
    if(ok&&q)ok=el.dataset.search.includes(q);
    el.classList.toggle("hidden",!ok);
  });
  document.querySelectorAll("#bonds .bgroup").forEach(d=>{
    const any=[...d.querySelectorAll(".qitem")].some(el=>!el.classList.contains("hidden"));
    d.classList.toggle("hidden",!any);
    const det=d.querySelector("details.qgroup");
    if(det&&(q||bondFilter!=="all"||bondChar||bondLv)&&any)det.open=true;
  });
  const any=document.querySelectorAll("#bonds .qitem:not(.hidden)").length;
  let nr=document.getElementById("bnores");
  if(!any&&(q||bondFilter!=="all"||bondChar||bondLv)){
    if(!nr){nr=document.createElement("div");nr.id="bnores";nr.className="nores";nr.textContent="没有匹配的牵绊对话，换个筛选或关键词";$("#bgroups").appendChild(nr);}
  }else if(nr)nr.remove();
  document.querySelectorAll("#bfilters [data-bfilter]").forEach(b=>b.classList.toggle("on",b.dataset.bfilter===bondFilter));
  document.querySelectorAll("#bchars [data-bchar]").forEach(b=>b.classList.toggle("on",b.dataset.bchar===bondChar));
  document.querySelectorAll("#blevels [data-blv]").forEach(b=>b.classList.toggle("on",b.dataset.blv===bondLv));
}

function bindBondEvents(){
  const root=$("#bonds"); if(!root)return;
  root.addEventListener("change",e=>{
    const cb=e.target.closest("input[data-b]"); if(!cb)return;
    const list=bondList();
    if(cb.checked)list[String(cb.dataset.b)]=1;else delete list[String(cb.dataset.b)];
    save();renderBondProgress();updateBondCounts();applyBondFilter(bondFilter);
  });
  root.addEventListener("click",e=>{
    const f=e.target.closest("[data-bfilter]");
    if(f){applyBondFilter(f.dataset.bfilter);return;}
    const c=e.target.closest("#bchars [data-bchar]");
    if(c){bondChar=c.dataset.bchar;applyBondFilter(bondFilter);return;}
    const l=e.target.closest("#blevels [data-blv]");
    if(l){bondLv=l.dataset.blv;applyBondFilter(bondFilter);return;}
    if(e.target.closest("[data-bnext]")){
      const next=[...root.querySelectorAll(".qitem:not(.hidden)")].find(el=>!isBondDone(el.dataset.bid));
      if(next){next.closest("details").open=true;next.scrollIntoView({behavior:"smooth",block:"center"});}
      return;
    }
    const x=e.target.closest("[data-bexpand]");
    if(x){
      const open=x.dataset.bexpand==="1";
      root.querySelectorAll("details.qgroup").forEach(d=>{if(!d.closest(".bgroup").classList.contains("hidden"))d.open=open;});
    }
  });
}

function renderNpcProgress(){
  const g=game(); if(!g.npcs)return;
  const all=g.npcs.flatMap(grp=>grp.items);
  const done=all.filter(it=>isNpcDone(it.id)).length;
  const pct=all.length?(done/all.length*100).toFixed(2):0;
  const el=$("#ndone"); if(el)el.textContent=done;
  const fill=$("#nfill"); if(fill)fill.style.width=pct+"%";
}

function updateNpcCounts(){
  const g=game(); if(!g.npcs)return;
  document.querySelectorAll("#npcs details.qgroup").forEach((d,gi)=>{
    const grp=g.npcs[gi]; if(!grp)return;
    const done=grp.items.filter(it=>isNpcDone(it.id)).length;
    const c=d.querySelector("[data-ncnt]");
    if(c){c.textContent=done+" / "+grp.items.length;c.classList.toggle("full",done===grp.items.length);}
  });
}

function applyNpcFilter(filter){
  const root=$("#npcs"); if(!root)return;
  npcFilter=filter||"all";
  const q=($("#search").value||"").trim().toLowerCase();
  document.querySelectorAll("#npcs .qitem").forEach(el=>{
    const done=isNpcDone(el.dataset.nid);
    let ok=true;
    if(npcFilter==="undone")ok=!done;
    else if(npcFilter==="done")ok=done;
    else if(npcFilter==="quest")ok=el.dataset.nquest==="1";
    else if(npcFilter==="trade")ok=el.dataset.ntrade==="1";
    if(ok&&npcArea)ok=(el.dataset.nareas||"").split("|").includes(npcArea);
    if(ok&&npcRace)ok=el.dataset.nrace===npcRace;
    if(ok&&npcTime)ok=el.dataset["n"+npcTime]==="1";
    if(ok&&q)ok=el.dataset.search.includes(q);
    el.classList.toggle("hidden",!ok);
  });
  document.querySelectorAll("#npcs details.qgroup").forEach(d=>{
    const any=[...d.querySelectorAll(".qitem")].some(el=>!el.classList.contains("hidden"));
    d.classList.toggle("hidden",!any);
    if((q||npcFilter!=="all"||npcArea||npcRace||npcTime)&&any)d.open=true;
  });
  const any=document.querySelectorAll("#npcs .qitem:not(.hidden)").length;
  let nr=document.getElementById("nnores");
  if(!any&&(q||npcFilter!=="all"||npcArea||npcRace||npcTime)){
    if(!nr){nr=document.createElement("div");nr.id="nnores";nr.className="nores";nr.textContent="没有匹配的 NPC，换个筛选或关键词";$("#ngroups").appendChild(nr);}
  }else if(nr)nr.remove();
  document.querySelectorAll("#nfilters [data-nfilter]").forEach(b=>b.classList.toggle("on",b.dataset.nfilter===npcFilter));
  document.querySelectorAll("#nareas [data-narea]").forEach(b=>b.classList.toggle("on",b.dataset.narea===npcArea));
  document.querySelectorAll("#nraces [data-nrace]").forEach(b=>b.classList.toggle("on",b.dataset.nrace===npcRace));
  document.querySelectorAll("#ntimes [data-ntime]").forEach(b=>b.classList.toggle("on",b.dataset.ntime===npcTime));
}

function bindNpcEvents(){
  const root=$("#npcs"); if(!root)return;
  root.addEventListener("change",e=>{
    const cb=e.target.closest("input[data-n]"); if(!cb)return;
    const list=npcList();
    if(cb.checked)list[String(cb.dataset.n)]=1;else delete list[String(cb.dataset.n)];
    save();renderNpcProgress();updateNpcCounts();applyNpcFilter(npcFilter);
  });
  root.addEventListener("click",e=>{
    const f=e.target.closest("[data-nfilter]");
    if(f){applyNpcFilter(f.dataset.nfilter);return;}
    const a=e.target.closest("#nareas [data-narea]");
    if(a){npcArea=a.dataset.narea;applyNpcFilter(npcFilter);return;}
    const r=e.target.closest("#nraces [data-nrace]");
    if(r){npcRace=r.dataset.nrace;applyNpcFilter(npcFilter);return;}
    const t=e.target.closest("#ntimes [data-ntime]");
    if(t){npcTime=t.dataset.ntime;applyNpcFilter(npcFilter);return;}
    if(e.target.closest("[data-nnext]")){
      const next=[...root.querySelectorAll(".qitem:not(.hidden)")].find(el=>!isNpcDone(el.dataset.nid));
      if(next){next.closest("details").open=true;next.scrollIntoView({behavior:"smooth",block:"center"});}
      return;
    }
    const x=e.target.closest("[data-nexpand]");
    if(x){
      const open=x.dataset.nexpand==="1";
      root.querySelectorAll("details.qgroup").forEach(d=>{if(!d.classList.contains("hidden"))d.open=open;});
    }
  });
}

function build(){
  const g=game();
  questFilter="all";
  bondFilter="all";
  bondChar="";
  bondLv="";
  npcFilter="all";
  npcArea="";
  npcRace="";
  npcTime="";
  itemFilter="all";
  itemUser="";
  itemClass="";
  itemSort="value";
  document.body.dataset.game=g.id;
  $("#qpwrap").classList.toggle("hidden",!g.quests);
  const mt=document.querySelector('meta[name="theme-color"]');
  if(mt)mt.setAttribute("content",getComputedStyle(document.body).getPropertyValue("--bg").trim());
  renderTabs();renderToc();renderProgress();
  const firstUndone=g.chapters.find(c=>!isDone(c.id));
  $("#main").innerHTML=`
  <nav class="ptabs" id="ptabs">${panels(g).map(([id,label])=>`<button class="ptab" data-view="${id}">${label}</button>`).join("")}</nav>
  <div data-panel="flow">
  <div id="top">
    <section class="hero">
      <h1>${esc(g.title)}</h1>
      <div class="sub">${esc(g.sub)}</div>
      <div class="metas">${g.metas.map(m=>`<span class="meta">${m}</span>`).join("")}</div>
      <div class="intro">${g.intro.map(p=>`<p>${p}</p>`).join("")}</div>
      ${firstUndone?`<div class="next"><div style="flex:1"><div class="k">现在该做</div><b>第 ${firstUndone.n} 章 · ${esc(firstUndone.title)}</b></div></div>`:`<div class="next"><div style="flex:1"><b>全部章节已完成 · 去补收集吧</b></div></div>`}
    </section>
  </div>

  <h2 class="sec" id="flow">流程</h2>
  <div id="chapters">${g.chapters.length?g.chapters.map(c=>chapterHTML(c,g)).join(""):'<div class="nores">内容整理中…</div>'}</div>
  </div>

  ${g.quests?`<section id="quests" data-panel="quests"><h2 class="sec">全任务</h2>${questSectionHTML(g)}${g.fvQuests?fvSectionHTML(g):""}</section>`:""}
  ${g.bonds?`<section id="bonds" data-panel="bonds"><h2 class="sec">${esc(g.bondMeta?.title||"全牵绊对话")}</h2>${bondsHTML(g)}</section>`:""}
  ${g.npcs?`<section id="npcs" data-panel="npcs"><h2 class="sec">${esc(g.npcMeta?.title||"全 NPC 一览")}</h2>${npcsHTML(g)}</section>`:""}
  ${g.bestiary?`<section id="bestiary" data-panel="bestiary"><h2 class="sec">${esc(g.bestiaryMeta?.title||"珍稀种速查")}</h2>${bestiaryHTML(g)}</section>`:""}
  ${g.systems?`<section id="systems" data-panel="systems"><h2 class="sec">${esc(g.systemsMeta?.title||"系统速查")}</h2>${systemsHTML(g)}</section>`:""}

  <div data-panel="help">
  <h2 class="sec" id="help">卡关急救</h2>
  <div id="qas">${g.qa.length?g.qa.map(q=>{
      const t=(q.q+" "+q.a).toLowerCase();
      return `<details class="qa" data-search="${esc(t)}"><summary>${esc(q.q)}</summary><p>${q.a}</p></details>`;
    }).join(""):'<div class="nores">内容整理中…</div>'}</div>

  ${g.tips?`<section id="tips"><h2 class="sec">小技巧</h2>${tipsHTML(g)}</section>`:""}
  </div>
  ${g.catalog?`<section id="catalog" data-panel="catalog"><h2 class="sec">${esc(g.catalogMeta?.title||"全物品")}</h2>${catalogHTML(g)}</section>`:""}
  ${g.items?`<section id="items" data-panel="items"><h2 class="sec">${esc(g.itemsMeta?.title||"物品出处")}</h2>${itemsHTML(g)}</section>`:""}

  <div data-panel="collect">
  <h2 class="sec" id="collect">收集清单</h2>
  <div id="checks">${g.checks.length?g.checks.map((grp,gi)=>{
      const items=grp.items.map((it,i)=>{
        const k=gid()+"-"+gi+"-"+i;
        const on=!!(state.checks[gid()]&&state.checks[gid()][k]);
        return `<label class="chk" data-search="${esc(it.toLowerCase())}"><input type="checkbox" data-chk="${k}" ${on?"checked":""}><span>${esc(it)}</span></label>`;
      }).join("");
      return `<div class="cgroup"><h4>${esc(grp.t)}<span data-cnt="${gi}"></span></h4>${items}</div>`;
    }).join(""):'<div class="nores">内容整理中…</div>'}</div>
  </div>

  <div data-panel="boss">
  <h2 class="sec" id="boss">${esc(g.bossMeta?.title||"Boss 速查")}</h2>
  <div id="bosses">${g.bosses.length?g.bosses.map(b=>`<div class="card"><div class="bossrow" data-search="${esc((b.n+" "+b.s+" "+b.t).toLowerCase())}"><div class="bn">${esc(b.n)}<small>${esc(b.s)}</small></div><div class="bt">${b.t}</div></div></div>`).join(""):'<div class="nores">内容整理中…</div>'}</div>
  </div>
  `;
  $("#ptabs").querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{
    $("#search").value="";applySearch("");showPanel(b.dataset.view);window.scrollTo({top:$("#main").offsetTop});
  });
  showPanel(state.views[g.id]||"flow",false);

  // 章节折叠
  $("#chapters").querySelectorAll(".chead").forEach(hd=>{
    hd.onclick=e=>{
      if(e.target.closest("[data-done]"))return;
      hd.parentElement.classList.toggle("open");
    };
  });
  // 完成标记
  $("#chapters").addEventListener("click",e=>{
    const a=e.target.closest(".xref");
    if(a){e.preventDefault();xrefJump(a.dataset.xref,a.dataset.q);}
  });
  $("#chapters").querySelectorAll("[data-done]").forEach(btn=>{
    btn.onclick=e=>{
      e.stopPropagation();
      const id=btn.dataset.done,list=doneList(),i=list.indexOf(id);
      if(i>=0)list.splice(i,1);else list.push(id);
      save();
      btn.closest(".chapter").classList.toggle("done",isDone(id));
      btn.setAttribute("aria-pressed",isDone(id));
      renderProgress();renderToc();updateNext();
    };
  });
  // 默认展开第一个未完成
  if(firstUndone){const el=document.getElementById("ch-"+firstUndone.id);if(el)el.classList.add("open");}
  // 勾选
  $("#checks").querySelectorAll("input[data-chk]").forEach(cb=>{
    cb.onchange=()=>{
      const g2=state.checks[gid()]||(state.checks[gid()]={});
      if(cb.checked)g2[cb.dataset.chk]=1;else delete g2[cb.dataset.chk];
      save();updateCounts();
    };
  });
  updateCounts();
  bindQuestEvents();
  syncQuestLocks();
  bindFvEvents();
  bindBondEvents();
  bindNpcEvents();
  bindCatalogEvents();
  bindItemsEvents();
  renderQuestProgress();
  renderBondProgress();
  renderNpcProgress();
  updateQuestCounts();
  updateBondCounts();
  updateNpcCounts();
  applySearch($("#search").value);
}

function updateNext(){
  const g=game(), el=document.querySelector(".next"); if(!el)return;
  const c=g.chapters.find(x=>!isDone(x.id));
  el.innerHTML = c
    ? `<div style="flex:1"><div class="k">现在该做</div><b>第 ${c.n} 章 · ${esc(c.title)}</b></div>`
    : `<div style="flex:1"><b>全部章节已完成 · 去补收集吧</b></div>`;
}

function updateCounts(){
  const g=game();
  document.querySelectorAll(".cgroup").forEach((el,gi)=>{
    const boxes=el.querySelectorAll("input[data-chk]");
    const on=[...boxes].filter(b=>b.checked).length;
    const c=el.querySelector("[data-cnt]");
    if(c)c.textContent=on+" / "+boxes.length;
    el.querySelector("h4").classList.toggle("full",on===boxes.length&&boxes.length>0);
  });
}

function applySearch(q){
  q=(q||"").trim().toLowerCase();
  const nodes=document.querySelectorAll("[data-search]");
  let hits=0;
  nodes.forEach(n=>{
    if(n.closest("#quests")||n.closest("#bonds")||n.closest("#npcs")||n.closest("#catalog")||n.closest("#items"))return;
    const ok=!q||n.dataset.search.includes(q);
    n.classList.toggle("hidden",!ok);
    if(ok&&q)hits++;
  });
  document.querySelectorAll(".chapter").forEach(c=>{
    const ok=!q||!c.classList.contains("hidden");
    if(q&&ok)c.classList.add("open");
  });
  ["#qas","#checks"].forEach(sel=>{
    document.querySelectorAll(sel+" [data-search]").forEach(n=>{
      if(n.classList.contains("hidden"))n.style.display="none";else n.style.display="";
    });
  });
  applyQuestFilter(questFilter);
  applyBondFilter(bondFilter);
  applyNpcFilter(npcFilter);
  applyItemFilter(itemFilter);
  applyItemsFilter(itemsFilter);
  const qhits=document.querySelectorAll("#quests .qitem:not(.hidden)").length;
  const bhits=document.querySelectorAll("#bonds .qitem:not(.hidden)").length;
  const nhits=document.querySelectorAll("#npcs .qitem:not(.hidden)").length;
  const ihits=document.querySelectorAll("#catalog .citem:not(.hidden)").length;
  const xhits=document.querySelectorAll("#items .citem:not(.hidden)").length;
  document.querySelectorAll("details.qa,details.tipcard").forEach(d=>{d.open=!!q&&!d.classList.contains("hidden");});
  document.querySelectorAll("#bestiary details.qgroup,#systems details.qgroup").forEach(d=>{
    const any=[...d.querySelectorAll("[data-search]")].some(el=>!el.classList.contains("hidden"));
    d.classList.toggle("hidden",!any);
    if(q&&any)d.open=true;
  });
  document.querySelectorAll("#main [data-panel]").forEach(p=>{
    if(q)p.classList.toggle("hidden",!p.querySelector("[data-search]:not(.hidden)"));
  });
  if(!q&&$("#ptabs"))showPanel(state.views[gid()]||"flow",false);
  document.querySelectorAll("#ptabs [data-view]").forEach(b=>{
    if(q)b.classList.toggle("on",!!document.querySelector(`#main [data-panel="${b.dataset.view}"]:not(.hidden)`));
  });
  let nr=$("#nores");
  if(q&&!hits&&!qhits&&!bhits&&!nhits&&!ihits&&!xhits){
    if(!nr){nr=document.createElement("div");nr.id="nores";nr.className="nores";nr.textContent="没有匹配，换个词试试";$("#main").appendChild(nr);}
  }else if(nr){nr.remove();}
}

$("#search").addEventListener("input",e=>applySearch(e.target.value));
build();
