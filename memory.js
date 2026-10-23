(() => {
    const board = document.querySelector('#memory-board');
    const status = document.querySelector('#game-status');
    const pairsDisplay = document.querySelector('#pairs');
    const movesDisplay = document.querySelector('#moves');
    let selected = [];
    let pairs = 0;
    let moves = 0;
    let pending;

    function shuffle(items) {
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items;
    }

    // Each entry is [LaTeX task, LaTeX answer, spoken/plain task, spoken/plain answer].
    const tasks = [
            ['2x+6=10', '2', 'Solve 2x + 6 = 10', '2'],
            [String.raw`\sqrt{9}`, '3', 'Square root of 9', '3'],
            ['3x-5=7', '4', 'Solve 3x - 5 = 7', '4'],
            [String.raw`\sqrt{25}`, '5', 'Square root of 25', '5'],
            ['2x-4=8', '6', 'Solve 2x - 4 = 8', '6'],
            [String.raw`\sqrt{49}`, '7', 'Square root of 49', '7'],
            ['3x=24', '8', 'Solve 3x = 24', '8'],
            [String.raw`\sqrt{81}`, '9', 'Square root of 81', '9'],
            ['5x+3=8', '1', 'Solve 5x + 3 = 8', '1'],
            ['4x+8=8', '0', 'Solve 4x + 8 = 8', '0'],
            ['3x+7=1', '-2', 'Solve 3x + 7 = 1', '−2'],
            [String.raw`\sqrt{144}`, '12', 'Square root of 144', '12'],
            [String.raw`\sqrt[3]{125}`, '5', 'Cube root of 125', '5'],
            ['2(x+1)=10', '4', 'Solve 2(x + 1) = 10', '4'],

            [String.raw`\log_2 32`, '5', 'Log base 2 of 32', '5'],
            [String.raw`\sqrt[3]{64}`, '4', 'Cube root of 64', '4'],
            [String.raw`\log_3 27`, '3', 'Log base 3 of 27', '3'],
            [String.raw`2^x=64`, '6', 'Solve 2 to the power x = 64', '6'],
            [String.raw`\sin\left(\frac{\pi}{6}\right)`, String.raw`\frac12`, 'Sine of pi over 6', '1/2'],
            [String.raw`\cos(\pi)`, '-1', 'Cosine of pi', '−1'],
            [String.raw`\ln(e^2)`, '2', 'Natural logarithm of e squared', '2'],
            [String.raw`\sqrt{\frac{9}{16}}`, String.raw`\frac34`, 'Square root of 9/16', '3/4'],
            [String.raw`\binom{5}{2}`, '10', '5 choose 2', '10'],
            ['4!', '24', '4 factorial', '24'],
            [String.raw`\sum_{k=1}^{4}k^2`, '30', 'Sum of k squared from k = 1 to 4', '30'],
            [String.raw`\log_{10}(1000)`, '3', 'Log base 10 of 1000', '3'],
            [String.raw`\sqrt{2}\,\sqrt{8}`, '4', 'Square root of 2 times square root of 8', '4'],
            [String.raw`\tan\left(\frac{\pi}{4}\right)`, '1', 'Tangent of pi over 4', '1'],

            [String.raw`\int_0^2 x^2\,dx`, String.raw`\frac83`, 'Integral of x squared from 0 to 2', '8/3'],
            [String.raw`\sum_{n=1}^{\infty}\frac{1}{2^n}`, '1', 'Sum of 1/2 to the power n from n = 1 to infinity', '1'],
            [String.raw`\int_0^\pi\sin x\,dx`, '2', 'Integral of sine x from 0 to pi', '2'],
            [String.raw`\int_0^1 x^3\,dx`, String.raw`\frac14`, 'Integral of x cubed from 0 to 1', '1/4'],
            [String.raw`\sum_{n=1}^{\infty}\frac{1}{3^n}`, String.raw`\frac12`, 'Sum of 1/3 to the power n from n = 1 to infinity', '1/2'],
            [String.raw`\sum_{n=1}^{\infty}\frac{1}{n^2}`, String.raw`\frac{\pi^2}{6}`, 'Sum of 1/n squared from n = 1 to infinity', 'pi squared / 6'],
            [String.raw`\int_1^e\frac{2}{x}\,dx`, '2', 'Integral of 2/x from 1 to e', '2'],
            [String.raw`\lim_{x\to0}\frac{\sin(3x)}{x}`, '3', 'Limit of sin(3x)/x as x tends to 0', '3'],
            [String.raw`\lim_{n\to\infty}\left(1+\frac1n\right)^n`, 'e', 'Limit of (1 + 1/n) to the power n as n tends to infinity', 'e'],
            [String.raw`\left.\frac{d}{dx}x^3\right|_{x=2}`, '12', 'Derivative of x cubed evaluated at x = 2', '12'],
            [String.raw`\int_0^1 e^x\,dx`, 'e-1', 'Integral of e to the power x from 0 to 1', 'e − 1'],
            [String.raw`\sum_{n=0}^{\infty}\frac{1}{n!}`, 'e', 'Sum of 1/n factorial from n = 0 to infinity', 'e'],
            [String.raw`\int_0^1\frac{1}{1+x^2}\,dx`, String.raw`\frac\pi4`, 'Integral of 1/(1 + x squared) from 0 to 1', 'pi / 4'],
            [String.raw`\det\begin{pmatrix}2&1\\3&4\end{pmatrix}`, '5', 'Determinant of the matrix with rows 2, 1 and 3, 4', '5'],
            [String.raw`\det\begin{pmatrix}2&1\\1&3\end{pmatrix}`, '5', 'Determinant of the matrix with rows 2, 1 and 1, 3', '5'],
            [String.raw`\operatorname{rank}\begin{pmatrix}1&2\\2&4\end{pmatrix}`, '1', 'Rank of the matrix with rows 1, 2 and 2, 4', '1'],
            [String.raw`\deg((x^2+1)(x^3-x))`, '5', 'Degree of (x squared + 1)(x cubed - x)', '5'],
            [String.raw`\dim_{\mathbb Q}\!\left(\mathbb Q[x]/(x^3)\right)`, '3', 'Dimension of Q[x]/(x cubed) over Q', '3'],
            [String.raw`\operatorname{ord}_{(\mathbb Z/7\mathbb Z,+)}(2)`, '7', 'Additive order of 2 modulo 7', '7'],
            [String.raw`\left|(\mathbb Z/10\mathbb Z)^\times\right|`, '4', 'Number of units modulo 10', '4'],
            [String.raw`\binom{6}{2}`, '15', '6 choose 2', '15'],
            [String.raw`|S_4|`, '24', 'Order of the symmetric group S4', '24'],
            [String.raw`|\mathcal P(\{1,2,3\})|`, '8', 'Number of subsets of a three-element set', '8'],
            [String.raw`|E(K_5)|`, '10', 'Number of edges of the complete graph K5', '10'],
            [String.raw`\#\!\left\{\substack{\text{spanning trees}\\\text{of }K_4}\right\}`, '16', 'Number of spanning trees of the complete graph K4', '16'],
            [String.raw`\#\{f:\{1,2,3\}\twoheadrightarrow\{1,2\}\}`, '6', 'Number of surjections from a three-element set to a two-element set', '6']
    ];

    function createPairs() {
        return shuffle([...tasks]).slice(0, 8);
    }

    // Compare canonical values, not original pair IDs. Identical answers are interchangeable.
    // Require one task and one answer, so two equal answers cannot match each other.
    function isMatch(first, second) {
        return first.kind !== second.kind && first.answerKey === second.answerKey;
    }

    function renderFormula(element, card) {
        if (window.katex) {
            window.katex.render(card.tex, element, { throwOnError: false, displayMode: true });
        } else {
            element.textContent = card.text;
        }
    }

    function reveal(button, card) {
        if (pending || button.classList.contains('is-open') || button.classList.contains('is-matched')) return;
        button.classList.add('is-open');
        renderFormula(button, card);
        button.setAttribute('aria-label', `Card ${button.dataset.position}: ${card.text}`);
        selected.push({ button, card });
        if (selected.length < 2) return;
        movesDisplay.textContent = String(++moves);
        const [first, second] = selected;
        if (isMatch(first.card, second.card)) {
            for (const { button: matched, card: value } of selected) {
                matched.classList.replace('is-open', 'is-matched');
                matched.setAttribute('aria-disabled', 'true');
                matched.setAttribute('aria-label', `${value.text}, pair found`);
            }
            pairsDisplay.textContent = `${++pairs} / 8`;
            selected = [];
            status.textContent = pairs === 8
                ? `Well done! You found all 8 pairs in ${moves} moves. Ready for another round?`
                : 'Correct! You found a matching pair.';
        } else {
            status.textContent = 'These cards do not match. Remember their positions!';
            pending = window.setTimeout(() => {
                for (const { button: hidden } of selected) {
                    hidden.classList.remove('is-open');
                    hidden.textContent = '?';
                    hidden.setAttribute('aria-label', `Card ${hidden.dataset.position}, face down`);
                }
                selected = [];
                pending = undefined;
                status.textContent = 'Turn over two more cards.';
            }, 1200);
        }
    }

    function start() {
        window.clearTimeout(pending);
        pending = undefined;
        selected = [];
        pairs = 0;
        moves = 0;
        pairsDisplay.textContent = '0 / 8';
        movesDisplay.textContent = '0';
        status.textContent = window.katex
            ? 'Let’s play! Turn over two cards.'
            : 'Formula typesetting could not load. Plain-text mode is active.';
        const cards = shuffle(createPairs().flatMap(([task, answer, taskLabel, answerLabel]) => [
            { kind: 'task', answerKey: answerLabel, tex: task, text: taskLabel },
            { kind: 'answer', answerKey: answerLabel, tex: answer, text: answerLabel }
        ]));
        board.replaceChildren(...cards.map((card, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'memory-card';
            button.dataset.position = String(index + 1);
            button.textContent = '?';
            button.setAttribute('aria-label', `Card ${index + 1}, face down`);
            button.addEventListener('click', () => reveal(button, card));
            return button;
        }));
    }

    document.querySelector('.memory-toolbar').hidden = false;
    document.querySelector('#restart').addEventListener('click', start);
    start();
})();
