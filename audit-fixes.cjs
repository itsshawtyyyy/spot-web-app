const fs=require('fs');
const file='spot-site/dist/index.html';let s=fs.readFileSync(file,'utf8');
s=s.replace("const [{data:reactions=[]},{data:comments=[]},{data:{user}}]=await Promise.all([", "const [reactionResult,commentResult,{data:{user}}]=await Promise.all([");
s=s.replace("if(!social.isConnected)return;", "if(!social.isConnected)return;\n        const reactions=reactionResult.data||[],comments=commentResult.data||[];\n        if(reactionResult.error||commentResult.error){social.replaceChildren();const message=document.createElement('p');message.textContent='Non riesco a caricare reazioni e commenti.';const retry=document.createElement('button');retry.className='filter';retry.textContent='Riprova';retry.onclick=()=>renderEventSocial(event);social.append(message,retry);return;}");
const start=s.indexOf('      async function syncProfile(user)');const end=s.indexOf('\n      function clean',start);
s=s.slice(0,start)+`      async function syncProfile(user){
        const value={user_id:user.id,email:user.email,display_name:user.user_metadata?.full_name||user.user_metadata?.name||user.email};
        const created=await supabase.from('profiles').upsert(value,{onConflict:'user_id',ignoreDuplicates:true});if(created.error)throw created.error;
        const {data,error}=await supabase.from('profiles').select('*').eq('user_id',user.id).single();if(error||!data)throw error||new Error('Profilo non disponibile');
        profile=data;await loadAvatar();eventForm.style.display='grid';submitHelp.textContent='Il tuo evento sarà visibile solo dopo l’approvazione.';
      }
      async function refresh(){try{const {data:{user},error}=await supabase.auth.getUser();if(error&&!user)return;if(user)await syncProfile(user);}catch{profile=null;eventForm.style.display='none';submitHelp.textContent='Non riesco a caricare il profilo. Riprova ad accedere.';authMessage.textContent='Accesso al profilo non riuscito. Riprova.';}}
`+s.slice(end);
s=s.replace("document.body.classList.remove('map-mode');document.body.classList.add('profile-mode');", "document.body.classList.remove('map-mode','add-mode');document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab==='profile'));document.body.classList.add('profile-mode');");
s=s.replace("const reactions=reactionResult.data||[],comments=commentResult.data||[];document.querySelector('#reaction-events')", "if(reactionResult.error||commentResult.error)document.querySelector('#profile-message').textContent='Alcune attività non sono disponibili. Riapri il profilo per riprovare.';const reactions=reactionResult.data||[],comments=commentResult.data||[];document.querySelector('#reaction-events')");
s=s.replace("if(tab==='add'){openHome();", "if(tab==='add'){if(!profile){authModal.classList.add('open');return;}openHome();");
s=s.replace("document.querySelector('#google').onclick=()=>supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});", "document.querySelector('#google').onclick=async()=>{const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});if(error)authMessage.textContent='Accesso Google non disponibile. Riprova.';};");
fs.writeFileSync(file,s);
