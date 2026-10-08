export function createEventsStore(client) {
  let pending;
  const listeners = new Set();
  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    refresh() {
      if (pending) return pending;
      pending = (async () => {
        const rows = [];
        for (let offset = 0; ; offset += 500) {
          const {data,error} = await client.from('events')
            .select('id,title,venue,category,starts_at,description,latitude,longitude,image_url,is_lgbt')
            .eq('status','approved').order('starts_at').order('id').range(offset,offset+499);
          if (error) throw error;
          rows.push(...data);
          if (data.length < 500) break;
        }
        for (const listener of listeners) listener(rows);
        return rows;
      })().finally(() => { pending = null; });
      return pending;
    }
  };
}
export function eventDate(event) {
  const date = new Date(event.starts_at);
  if (!event.starts_at || !Number.isFinite(date.getTime())) return 'Data da confermare';
  return date.toLocaleString('it-IT', {
    weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Rome'
  });
}
export function eventImage(event) {
  if (event.image_url) {
    try { const url = new URL(event.image_url, location.href); if (['http:','https:'].includes(url.protocol)) return url.href; } catch {}
  }
  return 'assets/' + (event.category === 'Mostre' ? 'cover-gallery.jpg' : event.category === 'Aperitivi' ? 'cover-aperitivo.jpg' : 'cover-concert.jpg');
}
