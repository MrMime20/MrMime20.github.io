let game = { away: 0, home: 0, inning: 1, top: true, outs: 0 };
let gameLog = [];
let currentThemeIndex = 0;
let isClearing = false;

// Timer State
let timer = { interval: null, seconds: 0, running: false };

const themes = [
    { name: "forest", bg: "#1a2e1a", glass: "rgba(0, 0, 0, 0.3)", accent: "#d4e09b", primary: "#3a5a40", btnText: "#fff" },
    { name: "crimson", bg: "#780000", glass: "rgba(0, 48, 73, 0.5)", accent: "#fdf0d5", primary: "#c1121f", btnText: "#fff" },
    { name: "midnight", bg: "#0d1b2a", glass: "rgba(27, 38, 59, 0.6)", accent: "#e0e1dd", primary: "#415a77", btnText: "#fff" },
    { name: "indigo", bg: "#7699d4", glass: "rgba(30, 30, 36, 0.5)", accent: "#f0f2ef", primary: "#232ed1", btnText: "#fff" },
    { name: "graphite", bg: "#383535", glass: "rgba(20, 20, 20, 0.6)", accent: "#e6e4ce", primary: "#6d98ba", btnText: "#000" },
    { name: "slate", bg: "#1d2d44", glass: "rgba(13, 19, 33, 0.7)", accent: "#e6e4ce", primary: "#748cab", btnText: "#fff" }
];

function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    const t = themes[currentThemeIndex];
    const root = document.documentElement;
    root.style.setProperty('--bg-color', t.bg);
    root.style.setProperty('--glass-bg', t.glass);
    root.style.setProperty('--text-accent', t.accent);
    root.style.setProperty('--btn-primary', t.primary);
    root.style.setProperty('--btn-text', t.btnText);
}

function updateScore(team, val) {
    const oldVal = game[team];
    const newVal = Math.max(0, game[team] + val);
    if (oldVal !== newVal) {
        game[team] = newVal;
        morphNumber(team, newVal);
    }
}

function morphNumber(team, newVal) {
    const blurNode = document.getElementById(`blur-${team}`);
    const zone = document.querySelector(`.${team}-filter`);
    const oldScores = zone.querySelectorAll('.score-display');
    oldScores.forEach((el, index) => { if (index < oldScores.length - 1) el.remove(); });
    const oldDisplay = zone.querySelector('.score-display');
    animateBlur(blurNode, 0, 10, 400);
    const newDisplay = document.createElement('div');
    newDisplay.className = 'score-display enter';
    newDisplay.innerText = newVal;
    zone.appendChild(newDisplay);
    setTimeout(() => {
        if (oldDisplay) oldDisplay.classList.add('exit');
        newDisplay.classList.remove('enter');
    }, 50);
    setTimeout(() => { animateBlur(blurNode, 10, 0, 500); }, 450);
    setTimeout(() => { if (oldDisplay) oldDisplay.remove(); }, 1100);
}

function animateBlur(element, start, end, duration) {
    let startTime = null;
    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        let progress = (timestamp - startTime) / duration;
        if (progress > 1) progress = 1;
        let current = start + (end - start) * progress;
        element.setAttribute('stdDeviation', current);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function handleOutClick(e) {
    if (isClearing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
        removeOut();
    } else {
        addOut();
    }
}

function removeOut() {
    if (game.outs > 0) {
        game.outs--;
        updateUI();
    }
}

function addOut() {
    if (isClearing || game.outs >= 3) return;
    game.outs++;
    updateUI();
    if (game.outs === 3) {
        isClearing = true;
        setTimeout(sequentialReset, 600);
    }
}

function sequentialReset() {
    const dots = document.querySelectorAll('.dot');
    setTimeout(() => { dots[2].classList.remove('active'); }, 0);
    setTimeout(() => { dots[1].classList.remove('active'); }, 200);
    setTimeout(() => { 
        dots[0].classList.remove('active'); 
        setTimeout(() => {
            game.outs = 0;
            if (game.top) { game.top = false; } else { game.top = true; game.inning++; }
            isClearing = false;
            updateUI(true); 
        }, 300);
    }, 400);
}

function changeInning(dir) {
    if (isClearing) return;
    if (dir === 1) {
        if (game.top) game.top = false;
        else { game.top = true; game.inning++; }
    } else {
        if (!game.top) game.top = true;
        else if (game.inning > 1) { game.top = false; game.inning--; }
    }
    updateUI(true); 
}

function updateUI(shouldAnimate = false) {
    const inningText = document.getElementById('inning-text');
    const render = () => {
        document.getElementById('inning-num').innerText = game.inning;
        document.getElementById('inning-half').innerText = game.top ? 'TOP' : 'BOTTOM';
        document.getElementById('away-card').classList.toggle('batting-now', game.top);
        document.getElementById('home-card').classList.toggle('batting-now', !game.top);
        if (!isClearing) {
            document.querySelectorAll('.dot').forEach((d, i) => {
                d.classList.toggle('active', i < game.outs);
            });
        }
    };
    if (shouldAnimate) {
        inningText.classList.add('slide-out');
        setTimeout(() => {
            render();
            inningText.classList.remove('slide-out');
            inningText.classList.add('slide-in');
            setTimeout(() => { inningText.classList.remove('slide-in'); }, 50);
        }, 300);
    } else { render(); }
}

function confirmReset() {
    if (confirm("Are you sure you want to start a new game? This will reset all scores, the timer, and the hit log.")) {
        resetGame();
        toggleDrawer(false);
    }
}

function resetGame() {
    game = { away: 0, home: 0, inning: 1, top: true, outs: 0 };
    gameLog = [];
    morphNumber('away', 0);
    morphNumber('home', 0);
    renderLog();
    updateUI(true);
    clearInterval(timer.interval);
    timer.seconds = 0;
    timer.running = false;
    document.getElementById('timer-display').innerText = "00:00:00";
}

function shareGame() { 
    const summary = generateGameRecap();
    alert(summary);
}

function toggleTimer() {
    if (timer.running) {
        clearInterval(timer.interval);
        timer.running = false;
    } else {
        timer.running = true;
        timer.interval = setInterval(() => {
            timer.seconds++;
            updateTimerDisplay();
        }, 1000);
    }
}

function updateTimerDisplay() {
    const h = Math.floor(timer.seconds / 3600);
    const m = Math.floor((timer.seconds % 3600) / 60);
    const s = timer.seconds % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Drawer & Team Names
function toggleDrawer(open) {
    document.getElementById('drawer-overlay').classList.toggle('active', open);
}

function updateTeamName(team, name) {
    const label = document.getElementById(`${team}-label`);
    label.innerText = name.trim() === "" ? (team === 'away' ? 'AWAY' : 'HOME') : name.toUpperCase();
}

// Hit Log Logic
function handleHitTypeChange() {
    const hitType = document.getElementById('log-type').value;
    const locationSelect = document.getElementById('log-location');
    
    if (hitType === "walk" || hitType === "hbp" || hitType === "strikeout") {
        locationSelect.selectedIndex = 0;
        locationSelect.disabled = true;
    } else {
        locationSelect.disabled = false;
    }
}

function addHitLog() {
    const playerName = document.getElementById('log-player').value.trim();
    const hitType = document.getElementById('log-type').value;
    const locationSelect = document.getElementById('log-location');
    const hitLocation = locationSelect.value;

    const noLocationRequired = ["walk", "hbp", "strikeout"];

    if (!playerName || !hitType || (!noLocationRequired.includes(hitType) && !hitLocation)) {
        alert("Please provide a name, hit type, and location.");
        return;
    }

    let logEntry = `${playerName} hit a ${hitType} to ${hitLocation}.`;

    if (hitType === "strikeout") {
        logEntry = `${playerName} struck out.`;
    } else if (hitType === "walk") {
        logEntry = `${playerName} walked.`;
    } else if (hitType === "hbp") {
        logEntry = `${playerName} was hit by a pitch.`;
    } else if (hitType === "groundout") {
        logEntry = `${playerName} grounded out to ${hitLocation}.`;
    } else if (hitType === "popout") {
        logEntry = `${playerName} popped out to ${hitLocation}.`;
    } else if (hitType === "homerun") {
        logEntry = `${playerName} hit a homerun to ${hitLocation}.`;
    } else if (hitType === "single") {
        logEntry = `${playerName} hit a single to ${hitLocation}.`;
    } else if (hitType === "double") {
        logEntry = `${playerName} hit a double to ${hitLocation}.`;
    } else if (hitType === "triple") {
        logEntry = `${playerName} hit a triple to ${hitLocation}.`;
    }

    const play = {
        text: logEntry,
        inning: game.inning,
        top: game.top
    };

    gameLog.unshift(play);
    renderLog();

    document.getElementById('log-player').value = "";
    document.getElementById('log-type').selectedIndex = 0;
    locationSelect.selectedIndex = 0;
    locationSelect.disabled = false;
}

function renderLog() {
    const container = document.getElementById('hit-log-container');
    if (gameLog.length === 0) {
        container.innerHTML = '<div class="log-empty">No plays recorded.</div>';
        return;
    }

    container.innerHTML = gameLog.map(play => `
        <div class="log-item">
            <div class="play-info">${play.text}</div>
            <div class="play-meta">${play.top ? 'T' : 'B'}${play.inning}</div>
        </div>
    `).join('');
}

// Game Recap Logic
function getInningSuffix(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function generateGameRecap() {
    let recap = "";
    let homeTeamName = document.getElementById("home-label").textContent;
    let awayTeamName = document.getElementById("away-label").textContent;
    let runDifferential = Math.abs(game.home - game.away);
    let winningTeam, losingTeam, winningScore, losingScore;

    // Determine winning/losing teams and handle ties
    if (game.home > game.away) {
        winningTeam = homeTeamName;
        losingTeam = awayTeamName;
        winningScore = game.home;
        losingScore = game.away;
    } else if (game.away > game.home) {
        winningTeam = awayTeamName;
        losingTeam = homeTeamName;
        winningScore = game.away;
        losingScore = game.home;
    } else {
        const tieOutcomes = [
            `Folks, we've got ourselves a deadlock. ${homeTeamName} and ${awayTeamName} are tied at ${game.home} runs apiece. It's anyone's game at this point.`,
            `This one's a real seesaw battle! ${homeTeamName} and ${awayTeamName} are knotted up at ${game.home} runs.`,
            `It's all square here. ${homeTeamName} and ${awayTeamName} are even at ${game.home} runs. What a contest!`
        ];
        recap = tieOutcomes[Math.floor(Math.random() * tieOutcomes.length)];

        // Add inning and outs information for a tie
        let inningDescription;
        switch (game.outs) {
            case 0:
                inningDescription = ` We're now in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning, and the inning's just getting started with no outs.`;
                break;
            case 1:
                inningDescription = ` There's one out gone in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning.`;
                break;
            case 2:
                inningDescription = ` Two down, one to go in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning.`;
                break;
            default:
                inningDescription = ` And that's the side retired! Time for a change.`;
        }
        recap += inningDescription;
        return recap;
    }

    // Varying descriptions of the score
    let scoreDescription;
    switch (runDifferential) {
        case 1:
            const oneRunOutcomes = [
                `Talk about a close one! The ${winningTeam} are squeaking by the ${losingTeam} by just a run.`,
                `It's a nail-biter! The ${winningTeam} are clinging to a one-run lead over the ${losingTeam}.`,
                `Just a sliver of daylight! The ${winningTeam} lead the ${losingTeam} by a single run.`
            ];
            scoreDescription = oneRunOutcomes[Math.floor(Math.random() * oneRunOutcomes.length)];
            break;
        case 2:
            const twoRunOutcomes = [
                `The ${winningTeam} are holding a slight advantage, up by a couple of runs.`,
                `A two-run cushion for the ${winningTeam} as they lead the ${losingTeam}.`,
                `The ${winningTeam} are up by two, but this game is far from over.`
            ];
            scoreDescription = twoRunOutcomes[Math.floor(Math.random() * twoRunOutcomes.length)];
            break;
        case 3:
            const threeRunOutcomes = [
                `The ${winningTeam} have a bit of breathing room, leading by three.`,
                `A three-run lead for the ${winningTeam}, but they can't afford to relax just yet.`,
                `The ${winningTeam} are up by three, putting some distance between themselves and the ${losingTeam}.`
            ];
            scoreDescription = threeRunOutcomes[Math.floor(Math.random() * threeRunOutcomes.length)];
            break;
        case 4:
            const fourRunOutcomes = [
                `The ${winningTeam} are starting to pull away, leading by four runs.`,
                `A solid four-run advantage for the ${winningTeam}, they're in control.`,
                `The ${winningTeam} are extending their lead, now up by four runs.`
            ];
            scoreDescription = fourRunOutcomes[Math.floor(Math.random() * fourRunOutcomes.length)];
            break;
        default:
            const blowoutOutcomes = [
                `And it's a blowout! The ${winningTeam} are dominating, leading the ${losingTeam} by a whopping ${runDifferential} runs.`,
                `This one's getting out of hand! The ${winningTeam} are crushing the ${losingTeam} by ${runDifferential} runs.`,
                `It's a lopsided affair! The ${winningTeam} have a commanding ${runDifferential}-run lead.`,
                `No contest here! The ${winningTeam} are absolutely dismantling the ${losingTeam} by ${runDifferential} runs.`
            ];
            scoreDescription = blowoutOutcomes[Math.floor(Math.random() * blowoutOutcomes.length)];
    }
    recap += `${scoreDescription} The scoreboard shows ${winningScore} to ${losingScore}, ${winningTeam} in the driver's seat.\n`;

    // Varying descriptions of the hit log
    const filteredHitLogs = gameLog.map(log => log.text).filter(text => text.trim().length > 0);
    if (filteredHitLogs.length > 0) {
        let playHighlights;
        switch (filteredHitLogs.length) {
            case 1:
                const oneHitOutcomes = [
                    `We did see one noteworthy hit:`,
                    `Just one key moment to report:`,
                    `The highlight so far:`
                ];
                playHighlights = oneHitOutcomes[Math.floor(Math.random() * oneHitOutcomes.length)];
                break;
            case 2:
                const twoHitOutcomes = [
                    `A couple of key moments to mention:`,
                    `Two hits that stood out:`,
                    `Here's a look at two significant hits:`
                ];
                playHighlights = twoHitOutcomes[Math.floor(Math.random() * twoHitOutcomes.length)];
                break;
            default:
                const manyHitOutcomes = [
                    `Alright, let's recap some of the action:`,
                    `Let's take a look at the key hits:`,
                    `Here's a rundown of the highlights:`
                ];
                playHighlights = manyHitOutcomes[Math.floor(Math.random() * manyHitOutcomes.length)];
        }
        recap += '\n' + playHighlights + '\n';
        recap += filteredHitLogs.join('\n') + '\n';
    } else {
        const quietOutcomes = [
            `Things have been pretty quiet, not much to write home about so far.`,
            `It's been a slow game, not a lot of action to report.`,
            `A quiet affair so far, with minimal highlights.`
        ];
        recap += '\n' + quietOutcomes[Math.floor(Math.random() * quietOutcomes.length)] + '\n';
    }

    // Varied inning and out descriptions
    let inningDescription;
    switch (game.outs) {
        case 0:
            const noOutOutcomes = [
                `We're now in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning, and the inning's just getting started.`,
                `The ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning is underway, and there are no outs.`,
                `Fresh inning here, ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning, with no outs on the board.`
            ];
            inningDescription = noOutOutcomes[Math.floor(Math.random() * noOutOutcomes.length)];
            break;
        case 1:
            const oneOutOutcomes = [
                `That's one gone in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning.`,
                `One out recorded in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning.`,
                `First out of the inning in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning.`
            ];
            inningDescription = oneOutOutcomes[Math.floor(Math.random() * oneOutOutcomes.length)];
            break;
        case 2:
            const twoOutOutcomes = [
                `Two down, one to go in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning.`,
                `Two outs now, in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning.`,
                `We're down to the final out in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning.`
            ];
            inningDescription = twoOutOutcomes[Math.floor(Math.random() * twoOutOutcomes.length)];
            break;
        default:
            const threeOutOutcomes = [
                `And that's the side retired! Time for a change.`,
                `Three outs, and we're moving on to the next half-inning.`,
                `That'll do it for the inning, three outs and a change of sides.`
            ];
            inningDescription = threeOutOutcomes[Math.floor(Math.random() * threeOutOutcomes.length)];
    }
    recap += `\n${inningDescription}`;

    return recap;
}

// Initial Call
updateUI();
