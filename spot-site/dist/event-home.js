import {eventDate,eventImage} from './events-data.js';
import {matchesCategory} from './event-categories.js';
export function createEventHome(store,openDetail) {
  const grid=document.querySelector('#grid'), search=document.querySelector('#search'), empty=document.querySelector('#empty');
  let events=[],category='Tutti',loaded=false;
  function node(tag,text,className) { const el=document.createElement(tag);el.textContent=text||'';if(className)el.className=className;return el; }
  function render() {
    const q=search.value.trim().toLocaleLowerCase('it-IT');
    const shown=events.filter(e=>matchesCategory(e,category)&&[e.title,e.venue,e.category,e.is_lgbt?'LGBT+':''].join(' ').toLocaleLowerCase('it-IT').includes(q));
    grid.replaceChildren();
    for(const event of shown) {
      const card=node('article','','card'),button=node('button'),cover=node('div','','image'),body=node('div','','body');
      button.type='button';button.dataset.event=event.id;button.onclick=()=>openDetail(event);
      cover.style.backgroundImage='linear-gradient(0deg,#12101577,transparent),url('+JSON.stringify(eventImage(event))+')';
      cover.append(node('span',event.category,'badge'));if(event.is_lgbt)cover.append(node('span','LGBT+','lgbt-tag'));
      body.append(node('div',eventDate(event),'when'),node('h3',event.title),node('div','⌖ '+event.venue,'where'));
      button.append(cover,body);card.append(button);grid.append(card);
    }
    document.querySelector('#count').textContent=events.length;
    document.querySelector('#results').textContent=shown.length+' '+(shown.length===1?'evento':'eventi');
    empty.style.display=shown.length?'none':'block';
    empty.textContent=loaded?(events.length?'Nessun evento corrisponde alla ricerca.':'Non ci sono ancora eventi approvati.'):'Caricamento eventi…';
  }
  async function refresh() {
    try { await store.refresh(); }
    catch {
      empty.style.display='block';empty.replaceChildren(node('p','Non riesco ad aggiornare gli eventi. Controlla la connessione.'));
      const retry=node('button','Riprova','filter');retry.onclick=refresh;empty.append(retry);
    }
  }
  store.subscribe(rows=>{events=rows;loaded=true;render();});
  search.oninput=render;
  document.querySelectorAll('[data-filter]').forEach(button=>button.onclick=()=>{
    category=button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b===button));
    render();
  });
  document.querySelector('#close').onclick=()=>document.querySelector('#modal').classList.remove('open');
  document.querySelector('#modal').onclick=e=>{if(e.target.id==='modal')e.currentTarget.classList.remove('open');};
  render();
  return {refresh};
}
