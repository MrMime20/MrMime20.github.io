// Initialize game state from localStorage or defaults
let game = JSON.parse(localStorage.getItem('diamond_tracker_game')) || { 
    away: 0, 
    home: 0, 
    inning: 1, 
    top: true, 
    outs: 0 
};

let gameLog = JSON.parse(localStorage.getItem('diamond_tracker_log')) || [];
let currentThemeIndex = parseInt(localStorage.getItem('diamond_tracker_theme')) || 0;
let isClearing = false;

// Timer State with LocalStorage persistence
let timer = JSON.parse(localStorage.getItem('diamond_tracker_timer')) || { 
    startTime: null, 
    baseSeconds: 0, 
    running: false 
};
let timerInterval = null;

function saveAll() {
    localStorage.setItem('diamond_tracker_game', JSON.stringify(game));
    localStorage.setItem('diamond_tracker_log', JSON.stringify(gameLog));
    localStorage.setItem('diamond_tracker_theme', currentThemeIndex);
    localStorage.setItem('diamond_tracker_timer', JSON.stringify(timer));
}

const themes = [
    { name: "forest", bg: "#1a2e1a", glass: "rgba(0, 0, 0, 0.3)", accent: "#d4e09b", primary: "#3a5a40", btnText: "#fff" },
    { name: "crimson", bg: "#780000", glass: "rgba(0, 48, 73, 0.5)", accent: "#fdf0d5", primary: "#c1121f", btnText: "#fff" },
    { name: "midnight", bg: "#0d1b2a", glass: "rgba(27, 38, 59, 0.6)", accent: "#e0e1dd", primary: "#415a77", btnText: "#fff" },
    { name: "indigo", bg: "#7699d4", glass: "rgba(30, 30, 36, 0.5)", accent: "#f0f2ef", primary: "#232ed1", btnText: "#fff" },
    { name: "graphite", bg: "#383535", glass: "rgba(20, 20, 20, 0.6)", accent: "#e6e4ce", primary: "#6d98ba", btnText: "#000" },
    { name: "slate", bg: "#1d2d44", glass: "rgba(13, 19, 33, 0.7)", accent: "#e6e4ce", primary: "#748cab", btnText: "#fff" }
];

function applyTheme() {
    const t = themes[currentThemeIndex];
    const root = document.documentElement;
    root.style.setProperty('--bg-color', t.bg);
    root.style.setProperty('--glass-bg', t.glass);
    root.style.setProperty('--text-accent', t.accent);
    root.style.setProperty('--btn-primary', t.primary);
    root.style.setProperty('--btn-text', t.btnText);
}

function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    applyTheme();
    saveAll();
}

// Score & UI Morphing Logic
function updateScore(team, val) {
    const oldVal = game[team];
    const newVal = Math.max(0, game[team] + val);
    if (oldVal !== newVal) {
        game[team] = newVal;
        morphNumber(team, newVal);
        saveAll();
    }
}

function morphNumber(team, newVal) {
    const blurNode = document.getElementById(`blur-${team}`);
    const zone = document.querySelector(`.${team}-filter`);
    if (!blurNode || !zone) return;

    const oldScores = zone.querySelectorAll('.score-display');
    oldScores.forEach((el, index) => { if (index < oldScores.length - 1) el.remove(); });
    
    const oldDisplay = Array.from(oldScores).pop();
    animateBlur(blurNode, 0, 10, 400);
    
    const newDisplay = document.createElement('div');
    newDisplay.className = 'score-display enter';
    newDisplay.id = `${team}-score`; // Maintain ID for render function
    newDisplay.innerText = newVal;
    zone.appendChild(newDisplay);
    
    setTimeout(() => {
        if (oldDisplay) {
            oldDisplay.classList.add('exit');
            oldDisplay.removeAttribute('id'); // Remove ID so only one exists
        }
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

// Inning & Out Logic
function handleOutClick(e) {
    if (isClearing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) removeOut();
    else addOut();
}

function removeOut() {
    if (game.outs > 0) {
        game.outs--;
        updateUI();
        saveAll();
    }
}

function addOut() {
    if (isClearing || game.outs >= 3) return;
    game.outs++;
    updateUI();
    saveAll();
    if (game.outs === 3) {
        isClearing = true;
        setTimeout(sequentialReset, 600);
    }
}

function sequentialReset() {
    const dots = document.querySelectorAll('.dot');
    if (dots.length < 3) return;
    setTimeout(() => { dots[2].classList.remove('active'); }, 0);
    setTimeout(() => { dots[1].classList.remove('active'); }, 200);
    setTimeout(() => { 
        dots[0].classList.remove('active'); 
        setTimeout(() => {
            game.outs = 0;
            if (game.top) { game.top = false; } else { game.top = true; game.inning++; }
            isClearing = false;
            updateUI(true);
            saveAll();
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
    saveAll();
}

function updateUI(shouldAnimate = false) {
    const inningText = document.getElementById('inning-text');
    const render = () => {
        const inNum = document.getElementById('inning-num');
        const inHalf = document.getElementById('inning-half');
        const awayC = document.getElementById('away-card');
        const homeC = document.getElementById('home-card');
        const awayS = document.getElementById('away-score');
        const homeS = document.getElementById('home-score');

        if (inNum) inNum.innerText = game.inning;
        if (inHalf) inHalf.innerText = game.top ? 'TOP' : 'BOTTOM';
        if (awayC) awayC.classList.toggle('batting-now', game.top);
        if (homeC) homeC.classList.toggle('batting-now', !game.top);
        if (awayS) awayS.innerText = game.away;
        if (homeS) homeS.innerText = game.home;
        
        if (!isClearing) {
            document.querySelectorAll('.dot').forEach((d, i) => {
                d.classList.toggle('active', i < game.outs);
            });
        }
    };

    if (shouldAnimate && inningText) {
        inningText.classList.add('slide-out');
        setTimeout(() => {
            render();
            inningText.classList.remove('slide-out');
            inningText.classList.add('slide-in');
            setTimeout(() => { inningText.classList.remove('slide-in'); }, 50);
        }, 300);
    } else { render(); }
}

// Timer Logic
function toggleTimer() {
    if (timer.running) {
        timer.baseSeconds += Math.floor((Date.now() - timer.startTime) / 1000);
        timer.running = false;
        timer.startTime = null;
        clearInterval(timerInterval);
    } else {
        timer.running = true;
        timer.startTime = Date.now();
        startInterval();
    }
    saveAll();
}

function startInterval() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    let totalSeconds = timer.baseSeconds;
    if (timer.running && timer.startTime) {
        const elapsedSinceStart = Math.floor((Date.now() - timer.startTime) / 1000);
        totalSeconds += elapsedSinceStart;
    }
    
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    const display = document.getElementById('timer-display');
    if (display) display.innerText = `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Drawer & Team Names
function toggleDrawer(open) {
    const drawer = document.getElementById('drawer-overlay');
    if (!drawer) return;
    drawer.classList.toggle('active', open);
    if(open) {
        document.getElementById('edit-away').value = localStorage.getItem('team_away') || "";
        document.getElementById('edit-home').value = localStorage.getItem('team_home') || "";
    }
}

function updateTeamName(team, name) {
    const label = document.getElementById(`${team}-label`);
    if (label) label.innerText = name.trim() === "" ? (team === 'away' ? 'AWAY' : 'HOME') : name.toUpperCase();
    localStorage.setItem(`team_${team}`, name);
}

function confirmReset() {
    if (confirm("Are you sure you want to start a new game?")) {
        localStorage.clear();
        game = { away: 0, home: 0, inning: 1, top: true, outs: 0 };
        gameLog = [];
        timer = { startTime: null, baseSeconds: 0, running: false };
        clearInterval(timerInterval);
        
        morphNumber('away', 0);
        morphNumber('home', 0);
        renderLog();
        updateUI(true);
        updateTimerDisplay();
        
        document.getElementById('edit-away').value = "";
        document.getElementById('edit-home').value = "";
        updateTeamName('away', "");
        updateTeamName('home', "");
        
        toggleDrawer(false);
        saveAll();
    }
}

// Hit Log Logic
function handleHitTypeChange() {
    const hitType = document.getElementById('log-type').value;
    const locationSelect = document.getElementById('log-location');
    const nonSpatial = ["walk", "hbp", "strikeout"];
    locationSelect.disabled = nonSpatial.includes(hitType);
    if (locationSelect.disabled) locationSelect.selectedIndex = 0;
}

function addHitLog() {
    const playerName = document.getElementById('log-player').value.trim();
    const hitType = document.getElementById('log-type').value;
    const location = document.getElementById('log-location').value;

    if (!playerName || !hitType) return alert("Name and Hit Type required");

    let logEntry = "";
    if (hitType === "strikeout") logEntry = `${playerName} struck out.`;
    else if (hitType === "walk") logEntry = `${playerName} walked.`;
    else if (hitType === "hbp") logEntry = `${playerName} was hit by a pitch.`;
    else if (hitType === "groundout") logEntry = `${playerName} grounded out to ${location}.`;
    else if (hitType === "popout") logEntry = `${playerName} popped out to ${location}.`;
    else if (hitType === "flyout") logEntry = `${playerName} flied out to ${location}.`;
    else if (hitType === "lineout") logEntry = `${playerName} lined out to ${location}.`;
    else if (hitType === "homerun") logEntry = `${playerName} hit a homerun to ${location}.`;
    else if (hitType === "single") logEntry = `${playerName} hit a single to ${location}.`;
    else if (hitType === "double") logEntry = `${playerName} hit a double to ${location}.`;
    else if (hitType === "triple") logEntry = `${playerName} hit a triple to ${location}.`;

    gameLog.unshift({ text: logEntry, inning: game.inning, top: game.top });
    renderLog();
    saveAll();
    
    document.getElementById('log-player').value = "";
    document.getElementById('log-type').selectedIndex = 0;
    document.getElementById('log-location').selectedIndex = 0;
}

function renderLog() {
    const container = document.getElementById('hit-log-container');
    if (!container) return;
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

// Sharing functions
function toggleShareMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('share-menu');
    if (menu) menu.classList.toggle('active');
}

function shareTo(platform) {
    const h = document.getElementById("home-label").textContent;
    const a = document.getElementById("away-label").textContent;
    const scoreText = `Current Score: ${a} ${game.away}, ${h} ${game.home} (${game.top ? 'Top' : 'Bottom'} ${game.inning})`;
    
    switch(platform) {
        case 'text': window.location.href = `sms:?&body=${encodeURIComponent(scoreText)}`; break;
        case 'email': window.location.href = `mailto:?subject=Baseball Update&body=${encodeURIComponent(scoreText)}`; break;
        case 'copyLink': copyToClipboard(window.location.href, "Link Copied!"); break;
        case 'copyGameRecap': copyToClipboard(generateGameRecap(), "Full Recap Copied!"); break;
        case 'generateSimpleRecap': copyToClipboard(scoreText, "Score Copied!"); break;
    }
}

function copyToClipboard(text, message) {
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.share-toggle');
        if (!btn) return;
        const original = btn.innerHTML;
        btn.innerHTML = `<span style="font-size:10px;">COPIED!</span>`;
        setTimeout(() => { btn.innerHTML = original; }, 2000);
    });
}

function getInningSuffix(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function generateGameRecap() {
    let homeTeamName = document.getElementById("home-label").textContent;
    let awayTeamName = document.getElementById("away-label").textContent;
    let recap = `${awayTeamName} vs ${homeTeamName}\nScore: ${game.away} - ${game.home}\nInning: ${game.top ? 'Top' : 'Bottom'} ${game.inning}\n\nRecent Plays:\n`;
    recap += gameLog.slice(0, 5).map(l => l.text).join('\n');
    return recap;
}

// Initial Run after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    updateUI();
    renderLog();
    updateTimerDisplay();
    if (timer.running) startInterval();

    const savedAway = localStorage.getItem('team_away');
    const savedHome = localStorage.getItem('team_home');
    if (savedAway) updateTeamName('away', savedAway);
    if (savedHome) updateTeamName('home', savedHome);

    document.addEventListener('click', () => {
        const menu = document.getElementById('share-menu');
        if (menu) menu.classList.remove('active');
    });
});
