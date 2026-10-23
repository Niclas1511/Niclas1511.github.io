// Run from the repository root: gjs tests/runner-sound.test.js
const GLib=imports.gi.GLib;
function read(path){const [,bytes]=GLib.file_get_contents(path);return new TextDecoder().decode(bytes);}
function assert(ok,message){if(!ok)throw Error(message);}
const contexts=[];
function parameter(){return {value:0,setValueAtTime(v,t){assert(Number.isFinite(v)&&t>=0,'valid audio parameter');},linearRampToValueAtTime(v,t){assert(v>=0&&t>=0,'valid attack');},exponentialRampToValueAtTime(v,t){assert(v>0&&t>=0,'positive exponential ramp');}};}
class AudioMock {
 constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=44100;this.destination={};this.nodes=[];contexts.push(this);}
 resume(){this.state='running';return Promise.resolve();}
 createGain(){return {gain:parameter(),connect(){},disconnect(){}};}
 createBuffer(channels,length){return {getChannelData(){return new Float32Array(length);}};}
 createOscillator(){return this.node();}
 createBufferSource(){return this.node();}
 node(){const n={frequency:parameter(),playbackRate:parameter(),connect(){},disconnect(){},start(t){this.started=t;},stop(t){this.stopped=t??'immediate';}};this.nodes.push(n);return n;}
}
const audio=new Function('window',read('runner-sound.js')+';return RunnerSound;')({AudioContext:AudioMock});
const button={events:{},setAttribute(k,v){this[k]=v;},addEventListener(k,fn){this.events[k]=fn;}},status={};
const effects=audio.create(button,status);
assert(!contexts.length,'no audio context until a user gesture');
effects.play('jump');assert(!contexts.length,'events cannot unlock audio');
effects.unlock();const context=contexts[0];
for(const cue of Object.keys(audio.cues)){
 context.currentTime+=1;const before=context.nodes.length;effects.play(cue);
 assert(context.nodes.length>before,'cue schedules '+cue);
 const count=context.nodes.length;effects.play(cue);assert(context.nodes.length===count,'duplicate events throttled '+cue);
 effects.stop();assert(context.nodes.slice(before).every(n=>n.stopped==='immediate'),'stop cancels every voice');
}
context.currentTime+=1;
const defeatStart=context.nodes.length;effects.play('over');
const defeat=context.nodes.slice(defeatStart);
assert(defeat.length===4 && defeat.every((n,i)=>!i||n.started>defeat[i-1].started),'defeat plays four descending steps');
effects.stop();
const before=context.nodes.length;
effects.drain({sounds:['jump','doubleJump','throw']});assert(context.nodes.length===before+3,'queue plays separate actions');
const state={sounds:['hit']};effects.drain(state);assert(!state.sounds.length,'queue drains once');
effects.stop();context.currentTime+=1;
const capStart=context.nodes.length;
for(let i=0;i<100;i++){context.currentTime+=.08;effects.play('jump');}
assert(context.nodes.length-capStart===20,'voice budget limits simultaneous sources to twenty');
const limited=context.nodes.length;effects.play('hit');assert(context.nodes.length===limited,'simultaneous voice cap');
effects.setMuted(true);const globalCount=context.nodes.length;effects.play('jump');
assert(context.nodes.length===globalCount,'master mute suppresses effects');
effects.setMuted(false);context.currentTime+=1;effects.play('jump');
assert(context.nodes.length>globalCount,'master unmute restores enabled effects');
button.events.click();const muted=context.nodes.length;effects.play('jump');assert(context.nodes.length===muted&&button['aria-pressed']==='false','mute independent of music');
const engine=new Function(read('runner-engine.js')+';return MathRunner;')();
let s=engine.create();s.spawnIn=Infinity;s.nextBossAt=Infinity;
engine.jump(s);engine.jump(s);engine.jump(s);
assert(s.sounds.join(',')==='jump,doubleJump','only successful jumps emit effects');
s=engine.create();s.chalk=0;engine.throwChalk(s);assert(s.sounds.includes('empty')&&!s.sounds.includes('throw'),'empty ammo feedback');
s=engine.create();s.powerups.spread=10;engine.throwChalk(s);
assert(s.sounds.filter(c=>c==='spread').length===1,'triple volley has one throw effect');
s=engine.create();s.hagoromo=1;s.spawnIn=Infinity;s.nextBossAt=Infinity;
s.obstacles=[{x:220,y:214,w:35,h:12,speed:1},{x:240,y:192,w:35,h:28,speed:1}];engine.throwChalk(s);
for(let i=0;i<40;i++)engine.step(s,1/120);
assert(s.sounds.filter(c=>c==='explosion').length===1,'one explosion effect regardless of target count');
assert(s.sounds.includes('giant')&&s.sounds.includes('hit'),'throw and impacts emit cues');
for (const streak of [8,9,19,29]) {
 s=engine.create();s.streak=streak;s.multiplier=streak;s.spawnIn=Infinity;s.nextBossAt=Infinity;
 s.obstacles=[{x:180,y:214,w:35,h:12,speed:1}];engine.throwChalk(s);
 for(let i=0;i<40;i++)engine.step(s,1/120);
 assert(s.sounds.filter(c=>c==='reward').length===((streak+1)%10===0?1:0),'success sound only at each Hagoromo milestone');
 assert(!s.sounds.includes('combo'),'ordinary combo increments stay silent');
}
print('Passed: all synthesized effects, gesture gating, envelopes, throttling, voice limits, mute, queue draining and gameplay event semantics.');
