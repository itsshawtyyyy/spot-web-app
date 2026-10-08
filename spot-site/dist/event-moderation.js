import {eventDate,eventImage} from './events-data.js';
export function setupModeration(client,onChange) {
  const panel=document.querySelector('#admin-panel'),pending=document.querySelector('#pending-events'),own=document.querySelector('#my-proposals');
  let generation=0;
  const node=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text||'';if(cls)el.className=cls;return el;};
  function card(event){
    const box=node('article','','profile-item');
    const img=node('img');img.src=eventImage(event);img.alt=event.title;img.style.cssText='width:100%;max-height:180px;object-fit:cover;border-radius:12px';
    box.append(img,node('h3',event.title),node('p',event.venue+' · '+eventDate(event)),node('p',event.description));
    if(event.is_lgbt)box.append(node('span','LGBT+','lgbt-tag'));return box;
  }
  async function load(profile){
    const current=++generation;
    panel.style.display='none';pending.replaceChildren();own.textContent='Caricamento proposte…';
    const [mine,permission]=await Promise.all([
      client.from('events').select('*').eq('submitted_by',profile.id).order('created_at',{ascending:false}),
      client.rpc('can_moderate_events')
    ]);
    if(current!==generation)return;
    own.replaceChildren();
    if(mine.error)own.textContent='Non riesco a caricare le tue proposte. Riapri il profilo per riprovare.';
    else if(!mine.data.length)own.textContent='Non hai ancora proposto eventi.';
    else for(const event of mine.data){
      const item=card(event);
      item.append(node('strong',({pending:'In attesa di approvazione',approved:'Approvato',rejected:'Rifiutato'})[event.status]));
      if(event.status==='rejected')item.append(node('p','Motivo: '+(event.rejection_reason||'Nessun motivo registrato.')));
      own.append(item);
    }
    if(permission.error||!permission.data)return;
    panel.style.display='grid';pending.textContent='Caricamento…';
    const result=await client.from('events').select('*').eq('status','pending').order('created_at');
    if(current!==generation)return;
    pending.replaceChildren();
    if(result.error){pending.textContent='Non riesco a caricare gli eventi da approvare.';return;}
    if(!result.data.length)pending.textContent='Nessun evento in attesa.';
    for(const event of result.data){
      const item=card(event),label=node('label','Motivo del rifiuto (obbligatorio solo per rifiutare)');
      const reason=node('textarea');reason.className='search';reason.maxLength=500;reason.rows=2;label.append(reason);
      const actions=node('div','','venue-actions'),approve=node('button','Approva','filter active'),reject=node('button','Rifiuta','filter');
      const message=node('p');message.setAttribute('role','status');
      approve.type=reject.type='button';actions.append(approve,reject);item.append(label,actions,message);pending.append(item);
      async function decide(status){
        if(approve.disabled)return;
        const rejection_reason=status==='rejected'?reason.value.trim():null;
        if(status==='rejected'&&!rejection_reason){message.textContent='Indica il motivo del rifiuto.';reason.focus();return;}
        approve.disabled=reject.disabled=true;message.textContent='Salvataggio…';
        try{
          const {data,error}=await client.from('events').update({status,rejection_reason}).eq('id',event.id).eq('status','pending').select('id');
          if(error)throw error;
          if(!data.length){message.textContent='Evento già gestito o permessi non più validi. Riapri il profilo.';return;}
          await onChange();await load(profile);
        }catch{message.textContent='Non riesco a salvare la decisione. Verifica di essere entrato con Google e riprova.';}
        finally{approve.disabled=reject.disabled=false;}
      }
      approve.onclick=()=>decide('approved');reject.onclick=()=>decide('rejected');
    }
  }
  return {load};
}
