// Run from the repository root: gjs games/math-run/tests/runner-lookbook.test.js
const GLib=imports.gi.GLib;
function read(p){const [,b]=GLib.file_get_contents(p);return new TextDecoder().decode(b);}
const RunnerCosmetics=new Function(read('games/math-run/runner-cosmetics.js')+';return RunnerCosmetics;')();
function assert(ok,message){if(!ok)throw Error(message);}
function el(){return {events:{},value:'',open:true,textContent:'',setAttribute(k,v){this[k]=v;},addEventListener(k,f){(this.events[k]||=[]).push(f);},fire(k,e={}){for(const f of this.events[k]||[])f(e);}};}
for(const reduced of [false,true]){
 const elements={},frames=new Map();let next=0,draws=0;
 const document=el();document.querySelector=q=>elements[q]||=el();
 const canvas=document.querySelector('#runner-look-canvas');canvas.getContext=()=>({fillRect(){draws++;},fillText(){}});
 const panel=document.querySelector('#runner-lookbook'),slider=document.querySelector('#runner-look-semester'),number=document.querySelector('#runner-look-number'),pose=document.querySelector('#runner-look-pose'),button=document.querySelector('#runner-look-animate'),caption=document.querySelector('#runner-look-caption');
 pose.value='stand';
 const window={matchMedia:()=>({matches:reduced})};
 const requestAnimationFrame=f=>{frames.set(++next,f);return next;};const cancelAnimationFrame=id=>frames.delete(id);
 new Function('document','window','RunnerCosmetics','requestAnimationFrame','cancelAnimationFrame',read('games/math-run/runner-lookbook.js'))(document,window,RunnerCosmetics,requestAnimationFrame,cancelAnimationFrame);
 assert(draws>0&&caption.textContent.includes('Student'),'preview works immediately without a game run');
 slider.value='41';slider.fire('input');assert(caption.textContent.includes('Emeritus')&&number.value==='41','slider jumps to older appearance');
 number.value='9999';number.fire('input');assert(number.value==='999','numeric semester is bounded');
 for(const value of ['duck','run','sprint','stand']){pose.value=value;pose.fire('change');}
 assert(frames.size===(reduced?0:1),'reduced motion starts with animation disabled');
 if(!reduced){button.fire('click');assert(!frames.size,'pause stops preview animation');button.fire('click');assert(frames.size===1,'preview animation resumes');}
 panel.open=false;panel.fire('toggle');assert(!frames.size,'closed preview stops its animation loop');
 panel.open=true;panel.fire('toggle');document.hidden=true;document.fire('visibilitychange');assert(!frames.size,'hidden tab stops preview animation');
}
print('Passed: immediate appearance preview, semester slider/numeric controls, all poses, animation pause, closed/hidden lifecycle and reduced motion.');
