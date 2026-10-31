/* =========================================================
   数据
   ========================================================= */
const GAMES = (window.RETRO_GAME_IDS || []).map((id) => (window.RETRO_GAMES || {})[id]).filter(Boolean);

/* =========================================================
   状态
   ========================================================= */
const KEY="retroGuide.v1";
let state={game:"minish",done:{},checks:{},quests:{}};
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
if(!state.views)state.views={};
let questFilter="all";
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
const ARMOR_CLASS={"轻":"轻型","中":"中型","重":"重型","机":"机界"};
function panels(g){
  return [["flow","流程"],...(g.quests?[["quests","任务"]]:[]),["help",g.tips?"急救与技巧":"急救"],...(g.catalog?[["catalog",g.catalogMeta?.tab||"物品"]]:[]),...(g.items?[["items",g.itemsMeta?.tab||"物品"]]:[]),["collect","收集"],["boss",g.bossMeta?.tab||"Boss"]];
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

function questSectionHTML(g){
  const all=g.quests.flatMap(grp=>grp.items);
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
      const locked=!!other&&!isQuestDone(it.id)&&isQuestDone(other.id);
      const flags=[it.t?"t":"",it.x?"x":"",it.s?"s":"",it.ns2?"ns2":""].filter(Boolean).join(" ");
      const giver=it.s?"剧情任务":it.g;
      const reward=[];
      if(it.m)reward.push(it.m+"G");
      if(it.e)reward.push(it.e+"EXP");
      if(it.f)reward.push("评价+"+it.f);
      if(it.rw&&it.rw.length)reward.push(...it.rw);
      const rewardText=reward.length?reward.join(" · "):(it.s?"剧情任务，无报酬":"无报酬");
      const search=[it.n,giver,grp.area,it.d,rewardText,it.t?"限时":"",it.x?"二选一":"",it.s?"剧情":"",it.ns2?"NS2":""].filter(Boolean).join(" ").toLowerCase();
      return `<label class="chk qitem ${locked?"locked":""}" data-search="${esc(search)}" data-qid="${esc(String(it.id))}" data-qflags="${flags}"${other?` data-qother="${esc(String(other.id))}"`:""}>
        <input type="checkbox" data-q="${esc(String(it.id))}" ${isQuestDone(it.id)?"checked":""} ${locked?"disabled":""}>
        <span class="qbody">
          <span class="qname">${esc(it.n)}${it.t?' <i class="qbadge t">限时</i>':""}${it.x?' <i class="qbadge x">二选一</i>':""}${it.s?' <i class="qbadge s">剧情</i>':""}${it.ns2?' <i class="qbadge ns2">NS2</i>':""}${it.v?' <i class="qbadge v" title="中文译名待核">?</i>':""}</span>
          <span class="qmeta">${giver?`<span class="qgiver">${esc(giver)}</span>`:""}${it.d?`<span class="qdeadline">期限：${esc(it.d)}</span>`:""}</span>
          <span class="qreward">奖励：${esc(rewardText)}</span>
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
  <p class="qfoot"><span class="star">?</span> 标记的 6 条是中文维基缺页或 NS2 新增，中文名与奖励名为暂拟，游戏内以实际显示为准。奖励列任务菜单里的金钱 / EXP / 评价 / 道具；道具名后的 [0]/[1]/[2] 是装备插槽数，第５性格等额外解锁标在奖励末尾，未标出的以游戏内为准。勾选「二选一」中的一条后，另一条会自动锁定；想换分支，先取消已勾的那条。本表不含《相连的未来》的 43 个支线（均无时限、无二选一）。</p>`;
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
    const other=el.dataset.qother; if(!other)return;
    const self=el.dataset.qid;
    const locked=!isQuestDone(self)&&isQuestDone(other);
    el.classList.toggle("locked",locked);
    const cb=el.querySelector("input[data-q]"); if(cb)cb.disabled=locked;
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
  document.querySelectorAll("#quests details.qgroup").forEach(d=>{
    const any=[...d.querySelectorAll(".qitem")].some(el=>!el.classList.contains("hidden"));
    d.classList.toggle("hidden",!any);
    if((q||questFilter!=="all")&&any)d.open=true;
  });
  const any=document.querySelectorAll("#quests .qitem:not(.hidden)").length;
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

function build(){
  const g=game();
  questFilter="all";
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

  ${g.quests?`<section id="quests" data-panel="quests"><h2 class="sec">全任务</h2>${questSectionHTML(g)}</section>`:""}

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
  bindCatalogEvents();
  bindItemsEvents();
  renderQuestProgress();
  updateQuestCounts();
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
    if(n.closest("#quests")||n.closest("#catalog")||n.closest("#items"))return;
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
  applyItemFilter(itemFilter);
  applyItemsFilter(itemsFilter);
  const qhits=document.querySelectorAll("#quests .qitem:not(.hidden)").length;
  const ihits=document.querySelectorAll("#catalog .citem:not(.hidden)").length;
  const xhits=document.querySelectorAll("#items .citem:not(.hidden)").length;
  document.querySelectorAll("details.qa,details.tipcard").forEach(d=>{d.open=!!q&&!d.classList.contains("hidden");});
  document.querySelectorAll("#main [data-panel]").forEach(p=>{
    if(q)p.classList.toggle("hidden",!p.querySelector("[data-search]:not(.hidden)"));
  });
  if(!q&&$("#ptabs"))showPanel(state.views[gid()]||"flow",false);
  document.querySelectorAll("#ptabs [data-view]").forEach(b=>{
    if(q)b.classList.toggle("on",!!document.querySelector(`#main [data-panel="${b.dataset.view}"]:not(.hidden)`));
  });
  let nr=$("#nores");
  if(q&&!hits&&!qhits&&!ihits&&!xhits){
    if(!nr){nr=document.createElement("div");nr.id="nores";nr.className="nores";nr.textContent="没有匹配，换个词试试";$("#main").appendChild(nr);}
  }else if(nr){nr.remove();}
}

$("#search").addEventListener("input",e=>applySearch(e.target.value));
build();
