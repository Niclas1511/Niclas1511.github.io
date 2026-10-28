// Run from the repository root: gjs games/math-run/tests/runner-semesters.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
assert([0,1,2,6,100].map(game.meteorWindow).join(',')==='20,25,30,50,50','meteor window grows each semester');
const s=game.create();let previous=0;
for(let i=0;i<100;i++){
 game.fillPrimes(s);const n=Number(s.primeQueue.shift());
 assert(n>previous,'prime labels increase without recycling');
 for(let d=2;d*d<=n;d++)assert(n%d!==0,'generated label is genuinely prime');
 previous=n;
}
assert(previous===541,'first hundred consecutive primes');
const huge=game.create();huge.primeQueue=[];huge.primeCandidate='1000000000000000000000000000005';huge.primeDivisor='5';
game.fillPrimes(huge,1);
assert(BigInt(huge.primeCandidate)>1000000000000000000000000000005n,'candidate arithmetic remains exact beyond Number range');
assert(huge.primeQueue.length===0,'bounded budget yields instead of blocking');
for(const [wins,count] of [[0,1],[3,2],[6,3]]){
 const t=game.create();t.runTime=55;t.time=55;t.bossWins=wins;t.encounters=5;t.spawnIn=0;
 game.step(t,.001,()=>.99);
 const meteors=t.obstacles.filter(o=>o.kind==='prime');
 assert(meteors.length===count,'higher semesters unlock double and triple meteor showers');
 assert(new Set(meteors.map(o=>o.flightSpan)).size===count,'each meteor has a different angle');
}
for(let kind=0;kind<4;kind++){
 const t=game.create();t.bossCount=4+kind;t.nextBossAt=0;t.powerups.shield=100;game.step(t,.001);t.bossIntro=null;
 assert(t.boss.tier===1,'second cycle activates advanced boss');
 let scheduled=false,fired=false;
 for(let frame=0;frame<1800&&!fired;frame++){
  const pending=t.boss.echoIn;
  game.step(t,1/120);
  if(t.boss.echoIn!==null)scheduled=true;
  if(pending!==null&&t.boss.echoIn===null)fired=true;
 }
 assert(scheduled&&fired,'each advanced boss announces and fires a delayed follow-up');
}
assert(new Set([0,1,2,3].map(game.semesterAt)).size===4,'four rotating semester modifiers');
print('Passed: growing meteor windows, unbounded exact prime generation with bounded work, multi-angle showers, advanced bosses and semester modifiers.');
