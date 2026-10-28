// Run from the repository root: gjs games/math-run/tests/runner-scores.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-scores.js');
const scores=new Function(new TextDecoder().decode(bytes)+';return RunnerScores;')();
function assert(ok,message){if(!ok)throw Error(message);}
let data=null;const storage={getItem(){return data;},setItem(k,v){data=v;}};
const date='2026-10-26T12:00:00.000Z';
assert(!scores.read(storage).entries.length,'empty browser starts with empty leaderboard');
let result=scores.record(storage,'  Ada   Lovelace  ',120,date);
assert(result.ok&&result.entries[0].name==='Ada Lovelace','name and score saved');
assert(scores.read(storage).entries[0].score===120,'scores survive a new read');
result=scores.record(storage,'ADA LOVELACE',80,date);assert(result.ok&&!result.improved&&result.entries.length===1&&result.entries[0].score===120,'lower result cannot replace personal best');
result=scores.record(storage,'ada lovelace',150,date);assert(result.entries.length===1&&result.entries[0].score===150,'higher result replaces previous name entry');
for(let i=0;i<15;i++)scores.record(storage,'Player '+i,i*20,date);
assert(scores.read(storage).entries.length===10&&scores.read(storage).entries[0].score===280,'top ten sorted and bounded');
assert(!scores.record(storage,'',12,date).ok&&!scores.record(storage,'A',Infinity,date).ok,'empty names and invalid scores rejected');
assert(Array.from(scores.cleanName('😀'.repeat(30))).length===20,'names limited without breaking Unicode');
data='not json';assert(!scores.read(storage).entries.length&&scores.read(storage).available,'corrupt data can be replaced safely');
data=JSON.stringify([null,{name:'X',score:-1,date},{name:'Y',score:10,date:'invalid'},{name:'Z',score:30,date}]);assert(scores.read(storage).entries.length===1,'invalid stored entries ignored');
const blocked={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
assert(!scores.read(blocked).available&&!scores.record(blocked,'A',1,date).ok,'denied storage has clear failure');
const quota={getItem(){return '[]';},setItem(){throw Error('quota');}};
assert(!scores.record(quota,'A',1,date).ok,'quota errors do not pretend to save');
function element(){return {events:{},hidden:false,value:'',disabled:false,textContent:'',children:[],addEventListener(k,fn){this.events[k]=fn;},replaceChildren(...nodes){this.children=nodes;}};}
const elements={};for(const key of ['form','input','save','skip','list','message','status'])elements[key]=element();
data=null;const controller=scores.create(elements,storage,{createElement:()=>element()});
assert(elements.form.hidden,'name form hidden until game over');
controller.offer(42);assert(!elements.form.hidden&&!elements.save.disabled,'game over offers voluntary save');
elements.input.value='<img src=x onerror=alert(1)>';elements.form.events.submit({preventDefault(){}});
assert(elements.form.hidden&&elements.list.children.length===1,'submission saves and closes form');
assert(elements.list.children[0].textContent.startsWith('<img'),'names rendered as literal text, never HTML');
const saved=data;elements.form.events.submit({preventDefault(){}});assert(data===saved,'completed run cannot be submitted twice');
controller.offer(90);elements.skip.events.click();assert(data===saved&&elements.form.hidden,'Skip stores no named score');
controller.offer(100);controller.dismiss();assert(data===saved&&elements.form.hidden,'restarting dismisses unsaved run');
const unavailable=scores.create(elements,blocked,{createElement:()=>element()});unavailable.offer(200);
assert(elements.save.disabled&&!elements.form.hidden,'storage denial keeps skip available and disables save');
print('Passed: local persistence, optional names/skip, personal bests, top 10, Unicode and literal rendering, invalid data, duplicate submission and storage failures.');
