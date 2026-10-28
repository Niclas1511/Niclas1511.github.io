// Run from the repository root: gjs games/math-run/tests/runner-primes.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
function spawn(width=420,time=55,wins=0){
 const s=game.create(width);s.time=time;s.runTime=time;s.encounters=1;s.bossWins=wins;s.spawnIn=0;
 game.step(s,.001,()=>.99);return s;
}
assert(!spawn(420,39).obstacles.some(o=>o.kind==='prime'),'no prime shots before meteor window');
const warning=spawn(420,38.5);
assert(warning.primeWarning&&warning.popups.some(p=>p.text==='PRIME ASTEROIDS INCOMING'),'advance warning precedes prime fire');
for(const width of [420,960])for(const dt of [1/30,1/60,1/120])for(const dodge of [false,true])for(const wins of [0,100]){
 const s=spawn(width,59,wins),prime=s.obstacles.find(o=>o.kind==='prime');
 assert(prime&&prime.prime==='2','prime shot appears through encounter scheduler');
 s.obstacles=[prime];s.spawnIn=Infinity;s.nextBossAt=Infinity;s.duck=!dodge;
 let sawFall=false, sawDiagonal=false;
 for(let i=0;i<Math.ceil(8/dt)&&!s.over;i++){
  const remaining=(prime.x-100)/prime.speed;
  if(prime.y>8&&prime.y<prime.baseY&&prime.x<width)sawFall=true;
  if(dodge&&remaining<.16&&remaining>-.1&&s.y===252){s.duck=false;s.jumpHeld=true;game.jump(s);}
  const oldX=prime.x,oldY=prime.y;
  game.step(s,dt);
  if(prime.y>oldY&&prime.y<prime.baseY){
   assert(oldX-prime.x>(prime.y-oldY)*1.2,'comet flies on a shallow diagonal from the right');
   sawDiagonal=true;
  }
 }
 assert(sawFall&&sawDiagonal&&prime.impacted,'asteroid descends visibly and impacts the ground');
 assert(dodge?!s.over:s.over,'jump avoids landed asteroid; permanent ducking fails');
}
{
 const s=spawn();const prime=s.obstacles.find(o=>o.kind==='prime');
 s.obstacles=[prime];s.spawnIn=Infinity;s.nextBossAt=Infinity;
 while(!prime.impacted)game.step(s,1/120);
 prime.x=180;s.duck=true;game.throwChalk(s);for(let i=0;i<50&&!s.over;i++)game.step(s,1/120);
 assert(prime.destroyed,'normal chalk intercepts prime shot');
}
for(let serial=0;serial<22;serial++){
 const s=game.create();s.time=55;s.runTime=55;s.encounters=1;s.primeSerial=serial;s.spawnIn=0;
 game.step(s,.001,()=>.99);const n=Number(s.obstacles.find(o=>o.kind==='prime').prime);
 assert(n>=2&&!Array.from({length:n-2},(_,i)=>i+2).some(d=>n%d===0),'every projectile is a prime');
}
print('Passed: final-ten-second prime fire, advance warning, genuine primes, asteroid jump routes at 30/60/120 FPS and chalk interception.');
