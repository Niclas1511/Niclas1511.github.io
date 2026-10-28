// Run from the repository root: gjs games/math-run/tests/runner-skip-boss.test.js
const GLib=imports.gi.GLib;
const [,bytes]=GLib.file_get_contents('games/math-run/runner-engine.js');
const game=new Function(new TextDecoder().decode(bytes)+';return MathRunner;')();
function assert(ok,message){if(!ok)throw Error(message);}
assert(!game.skipBoss(game.create()),'skip has no effect outside an arena');
for(let boss=0;boss<4;boss++){
 const s=game.create();s.bossCount=boss;s.nextBossAt=0;game.step(s,.001);
 assert(s.boss&&s.bossIntro,'boss starts its cinematic');
 const lives=s.lives,bonus=s.bonus,time=s.runTime;
 assert(game.skipBoss(s),'can skip any boss including its cinematic');
 assert(!s.boss&&!s.bossIntro&&!s.enemyShots.length,'skip clears boss and intro');
 assert(s.bossWins===1&&s.bossCount===boss+1,'next semester progression is preserved');
 assert(s.lives===lives&&s.bonus===bonus,'skip preserves health without granting combat score');
 assert(s.nextBossAt===time+60,'next boss is scheduled after sixty running seconds');
 assert(!game.skipBoss(s)&&s.bossWins===1,'repeated click cannot skip another semester');
}
print('Passed: skipping all bosses, intro cleanup, next-semester difficulty, preserved health and no repeated skip.');

const phaseRun=game.create();phaseRun.obstacles=[{x:90,y:220,w:30,h:30}];phaseRun.items=[{kind:'heart'}];
for(const expected of [24,48,60]){
 assert(game.skipPhase(phaseRun)&&phaseRun.runTime===expected,'phase skip advances to next phase or boss deadline');
 assert(!phaseRun.obstacles.length&&!phaseRun.items.length,'old encounter hazards and rewards are cleared');
}
assert(phaseRun.boss&&phaseRun.bossIntro,'skip starts boss immediately at deadline');
assert(game.skipPhase(phaseRun)&&phaseRun.bossWins===1&&!phaseRun.boss,'same action skips boss');
assert(phaseRun.lives===1&&phaseRun.bonus===0&&phaseRun.distance===0,'phase skip does not grant health, score or distance');
assert(game.skipPhase(phaseRun)&&phaseRun.runTime===72,'next semester follows the phase clock');
phaseRun.over=true;assert(!game.skipPhase(phaseRun),'game-over run cannot skip phases');
const late=game.create();late.runTime=61;assert(game.skipPhase(late)&&late.boss&&late.runTime===61,'waiting for boss never rewinds the running clock');
print('Passed: general phase skip, boss transition/skip, hazard cleanup and no free rewards.');
