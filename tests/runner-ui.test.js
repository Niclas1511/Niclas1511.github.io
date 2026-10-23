// Run from the repository root: gjs tests/runner-ui.test.js
const GLib = imports.gi.GLib;
function read(path) {const [,bytes]=GLib.file_get_contents(path);return new TextDecoder().decode(bytes);}
const MathRunner = new Function(read('runner-engine.js')+'; return MathRunner;')();
let currentState;
const originalCreate=MathRunner.create;
MathRunner.create=width=>(currentState=originalCreate(width));
let jumpCalls=0, throwCalls=0;
const originalJump=MathRunner.jump, originalThrow=MathRunner.throwChalk;
MathRunner.jump=state=>{jumpCalls++;return originalJump(state);};
MathRunner.throwChalk=state=>{throwCalls++;return originalThrow(state);};
function assert(value,message){if(!value)throw Error(message);}
function element(){return {events:{},textContent:'',disabled:false,hidden:false,attrs:{},
 addEventListener(type,fn){(this.events[type] ||= []).push(fn)},
 setAttribute(name,value){this.attrs[name]=value},focus(){},setPointerCapture(){},
 fire(type,event={}){for(const fn of this.events[type] || [])fn(event)}};}
const elements={};
const canvas=elements['#runner-canvas']=element();canvas.width=960;canvas.height=320;
canvas.parentElement={clientWidth:440};
canvas.getBoundingClientRect=()=>({left:10,top:20,width:canvas.width/2,height:160});
let draws=0;const drawnText=[];
canvas.getContext=()=>({fillRect(){draws++},fillText(text){drawnText.push(text);}});
const document=element();document.body=element();
document.querySelector=selector=>elements[selector] ||= element();
const window=element();
// Storage denial must not prevent play.
const localStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
let nextFrame=0;const callbacks=new Map();
function requestAnimationFrame(fn){callbacks.set(++nextFrame,fn);return nextFrame;}
function cancelAnimationFrame(id){callbacks.delete(id);}
function advance(time){const entries=[...callbacks];callbacks.clear();for(const [,fn] of entries)fn(time);}
eval(read('runner.js'));
assert(draws>0,'initial pixel scene draws');assert(canvas.width===440,'responsive world width');
assert(!callbacks.size,'ready screen does not animate');
const start=elements['#runner-start'],pause=elements['#runner-pause'];
start.fire('click');assert(elements['#runner-overlay'].hidden,'start hides overlay');
assert(!pause.disabled && callbacks.size===1,'starts exactly one loop');
const key=code=>({code,target:canvas,repeat:false,preventDefault(){}});
document.fire('keydown',key('ArrowUp'));document.fire('keydown',key('ArrowUp'));
document.fire('keydown',{...key('ArrowUp'),repeat:true});
assert(jumpCalls===2,'separate presses allow double jump; held key does not repeat');
document.fire('keydown',key('KeyX'));
document.fire('keydown',{...key('KeyX'),repeat:true});
assert(throwCalls===1,'X throws once per press');
advance(16);advance(32);
assert(elements['#runner-chalk-count'].textContent==='2','chalk counter updates');
window.fire('blur');assert(!callbacks.size && !elements['#runner-overlay'].hidden,'blur pauses');
assert(elements['#runner-chalk'].disabled,'chalk disabled while paused');
document.fire('keydown',key('KeyX'));assert(throwCalls===1,'no throws while paused');
assert(start.textContent==='Resume','resume action');start.fire('click');
let prevented=false;
document.fire('keydown',{code:'KeyP',target:canvas,repeat:false,preventDefault(){prevented=true}});
assert(prevented && !callbacks.size,'P pauses');pause.fire('click');
assert(callbacks.size===1,'pause button resumes without duplicate loops');
elements['#runner-chalk'].fire('pointerdown',{preventDefault(){}});
assert(throwCalls===2,'touch chalk button connected');
const duck=elements['#runner-duck'];duck.fire('pointerdown',{pointerId:1,preventDefault(){}});
assert(duck.attrs['aria-pressed']==='true','touch duck held');
duck.fire('pointercancel',{pointerId:1});assert(duck.attrs['aria-pressed']==='false','cancel releases duck');
window.fire('blur');start.fire('click');
for(let i=1;i<4000 && callbacks.size;i++)advance(i*1000/60);
assert(!callbacks.size,'game stops on collision');
assert(start.textContent==='Try again' && pause.disabled,'game over controls');
const oldScore=Number(elements['#runner-score'].textContent);
assert(oldScore>0 && Number(elements['#runner-best'].textContent)===oldScore,'score and best update with unavailable storage');
start.fire('click');assert(elements['#runner-score'].textContent==='0' && callbacks.size===1,'restart resets score and loop');
let renderTime=100000;
for(const flyer of MathRunner.flyers){
    currentState.obstacles=[{...flyer,x:canvas.width-120,baseY:flyer.y,age:0,speed:280}];
    advance(renderTime+=17);
    currentState.obstacles[0].x=canvas.width+100;
    advance(renderTime+=17);
    assert(drawnText.includes(flyer.label),'warning renderer covers '+flyer.kind);
}
for(const text of ['Quick question!','URGENT','REVIEWER 2','ε','δ','PSET','ABSTRACT','DUE TODAY']){
    assert(drawnText.includes(text),'pixel motif renderer covers '+text);
}
currentState.obstacles=[{...MathRunner.flyers[0],x:250,baseY:176,age:0,speed:280,resolved:true}];
advance(renderTime+=17);
currentState.obstacles=[];
currentState.items=MathRunner.powerupTypes.map(type=>({kind:type.kind,x:220,y:220,w:28,h:28,speed:1}));
advance(renderTime+=17);
assert(drawnText.includes('PICK UP') && drawnText.includes('∞') && drawnText.includes('3'),'collectible icons render');
currentState.items.forEach(item=>item.x=78);currentState.chalk=0;
advance(renderTime+=17);
assert(elements['#runner-chalk-count'].textContent==='∞' && elements['#runner-chalk-capacity'].hidden,'unlimited ammo display');
assert(!elements['#runner-chalk'].disabled,'unlimited chalk enables button at zero normal ammo');
for(const type of MathRunner.powerupTypes)assert(elements['#runner-effects'].textContent.includes(type.label),'active effect countdown displayed');
assert(!elements['#runner-effects'].hidden && elements['#runner-status'].textContent.includes('Invincible'),'pickup announcement');
window.fire('blur');const shieldTime=currentState.powerups.shield;
advance(renderTime+=10000);
assert(currentState.powerups.shield===shieldTime,'pause freezes item effects');
start.fire('click');currentState.over=true;advance(renderTime+=17);start.fire('click');
assert(elements['#runner-effects'].hidden && !elements['#runner-chalk-capacity'].hidden,'restart clears power-up HUD');
const jump=elements['#runner-jump'];
document.fire('keydown',key('ArrowUp'));
assert(currentState.jumpHeld && currentState.jumps===1,'keyboard begins held jump');
document.fire('keyup',{code:'ArrowUp'});
assert(!currentState.jumpHeld && currentState.vy===-260,'keyboard release shortens rising jump');
currentState.y=252;currentState.vy=0;currentState.jumps=0;
jump.fire('pointerdown',{pointerId:77,preventDefault(){}});
assert(currentState.jumpHeld && currentState.jumps===1,'touch press begins held jump');
jump.fire('pointercancel',{pointerId:77});assert(!currentState.jumpHeld,'touch cancellation releases jump');
currentState.y=252;currentState.vy=0;currentState.jumps=0;
jump.fire('keydown',{code:'Enter',repeat:false,preventDefault(){},stopPropagation(){}});
assert(currentState.jumpHeld,'focused jump button supports held Enter');
jump.fire('keyup',{code:'Enter',preventDefault(){},stopPropagation(){}});
assert(!currentState.jumpHeld,'focused button release shortens jump');
currentState.y=252;currentState.vy=0;currentState.jumps=0;
currentState.time=6.1;currentState.runTime=6.1;currentState.spawnIn=Infinity;currentState.nextBossAt=Infinity;
advance(renderTime+=17);advance(renderTime+=17);
assert(elements['#runner-event'].textContent.includes('Office hours incoming'),'event warning shown');
currentState.time=9;currentState.runTime=9;advance(renderTime+=17);
assert(elements['#runner-event'].textContent.includes('Office hours') && !elements['#runner-event'].textContent.includes('incoming'),'active event shown');
currentState.time=49;currentState.runTime=49;currentState.multiplier=3;advance(renderTime+=17);
assert(elements['#runner-phase'].textContent==='Conference' && elements['#runner-combo'].textContent==='×3','phase and combo HUD');
currentState.obstacles=[{kind:'paperplane',x:230,y:160,w:48,h:30,speed:1,resolved:true,resolvedAt:currentState.time},
 {kind:'comment',x:320,y:132,w:62,h:28,speed:1,band:2}];
currentState.boss={kind:'boss',x:332,y:192,w:88,h:30,hp:4,maxHp:6,age:0,attackIn:.6,pattern:0};
advance(renderTime+=17);
assert(drawnText.includes('Solved!') && drawnText.includes('TARGET LOCK'),'folding paper and boss telegraph render');
assert(elements['#runner-event'].textContent.includes('4/6 comments left'),'boss health HUD');
window.fire('blur');const bossAge=currentState.boss.age;advance(renderTime+=10000);
assert(currentState.boss.age===bossAge,'pause freezes boss and event progression');
start.fire('click');advance(renderTime+=17);
assert(!elements['#runner-arena-controls'].hidden && !elements['#runner-left'].disabled,'arena movement controls visible and enabled');
const beforeMove=currentState.x;
document.fire('keydown',key('KeyD'));advance(renderTime+=30);
assert(currentState.x>beforeMove,'D moves player in arena');
document.fire('keyup',{code:'KeyD'});assert(currentState.move===0,'keyup stops walking');
const left=elements['#runner-left'];left.fire('pointerdown',{pointerId:92,preventDefault(){}});
assert(currentState.move===-1,'touch left button moves left');
left.fire('pointercancel',{pointerId:92});assert(currentState.move===0,'touch cancellation releases movement');
canvas.fire('pointermove',{clientX:140,clientY:65});
assert(currentState.aim.x===260 && currentState.aim.y===90,'pointer aim converts scaled canvas coordinates');
currentState.cooldown=0;currentState.chalk=3;currentState.shots=[];currentState.volleys=[];
canvas.fire('pointerdown',{clientX:140,clientY:65,button:0,pointerType:'touch',preventDefault(){}});
assert(currentState.shots.length===1 && currentState.shots[0].vy<0,'tap aims and throws chalk upwards');
document.fire('keydown',key('KeyW'));advance(renderTime+=30);
assert(currentState.aimTurn===-1 && currentState.aim===null,'keyboard aim works without pointer');
document.fire('keyup',{code:'KeyW'});assert(currentState.aimTurn===0,'aim key release');
document.fire('keydown',key('KeyD'));window.fire('blur');
assert(currentState.move===0 && elements['#runner-left'].disabled,'pause clears walking and disables arena controls');
start.fire('click');currentState.boss.hp=1;currentState.boss.attackIn=Infinity;
// Force only the last projectile collision here; engine tests exercise full aiming.
currentState.shots=[{x:currentState.boss.x-1,y:currentState.boss.y+10,w:10,h:4,vx:560,vy:0}];
advance(renderTime+=17);advance(renderTime+=17);
assert(!currentState.boss && elements['#runner-arena-controls'].hidden,'victory hides arena controls and returns to runner');
assert(currentState.x===76 && currentState.move===0,'normal runner restores fixed left position');
print('Passed: initial render, responsive sizing, start, pause/resume, blur, touch release, game over, score persistence fallback and restart.');
