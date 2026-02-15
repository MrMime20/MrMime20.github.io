let game = { away: 0, home: 0, inning: 1, top: true, outs: 0 };
let gameLog = [];
let pitches = { mode: 'OFF', simple: 0, balls: 0, strikes: 0 };
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
    pitches = { mode: 'OFF', simple: 0, balls: 0, strikes: 0 };
    setPitchMode('OFF');
    morphNumber('away', 0);
    morphNumber('home', 0);
    renderLog();
    updateUI(true);
    clearInterval(timer.interval);
    timer.seconds = 0;
    timer.running = false;
    document.getElementById('timer-display').innerText = "00:00:00";
}

function shareGame() { console.log("Share clicked."); }

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

// Pitch Counter Logic
function setPitchMode(mode) {
    pitches.mode = mode;
    ['OFF', 'SIMPLE', 'ADVANCED'].forEach(m => {
        document.getElementById(`pitch-${m.toLowerCase()}`).classList.toggle('active', m === mode);
    });
    document.getElementById('main-pitch-area').classList.toggle('hidden', mode === 'OFF');
    document.getElementById('main-ui-simple').classList.toggle('hidden', mode !== 'SIMPLE');
    document.getElementById('main-ui-advanced').classList.toggle('hidden', mode !== 'ADVANCED');
    refreshPitchUI();
}

function updateSimplePitch(val) {
    pitches.simple = Math.max(0, pitches.simple + val);
    refreshPitchUI();
}

function updateAdvanced(type, val) {
    pitches[type] = Math.max(0, pitches[type] + val);
    refreshPitchUI();
}

function refreshPitchUI() {
    document.getElementById('main-simple-count').innerText = pitches.simple;
    const total = pitches.balls + pitches.strikes;
    const percent = total === 0 ? 0 : Math.round((pitches.strikes / total) * 100);
    document.getElementById('main-count-balls').innerText = pitches.balls;
    document.getElementById('main-count-strikes').innerText = pitches.strikes;
    document.getElementById('main-adv-total').innerText = total;
    document.getElementById('main-adv-percent').innerText = `${percent}%`;
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

// Initial Call
updateUI();
