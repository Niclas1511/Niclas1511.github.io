// Run from the repository root: gjs games/math-run/tests/runner-stress.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
assert(game.stressAt(39,60).intensity===0,'stress starts in final twenty seconds');
assert(game.stressAt(50,60).countdown===10&&game.stressAt(57,60).countdown===3,'countdown has correct seconds');
assert(game.stressAt(500,Infinity).intensity===0,'disabled bosses disable stress');
assert(game.stressAt(43,60).recovery&&!game.stressAt(44,60).recovery,'waves alternate with recovery');
assert(game.stressAt(103,120).intensity===game.stressAt(43,60).intensity,'stress repeats for each semester');
for(const dt of [1/30,1/60,1/120]){
 const s=game.create();s.runTime=50.001;s.time=50.001;s.spawnIn=Infinity;
 for(let i=0;i<Math.round(3/dt);i++)game.step(s,dt);
 assert(s.sounds.filter(c=>c==='tick').length===4,'countdown sounds once per second independent of FPS');
 assert(s.popups.length<=2,'wave announcements do not repeat every frame');
}
function encounter(time){const s=game.create();s.time=time;s.runTime=time;s.encounters=0;s.spawnIn=0;game.step(s,.001,()=>.99);return s;}
const wave=encounter(52),rest=encounter(55);
assert(rest.spawnIn>wave.spawnIn+.9,'recovery reserves a longer gap without tightening pattern steps');
print('Passed: semester stress thresholds, countdown cadence, recurring waves and extra recovery gaps.');

for(const [wins,duration] of [[0,20],[1,25],[2,30],[5,45],[100,45]]){
 assert(game.stressAt(60-duration-.01,60,wins).intensity===0,'stress does not start early');
 assert(game.stressAt(60-duration+.01,60,wins).intensity>0,'stress extends after boss wins');
}
assert(game.stressAt(62,60).intensity===1,'stress persists while waiting for hazards to clear');
