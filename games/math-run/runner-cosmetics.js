/* Rendering-only progression. No simulation clocks, collision boxes or gameplay RNG. */
var RunnerCosmetics = (() => {
    const sprite = [
        '    hhhh    ', '   hhhhhh   ', '   hhsssh   ', '   sssssss  ',
        '   skkskks  ', '   sssssss  ', '    ssss    ', '     ss     ',
        '   bbbbbb   ', '  bbbbbbbb  ', '  sbbbbbbp  ', '  sbbbbbbp  ',
        '  sbbbbbbp  ', '   bbbbbb   ', '   bbbbbb   ', '   tttttt   ',
        '   tttttt   ', '   tt  tt   ', '   tt  tt   ', '   tt  tt   ',
        '   kk  kk   ', '  kkk  kkk  '
    ];
    const careers = [
        { from: 0, title: 'Student', coat: '#a9ccb4' },
        { from: 2, title: 'Doctoral student', coat: '#6d98b8' },
        { from: 5, title: 'Postdoc', coat: '#ad778c' },
        { from: 9, title: 'Professor', coat: '#687f9f' },
        { from: 15, title: 'Emeritus', coat: '#d3c7a5' }
    ];
    function profileAt(wins, duck = false) {
        const career = careers.filter(c => wins >= c.from).at(-1);
        return { ...career, semester: wins + 1, wins,
            beardLength: wins ? 3 + Math.floor(wins / 2) * 4 : 0,
            beard: wins >= 6 ? '#c7cbd0' : wins >= 3 && !duck ? '#8b8078' : '#604d43',
            hair: wins >= 6 ? '#b6bdc4' : '#493f46',
            braided: wins >= 12, dust: wins >= 8, walkingBeard: wins >= 24,
            gait: wins >= 15 ? .72 : wins >= 9 ? .85 : wins >= 5 ? 1.06 : 1 };
    }
    function motionAt(motion, time, boost, move, arena, reduced) {
        if (!motion || time < motion.time) motion = { time, wind: 0, velocity: 0, boost, brakeUntil: 0 };
        if (motion.boost && !boost) motion.brakeUntil = time + .5;
        const target = time < motion.brakeUntil ? -.6 : boost ? 1.6 : arena ? Math.abs(move) * .65 : .35;
        let dt = Math.max(0, Math.min(.1, time - motion.time));
        while (dt > 0) {
            const h = Math.min(dt, 1 / 120);
            motion.velocity += ((target - motion.wind) * 65 - motion.velocity * 13) * h;
            motion.wind += motion.velocity * h; dt -= h;
        }
        motion.time = time; motion.boost = boost;
        if (reduced) { motion.wind = 0; motion.velocity = 0; }
        return motion;
    }
    function adorn(r, p, y, duck, time, motion, trophies, reduced) {
        if (!duck) {
            if (p.wins < 2) {
                r(-2, y + 20, 5, 12, '#607f9c'); r(-1, y + 22, 3, 1, '#c5a467');
                r(19, y + 22, 1, 5, '#fff5dc');
            } else if (p.wins < 5) {
                r(7, y + 18, 3, 6, '#e9efdb'); r(14, y + 18, 3, 6, '#e9efdb');
                r(11, y + 20, 2, 9, '#495d78'); r(17, y + 27, 3, 2, '#e4bd7a');
                r(1, y + 5, 3, 8, p.hair);
            } else if (p.wins < 9) {
                for (let i = 0; i < 5; i++) { r(6 + i, y + 18 + i, 1, 1, '#d3ba75'); r(18 - i, y + 18 + i, 1, 1, '#d3ba75'); }
                r(10, y + 25, 7, 8, '#f0eddc'); r(11, y + 27, 5, 2, '#687f9f');
                r(4, y - 1, 3, 3, p.hair); r(13, y - 2, 3, 3, p.hair);
            } else if (p.wins < 15) {
                r(4, y + 19, 3, 14, '#4d617f'); r(18, y + 19, 3, 14, '#4d617f');
                for (let i = 0; i < 3; i++) r(12, y + 23 + i * 5, 1, 1, '#d3ba75');
            } else {
                r(3, y + 18, 5, 4, '#8c778e'); r(17, y + 18, 5, 4, '#8c778e');
                r(4, y + 22, 2, 12, '#b89e63'); r(20, y + 22, 2, 12, '#b89e63');
                r(8, y + 4, 5, 1, '#a88466');
            }
        }
        const sway = reduced ? 0 : Math.sin(time * (p.gait * 7)) * .7;
        const chinX = duck ? 19 : 6, chinY = y + (duck ? 11 : 12);
        const verticalRoom = duck ? 6 : 27;
        // Extra length folds into a trailing beard rather than disappearing below the floor.
        const length = p.beardLength;
        const segments = Math.min(72, Math.ceil(length / 2));
        for (let i = segments - 1; i >= 0; i--) {
            const d = i < 14 ? i * 2 : 28 + (i - 14) * Math.max(2, (length - 28) / 58);
            const fold = Math.max(0, d - verticalRoom);
            const taper = Math.min(7, d / Math.max(1, length) * 7);
            const width = Math.max(3, (duck ? 8 : p.walkingBeard ? 24 : 15) - taper);
            const wind = reduced ? 0 : motion.wind * Math.min(d, 32) * -.32;
            const wave = reduced ? 0 : Math.sin(time * 8 - d * .22) * Math.min(2, d * .08);
            const x = chinX + taper * .45 - fold * .55 + wind + wave + sway;
            const py = chinY + Math.min(d, verticalRoom) - (fold ? Math.sin(d * .15) * 1.5 : 0);
            r(x, py, width, 2, p.beard);
            if (p.braided && i % 3 === 0) {
                r(x + width / 2 + (i % 2 ? 1 : -1), py, 2, 2, '#8f929a');
                if (i % 9 === 0) r(x + width / 2 - 1, py + 1, 4, 1, '#c5a467');
            }
            if (p.dust && i % 7 === 0) r(x + 2, py, 1, 1, '#fff5dc');
        }
        if (p.wins >= 6) {
            r(duck ? 17 : 3, y + (duck ? 0 : 3), 5, 3, p.hair);
            if (!duck) r(18, y + 3, 4, 6, p.hair);
        }
        if (!duck && p.wins >= 9) {
            // Receding hairline, elbow patch and a tiny waistcoat watch-chain.
            r(8, y, 8, 2, '#e4bd7a'); r(18, y + 25, 4, 4, '#b39a80');
            r(16, y + 29, 3, 1, '#e4bd7a'); r(19, y + 30, 2, 2, '#e4bd7a');
        }
        // Boss mementos are drawn last so even the walking beard keeps them visible.
        if (trophies.includes('reviewer') || p.wins >= 8) {
            const x = duck ? 17 : 3, gy = y + (duck ? 3 : 7);
            r(x, gy, 7, 4, '#263442'); r(x + 9, gy, 7, 4, '#263442'); r(x + 6, gy + 1, 4, 1, '#263442');
            r(x + 1, gy + 1, 4, 1, '#b4d4db'); r(x + 10, gy + 1, 4, 1, '#b4d4db');
        }
        if (trophies.includes('blackboard')) {
            const ey = y + (duck ? 9 : 28);
            r(0, ey, 5, 8, '#493f46'); r(0, ey, 5, 2, '#d3b27d'); r(1, ey + 4, 3, 1, '#c7cbd0');
        }
        if (trophies.includes('deadline')) {
            r(duck ? 11 : 21, y + (duck ? 12 : 31), 5, 5, '#e4bd7a');
            r(duck ? 13 : 23, y + (duck ? 13 : 32), 1, 2, '#493f46');
        }
        if (p.walkingBeard && !duck) {
            // Only shoes and spectacles peek out from the enormous beard cape.
            r(1, y + 40, 9, 4, '#263442'); r(15, y + 40, 9, 4, '#263442');
            r(2, y + 40, 3, 1, '#c7cbd0'); r(16, y + 40, 3, 1, '#c7cbd0');
        }
    }
    function bossBackdrop(r, kind, width, colors) {
        if (!kind) return;
        const ink = colors.grid, sky = colors.sky;
        const center = width / 2;
        if (kind === 'reviewer') {
            for (let i = 0; i < 3; i++) {
                const x = center - 110 + i * 75, y = 58 + i * 8;
                r(x,y,55,69,ink); r(x+3,y+3,49,63,sky);
                for (let row = 0; row < 4; row++) r(x+9,y+15+row*10,32-row*3,1,ink);
                r(x+35,y+50,10,2,ink);r(x+39,y+46,2,10,ink);
            }
        } else if (kind === 'blackboard') {
            r(center-140,57,280,89,ink);r(center-136,61,272,81,sky);
            for(let i=1;i<8;i++)r(center-136+i*34,62,1,78,ink);
            for(let i=1;i<4;i++)r(center-135,61+i*20,270,1,ink);
            r(center-135,144,270,3,ink);
        } else if (kind === 'printer') {
            for(let i=0;i<4;i++){
                const x=center-95+i*44,y=56+i*6;
                r(x,y,39,58,ink);r(x+3,y+3,33,52,sky);
                for(let row=0;row<5;row++)r(x+8,y+12+row*7,22,1,ink);
            }
            r(center-112,139,224,3,ink);r(center-112,146,224,2,ink);
        } else if (kind === 'deadline') {
            for(let i=0;i<12;i++){
                const angle=i*Math.PI/6;
                r(center+Math.sin(angle)*50-2,103-Math.cos(angle)*50-2,4,4,ink);
            }
            r(center-1,67,2,37,ink);r(center,102,30,2,ink);r(center-3,100,6,6,ink);
        }
    }
    return { sprite, profileAt, motionAt, adorn, bossBackdrop };
})();
