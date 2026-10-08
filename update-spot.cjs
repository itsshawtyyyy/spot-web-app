const fs=require('fs');
const base='spot-site/dist/';
function edit(file,fn){const old=fs.readFileSync(base+file,'utf8');fs.writeFileSync(base+file,fn(old));}
edit('index.html',s=>{
 s=s.replace('</style>',`.tabbar{border-radius:999px;padding:9px;background:rgba(35,31,42,.68);box-shadow:inset 0 1px 0 #ffffff24,0 12px 40px #0008;backdrop-filter:blur(26px) saturate(170%)}.tab{border-radius:999px}.tab[data-tab=profile]{max-width:90px;justify-self:center}.lgbt-tag{display:inline-block;border:1px solid #c680ef;background:#30203f;color:#f5dcff;border-radius:999px;padding:4px 9px;font-size:.75rem}.image .lgbt-tag{position:absolute;right:10px;bottom:10px}.event-tag-option{display:flex;align-items:center;gap:10px;padding:12px;border:1px solid var(--line);border-radius:16px}.event-tag-option input{width:20px;height:20px;accent-color:var(--violet)}#account.account-avatar{width:44px;height:44px;min-width:44px;padding:0;border-radius:50%;display:grid;place-items:center;overflow:hidden;background:#29212f}#account.account-avatar img{width:100%;height:100%;object-fit:cover}#account.account-avatar svg{width:25px;height:25px}@media(max-width:480px){body:not(.profile-mode):not(.map-mode):not(.add-mode) header #account.account-avatar{grid-row:1;grid-column:3}}\n</style>`);
 s=s.replace('data-filter="Aperitivi">Aperitivi</button></nav>','data-filter="Aperitivi">Aperitivi</button><button class="filter" data-filter="LGBT+">LGBT+</button></nav>');
 s=s.replace('<label>Categoria<select', '<label class="event-tag-option"><input type="checkbox" name="is_lgbt">Evento LGBT+</label>\n<label>Categoria<select');
 s=s.replace("account.textContent=profile?.display_name||user.email.split('@')[0];",'await loadAvatar();');
 s=s.replace('account.textContent=data.display_name;','');
 const start=s.indexOf('      async function loadAvatar()');const end=s.indexOf('\n',start);
 s=s.slice(0,start)+`      async function loadAvatar(){
        const avatar=document.querySelector('#profile-avatar'),picker=document.querySelector('.avatar-picker');
        picker.dataset.initials=(profile?.display_name||'SP').trim().split(/\\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase();
        avatar.removeAttribute('src');avatar.style.display='none';
        account.classList.add('account-avatar');account.setAttribute('aria-label','Apri il tuo profilo');account.title='Il tuo profilo';
        const fallback=()=>{account.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>';};fallback();
        if(!profile?.avatar_url)return;
        const {data}=await supabase.storage.from('profile-avatars').createSignedUrl(profile.avatar_url,3600);
        if(data?.signedUrl){avatar.src=data.signedUrl;avatar.style.display='block';avatar.onerror=()=>{avatar.style.display='none';};const photo=document.createElement('img');photo.alt='';photo.src=data.signedUrl;photo.onerror=fallback;account.replaceChildren(photo);}
      }`+s.slice(end);
 return s;
});
edit('events-data.js',s=>s.replace('longitude,image_url','longitude,image_url,is_lgbt'));
edit('event-create.js',s=>s.replace("title,venue,category:values.get('category'),description:text,","title,venue,category:values.get('category'),description:text,is_lgbt:values.get('is_lgbt')==='on',"));
edit('event-home.js',s=>s.replace("category==='Tutti'||e.category===category","category==='Tutti'||(category==='LGBT+'?e.is_lgbt:e.category===category)").replace('[e.title,e.venue,e.category]','[e.title,e.venue,e.category,e.is_lgbt?\'LGBT+\':\'\']').replace("cover.append(node('span',event.category,'badge'));","cover.append(node('span',event.category,'badge'));if(event.is_lgbt)cover.append(node('span','LGBT+','lgbt-tag'));"));
edit('event-map.js',s=>s.replace("meta.append(element('span', date(event))","if(event.is_lgbt)meta.append(element('span','LGBT+','lgbt-tag'));\n    meta.append(element('span', date(event))"));
edit('event-moderation.js',s=>s.replace('return box;',"if(event.is_lgbt)box.append(node('span','LGBT+','lgbt-tag'));return box;"));
