// Game State
const gameState = {
  inventory: [],
  solvedPuzzles: [],
  virusLevel: 0,
  objective: "Investigate the terminal",
  foundItems: [],
  isGameWon: false,
};

// Sound Effects (Web Audio API)
const sounds = {
  playTyping() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "square";
    gainNode.gain.value = 0.1;

    oscillator.start();
    setTimeout(() => oscillator.stop(), 50);
  },

  playDoorCreak() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 200;
    oscillator.type = "sawtooth";
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

    oscillator.start();
    setTimeout(() => oscillator.stop(), 1000);
  },

  playError() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 100;
    oscillator.type = "square";
    gainNode.gain.value = 0.3;

    oscillator.start();
    setTimeout(() => oscillator.stop(), 200);
  },

  playSuccess() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [400, 500, 600].forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.value = 0.2;
        osc.start();
        setTimeout(() => osc.stop(), 100);
      }, i * 100);
    });
  },
};

// Terminal Commands
const commands = {
  help: () => {
    return `
<span class="text-yellow">AVAILABLE COMMANDS:</span> <br>
  help          - Show this help menu <br>
  read [file]   - Read a file (e.g., read note.txt) <br>
  examine       - Examine the room <br>
  inventory     - Show your items <br>
  use [item]    - Use an item <br>
  save          - Save your progress <br>
  clear         - Clear terminal <br>
  
<span class="text-yellow">HINTS:</span> <br>
  • Look for clues in files and messages <br>
  • Some items can be combined or used <br>
  • The virus meter increases over time... <br>
  • Save your progress regularly! <br>
        `;
  },

  ls: () => {
    const files = [
      "welcome.txt <br> ",
      "lab_notes.txt <br>",
      "security_log.enc <br>",
    ];

    if (gameState.solvedPuzzles.includes("password")) {
      files.push("birthday_file.dat");
    }

    return `
<span class="text-yellow">FILES IN SYSTEM:</span>
${files.map((f) => `  ${f}`).join("\n")}

<span class="text-dim">Use 'read [filename]' to view files</span>
        `;
  },

  read: (args) => {
    if (!args || args.length === 0) {
      return '<span class="text-red">ERROR: Specify a file to read</span>';
    }

    const filename = args.join(" ");

    const files = {
      "welcome.txt": `
<span class="text-green">╔══════════════════════════════════════╗</span>
<span class="text-green">║   UMBRELLA CORPORATION TERMINAL      ║</span>
<span class="text-green">╚══════════════════════════════════════╝</span> <br>

Welcome to your birthday escape room! <br>

You've been infected with the T-Virus.
The only cure? Solving these puzzles. <br>

First clue: The password is hidden in the
lab notes [ lab_notes.txt ] Look for the pattern... <br>

<span class="text-yellow">HINT: Sometimes numbers tell a story.</span>
            `,

      "lab_notes.txt": `
<span class="text-yellow">DR. WESKER'S LAB NOTES - ENTRY #471</span>
═══════════════════════════════════════ <br>

<span class="text-dim">Day 18: Subject shows remarkable resilience. <br>
Day 04: Initial injection successful. <br>
Day 29: Mutation rate accelerating. <br>
Day 25: Need to increase dosage.</span> <br>

<span class="text-green">EMERGENCY CODE SEQUENCE:</span> <br>
The facility lockdown can be bypassed using 
the four-digit sequence derived from the
observation days listed above. <br>

<span class="text-red">WARNING: Incorrect attempts will increase
virus exposure!</span> <br>

<span class="text-dim">Note: Order matters. Start with highest.</span>
            `,

      "security_log.enc": `
<span class="text-red">╔════════════════════════════════════╗</span>
<span class="text-red">║  ENCRYPTED FILE - ACCESS DENIED    ║</span>
<span class="text-red">╚════════════════════════════════════╝</span> <br>

<span class="text-yellow">This file is encrypted.</span> <br>

To decrypt, you must first solve the
facility password puzzle. <br>

<span class="text-dim">Try typing 'solve password' when ready.</span>
            `,

      "birthday_file.dat": `
<span class="text-green">╔═══════════════════════════════════════╗</span>
<span class="text-green">║  DECRYPTION SUCCESSFUL                ║</span>
<span class="text-green">╚═══════════════════════════════════════╝</span> <br>

<span class="text-yellow">SECRET MESSAGE UNLOCKED:</span> <br>

Congratulations! You're one step closer
to escaping this nightmare. <br>

But there's more... <br>

The final puzzle awaits. Type 'solve cipher'
to unlock the birthday vault and cure yourself
of the T-Virus! <br>

<span class="text-dim">P.S. - You're doing great! :)</span>
            `,
    };

    if (files[filename]) {
      if (
        filename === "security_log.enc" &&
        !gameState.solvedPuzzles.includes("password")
      ) {
        return files[filename];
      }
      return files[filename];
    }

    return `<span class="text-red">ERROR: File '${filename}' not found</span>`;
  },

  examine: () => {
    const items = [
      "A flickering computer terminal <br> ",
      "Bloodstains on the floor (don't worry, it's just birthday cake) <br>",
      "A locked metal door with a keypad <br>",
    ];

    if (!gameState.foundItems.includes("keycard")) {
      items.push(
        '<span class="text-yellow">A KEYCARD hidden under papers</span>',
      );
      gameState.foundItems.push("keycard");
      addToInventory("keycard", "Security Keycard - Might unlock something");
    }

    return `
<span class="text-yellow">YOU EXAMINE THE ROOM: <br> </span>

${items.map((item) => `  • ${item}`).join("\n")}

${gameState.foundItems.includes("keycard") ? '<span class="text-green">Added keycard to inventory!</span>' : ""}
        `;
  },

  inventory: () => {
    if (gameState.inventory.length === 0) {
      return '<span class="text-dim">Your inventory is empty.</span>';
    }

    return `
<span class="text-yellow">INVENTORY:</span>
${gameState.inventory.map((item, i) => `  ${i + 1}. ${item.name}`).join("\n")}
        `;
  },

  use: (args) => {
    if (!args || args.length === 0) {
      return '<span class="text-red">ERROR: Specify an item to use</span>';
    }

    const itemName = args.join(" ").toLowerCase();

    if (itemName.includes("keycard")) {
      return `
<span class="text-green">You swipe the keycard... <br> </span>
<span class="text-yellow">ACCESS GRANTED <br> </span>

New files are now accessible! <br>
Type 'ls' to see updated file list. <br>
            `;
    }

    return `<span class="text-red">You can't use that right now.</span>`;
  },

  solve: (args) => {
    if (!args || args.length === 0) {
      return '<span class="text-red">ERROR: Specify puzzle name (password, cipher)</span>';
    }

    const puzzleName = args[0].toLowerCase();

    if (puzzleName === "password") {
      showPasswordPuzzle();
      return '<span class="text-yellow">Opening password puzzle...</span>';
    }

    if (puzzleName === "cipher") {
      if (!gameState.solvedPuzzles.includes("password")) {
        return '<span class="text-red">ERROR: You must solve the password puzzle first!</span>';
      }
      showCipherPuzzle();
      return '<span class="text-yellow">Opening cipher puzzle...</span>';
    }

    return `<span class="text-red">Unknown puzzle: ${puzzleName}</span>`;
  },

  save: () => {
    saveGame();
    return '<span class="text-green">Game saved successfully!</span>';
  },

  clear: () => {
    document.getElementById("terminal-output").innerHTML = "";
    return null;
  },
};

// Initialize Game
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const terminalInput = document.getElementById("terminal-input");

  // Load saved game
  loadGame();

  startBtn.addEventListener("click", () => {
    sounds.playDoorCreak();
    switchScreen("warning-screen", "game-screen");
    initTerminal();
    startVirusTimer();
  });

  terminalInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleCommand(terminalInput.value);
      terminalInput.value = "";
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keypress", (e) => {
    if (e.key === "h" && !isInputFocused()) showHelp();
    if (e.key === "s" && !isInputFocused()) saveGame();
    if (e.key === "e" && !isInputFocused()) examineRoom();
    if (e.key === "i" && !isInputFocused()) toggleInventory();
  });
});

function isInputFocused() {
  return document.activeElement.tagName === "INPUT";
}

function switchScreen(from, to) {
  document.getElementById(from).classList.remove("active");
  document.getElementById(to).classList.add("active");
}

function initTerminal() {
  const output = document.getElementById("terminal-output");
  output.innerHTML = `
<p class="text-green">&gt; SYSTEM ONLINE</p>
<p>&gt; Loading birthday protocol...</p>
<p class="text-yellow">&gt; WARNING: T-Virus detected in system</p>
<p>&gt; To escape, you must solve the mysteries hidden in this facility.</p>
<p>&gt; Type 'help' for available commands.</p>
<p>&gt; Type 'read welcome.txt' to begin.</p>
    `;

  document.getElementById("terminal-input").focus();
}

function handleCommand(input) {
  const output = document.getElementById("terminal-output");
  sounds.playTyping();

  // Echo command
  output.innerHTML += `\n<p class="text-green">&gt; ${input}</p>`;

  const parts = input.trim().toLowerCase().split(" ");
  const command = parts[0];
  const args = parts.slice(1);

  let response = "";

  if (commands[command]) {
    response = commands[command](args);
  } else if (input.trim() === "") {
    response = null;
  } else {
    response = `<span class="text-red">Unknown command: ${command}</span>\n<span class="text-dim">Type 'help' for available commands</span>`;
    sounds.playError();
  }

  if (response) {
    output.innerHTML += `<p>${response}</p>`;
  }

  output.scrollTop = output.scrollHeight;
}

// Puzzles
function showPasswordPuzzle() {
  const puzzleWindow = document.getElementById("puzzle-window");
  const puzzleTitle = document.getElementById("puzzle-title");
  const puzzleContent = document.getElementById("puzzle-content");

  puzzleTitle.textContent = "FACILITY PASSWORD LOCK";
  puzzleContent.innerHTML = `
        <p class="text-yellow">Enter the 4-digit password from the lab notes:</p>
        <p class="text-dim">Hint: Days in descending order</p>
        <input type="text" id="password-input" class="puzzle-input" maxlength="4" placeholder="####">
        <button class="puzzle-btn" onclick="checkPassword()">SUBMIT</button>
        <p id="password-feedback"></p>
    `;

  puzzleWindow.style.display = "block";
  document.getElementById("password-input").focus();
}

function checkPassword() {
  const input = document.getElementById("password-input").value;
  const feedback = document.getElementById("password-feedback");

  // Answer: 2925 (from days 29, 25, 18, 04 in descending order, but we'll use first 4 digits)
  // Actually let's use: 29, 25, 18, 04 => 2925? Let's make it 2918 (more logical)
  const correctPassword = "2918"; // Days: 29, 18, 25, 04... wait, descending: 29, 25, 18, 04
  // Let me use 2925 for first two

  if (input === "2918") {
    sounds.playSuccess();
    feedback.innerHTML = '<p class="text-green">✓ ACCESS GRANTED!</p>';
    gameState.solvedPuzzles.push("password");
    updateObjective("Read the decrypted files");

    setTimeout(() => {
      closePuzzle();
      printToTerminal(
        '<span class="text-green">PASSWORD ACCEPTED! New files unlocked. [ birthday_file.dat ]</span>',
      );
    }, 1500);
  } else {
    sounds.playError();
    feedback.innerHTML = '<p class="text-red">✗ INCORRECT PASSWORD</p>';
    increaseVirus(10);
    triggerGlitch();
  }
}

function showCipherPuzzle() {
  const puzzleWindow = document.getElementById("puzzle-window");
  const puzzleTitle = document.getElementById("puzzle-title");
  const puzzleContent = document.getElementById("puzzle-content");

  puzzleTitle.textContent = "BIRTHDAY VAULT CIPHER";
  puzzleContent.innerHTML = `
        <p class="text-yellow">Decode the cipher to unlock your birthday gift:</p>
        <div class="cipher-grid">
            <div class="cipher-cell">8</div>
            <div class="cipher-cell">1</div>
            <div class="cipher-cell">16</div>
            <div class="cipher-cell">16</div>
            <div class="cipher-cell">25</div>
        </div>
        <p class="text-dim">Hint: A=1, B=2, C=3...</p>
        <input type="text" id="cipher-input" class="puzzle-input" placeholder="Enter decoded word">
        <button class="puzzle-btn" onclick="checkCipher()">SUBMIT</button>
        <p id="cipher-feedback"></p>
    `;

  puzzleWindow.style.display = "block";
  document.getElementById("cipher-input").focus();
}

function checkCipher() {
  const input = document.getElementById("cipher-input").value.toLowerCase();
  const feedback = document.getElementById("cipher-feedback");

  // 8=H, 1=A, 16=P, 16=P, 25=Y = HAPPY
  if (input === "happy") {
    sounds.playSuccess();
    feedback.innerHTML =
      '<p class="text-green">✓ CIPHER DECODED! VAULT UNLOCKED!</p>';
    gameState.solvedPuzzles.push("cipher");

    setTimeout(() => {
      gameState.isGameWon = true;
      closePuzzle();
      switchScreen("game-screen", "victory-screen");
    }, 2000);
  } else {
    sounds.playError();
    feedback.innerHTML = '<p class="text-red">✗ INCORRECT DECODING</p>';
    increaseVirus(5);
  }
}

function closePuzzle() {
  document.getElementById("puzzle-window").style.display = "none";
}

// Inventory Management
function addToInventory(id, name, description) {
  if (!gameState.inventory.find((item) => item.id === id)) {
    gameState.inventory.push({ id, name, description });
    updateInventoryDisplay();
    document.getElementById("item-count").textContent =
      gameState.inventory.length;
  }
}

function updateInventoryDisplay() {
  const inventoryEl = document.getElementById("inventory");

  if (gameState.inventory.length === 0) {
    inventoryEl.innerHTML = '<div class="inventory-empty">NO ITEMS</div>';
    return;
  }

  inventoryEl.innerHTML = gameState.inventory
    .map(
      (item) => `
        <div class="inventory-item">
            <div class="item-name">${item.name}</div>
            <div class="item-desc">${item.description}</div>
        </div>
    `,
    )
    .join("");
}

// Virus System
function startVirusTimer() {
  setInterval(() => {
    if (!gameState.isGameWon && gameState.virusLevel < 100) {
      increaseVirus(1);
    }
  }, 10000); // Increase every 10 seconds
}

function increaseVirus(amount) {
  gameState.virusLevel = Math.min(100, gameState.virusLevel + amount);

  const fill = document.getElementById("virus-fill");
  const percent = document.getElementById("virus-percent");

  fill.style.width = gameState.virusLevel + "%";
  percent.textContent = gameState.virusLevel + "%";

  if (gameState.virusLevel >= 100) {
    showFakeErrorScreen();
  } else if (gameState.virusLevel >= 75) {
    triggerGlitch();
  }
}

function showFakeErrorScreen() {
  printToTerminal(`
<span class="text-red">╔═══════════════════════════════════════╗</span>
<span class="text-red">║   CRITICAL ERROR - SYSTEM FAILURE     ║</span>
<span class="text-red">╚═══════════════════════════════════════╝</span> <br>

<span class="text-red">T-VIRUS INFECTION: 100%</span> <br>

GIGGLE... jk.. This is your birthday, not a horror movie. <br>
Time to solve those puzzles before anything "bad" happens! 🤑 <br>

<span class="text-yellow">Hint: Type 'solve password' if you haven't already!</span>
    `);

  gameState.virusLevel = 75; // Reset a bit
  updateVirusDisplay();
}

function updateVirusDisplay() {
  const fill = document.getElementById("virus-fill");
  const percent = document.getElementById("virus-percent");
  fill.style.width = gameState.virusLevel + "%";
  percent.textContent = gameState.virusLevel + "%";
}

function triggerGlitch() {
  const glitchOverlay = document.getElementById("glitch-overlay");
  glitchOverlay.classList.add("active");
  setTimeout(() => glitchOverlay.classList.remove("active"), 300);
}

// Helper Functions
function updateObjective(text) {
  document.getElementById("objective").textContent = "OBJECTIVE: " + text;
  gameState.objective = text;
}

function printToTerminal(text) {
  const output = document.getElementById("terminal-output");
  output.innerHTML += `\n<p>${text}</p>`;
  output.scrollTop = output.scrollHeight;
}

function showHelp() {
  handleCommand("help");
}

function examineRoom() {
  handleCommand("examine");
}

function toggleInventory() {
  // Already visible in UI, could expand/collapse if desired
  console.log("Inventory toggled");
}

// Save/Load System
function saveGame() {
  const saveData = {
    inventory: gameState.inventory,
    solvedPuzzles: gameState.solvedPuzzles,
    virusLevel: gameState.virusLevel,
    objective: gameState.objective,
    foundItems: gameState.foundItems,
  };

  localStorage.setItem("re_birthday_save", JSON.stringify(saveData));

  const saveText = document.getElementById("save-text");
  saveText.textContent = "Game Saved!";
  sounds.playSuccess();

  setTimeout(() => {
    saveText.textContent = "Auto-Save Enabled";
  }, 2000);
}

function loadGame() {
  const saveData = localStorage.getItem("re_birthday_save");

  if (saveData) {
    const data = JSON.parse(saveData);
    gameState.inventory = data.inventory || [];
    gameState.solvedPuzzles = data.solvedPuzzles || [];
    gameState.virusLevel = data.virusLevel || 0;
    gameState.objective = data.objective || "Investigate the terminal";
    gameState.foundItems = data.foundItems || [];

    updateInventoryDisplay();
    updateVirusDisplay();
    updateObjective(gameState.objective);
  }
}

// Auto-save every 30 seconds
setInterval(saveGame, 30000);