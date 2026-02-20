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
// timer.baseSeconds: Seconds accumulated in previous "running" sessions
// timer.startTime: The timestamp (Date.now()) when the current session started
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
        document.getElementById('inning-num').innerText = game.inning;
        document.getElementById('inning-half').innerText = game.top ? 'TOP' : 'BOTTOM';
        document.getElementById('away-card').classList.toggle('batting-now', game.top);
        document.getElementById('home-card').classList.toggle('batting-now', !game.top);
        document.getElementById('away-score').innerText = game.away;
        document.getElementById('home-score').innerText = game.home;
        
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

// Timer Logic with LocalStorage Time Calculation
function toggleTimer() {
    if (timer.running) {
        // Pausing: Calculate how much time passed since startTime and add to base
        timer.baseSeconds += Math.floor((Date.now() - timer.startTime) / 1000);
        timer.running = false;
        timer.startTime = null;
        clearInterval(timerInterval);
    } else {
        // Starting: Log the exact time it started
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
    document.getElementById('timer-display').innerText = `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Drawer & Team Names
function toggleDrawer(open) {
    document.getElementById('drawer-overlay').classList.toggle('active', open);
    if(open) {
        document.getElementById('edit-away').value = localStorage.getItem('team_away') || "";
        document.getElementById('edit-home').value = localStorage.getItem('team_home') || "";
    }
}

function updateTeamName(team, name) {
    const label = document.getElementById(`${team}-label`);
    label.innerText = name.trim() === "" ? (team === 'away' ? 'AWAY' : 'HOME') : name.toUpperCase();
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

// --- SHARING & ANNOUNCER RECAP FUNCTIONALITY ---

function toggleShareMenu(event) {
    event.stopPropagation();
    document.getElementById('share-menu').classList.toggle('active');
}

document.addEventListener('click', () => {
    document.getElementById('share-menu').classList.remove('active');
});

function shareTo(platform) {
    const h = document.getElementById("home-label").textContent;
    const a = document.getElementById("away-label").textContent;
    const scoreText = `Current Score: ${a} ${game.away}, ${h} ${game.home} (${game.top ? 'Top' : 'Bottom'} ${game.inning})`;
    
    switch(platform) {
        case 'text':
            window.location.href = `sms:?&body=${encodeURIComponent(scoreText)}`;
            break;
        case 'email':
            window.location.href = `mailto:?subject=Baseball Game Update&body=${encodeURIComponent(scoreText)}`;
            break;
        case 'copyLink':
            copyToClipboard(window.location.href, "Link Copied!");
            break;
        case 'copyGameRecap':
            copyToClipboard(generateGameRecap(), "Full Recap Copied!");
            break;
        case 'generateSimpleRecap':
            copyToClipboard(scoreText, "Score Copied!");
            break;
    }
}

function copyToClipboard(text, message) {
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.share-toggle');
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<span style="font-size:10px; font-family:sans-serif">COPIED!</span>`;
        setTimeout(() => { btn.innerHTML = originalContent; }, 2000);
    });
}

function getInningSuffix(n) {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function generateGameRecap() {
    let recap = "";
    let homeTeamName = document.getElementById("home-label").textContent;
    let awayTeamName = document.getElementById("away-label").textContent;
    let runDifferential = Math.abs(game.home - game.away);
    let winningTeam, losingTeam, winningScore, losingScore;

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

        let inningDescription;
        switch (game.outs) {
            case 0:
                inningDescription = `We're now in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning, and the inning's just getting started with no outs.`;
                break;
            case 1:
                inningDescription = `There's one out gone in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning.`;
                break;
            case 2:
                inningDescription = `Two down, one to go in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning.`;
                break;
            default:
                inningDescription = `And that's the side retired! Time for a change.`;
        }
        recap += " " + inningDescription;
        return recap;
    }

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

    const filteredHitLogs = gameLog.map(l => l.text).filter(text => text.trim().length > 0);
    if (filteredHitLogs.length > 0) {
        let playHighlights;
        switch (filteredHitLogs.length) {
            case 1:
                playHighlights = `We did see one noteworthy hit:`;
                break;
            case 2:
                playHighlights = `A couple of key moments to mention:`;
                break;
            default:
                playHighlights = `Alright, let's recap some of the action:`;
        }
        recap += "\n" + playHighlights + '\n';
        recap += filteredHitLogs.slice(0, 5).join('\n') + '\n';
    } else {
        recap += "\nThings have been pretty quiet, not much to write home about so far.\n";
    }

    let finalInningDescription;
    switch (game.outs) {
        case 0:
            finalInningDescription = `We're now in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning, and the inning's just getting started.`;
            break;
        case 1:
            finalInningDescription = `That's one gone in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning.`;
            break;
        case 2:
            finalInningDescription = `Two down, one to go in the ${game.top ? 'top' : 'bottom'} of the ${getInningSuffix(game.inning)} inning.`;
            break;
        default:
            finalInningDescription = `And that's the side retired! Time for a change.`;
    }
    recap += `\n${finalInningDescription}`;

    return recap;
}

// Initialize Page
applyTheme();
updateUI();
renderLog();
updateTimerDisplay();
if (timer.running) startInterval();

const savedAway = localStorage.getItem('team_away');
const savedHome = localStorage.getItem('team_home');
if (savedAway) updateTeamName('away', savedAway);
if (savedHome) updateTeamName('home', savedHome);
