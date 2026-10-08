export function setupAccountActions(client) {
  const logout=document.querySelector('#logout');
  const forgot=document.querySelector('#forgot-password');
  const dialog=document.createElement('div');
  dialog.className='modal';dialog.id='password-modal';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','password-heading');
  dialog.innerHTML='<article class="sheet"><button type="button" class="close" aria-label="Chiudi recupero password">×</button><h3 id="password-heading">Recupera password</h3><p id="password-help"></p><form id="recovery-form" style="display:grid;gap:12px;margin-top:20px"><label>Email<input name="email" type="email" class="search" autocomplete="email" required></label><button class="filter active">Invia link di recupero</button></form><form id="new-password-form" style="display:none;gap:12px;margin-top:20px"><label>Nuova password<input name="password" type="password" class="search" autocomplete="new-password" minlength="8" required></label><label>Ripeti password<input name="confirm" type="password" class="search" autocomplete="new-password" minlength="8" required></label><button class="filter active">Salva nuova password</button></form><p id="password-message" role="status"></p></article>';
  document.body.append(dialog);
  const recovery=dialog.querySelector('#recovery-form'),change=dialog.querySelector('#new-password-form'),message=dialog.querySelector('#password-message');
  let recovering=false;
  function open(reset=false){
    recovering=reset;recovery.style.display=reset?'none':'grid';change.style.display=reset?'grid':'none';
    dialog.querySelector('#password-heading').textContent=reset?'Scegli una nuova password':'Recupera password';
    dialog.querySelector('#password-help').textContent=reset?'Inserisci almeno 8 caratteri e conferma la nuova password.':'Riceverai un link via email. Se usi Google, puoi accedere con “Continua con Google”.';
    message.textContent='';document.querySelector('#auth-modal').classList.remove('open');dialog.classList.add('open');
  }
  dialog.querySelector('.close').onclick=()=>{dialog.classList.remove('open');change.reset();};
  forgot.onclick=()=>{open();recovery.elements.email.value=document.querySelector('#email').value;};
  logout.onclick=async()=>{
    logout.disabled=true;
    try{
      const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;
      location.reload();
    }catch{document.querySelector('#profile-message').textContent='Uscita non riuscita. Controlla la connessione e riprova.';}
    finally{logout.disabled=false;}
  };
  recovery.onsubmit=async e=>{
    e.preventDefault();const button=recovery.querySelector('button');if(button.disabled)return;
    const email=recovery.elements.email.value.trim();button.disabled=true;message.textContent='Invio in corso…';
    try{
      const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
      if(error)throw error;
      message.textContent='Se l’indirizzo è associato a un account, riceverai un link. Controlla anche la cartella spam.';
    }catch{message.textContent='Non riesco a inviare il link. Controlla l’indirizzo e riprova tra qualche minuto.';}
    finally{button.disabled=false;}
  };
  change.onsubmit=async e=>{
    e.preventDefault();const button=change.querySelector('button');if(button.disabled||!recovering)return;
    const password=change.elements.password.value;
    if(password.length<8||password!==change.elements.confirm.value){message.textContent='Le password devono coincidere e contenere almeno 8 caratteri.';return;}
    button.disabled=true;
    try{
      const {error}=await client.auth.updateUser({password});if(error)throw error;
      change.reset();change.style.display='none';recovering=false;
      message.textContent='Password aggiornata. Puoi chiudere questa finestra.';
    }catch{message.textContent='Non è stato possibile cambiare la password. Riprova o richiedi un nuovo link.';}
    finally{button.disabled=false;}
  };
  // Keep the auth callback synchronous: async API calls here can deadlock the client.
  client.auth.onAuthStateChange(event=>{
    if(event==='PASSWORD_RECOVERY')open(true);
    if(event==='SIGNED_OUT')location.reload();
  });
  const urlError=new URLSearchParams(location.hash.slice(1)).get('error');
  if(urlError){open();message.textContent='Il link non è valido o è scaduto. Richiedine uno nuovo.';}
}
