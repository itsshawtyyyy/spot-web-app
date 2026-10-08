export function validatePhoto(file) {
  if(!file) return 'Scegli una foto per l’evento.';
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)) return 'Scegli una foto JPG, PNG o WebP.';
  if(file.size>5*1024*1024) return 'La foto deve essere più piccola di 5 MB.';
  return '';
}
export function setupEventCreation(client,getProfile) {
  const form=document.querySelector('#event-form'),message=document.querySelector('#event-message');
  const description=form.elements.description,photo=form.elements.photo,preview=document.querySelector('#event-photo-preview');
  const counter=document.querySelector('#description-counter'),position=document.querySelector('#venue-position');
  let map,marker,previewUrl,busy=false;
  function count(){counter.textContent=description.value.length+'/150 caratteri';}
  description.oninput=count;count();
  photo.onchange=()=>{
    if(previewUrl)URL.revokeObjectURL(previewUrl);
    preview.hidden=true;preview.removeAttribute('src');
    const file=photo.files[0];const error=validatePhoto(file);
    photo.setCustomValidity(error);message.textContent=file?error:'';
    if(!error){previewUrl=URL.createObjectURL(file);preview.src=previewUrl;preview.hidden=false;}
  };
  function choose(latlng){
    form.elements.latitude.value=latlng.lat.toFixed(6);form.elements.longitude.value=latlng.lng.toFixed(6);
    if(marker)marker.setLatLng(latlng);
    else marker=L.marker(latlng,{draggable:true}).addTo(map).on('dragend',()=>choose(marker.getLatLng()));
    position.textContent='Posizione selezionata. Puoi trascinare il segnaposto per correggerla.';
  }
  function showMap(){
    if(!window.L){position.textContent='Mappa non disponibile. Premi Ricarica mappa per riprovare.';return;}
    if(!map){
      map=L.map('venue-picker',{scrollWheelZoom:false}).setView([41.9028,12.4964],13);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
      map.on('click',e=>choose(e.latlng));
      new ResizeObserver(()=>map.invalidateSize()).observe(document.querySelector('#venue-picker'));
      document.querySelector('#use-map-center').onclick=()=>choose(map.getCenter());
    }
    map.invalidateSize();
  }
  document.querySelector('#reload-venue-map').onclick=showMap;
  new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))showMap();}).observe(document.querySelector('#venue-picker'));
  form.onsubmit=async e=>{
    e.preventDefault();if(busy)return;
    const profile=getProfile();if(!profile){message.textContent='Accedi per proporre un evento.';return;}
    const file=photo.files[0],photoError=validatePhoto(file);
    if(photoError){message.textContent=photoError;return;}
    const values=new FormData(form),text=String(values.get('description')).trim();
    if(!text||text.length>150){message.textContent='La descrizione deve contenere da 1 a 150 caratteri.';return;}
    if(!values.get('latitude')||!values.get('longitude')){message.textContent='Seleziona il luogo sulla mappa prima di inviare.';document.querySelector('#venue-picker').scrollIntoView({behavior:'smooth',block:'center'});return;}
    const latitude=Number(values.get('latitude')),longitude=Number(values.get('longitude'));
    if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){message.textContent='La posizione selezionata non è valida.';return;}
    const title=String(values.get('title')).trim(),venue=String(values.get('venue')).trim();
    if(!title||!venue){message.textContent='Inserisci titolo e nome del luogo.';return;}
    const startsAt=new Date(values.get('starts_at'));
    if(!Number.isFinite(startsAt.getTime())||startsAt<=new Date()){message.textContent='Scegli una data e un orario futuri.';return;}
    busy=true;
    const controls=[...form.querySelectorAll('input,textarea,select,button')];controls.forEach(el=>el.disabled=true);
    message.textContent='Caricamento foto e invio evento…';
    try{
      const {data:{user},error:authError}=await client.auth.getUser();
      if(authError||!user)throw new Error('Accedi di nuovo per inviare l’evento.');
      const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
      const path=user.id+'/'+crypto.randomUUID()+'.'+ext;
      const {error:uploadError}=await client.storage.from('event-photos').upload(path,file,{contentType:file.type,upsert:false});
      if(uploadError)throw new Error('Caricamento foto non riuscito. Riprova.');
      const {data:publicPhoto}=client.storage.from('event-photos').getPublicUrl(path);
      const {error}=await client.from('events').insert({
        title,venue,category:values.get('category'),description:text,is_lgbt:values.get('is_lgbt')==='on',
        starts_at:startsAt.toISOString(),latitude,longitude,
        image_url:publicPhoto.publicUrl,status:'pending',submitted_by:profile.id
      });
      if(error)throw new Error('Non è stato possibile inviare l’evento. I campi sono stati conservati.');
      form.reset();count();preview.hidden=true;preview.removeAttribute('src');
      if(previewUrl)URL.revokeObjectURL(previewUrl);
      if(marker){marker.remove();marker=null;}
      photo.setCustomValidity('');position.textContent='Tocca il punto esatto del luogo sulla mappa.';
      message.textContent='Evento e foto inviati. Saranno mostrati nel sito dopo l’approvazione.';
    }catch(error){message.textContent=error.message||'Invio non riuscito. Riprova.';}
    finally{busy=false;controls.forEach(el=>el.disabled=false);}
  };
}
