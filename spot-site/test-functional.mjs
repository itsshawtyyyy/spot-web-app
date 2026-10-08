import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {matchesCategory} from './dist/event-categories.js';
import {validatePhoto} from './dist/event-create.js';
import {isEmoji,toggleReaction} from './dist/event-reactions.js';
import {validCoordinates} from './dist/event-map.js';
import {eventDate} from './dist/events-data.js';
assert(matchesCategory({category:'Party'},'DJ SET'));
assert(matchesCategory({category:'Mostre'},'Live/Mostre Art'));
assert(matchesCategory({category:'Concerti'},'Live/Mostre Art'));
assert(!matchesCategory({category:'Party'},'Techno'));
assert(matchesCategory({is_lgbt:true},'LGBT+'));
assert(!matchesCategory({is_lgbt:false},'LGBT+'));
assert(validatePhoto({type:'image/svg+xml',size:2}));
assert(validatePhoto({type:'image/jpeg',size:6*1024*1024}));
assert.equal(validatePhoto({type:'image/webp',size:1024}),'');
assert(isEmoji('🏳️‍🌈'));assert(isEmoji('🥳'));assert(!isEmoji('ciao'));assert(!isEmoji('🔥🔥'));
assert(validCoordinates({latitude:0,longitude:0}));assert(!validCoordinates({latitude:91,longitude:12}));
assert.equal(eventDate({starts_at:'invalid'}),'Data da confermare');
assert(eventDate({starts_at:'2026-10-01T19:30:00Z'}).includes('21:30'));
let stored=false;
const client={from(){return {select(){const q={eq(){return q;},then(resolve){return Promise.resolve({data:stored?[{id:'test'}]:[],error:null}).then(resolve);}};return q;},upsert(){stored=true;return Promise.resolve({error:null});},delete(){const q={eq(){return q;},then(resolve){stored=false;return Promise.resolve({error:null}).then(resolve);}};return q;}};}};
await toggleReaction(client,'event','user','🥳');assert(stored);
await toggleReaction(client,'event','user','🥳');assert(!stored);
for(const file of readdirSync(new URL('./dist/',import.meta.url)).filter(f=>f.endsWith('.js'))){const result=spawnSync(process.execPath,['--check',new URL('./dist/'+file,import.meta.url).pathname.replace(/^\/(\w:)/,'$1')],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
const html=readFileSync(new URL('./dist/index.html',import.meta.url),'utf8');
for(const script of html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)){const result=spawnSync(process.execPath,['--input-type=module','--check'],{input:script[1],encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
console.log('PASS: category compatibility, LGBT tag, photo validation, custom emojis, reaction toggle, coordinates, Rome dates, all module syntax.');
