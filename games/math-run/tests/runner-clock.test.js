// Run from the repository root: gjs games/math-run/tests/runner-clock.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
const type=game.flyers.find(o=>o.kind==='clock');
assert(type&&type.w===30&&type.h===30,'small clock is part of the encounter pool');
{
 const s=game.create(420);s.spawnIn=0;s.nextBossAt=Infinity;
 const values=[.4,.2,0,(6.1)/game.flyers.length,.5];
 game.step(s,.001,()=>values.shift());assert(s.obstacles[0].kind==='clock','clock spawns through normal scheduler');
}
for(const dt of [1/30,1/60,1/120])for(const speed of [180,320,550])for(const low of [false,true]){
 const s=game.create(420);s.spawnIn=Infinity;s.nextBossAt=Infinity;
 const approach=.8;
 const age=(low?Math.PI/2:Math.PI*1.5)/2.2-approach;
 const o={...type,x:100+speed*approach,speed,age,baseY:177};s.obstacles=[o];
 for(let i=0;i<Math.ceil(3/dt)&&!s.over;i++){
  const remaining=(o.x-100)/speed;
  s.duck=!low;
  if(low&&remaining<.16&&remaining>-.1&&s.y===252){s.jumpHeld=true;game.jump(s);}
  game.step(s,dt);
 }
 assert(!s.over,'jump over low clock and duck under high clock at each speed/frame rate');
}
{
 const s=game.create();s.spawnIn=Infinity;s.nextBossAt=Infinity;s.powerups.shield=20;
 const o={...type,x:900,speed:1,age:0,baseY:177};s.obstacles=[o];let min=300,max=0,up=false,down=false,last=o.y;
 for(let i=0;i<480;i++){game.step(s,1/120);min=Math.min(min,o.y);max=Math.max(max,o.y);up ||= o.y<last;down ||= o.y>last;last=o.y;}
 assert(up&&down&&min<133&&max>221,'clock travels repeatedly between high and ground level');
 o.x=135;o.age=0;o.y=177;s.y=214;s.vy=0;game.throwChalk(s);
 for(let i=0;i<30;i++)game.step(s,1/120);
 assert(o.destroyed,'chalk destroys the moving clock');
}
print('Passed: clock scheduling, vertical oscillation, jump/duck routes at 30/60/120 FPS and chalk clearing.');
