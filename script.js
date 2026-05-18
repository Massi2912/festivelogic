/* ── DATA ── */
function saveData(){localStorage.setItem('fl_contacts',JSON.stringify(contacts));}
function loadData(){try{const c=localStorage.getItem('fl_contacts');if(c)contacts=JSON.parse(c);}catch(e){contacts=[];}}
let contacts=[];loadData();
let calYear=new Date().getFullYear();
let calMonth=new Date().getMonth();
let sortAsc=true,searchQuery='',activeCategory='',activeGift='',editingId=null;

const catColors={Familie:'b-rose',Freunde:'b-lilac',Arbeit:'b-gold',Bekannte:'b-muted'};
const catDots={Familie:'var(--rose)',Freunde:'var(--lilac)',Arbeit:'var(--gold2)',Bekannte:'var(--text3)'};
const pageTitles={dashboard:'Dashboard',contacts:'Kontakte',add:'Hinzufügen'};
const MONTH_NAMES=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const MONTH_SHORT=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

/* ── NAVIGATE ── */
function navigate(page){
  document.querySelectorAll('[data-page]').forEach(el=>el.classList.remove('active'));
  document.querySelector('[data-page="'+page+'"]').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.nav===page));
  document.querySelectorAll('.mob-item').forEach(el=>el.classList.toggle('active',el.id==='mob-'+page));
  document.getElementById('page-title').textContent=pageTitles[page]||'';
  if(page==='contacts')renderContacts();
  if(page==='dashboard')renderDashboard();
  document.getElementById('sidebar').classList.remove('mob-open');
  return false;
}

/* ── HELPERS ── */
function daysUntil(s){
  const t=new Date();t.setHours(0,0,0,0);
  const b=new Date(s);
  const n=new Date(t.getFullYear(),b.getMonth(),b.getDate());
  if(n<t)n.setFullYear(t.getFullYear()+1);
  return Math.round((n-t)/86400000);
}
function formatDate(s){
  const d=new Date(s);return d.getDate()+'. '+MONTH_SHORT[d.getMonth()];
}
function calcAge(s){
  const b=new Date(s),t=new Date();
  let a=t.getFullYear()-b.getFullYear();
  if(t.getMonth()-b.getMonth()<0||(t.getMonth()-b.getMonth()===0&&t.getDate()<b.getDate()))a--;
  return a;
}

/* ── WELCOME DOTS (decorative confetti) ── */
function drawWelcomeDots(){
  const c=document.getElementById('welcome-dots');
  if(!c)return;
  const colors=['var(--rose)','var(--gold2)','var(--lilac)','var(--green)','var(--teal)'];
  let html='';
  for(let i=0;i<18;i++){
    const x=Math.random()*100,y=Math.random()*100;
    const s=Math.random()*6+3;
    const col=colors[Math.floor(Math.random()*colors.length)];
    const op=Math.random()*0.35+0.1;
    html+=`<div class="welcome-dot" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;background:${col};opacity:${op}"></div>`;
  }
  c.innerHTML=html;
}

/* ── RING PROGRESS SVG ── */
function buildRingHTML(initials,photo,daysLeft){
  const R=22,C=2*Math.PI*R,total=365;
  const pct=Math.max(0,Math.min(1,(total-daysLeft)/total));
  const offset=C*(1-pct);
  const ringColor=daysLeft===0?'var(--rose)':daysLeft<=7?'var(--gold2)':'var(--lilac)';
  const inner=photo
    ?`<img src="${photo}" alt=""/>`
    :`<span>${initials}</span>`;
  return `<div class="bday-ring">
    <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
      <circle class="ring-track" cx="26" cy="26" r="${R}"/>
      <circle class="ring-fill" cx="26" cy="26" r="${R}"
        stroke="${ringColor}"
        stroke-dasharray="${C}"
        stroke-dashoffset="${offset}"/>
    </svg>
    <div class="bday-ring-inner">${inner}</div>
  </div>`;
}

/* ── DASHBOARD ── */
function renderDashboard(){renderStats();renderBirthdayCards();renderCalendar();renderUpcoming();renderGiftProgress();drawWelcomeDots();}

function renderStats(){
  const t=new Date();t.setHours(0,0,0,0);
  const mo=contacts.filter(c=>new Date(c.birthday).getMonth()===t.getMonth()).length;
  const ready=contacts.filter(c=>c.gift==='Besorgt').length;
  document.getElementById('stats-row').innerHTML=`
    <div class="stat-card rose-card"><div class="stat-icon rose"><span class="icon icon-f">group</span></div><div><div class="stat-val">${contacts.length}</div><div class="stat-lbl">Kontakte</div></div></div>
    <div class="stat-card gold-card"><div class="stat-icon gold"><span class="icon icon-f">cake</span></div><div><div class="stat-val">${mo}</div><div class="stat-lbl">Diesen Monat</div></div></div>
    <div class="stat-card green-card"><div class="stat-icon green"><span class="icon icon-f">redeem</span></div><div><div class="stat-val">${ready}</div><div class="stat-lbl">Geschenke bereit</div></div></div>`;
}

function renderGiftProgress(){
  const sec=document.getElementById('gift-progress-section');
  if(!contacts.length){sec.innerHTML='';return;}
  const total=contacts.length;
  const ready=contacts.filter(c=>c.gift==='Besorgt').length;
  const pct=Math.round((ready/total)*100);
  sec.innerHTML=`<div class="card" style="padding:18px 20px">
    <div class="gift-progress-wrap">
      <div class="gift-progress-lbl">
        <span>Geschenke-Fortschritt</span>
        <span style="color:var(--text2);font-weight:700">${ready} / ${total}</span>
      </div>
      <div class="gift-bar"><div class="gift-bar-fill" style="width:${pct}%"></div></div>
      <div style="margin-top:8px;font-size:12px;color:var(--text3)">${pct}% aller Geschenke sind bereit</div>
    </div>
  </div>`;
}

function renderUpcoming(){
  const ul=document.getElementById('upcoming-list');
  if(!ul)return;
  if(!contacts.length){ul.innerHTML='<div style="padding:16px;font-size:13px;color:var(--text3)">Keine Einträge.</div>';return;}
  const sorted=contacts.slice().sort((a,b)=>daysUntil(a.birthday)-daysUntil(b.birthday)).slice(0,4);
  ul.innerHTML=sorted.map(ct=>{
    const d=daysUntil(ct.birthday);
    const bd=new Date(ct.birthday);
    return `<div class="timeline-item">
      <div class="tl-date">
        <div class="tl-day">${bd.getDate()}</div>
        <div class="tl-mon">${MONTH_SHORT[bd.getMonth()]}</div>
      </div>
      <div style="flex:1">
        <div style="font-size:13.5px;font-weight:600;color:var(--text)">${ct.name}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:2px">Wird ${calcAge(ct.birthday)+1} · ${d===0?'<span style="color:var(--rose);font-weight:700">Heute!</span>':'in '+d+' T.'}</div>
      </div>
      <span class="badge ${d===0?'b-rose':d<=7?'b-gold':'b-muted'}">${d===0?'🎉':''+d+'d'}</span>
    </div>`;
  }).join('');
}

function renderBirthdayCards(){
  const c=document.getElementById('birthday-cards');
  if(contacts.length===0){
    c.innerHTML='<div class="empty" style="grid-column:span 2"><span class="icon">cake</span><h3>Noch keine Einträge</h3><p>Füge deinen ersten Geburtstag hinzu!</p><button class="btn btn-primary" style="margin-top:8px" onclick="navigate(\'add\')"><span class="icon">add</span>Jetzt hinzufügen</button></div>';
    return;
  }
  const sorted=contacts.slice().sort((a,b)=>daysUntil(a.birthday)-daysUntil(b.birthday)).slice(0,3);
  const cards=sorted.map(ct=>{
    const d=daysUntil(ct.birthday);
    const urgent=d<=7;
    const isToday=d===0;
    const lbl=isToday?'Heute 🎉':'In '+d+(d===1?' Tag':' Tagen');
    const tc=isToday?'b-rose':urgent?'b-gold':'b-muted';
    const init=ct.initials||ct.name.split(' ').map(w=>w[0]).join('').toUpperCase();
    return `<div class="bday-card ${isToday?'today-bd':urgent?'urgent':''}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        ${buildRingHTML(init,ct.photo,d)}
        <span class="badge ${tc}">${lbl}</span>
      </div>
      <div class="bday-name">${ct.name}</div>
      <div class="bday-age">Wird ${calcAge(ct.birthday)+1} · ${formatDate(ct.birthday)}</div>
      <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
        <span class="badge ${catColors[ct.category]||'b-muted'}">${ct.category}</span>
        <span class="badge ${ct.gift==='Besorgt'?'b-green':ct.gift==='Kein Geschenk'?'b-muted':'b-red'}">${ct.gift||'Idee nötig'}</span>
      </div>
    </div>`;
  });
  cards.push('<div class="add-card" onclick="navigate(\'add\')"><span class="icon">add_circle</span><span>Neuen Kontakt<br>hinzufügen</span></div>');
  c.innerHTML=cards.join('');
}

/* ── CALENDAR ── */
function renderCalendar(){
  const today=new Date();
  const todayY=today.getFullYear(),todayM=today.getMonth(),todayD=today.getDate();
  document.getElementById('cal-month-label').textContent=MONTH_NAMES[calMonth]+' '+calYear;
  const bdMap={};
  contacts.forEach(c=>{
    if(!c.birthday)return;
    const b=new Date(c.birthday);
    if(b.getMonth()===calMonth){
      const d=b.getDate();
      if(!bdMap[d])bdMap[d]=[];
      bdMap[d].push(c.name);
    }
  });
  const firstDow=(new Date(calYear,calMonth,1).getDay()+6)%7;
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const daysInPrev=new Date(calYear,calMonth,0).getDate();
  let html='';
  for(let i=0;i<firstDow;i++){
    const d=daysInPrev-firstDow+i+1;
    html+='<div class="cal-day other-month"><span class="cal-num">'+d+'</span><span class="cal-dot"></span></div>';
  }
  for(let d=1;d<=daysInMonth;d++){
    const isToday=(d===todayD&&calMonth===todayM&&calYear===todayY);
    const hasBd=!!bdMap[d];
    const cls='cal-day'+(isToday?' today':'')+(hasBd?' has-event clickable':'');
    const dataA=hasBd?' data-names="'+encodeURIComponent(JSON.stringify(bdMap[d]))+'" data-day="'+d+'"':'';
    const oc=hasBd?' onclick="onCalDayClick(event,this)"':'';
    html+='<div class="'+cls+'"'+dataA+oc+'><span class="cal-num">'+d+'</span><span class="cal-dot"></span></div>';
  }
  const trailing=(7-(firstDow+daysInMonth)%7)%7;
  for(let i=1;i<=trailing;i++){
    html+='<div class="cal-day other-month"><span class="cal-num">'+i+'</span><span class="cal-dot"></span></div>';
  }
  document.getElementById('cal-grid').innerHTML=html;
}

let _popupAnchor=null;
function onCalDayClick(evt,el){
  evt.stopPropagation();
  const popup=document.getElementById('cal-popup');
  if(_popupAnchor===el){hideCalPopup();return;}
  _popupAnchor=el;
  const day=parseInt(el.dataset.day);
  const names=JSON.parse(decodeURIComponent(el.dataset.names));
  popup.innerHTML='<div class="cal-popup-date">'+day+'. '+MONTH_NAMES[calMonth]+'</div>'+
    names.map(n=>'<div class="cal-popup-person"><span class="icon">cake</span>'+n+'</div>').join('');
  popup.style.display='block';
  const r=el.getBoundingClientRect(),pw=popup.offsetWidth||180,ph=popup.offsetHeight||80;
  let left=r.left+r.width/2-pw/2;
  let top=r.bottom+6;
  if(left+pw>window.innerWidth-8)left=window.innerWidth-pw-8;
  if(left<8)left=8;
  if(top+ph>window.innerHeight-8)top=r.top-ph-6;
  popup.style.left=left+'px';popup.style.top=top+'px';
}
function hideCalPopup(){document.getElementById('cal-popup').style.display='none';_popupAnchor=null;}
document.addEventListener('click',function(e){
  const p=document.getElementById('cal-popup');
  if(p&&p.style.display!=='none'&&!p.contains(e.target)&&e.target!==_popupAnchor)hideCalPopup();
});
function changeMonth(delta){
  calMonth+=delta;
  if(calMonth>11){calMonth=0;calYear++;}
  else if(calMonth<0){calMonth=11;calYear--;}
  hideCalPopup();renderCalendar();
}

/* ── CONTACTS TABLE ── */
function renderContacts(q){
  if(q!==undefined)searchQuery=q;
  let f=contacts.filter(c=>
    (c.name.toLowerCase().includes(searchQuery.toLowerCase())||c.category.toLowerCase().includes(searchQuery.toLowerCase()))&&
    (activeCategory===''||c.category===activeCategory)&&
    (activeGift===''||(c.gift||'Idee nötig')===activeGift)
  );
  if(sortAsc)f.sort((a,b)=>a.name.localeCompare(b.name));
  else f.sort((a,b)=>b.name.localeCompare(a.name));
  document.getElementById('contacts-count').textContent=f.length+' von '+contacts.length+' Kontakten';
  const tb=document.getElementById('contacts-table');
  if(!f.length){
    tb.innerHTML='<tr><td colspan="6"><div class="empty"><span class="icon">group</span><h3>'+(contacts.length===0?'Noch keine Kontakte':'Keine Treffer')+'</h3><p>'+(contacts.length===0?'Füge deinen ersten Kontakt hinzu.':'Versuche andere Suchbegriffe.')+'</p>'+(contacts.length===0?'<button class="btn btn-primary" style="margin-top:8px" onclick="navigate(\'add\')"><span class="icon">add</span>Hinzufügen</button>':'')+'</div></td></tr>';
    return;
  }
  tb.innerHTML=f.map(c=>{
    const bd=new Date(c.birthday);
    const bdS=bd.getDate().toString().padStart(2,'0')+'. '+MONTH_SHORT[bd.getMonth()]+' '+bd.getFullYear();
    const init=c.initials||c.name.split(' ').map(w=>w[0]).join('').toUpperCase();
    const gc=c.gift==='Besorgt'?'b-green':c.gift==='Kein Geschenk'?'b-muted':'b-red';
    const dot=catDots[c.category]||'var(--text3)';
    const av=c.photo?'<img src="'+c.photo+'" alt=""/>':'<span>'+init+'</span>';
    return '<tr><td><div style="display:flex;align-items:center;gap:10px"><div class="c-avatar">'+av+'</div><span class="c-name">'+c.name+'</span></div></td>'+
      '<td>'+bdS+'</td><td>'+calcAge(c.birthday)+' J.</td>'+
      '<td><span class="badge '+(catColors[c.category]||'b-muted')+'"><span class="cat-dot" style="background:'+dot+'"></span>'+c.category+'</span></td>'+
      '<td><span class="badge '+gc+'">'+(c.gift||'Idee nötig')+'</span></td>'+
      '<td style="text-align:right"><button class="act-btn edit" onclick="openEditModal('+c.id+')"><span class="icon">edit</span></button> <button class="act-btn del" onclick="deleteContact('+c.id+')"><span class="icon">delete</span></button></td></tr>';
  }).join('');
}

function filterContacts(q){renderContacts(q);}
function toggleSort(){
  sortAsc=!sortAsc;
  document.getElementById('sort-label').textContent=sortAsc?'A – Z':'Z – A';
  renderContacts();
}
function deleteContact(id){contacts=contacts.filter(c=>c.id!==id);saveData();renderContacts();renderDashboard();showToast('Kontakt gelöscht');}
function toggleFilterPanel(){document.getElementById('filter-panel').classList.toggle('open');}
function setFilter(cat,el){
  activeCategory=cat;
  el.closest('#filter-panel').querySelectorAll('.chip').forEach(c=>{if(c.getAttribute('onclick')&&c.getAttribute('onclick').includes('setFilter'))c.classList.remove('selected');});
  el.classList.add('selected');renderContacts();
}
function setGiftFilter(gift,el){
  if(activeGift===gift){activeGift='';el.classList.remove('selected');}
  else{
    activeGift=gift;
    el.closest('#filter-panel').querySelectorAll('.chip').forEach(c=>{if(c.getAttribute('onclick')&&c.getAttribute('onclick').includes('setGiftFilter'))c.classList.remove('selected');});
    el.classList.add('selected');
  }
  renderContacts();
}
function resetFilters(){
  activeCategory='';activeGift='';
  document.querySelectorAll('#filter-panel .chip').forEach(c=>c.classList.remove('selected'));
  document.querySelector('#filter-panel .chip').classList.add('selected');
  renderContacts();
}
function selectChip(el){
  el.closest('.gift-chips').querySelectorAll('.chip').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
}
function previewPhoto(input){
  if(!input.files||!input.files[0])return;
  const r=new FileReader();
  r.onload=e=>{
    const p=document.getElementById('photo-preview');p.src=e.target.result;p.style.display='block';
    document.getElementById('photo-icon').style.display='none';
    document.getElementById('photo-lbl').style.display='none';
  };
  r.readAsDataURL(input.files[0]);
}
function saveBirthday(){
  const name=document.getElementById('form-name').value.trim();
  const date=document.getElementById('form-date').value;
  if(!name){showToast('Bitte einen Namen eingeben',true);return;}
  if(!date){showToast('Bitte ein Datum wählen',true);return;}
  const cat=document.getElementById('form-category').value;
  const notes=document.getElementById('form-notes').value.trim();
  const sel=document.querySelector('#add-gift-chips .chip.selected');
  const gift=sel?sel.textContent.trim():'Idee nötig';
  const prev=document.getElementById('photo-preview');
  const photo=prev&&prev.style.display!=='none'?prev.src:null;
  contacts.push({id:Date.now(),name,birthday:date,category:cat,gift,info:notes||'Keine Notizen',initials:name.split(' ').map(w=>w[0]).join('').toUpperCase(),photo});
  saveData();
  ['form-name','form-date','form-notes'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('form-category').selectedIndex=0;
  document.getElementById('photo-file').value='';
  const p=document.getElementById('photo-preview');p.style.display='none';p.src='';
  document.getElementById('photo-icon').style.display='';
  document.getElementById('photo-lbl').style.display='';
  document.querySelectorAll('#add-gift-chips .chip').forEach((c,i)=>c.classList.toggle('selected',i===1));
  showToast('🎉 '+name+' wurde gespeichert!');
  setTimeout(()=>navigate('contacts'),600);
}
function openEditModal(id){
  editingId=id;
  const c=contacts.find(x=>x.id===id);if(!c)return;
  document.getElementById('edit-notes').value=c.info==='Keine Notizen'?'':c.info;
  document.querySelectorAll('#edit-gift-chips .chip').forEach(chip=>chip.classList.toggle('selected',chip.textContent.trim()===(c.gift||'Idee nötig')));
  document.getElementById('edit-modal').classList.add('open');
}
function closeEditModal(){document.getElementById('edit-modal').classList.remove('open');editingId=null;}
function saveEdit(){
  const c=contacts.find(x=>x.id===editingId);if(!c)return;
  const sel=document.querySelector('#edit-gift-chips .chip.selected');
  c.gift=sel?sel.textContent.trim():'Idee nötig';
  c.info=document.getElementById('edit-notes').value.trim()||'Keine Notizen';
  saveData();closeEditModal();renderContacts();renderDashboard();showToast('Gespeichert!');
}
function handleSearch(q){
  if(q)navigate('contacts');
  const el=document.getElementById('contact-search');if(el)el.value=q;
  filterContacts(q);
}
function showToast(msg,isErr=false){
  const t=document.createElement('div');
  t.className='toast '+(isErr?'t-err':'t-ok');t.textContent=msg;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(()=>t.remove(),3200);
}
function confirmName(){
  const name=document.getElementById('name-input').value.trim();
  if(!name){showToast('Bitte einen Namen eingeben',true);return;}
  localStorage.setItem('fl_username',name);
  document.getElementById('welcome-name').textContent=name;
  document.getElementById('name-modal').classList.remove('open');
}

/* ── THEME ── */
(function(){
  const saved=localStorage.getItem('fl_theme')||'dark';
  document.documentElement.setAttribute('data-theme',saved);
  const icon=document.getElementById('theme-icon');
  if(icon)icon.textContent=(saved==='dark'?'light_mode':'dark_mode');
}());
function toggleTheme(){
  const cur=document.documentElement.getAttribute('data-theme');
  const next=cur==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',next);
  document.getElementById('theme-icon').textContent=(next==='dark'?'light_mode':'dark_mode');
  localStorage.setItem('fl_theme',next);
}

/* ── INIT ── */
const sn=localStorage.getItem('fl_username');
if(sn){document.getElementById('welcome-name').textContent=sn;document.getElementById('name-modal').classList.remove('open');}
navigate('dashboard');