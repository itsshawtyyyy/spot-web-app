import {eventDate,eventImage} from './events-data.js';
const defaults = [41.9028, 12.4964];
export function validCoordinates(event) {
  return typeof event.latitude === 'number' && typeof event.longitude === 'number'
    && Number.isFinite(event.latitude) && Number.isFinite(event.longitude)
    && Math.abs(event.latitude) <= 90 && Math.abs(event.longitude) <= 180;
}
export function createEventMap(store) {
  let map, markers, request = 0;
  const status = document.querySelector('#map-status');
  const list = document.querySelector('#map-events');
  const retry = document.querySelector('#map-refresh');
  function element(tag, text, className) {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  const date = eventDate;
  function directions(event) {
    const link = element('a', 'Apri indicazioni', 'map-directions');
    link.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(validCoordinates(event) ? event.latitude + ',' + event.longitude : event.venue);
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    return link;
  }
  function detail(event) {
    const content = document.querySelector('#modal-content');
    content.replaceChildren();
    const cover = element('div', '', 'event-detail-image');
    cover.style.backgroundImage = 'url(' + JSON.stringify(eventImage(event)) + ')';
    const title = element('h3', event.title); title.id = 'modal-title';
    const meta = element('div', '', 'meta');
    if(event.is_lgbt)meta.append(element('span','LGBT+','lgbt-tag'));
    meta.append(element('span', date(event)), element('span', event.venue), directions(event));
    const social = element('div', '', 'event-social'); social.id = 'event-social';
    content.append(cover, element('div', event.category, 'label'), title, meta,
      element('p', Array.from(event.description || '').slice(0,150).join('')), social);
    document.querySelector('#modal').classList.add('open');
    window.dispatchEvent(new CustomEvent('spot:event-open', {detail:event}));
  }
  async function show() {
    const current = ++request;
    retry.disabled = true;
    status.textContent = 'Caricamento degli eventi sulla mappa…';
    try {
      if (!window.L) throw new Error('map-library');
      if (!map) {
        map = L.map('event-map', {scrollWheelZoom:false}).setView(defaults, 12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).on('tileerror', () => { document.querySelector('#map-tile-message').textContent = 'Lo sfondo della mappa non è disponibile. Puoi comunque aprire le indicazioni dagli eventi sotto.'; }).addTo(map);
        markers = L.featureGroup().addTo(map);
        new ResizeObserver(() => map.invalidateSize()).observe(document.querySelector('#event-map'));
      }
      map.invalidateSize();
      const rows = await store.refresh();
      if (current !== request) return;
      markers.clearLayers(); list.replaceChildren();
      const events = rows.filter(validCoordinates);
      const groups = new Map();
      for(const event of events) {
        const key = event.latitude + ',' + event.longitude;
        if(!groups.has(key)) groups.set(key,[]);
        groups.get(key).push(event);
      }
      for(const group of groups.values()) {
        const first = group[0];
        const popup = element('div', '', 'map-popup');
        for(const event of group) {
          const item = element('div','', 'map-popup-event');
          const open = element('button','Vedi evento','filter'); open.onclick = () => detail(event);
          item.append(element('strong',event.title), element('p',event.venue), element('p',date(event)),open,directions(event));
          popup.append(item);
        }
        const marker = L.marker([first.latitude,first.longitude], {
          title: group.map(e=>e.title).join(', '), alt: 'Evento: '+first.title,
          icon:L.divIcon({className:'spot-marker',html:'<span>'+(group.length>1?group.length:'●')+'</span>',iconSize:[36,36],iconAnchor:[18,18]})
        }).bindPopup(popup,{maxWidth:260}).addTo(markers);
        for(const event of group) {
          const row=element('article','','profile-item');
          const focus=element('button',event.title,'map-event-link');
          focus.onclick=()=>{ map.setView(marker.getLatLng(),16); marker.openPopup(); document.querySelector('#event-map').scrollIntoView({behavior:'smooth',block:'center'}); };
          row.append(focus,element('p',event.venue+' · '+date(event)),directions(event));
          list.append(row);
        }
      }
      if(events.length) map.fitBounds(markers.getBounds(),{padding:[35,35],maxZoom:15});
      else map.setView(defaults,12);
      status.textContent = events.length ? events.length+' eventi sulla mappa' : 'Nessun evento approvato con una posizione disponibile.';
      if(rows.length>events.length) status.textContent += ' '+(rows.length-events.length)+' eventi senza coordinate valide.';
    } catch(error) {
      status.textContent='Non riesco a caricare la mappa o gli eventi. Premi Aggiorna per riprovare.';
    } finally { if(current===request) retry.disabled=false; }
  }
  retry.onclick=show;
  return {show,openDetail:detail};
}
