const $ = s => document.querySelector(s);
let section = 'settings', editId = null;
const pass = 'admin123';

const SECTION_ITEMS = [
  ['settings','🏫','Të dhënat e shkollës'],
  ['home','🏠','Ballina'],
  ['about','📖','Rreth nesh'],
  ['news','📰','Lajme'],
  ['teachers','👩‍🏫','Mësimdhënës'],
  ['gallery','🖼️','Galeri'],
  ['documents','📄','Dokumente']
];

function oneLang(name, obj = {}, type = 'text', label = '') {
  const value = (obj && typeof obj === 'object') ? (obj.sq || obj.en || obj.tr || obj.mk || '') : (obj || '');
  const tag = type === 'textarea' ? 'textarea' : 'input';
  const input = tag === 'textarea'
    ? `<textarea rows="3" data-i18nfield="${name}" data-lang="sq" placeholder="Shkruaj në shqip...">${CMS.esc(value)}</textarea>`
    : `<input type="text" data-i18nfield="${name}" data-lang="sq" value="${CMS.esc(value)}" placeholder="Shkruaj në shqip...">`;
  return `<div class="field-row full">
    <div class="field-info"><b>${label || name}</b><span>Shkruaje vetëm në shqip. Sistemi e përkthen automatikisht për EN / TR / MK.</span></div>
    <div class="field-input">${input}</div>
    <div class="auto-badge">✨ Auto</div>
  </div>`;
}

const TRANSLATION_CACHE_KEY_ADMIN = 'schoolCMS_translationCache_admin_v7';
function getTranslationCacheAdmin(){try{return JSON.parse(localStorage.getItem(TRANSLATION_CACHE_KEY_ADMIN)||'{}')}catch(e){return {}}}
function setTranslationCacheAdmin(c){try{localStorage.setItem(TRANSLATION_CACHE_KEY_ADMIN,JSON.stringify(c))}catch(e){}}
async function translateSQ(text, target){
  const value = String(text || '').trim();
  if(!value) return '';
  if(target === 'sq') return value;
  const cache=getTranslationCacheAdmin();
  const ck=target+'::'+value;
  if(cache[ck]) return cache[ck];
  const langMap = {en:'en', tr:'tr', mk:'mk'};
  try{
    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(value) + '&langpair=sq|' + langMap[target];
    const res = await fetch(url,{cache:'no-store'});
    if(!res.ok) throw new Error('translate failed');
    const data = await res.json();
    let translated = (data && data.responseData && data.responseData.translatedText) || '';
    translated = String(translated).replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim();
    if(translated && translated.toLowerCase() !== value.toLowerCase()){
      cache[ck]=translated; setTranslationCacheAdmin(cache); return translated;
    }
  }catch(e){
    console.warn('Përkthimi online nuk u krye, teksti u kopjua.', e);
  }
  return value;
}
function isI18nObjAdmin(o){return o && typeof o==='object' && !Array.isArray(o) && Object.prototype.hasOwnProperty.call(o,'sq') && (Object.prototype.hasOwnProperty.call(o,'en')||Object.prototype.hasOwnProperty.call(o,'tr')||Object.prototype.hasOwnProperty.call(o,'mk'))}
async function fillTranslationsInObjectAdmin(obj){
  if(!obj || typeof obj!=='object') return obj;
  if(Array.isArray(obj)){ for(const x of obj) await fillTranslationsInObjectAdmin(x); return obj; }
  if(isI18nObjAdmin(obj)){
    const sq=String(obj.sq||'').trim();
    if(sq){
      for(const l of ['en','tr','mk']){
        if(!obj[l] || String(obj[l]).trim()===sq){ obj[l]=await translateSQ(sq,l); }
      }
    }
    return obj;
  }
  for(const k of Object.keys(obj)) await fillTranslationsInObjectAdmin(obj[k]);
  return obj;
}

async function read4(name, opts = {}) {
  const sq = document.querySelector(`[data-i18nfield="${name}"][data-lang="sq"]`)?.value || '';
  if(opts.copyOnly) return { sq, en: sq, tr: sq, mk: sq };
  msg('Duke përkthyer tekstet...');
  const [en,tr,mk] = await Promise.all([translateSQ(sq,'en'), translateSQ(sq,'tr'), translateSQ(sq,'mk')]);
  return { sq, en, tr, mk };
}

function imgInput(label,id,val='') {
  return `<div class="upload-box"><label>${label}</label><div class="upload-preview">${val ? `<img src="${CMS.esc(val)}">` : '<span>🖼️</span>'}</div><input type="file" id="${id}File" accept="image/*"><input id="${id}" value="${CMS.esc(val)}" placeholder="ose URL/base64 ekzistues"></div>`;
}
function docInput(label,id,val='') {
  return `<div class="upload-box"><label>${label}</label><div class="upload-preview document"><span>📄</span><small>${val?'Dokumenti ekzistues është ruajtur. Zgjidh dokument të ri për ta zëvendësuar.':'Nuk ka dokument'}</small></div><input type="file" id="${id}File"><input id="${id}" value="${CMS.esc(val)}" placeholder="ose URL/base64 ekzistues"><p class="small muted">Nëse zgjedh file të ri, ai e zëvendëson automatikisht dokumentin e vjetër.</p></div>`;
}
function auth(){return sessionStorage.getItem('adminAuth')==='true'}
function logout(){sessionStorage.removeItem('adminAuth'); location.reload()}

function shell(){
  if(!auth()){
    document.body.innerHTML=`<div class="login pro-login"><div class="login-logo">SHV</div><h1>Paneli Administratorit</h1><p class="muted">Hyr për të redaktuar faqen e shkollës.</p><form id="loginForm" class="form"><input id="pwd" type="password" placeholder="Fjalëkalimi"><button class="btn primary">Hyr</button></form><p class="small muted">Fjalëkalimi fillestar: <b>admin123</b></p></div>`;
    $('#loginForm').onsubmit=e=>{e.preventDefault();if($('#pwd').value===pass){sessionStorage.setItem('adminAuth','true');location.reload()}else alert('Fjalëkalim i gabuar')};return;
  }
  $('#adminApp').innerHTML=`<div class="admin-shell">
    <aside class="admin-sidebar-pro">
      <div class="brand"><div class="brand-logo">SHV</div><div><h2>Shkolla Fillore<br>Vrapçisht</h2><p>Admin Panel</p></div></div>
      <div class="nav-label">PËRMBAJTJA</div>
      <div class="admin-menu">${SECTION_ITEMS.map(x=>`<button class="side-btn" data-sec="${x[0]}"><span>${x[1]}</span>${x[2]}</button>`).join('')}</div>
      <div class="nav-label">SISTEMI</div>
      <button class="side-btn" onclick="exportData()"><span>⬇️</span>Eksporto të dhënat</button>
      <button class="side-btn" onclick="importData()"><span>⬆️</span>Importo të dhënat</button>
      <button class="side-btn" onclick="retranslateAll()"><span>🌐</span>Përkthe krejt</button>
      <button class="side-btn" onclick="if(confirm('Të kthehen të dhënat fillestare?')){CMS.resetAll();location.reload()}"><span>♻️</span>Reset</button>
      <a class="side-btn as-link" href="index.html"><span>👁️</span>Shiko faqen</a>
      <div class="admin-user"><div class="avatar">A</div><div><b>Administrator</b><small>● Online</small></div><button type="button" onclick="logout()">Dil</button></div>
    </aside>
    <main class="admin-content-pro">
      <div class="top-line"><button class="hamb">☰</button><div><h1 id="title"></h1><p id="sub" class="muted"></p></div><div class="top-actions"><button id="addBtn" class="btn primary">+ Shto</button><button type="button" class="btn danger" onclick="logout()">🚪 Dil</button></div></div>
      <div id="msg"></div><div id="formBox"></div><div id="list"></div>
    </main>
  </div>`;
  document.querySelectorAll('.side-btn[data-sec]').forEach(b=>b.onclick=()=>{section=b.dataset.sec;editId=null;render()});
  render();
}
function msg(t,ok=true){$('#msg').innerHTML=`<div class="message ${ok?'ok':'err'}">${t}</div>`;setTimeout(()=>$('#msg').innerHTML='',3000)}
function titleOf(){return SECTION_ITEMS.find(x=>x[0]===section)?.[2] || ''}
function render(){document.querySelectorAll('.side-btn[data-sec]').forEach(b=>b.classList.toggle('active',b.dataset.sec===section));$('#title').textContent=titleOf();$('#sub').textContent='Redakto tekstet, fotot dhe dokumentet që shfaqen në ueb-faqe.';$('#addBtn').style.display=['settings','home','about'].includes(section)?'none':'inline-flex';$('#addBtn').onclick=()=>{editId='new';form()};list();form()}
async function valFile(id){const f=$('#'+id+'File')?.files?.[0];return f?await CMS.fileToData(f):$('#'+id)?.value}

function form(){
  if(section==='settings'||section==='home'||section==='about'){
    let s=CMS.getData('settings');
    let html='';
    if(section==='settings') html=`<div class="card-title"><span>ℹ️</span><div><h2>Informacion bazë</h2><p>Shkruaj tekstet vetëm në shqip. Për gjuhët tjera përkthehen automatikisht.</p></div></div>${oneLang('schoolName',s.schoolName,'text','Emri i shkollës')}<div class="form-grid two"><label>Logo tekst / shkurtimi<input id="logoText" value="${CMS.esc(s.logoText||'')}"></label>${imgInput('Logo foto','logoImage',s.logoImage||'')}<label>Telefon<input id="phone" value="${CMS.esc(s.phone||'')}"></label><label>Email<input id="email" value="${CMS.esc(s.email||'')}"></label></div>${oneLang('address',s.address,'text','Adresa')}${oneLang('hours',s.hours,'text','Orari')}<div class="form-grid three"><label>Facebook<input id="facebook" value="${CMS.esc(s.facebook||'')}"></label><label>Instagram<input id="instagram" value="${CMS.esc(s.instagram||'')}"></label><label>YouTube<input id="youtube" value="${CMS.esc(s.youtube||'')}"></label></div>`;
    if(section==='home') html=`<div class="card-title"><span>🏠</span><div><h2>Ballina</h2><p>Titujt dhe përshkrimet përkthehen automatikisht në gjuhët tjera.</p></div></div>${imgInput('Foto kryesore / hero','heroImage',s.heroImage||'')}${oneLang('heroBadge',s.heroBadge,'text','Teksti i vogël mbi titull')}${oneLang('heroTitle',s.heroTitle,'text','Titulli kryesor')}${oneLang('heroSubtitle',s.heroSubtitle,'textarea','Përshkrimi kryesor')}<div class="card-title"><span>✨</span><div><h2>Kartelat në ballinë</h2><p>Këto tani redaktohen dhe përkthehen në gjuhët tjera.</p></div></div>${oneLang('feature1Title',s.feature1Title,'text','Kartela 1 - Titulli')}${oneLang('feature1Desc',s.feature1Desc,'textarea','Kartela 1 - Përshkrimi')}${oneLang('feature2Title',s.feature2Title,'text','Kartela 2 - Titulli')}${oneLang('feature2Desc',s.feature2Desc,'textarea','Kartela 2 - Përshkrimi')}${oneLang('feature3Title',s.feature3Title,'text','Kartela 3 - Titulli')}${oneLang('feature3Desc',s.feature3Desc,'textarea','Kartela 3 - Përshkrimi')}${oneLang('latestNewsTitle',s.latestNewsTitle,'text','Titulli: Lajmet e Fundit')}${oneLang('partnersTitle',s.partnersTitle,'text','Titulli: Partnerët')}<div class="form-grid four"><label>Numri nxënësve<input id="students" value="${CMS.esc(s.students||'')}"></label><label>Stafi<input id="staff" value="${CMS.esc(s.staff||'')}"></label><label>Themeluar<input id="founded" value="${CMS.esc(s.founded||'')}"></label><label>Sipërfaqe m²<input id="area" value="${CMS.esc(s.area||'')}"></label></div>${oneLang('studentsLabel',s.studentsLabel,'text','Etiketa: Nxënës')}${oneLang('staffLabel',s.staffLabel,'text','Etiketa: Staf')}${oneLang('foundedLabel',s.foundedLabel,'text','Etiketa: Themeluar')}${oneLang('areaLabel',s.areaLabel,'text','Etiketa: m²')}<label>Partnerët (një në rresht)<textarea id="partners" rows="4">${CMS.esc((s.partners||[]).join('\n'))}</textarea></label>`;
    if(section==='about') html=`<div class="card-title"><span>📖</span><div><h2>Rreth shkollës</h2><p>Teksti shkruhet vetëm në shqip dhe përkthehet në të gjitha gjuhët.</p></div></div>${oneLang('aboutTitle',s.aboutTitle,'text','Titulli')}${oneLang('aboutText',s.aboutText,'textarea','Përshkrimi')}<label>Historia / timeline në JSON<textarea id="timeline" rows="8">${CMS.esc(JSON.stringify(s.timeline||[],null,2))}</textarea></label>`;
    $('#formBox').innerHTML=`<form id="editForm" class="panel pro-card form">${html}<div class="save-bar"><div class="hint">✨ Nuk je i detyruar të shkruash EN/TR/MK. Sistemi i përkthen automatikisht gjatë ruajtjes.</div><button class="btn primary">💾 Ruaj ndryshimet</button></div></form>`;
    $('#editForm').onsubmit=async e=>{e.preventDefault();let s=CMS.getData('settings');
      if(section==='settings') Object.assign(s,{schoolName:await read4('schoolName'),logoText:$('#logoText').value,logoImage:await valFile('logoImage'),phone:$('#phone').value,email:$('#email').value,address:await read4('address'),hours:await read4('hours'),facebook:$('#facebook').value,instagram:$('#instagram').value,youtube:$('#youtube').value});
      if(section==='home') Object.assign(s,{heroImage:await valFile('heroImage'),heroBadge:await read4('heroBadge'),heroTitle:await read4('heroTitle'),heroSubtitle:await read4('heroSubtitle'),feature1Title:await read4('feature1Title'),feature1Desc:await read4('feature1Desc'),feature2Title:await read4('feature2Title'),feature2Desc:await read4('feature2Desc'),feature3Title:await read4('feature3Title'),feature3Desc:await read4('feature3Desc'),latestNewsTitle:await read4('latestNewsTitle'),partnersTitle:await read4('partnersTitle'),studentsLabel:await read4('studentsLabel'),staffLabel:await read4('staffLabel'),foundedLabel:await read4('foundedLabel'),areaLabel:await read4('areaLabel'),students:$('#students').value,staff:$('#staff').value,founded:$('#founded').value,area:$('#area').value,partners:$('#partners').value.split('\n').filter(Boolean)});
      if(section==='about'){s.aboutTitle=await read4('aboutTitle');s.aboutText=await read4('aboutText');try{s.timeline=JSON.parse($('#timeline').value)}catch(err){msg('Timeline JSON nuk është valid',false);return}}
      CMS.saveData('settings',s);msg('U ruajt me sukses');}; return;
  }
  let arr=CMS.getData(section); let item = editId==='new' ? {id:section[0]+Date.now()} : arr.find(x=>x.id===editId);
  if(!item){$('#formBox').innerHTML='';return}
  let html='';
  if(section==='news') html=`${oneLang('title',item.title,'text','Titulli i lajmit')}${oneLang('excerpt',item.excerpt,'textarea','Përshkrimi')}${oneLang('category',item.category,'text','Kategoria')}<div class="form-grid two"><label>Data<input id="date" type="date" value="${CMS.esc(item.date||'')}"></label>${imgInput('Foto','image',item.image||'')}</div>`;
  if(section==='teachers') html=`${oneLang('name',item.name,'text','Emri')}${oneLang('role',item.role,'text','Pozita')}${oneLang('subject',item.subject,'text','Lënda')}${oneLang('bio',item.bio,'textarea','Biografia')}${imgInput('Foto','image',item.image||'')}`;
  if(section==='gallery') html=`${oneLang('caption',item.caption,'text','Përshkrimi i fotos')}${imgInput('Foto','image',item.image||'')}`;
  if(section==='documents') html=`${oneLang('title',item.title,'text','Titulli i dokumentit')}${oneLang('desc',item.desc,'textarea','Përshkrimi')}<div class="form-grid two"><label>Data<input id="date" type="date" value="${CMS.esc(item.date||'')}"></label>${docInput('Dokumenti','file',item.file||'')}<label>Emri i file-it<input id="fileName" value="${CMS.esc(item.fileName||'document')}"></label></div>`;
  $('#formBox').innerHTML=`<form id="editForm" class="panel pro-card form"><div class="card-title"><span>✏️</span><div><h2>${editId==='new'?'Shto':'Redakto'} ${titleOf()}</h2><p>Shkruaj vetëm në shqip. Gjuhët tjera përkthehen automatikisht gjatë ruajtjes.</p></div></div>${html}<div class="save-bar"><button class="btn" type="button" onclick="editId=null;form()">Anulo</button><button class="btn primary">💾 Ruaj</button></div></form>`;
  $('#editForm').onsubmit=async e=>{e.preventDefault();let it={...item};
    if(section==='news') Object.assign(it,{title:await read4('title'),excerpt:await read4('excerpt'),category:await read4('category'),date:$('#date').value,image:await valFile('image')});
    if(section==='teachers') Object.assign(it,{name:await read4('name',{copyOnly:true}),role:await read4('role'),subject:await read4('subject'),bio:await read4('bio'),image:await valFile('image')});
    if(section==='gallery') Object.assign(it,{caption:await read4('caption'),image:await valFile('image')});
    if(section==='documents'){
      const newDocFile=$('#fileFile')?.files?.[0];
      const docValue = newDocFile ? await CMS.fileToData(newDocFile) : ($('#file')?.value || it.file || '');
      const docName = newDocFile?.name || $('#fileName')?.value || it.fileName || 'document';
      Object.assign(it,{title:await read4('title'),desc:await read4('desc'),date:$('#date').value,file:docValue,fileName:docName});
    }
    let a=CMS.getData(section);let i=a.findIndex(x=>x.id===it.id);if(i>=0)a[i]=it;else a.unshift(it);CMS.saveData(section,a);editId=null;msg('U ruajt me sukses');render();};
}
function list(){
  if(['settings','home','about'].includes(section)){$('#list').innerHTML='';return}
  let arr=CMS.getData(section);
  $('#list').innerHTML=`<div class="panel pro-card"><div class="card-title"><span>📋</span><div><h2>Lista</h2><p>${arr.length} artikuj</p></div></div>${arr.map(x=>{let title=CMS.mt(x.title||x.name||x.caption,'sq');let im=x.image||'';return `<div class="item-row">${im?`<img src="${CMS.esc(im)}">`:'<div class="empty-thumb">📌</div>'}<div><b>${CMS.esc(title)}</b><p class="muted small">ID: ${CMS.esc(x.id)}</p></div><div class="row-actions"><button type="button" class="btn" data-edit-id="${CMS.esc(x.id)}">✏️ Redakto</button> <button type="button" class="btn danger" data-delete-id="${CMS.esc(x.id)}">🗑️ Fshi</button></div></div>`}).join('')||'<p class="muted">Nuk ka artikuj.</p>'}</div>`;
}
function delItem(id){if(!confirm('A të fshihet?'))return;CMS.saveData(section,CMS.getData(section).filter(x=>x.id!==id));render()}
function exportData(){let data={};Object.keys(CMS.def).forEach(k=>data[k]=CMS.getData(k));let blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='school-cms-data.json';a.click()}
function importData(){let inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.onchange=()=>{let r=new FileReader();r.onload=()=>{try{let data=JSON.parse(r.result);Object.keys(CMS.def).forEach(k=>{if(data[k])CMS.saveData(k,data[k])});msg('Importimi u krye');render()}catch(e){msg('JSON i pavlefshëm',false)}};r.readAsText(inp.files[0])};inp.click()}

document.addEventListener('click', e=>{
  const editBtn=e.target.closest('[data-edit-id]');
  if(editBtn){
    editId=editBtn.dataset.editId;
    form();
    document.getElementById('formBox')?.scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }
  const delBtn=e.target.closest('[data-delete-id]');
  if(delBtn){ delItem(delBtn.dataset.deleteId); return; }
});

async function retranslateAll(){
  msg('Duke përkthyer të gjitha tekstet...');
  for(const k of Object.keys(CMS.def)){
    const data=CMS.getData(k);
    await fillTranslationsInObjectAdmin(data);
    CMS.saveData(k,data);
  }
  msg('Përkthimi u krye. Hap faqen dhe zgjidh EN/TR/MK.');
}
document.addEventListener('DOMContentLoaded',shell);
