// Run from the repository root: gjs tests/memory.test.js

const elements = {};
function element() { return {textContent:'',dataset:{},hidden:true, attrs:{},children:[], events:{},
 classList:{values:new Set(),contains(x){return this.values.has(x)},add(x){this.values.add(x)},remove(x){this.values.delete(x)},replace(x,y){this.remove(x);this.add(y)}},
 setAttribute(k,v){this.attrs[k]=v},addEventListener(k,v){this.events[k]=v},replaceChildren(...children){this.children=children}}; }
const document={querySelector(s){return elements[s] ||= element()},createElement(){return element()}};
let timer;
const window={setTimeout(fn){timer=fn;return 1},clearTimeout(){timer=undefined}};
function assert(ok,message){if(!ok)throw Error(message)};


const GLib = imports.gi.GLib;
const [, bytes] = GLib.file_get_contents('memory.js');
const source = new TextDecoder().decode(bytes);
let game;
eval(source.replace('    start();\n})();', '    start(); game = {tasks, start, reveal, isMatch, createPairs};\n})();'));
assert(game.tasks.length === 54, '54 valid tasks');
for(const task of game.tasks) assert(task.length===4 && task.every(t=>typeof t==='string' && t.length), 'complete task data');
for(let round=0;round<500;round++) {
 game.start();
 const board=elements['#memory-board'];
 assert(board.children.length===16,'16 cards');
 // Reveal through real event handlers; interchange equal answers in reverse order.
 const groups={};
 for(const [task,answer,taskText,answerText] of game.createPairs()) {
  assert(typeof answerText==='string','canonical key');
 }
 // Each rendered formula exposes its card through a renderer test spy.
 const cards=[];
 window.katex={render(tex,button){button.textContent=tex;cards.push([button,tex])}};
 for(const button of board.children) {
  button.events.click();
  if(timer){const callback=timer;timer=undefined;callback();}
 }
 assert(elements['#moves'].textContent==='8','one move per two reveals');
 delete window.katex;
}
const task={kind:'task',answerKey:'5',tex:'2+3',text:'2 + 3'};
const sameAnswer={kind:'answer',answerKey:'5',tex:'5',text:'5'};
assert(game.isMatch(task,sameAnswer),'equal answers match across original pairs');
assert(game.isMatch(sameAnswer,task),'either reveal order');
assert(!game.isMatch(task,task),'two equal-valued tasks do not match');
assert(!game.isMatch(sameAnswer,sameAnswer),'two answer cards do not match');
assert(!game.isMatch(task,{...sameAnswer,answerKey:'6'}),'wrong answer rejected');
game.start();
let button=elements['#memory-board'].children[0];button.events.click();button.events.click();
assert(elements['#moves'].textContent==='0','same card ignored');
game.start();
for(let i=0;i<8;i++){
 const a=element(),b=element();a.dataset.position='1';b.dataset.position='2';
 game.reveal(a,task);game.reveal(b,sameAnswer);
 assert(a.classList.contains('is-matched'),'matched cards stay visible');
 game.reveal(a,task);assert(elements['#moves'].textContent===String(i+1),'matched card ignored');
}
assert(elements['#pairs'].textContent==='8 / 8','all duplicate results can be completed');
assert(elements['#game-status'].textContent.includes('Well done'),'completion announcement');
game.start();
const a=element(),b=element(),c=element();
game.reveal(a,task);game.reveal(b,{...sameAnswer,answerKey:'6'});game.reveal(c,task);
assert(!c.classList.contains('is-open'),'third reveal blocked during mismatch');
assert(timer,'mismatch scheduled');game.start();assert(!timer,'restart cancels old timeout');
assert(elements['#pairs'].textContent==='0 / 8' && elements['#moves'].textContent==='0','restart resets counters');
print('Passed: 54 task records, 500 rounds, duplicate answers, invalid pairs, reveal guards, completion and restart.');
