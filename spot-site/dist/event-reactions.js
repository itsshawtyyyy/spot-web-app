export function isEmoji(value) {
  return value.length<=16 && [...new Intl.Segmenter('it',{granularity:'grapheme'}).segment(value)].length===1
    && /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(value);
}
export async function toggleReaction(client,eventId,userId,emoji) {
  const {data,error}=await client.from('event_reactions').select('id')
    .eq('event_id',eventId).eq('user_id',userId).eq('emoji',emoji);
  if(error)throw error;
  const result=data.length
    ? await client.from('event_reactions').delete().eq('event_id',eventId).eq('user_id',userId).eq('emoji',emoji)
    : await client.from('event_reactions').upsert({event_id:eventId,user_id:userId,emoji},{onConflict:'event_id,user_id,emoji',ignoreDuplicates:true});
  if(result.error)throw result.error;
}
export function mountReactions(container,client,eventId,rows,user,onLogin) {
  let busy=false;
  const message=document.createElement('p');message.setAttribute('role','status');message.className='login-note';
  container.after(message);
  function draw() {
    container.replaceChildren();
    const counts=new Map(),mine=new Set();
    for(const row of rows){counts.set(row.emoji,(counts.get(row.emoji)||0)+1);if(row.user_id===user?.id)mine.add(row.emoji);}
    for(const emoji of new Set(['❤️','🔥','👏','😍',...counts.keys()])) {
      const button=document.createElement('button');button.type='button';
      button.textContent=emoji+' '+(counts.get(emoji)||0);
      button.setAttribute('aria-pressed',String(mine.has(emoji)));
      button.setAttribute('aria-label',(mine.has(emoji)?'Rimuovi reazione ':'Aggiungi reazione ')+emoji);
      button.onclick=()=>change(emoji);container.append(button);
    }
    const input=document.createElement('input');input.className='search';input.maxLength=16;input.placeholder='✨';input.setAttribute('aria-label','Emoji personalizzata');
    const add=document.createElement('button');add.type='button';add.textContent='+ Aggiungi';
    add.onclick=()=>change(input.value.trim());
    input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();add.click();}};
    container.append(input,add);
  }
  async function change(emoji) {
    if(busy)return;
    if(!isEmoji(emoji)){message.textContent='Inserisci una sola emoji, per esempio ✨ o 🥳.';return;}
    busy=true;container.querySelectorAll('button,input').forEach(el=>el.disabled=true);message.textContent='';
    let saved=false;
    try {
      const {data,error}=await client.auth.getUser();
      if(error||!data.user){message.textContent='Accedi per aggiungere o rimuovere una reazione.';onLogin();return;}
      user=data.user;
      await toggleReaction(client,eventId,user.id,emoji);
      saved=true;
      const result=await client.from('event_reactions').select('emoji,user_id').eq('event_id',eventId);
      if(result.error)throw result.error;
      rows=result.data;draw();message.textContent='Reazioni aggiornate.';
    }catch{
      message.textContent=saved?'Reazione salvata. Riapri l’evento per aggiornare il conteggio.':'Non riesco a salvare la reazione. Riprova.';
    }finally{busy=false;container.querySelectorAll('button,input').forEach(el=>el.disabled=false);}
  }
  draw();
}
