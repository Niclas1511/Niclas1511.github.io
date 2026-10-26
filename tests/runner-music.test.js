// Run from the repository root: gjs tests/runner-music.test.js
const GLib=imports.gi.GLib;
const [,code]=GLib.file_get_contents('runner-music.js');
const music=new Function(new TextDecoder().decode(code)+';return RunnerMusic;')();
function assert(ok,message){if(!ok)throw Error(message);}
for(const file of ['mozart-rondo-alla-turca.mid','bach-prelude-c-major.mid','reviewer-2-boss.mid','liszt-liebestraum-no-3.mid','bach-italian-concerto-1.mid','bach-italian-concerto-2.mid']) {
 const [,bytes]=GLib.file_get_contents('assets/music/'+file);
 const song=music.parse(bytes.buffer);
 assert(song.notes.length>500 && song.duration>(file==='reviewer-2-boss.mid'?40:60) && song.duration<600,'complete piece '+file);
 assert(song.notes.every(n=>n.pitch>=0 && n.pitch<=127 && n.duration>0 && n.time>=0),'valid note events');
 assert(song.notes.every((n,i)=>!i || n.time>=song.notes[i-1].time),'chronological notes');
 print(file+': '+song.notes.length+' notes, '+song.duration.toFixed(1)+' seconds');
}
// Format 0, running status, note-on velocity zero, two tempi.
const track=[0,255,81,3,7,161,32,0,144,60,100,96,60,0,0,255,81,3,15,66,64,0,144,64,80,96,128,64,0,0,255,47,0];
const bytes=new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,0,96,77,84,114,107,0,0,0,track.length,...track]);
const song=music.parse(bytes.buffer);
assert(song.notes.length===2 && song.notes[0].duration===.5 && song.notes[1].time===.5 && song.notes[1].duration===1,'tempo changes and running status');
let rejected=false;try{music.parse(bytes.slice(0,25).buffer);}catch(_){rejected=true;}assert(rejected,'truncated MIDI rejected');
print('Passed: complete local MIDI files, tempo map, running status, note-off semantics and malformed-file handling.');

const contexts=[], intervals=new Map();let nextTimer=0, fetches=0;
globalThis.setInterval=callback=>{intervals.set(++nextTimer,callback);return nextTimer;};
globalThis.clearInterval=id=>intervals.delete(id);
class AudioMock {
 constructor(){this.currentTime=0;this.state='suspended';this.destination={};this.voices=[];contexts.push(this);}
 resume(){this.state='running';return Promise.resolve();}
 suspend(){this.state='suspended';return Promise.resolve();}
 createGain(){return {gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
 createOscillator(){const voice={frequency:{value:0},connect(){},disconnect(){},start(time){this.startTime=time;},stop(time){this.stopTime=time;}};this.voices.push(voice);return voice;}
}
globalThis.window={AudioContext:AudioMock};
globalThis.fetch=async path=>{fetches++;const [,bytes]=GLib.file_get_contents(path);return {ok:true,arrayBuffer:async()=>bytes.buffer};};
function element(value=''){return {value,listeners:{},textContent:'',attributes:{},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;}};}
const loop=new GLib.MainLoop(null,false);
async function playback(){
 const button=element(), select=element('assets/music/mozart-rondo-alla-turca.mid'), status=element();
 const requests=[];
 const player=new Function('window','fetch','setInterval','clearInterval',new TextDecoder().decode(code)+';return RunnerMusic;')({AudioContext:AudioMock}, async path=>{requests.push(path);return globalThis.fetch(path);}, callback=>{intervals.set(++nextTimer,callback);return nextTimer;}, id=>intervals.delete(id));
 const controller=player.create(button,select,status,()=>0);
 const flush=async()=>{for(let i=0;i<14;i++)await Promise.resolve();};
 assert(!contexts.length && !fetches && button.attributes['aria-pressed']==='true','music defaults on but website stays silent');
 controller.setRunning(true);await flush();
 const context=contexts[0];
 assert(requests[0].endsWith('liszt-liebestraum-no-3.mid'),'seeded random selection chooses first classical track');
 assert(context.state==='running' && context.voices.length>0 && fetches===1,'Start automatically plays game music');
 assert(context.voices.every(v=>['square','triangle'].includes(v.type)),'8-bit oscillator timbres');
 controller.setRunning(false);await flush();assert(context.state==='suspended','pause freezes music');
 const count=context.voices.length;for(const callback of intervals.values())callback();
 assert(context.voices.length===count,'paused scheduler is silent');
 await controller.toggle();assert(button.attributes['aria-pressed']==='false','mute updates control');
 controller.setRunning(true);await flush();assert(context.state==='suspended','starting muted game does not play');
 await controller.toggle();assert(context.state==='running' && fetches===1,'unmute resumes cached game music');
 // Complete all five classical pieces and return to Liebestraum.
 for(const next of ['mozart-rondo-alla-turca.mid','bach-prelude-c-major.mid','bach-italian-concerto-1.mid','bach-italian-concerto-2.mid','liszt-liebestraum-no-3.mid']) {
  const end=context.currentTime+600;
  context.currentTime=end;
  for(let i=0;i<3;i++){for(const callback of [...intervals.values()])callback();await flush();}
  assert(select.value.endsWith(next),'playlist advances to '+next);
 }
 assert(fetches===5,'all five classical pieces cached');
 context.currentTime+=10;
 const classicalPath=select.value;
 controller.setBoss(true);await flush();
 assert(requests.at(-1).endsWith('reviewer-2-boss.mid') && context.state==='running','dedicated boss theme');
 const duringBoss=requests.length;
 await controller.next();assert(select.value===classicalPath,'skip cannot interrupt boss music');select.listeners.change();await flush();
 assert(requests.length===duringBoss,'track selector cannot interrupt boss theme');
 context.currentTime+=100;
 for(let i=0;i<3;i++){for(const callback of [...intervals.values()])callback();await flush();}
 assert(select.value===classicalPath && requests.length===duringBoss,'boss loops instead of advancing classical playlist');
 controller.setRunning(false);await flush();assert(context.state==='suspended','boss theme pauses with game');
 controller.setRunning(true);await flush();
 const beforeReturn=context.voices.length;
 controller.setBoss(false);await flush();
 assert(fetches===6 && context.voices.length>beforeReturn,'victory restores cached classical music');
 const [,mozartBytes]=GLib.file_get_contents(classicalPath);
 const expected=music.parse(mozartBytes.buffer).notes.find(note=>note.time>=9.94);
 assert(context.voices[beforeReturn].frequency.value===440*2**((expected.pitch-69)/12),'classical piece resumes saved position');
 controller.setBoss(true);controller.setBoss(false);await flush();
 assert(fetches===6 && button.attributes['aria-pressed']==='true','rapid arena transitions reuse cache');
 await controller.setMuted(true);assert(context.state==='suspended','master mute suspends music');
 await controller.setMuted(false);assert(context.state==='running','master unmute resumes enabled music');
 controller.setRunning(false);await flush();assert(context.state==='suspended','game over silences music');
 await controller.toggle();await controller.toggle();assert(context.state==='suspended','music button cannot play website background music');
 await controller.next();assert(select.value.endsWith('mozart-rondo-alla-turca.mid'),'manual skip advances playlist');
 for(const [i,name] of ['liszt-liebestraum-no-3.mid','mozart-rondo-alla-turca.mid','bach-prelude-c-major.mid','bach-italian-concerto-1.mid','bach-italian-concerto-2.mid'].entries()) {
  controller.restart(()=> (i+.5)/5);
  assert(select.value.endsWith(name),'random start can select '+name);
 }
 controller.restart(()=>0);
 controller.setRunning(true);await flush();
 assert(context.state==='running','new run still starts music');
 globalThis.fetch=async()=>({ok:false});select.value='missing.mid';select.listeners.change();await flush();
 assert(button.attributes['aria-pressed']==='false' && status.textContent.includes('unavailable') && context.state==='suspended','load failure disables music gracefully');
 print('Passed: automatic game-only playback, mute, pause/game over, complete classical playlist rotation, boss looping/restoration, cache and load failure.');
}

let failure;
playback().then(()=>loop.quit(),error=>{failure=error;loop.quit();});
loop.run();
if(failure)throw failure;
