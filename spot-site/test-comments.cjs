const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/dist/index.html','utf8');
const handler=html.slice(html.indexOf('      async function addComment('),html.indexOf("      window.addEventListener('spot:event-open'"));
async function check(mode) {
  const field={value:'  Bel concerto!  '},button={},messages=[],items=[];
  const comments={querySelector:()=>null,prepend:item=>items.push(item)};
  const form={dataset:{},parentElement:{querySelector:()=>comments},
    querySelector:s=>s==='[name="body"]'?field:s==='[type="submit"]'?button:messages[0],
    append:m=>messages.push(m)};
  let inserts=0,login=false;
  const context={document:{createElement:()=>({style:{},setAttribute(){}})},
    authModal:{classList:{add:()=>login=true}},
    supabase:{auth:{getUser:async()=>({data:{user:mode==='logged-out'?null:{id:'user'}}})},
      from:()=>({insert:async payload=>{inserts++;assert.equal(payload.body,'Bel concerto!');return {error:mode==='error'?new Error('network'):null};}})}};
  vm.createContext(context);vm.runInContext(handler,context);
  const event={currentTarget:form,preventDefault(){}};
  const pending=context.addComment(event,{id:'event'});
  // Native event.currentTarget is cleared after dispatch.
  event.currentTarget=null;
  await context.addComment({currentTarget:form,preventDefault(){}},{id:'event'});
  await pending;
  assert.equal(inserts,mode==='logged-out'?0:1);
  assert.equal(button.disabled,false);
  assert.equal(field.disabled,false);
  if(mode==='success'){assert.equal(field.value,'');assert.equal(items[0].textContent,'Bel concerto!');}
  else{assert.equal(field.value,'  Bel concerto!  ');assert.match(messages[0].textContent,/conservato/);}
  assert.equal(login,mode==='logged-out');
}
(async()=>{for(const mode of ['success','error','logged-out'])await check(mode);console.log('PASS: async event lifecycle, duplicate clicks, success, failed save, expired login.');})().catch(e=>{console.error(e);process.exitCode=1;});
