/* Independent cosmetic preview: no MathRunner state, inputs, RNG or audio. */
(() => {
    const panel = document.querySelector('#runner-lookbook');
    if (!panel) return;
    const canvas = document.querySelector('#runner-look-canvas'), ctx = canvas.getContext('2d');
    if (!ctx) return;
    const slider = document.querySelector('#runner-look-semester'), number = document.querySelector('#runner-look-number');
    const pose = document.querySelector('#runner-look-pose'), toggle = document.querySelector('#runner-look-animate');
    const caption = document.querySelector('#runner-look-caption');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
    let semester = 1, time = 0, last = null, frame = null, motion, animate = !reduced;
    const colors = { sky: '#172431', grid: '#203442', muted: '#59747a', ink: '#e9efdb' };
    function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); }
    function text(value, x, y, size, color, width) { ctx.fillStyle = color; ctx.font = `bold ${size}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(value, x, y, width); }
    function character(wins, x, y, scale, selectedPose, trophies) {
        const duck = selectedPose === 'duck', p = RunnerCosmetics.profileAt(wins, duck);
        const r = (px, py, w, h, color) => rect(x + px * scale, y + (py - 208) * scale, w * scale, h * scale, color);
        if (duck) {
            r(0,236,24,10,p.coat);r(16,232,10,10,'#e4bd7a');r(22,234,4,2,colors.sky);r(0,246,26,6,colors.ink);
        } else {
            const palette = { h:p.hair,s:'#e4bd7a',k:colors.sky,b:p.coat,p:'#d69a93',t:'#91a3bc' };
            const stride = ['run','sprint'].includes(selectedPose) && Math.floor(time * p.gait * (selectedPose==='sprint'?20:10)) % 2;
            RunnerCosmetics.sprite.forEach((row,py)=>[...row].forEach((pixel,px)=>{
                if(pixel===' ')return;
                const step=py>17&&stride?(px<6?-2:2):0;
                r(px*2+step,208+py*2,2,2,palette[pixel]);
            }));
        }
        RunnerCosmetics.adorn(r,p,duck?232:208,duck,time,motion||{wind:0},trophies,reduced);
    }
    function draw() {
        const p = RunnerCosmetics.profileAt(semester-1);
        motion=RunnerCosmetics.motionAt(motion,time,pose.value==='sprint',pose.value==='run'?1:0,true,reduced);
        rect(0,0,960,360,colors.sky);
        for(let x=0;x<960;x+=48)rect(x,65,1,155,colors.grid);
        rect(0,222,960,3,'#a9ccb4');
        const trophies=['reviewer','blackboard','printer','deadline'].slice(0,Math.min(4,semester-1));
        character(semester-1,400,90,3,pose.value,trophies);
        text(`Semester ${semester} · ${p.title}`,480,24,18,colors.ink,920);
        text('Appearance preview',480,49,12,'#a9ccb4',920);
        rect(0,236,960,124,'#14212c');
        [0,2,5,9,15,24,40].forEach((wins,i)=>{
            character(wins,70+i*132,253,1.45,'stand',['reviewer','blackboard','printer','deadline'].slice(0,Math.min(4,wins)));
            text(String(wins+1),88+i*132,337,12,'#a9ccb4',100);
        });
        caption.textContent=`Semester ${semester} · ${p.title}${p.braided?' · braided beard':''}${p.dust?' · chalk dust':''}`;
    }
    function tick(now) {
        frame=null;
        if(!panel.open||document.hidden||!animate){last=null;return;}
        if(last!==null)time+=Math.min(.05,(now-last)/1000);
        last=now;draw();frame=requestAnimationFrame(tick);
    }
    function refresh() {
        draw();toggle.textContent=animate?'Pause preview':'Animate preview';toggle.setAttribute('aria-pressed',String(animate));
        if(frame!==null)cancelAnimationFrame(frame);frame=null;last=null;
        if(panel.open&&!document.hidden&&animate)frame=requestAnimationFrame(tick);
    }
    function choose(value) {
        semester=Math.max(1,Math.min(999,Math.floor(Number(value)||1)));
        slider.value=String(Math.min(81,semester));number.value=String(semester);refresh();
    }
    slider.addEventListener('input',()=>choose(slider.value));number.addEventListener('input',()=>choose(number.value));
    pose.addEventListener('change',refresh);
    toggle.addEventListener('click',()=>{animate=!animate;refresh();});
    panel.addEventListener('toggle',refresh);document.addEventListener('visibilitychange',refresh);
    refresh();
})();
