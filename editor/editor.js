/**
 * Magic Four² Puzzle Editor
 * Web-based editor for creating puzzles manually
 */

// Note: validator import removed - validation done inline for standalone editor

// Translations
const translations = {
  en: {
    title: '🎮 Magic Four² Puzzle Editor',
    subtitle: 'Create and edit puzzles for the Magic Four Squared game',
    metadata: '📋 Puzzle Metadata',
    language: 'Language',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    grid: '🔢 Magic Square Grid',
    gridHelp: 'Enter 4 letters in each cell to form your magic square. Each row and column should form a 4-letter word.',
    riddles: '🎯 Riddles',
    riddlesHelp: 'Create a riddle for each word in your magic square.',
    riddle: 'Riddle',
    prompt: 'Riddle Prompt',
    promptPlaceholder: 'Describe the word without spelling it out...',
    promptHelp: 'Describe what the word means, not its letters',
    hint: 'Hint',
    hintPlaceholder: 'A helpful clue...',
    hintHelp: 'Provide additional context or a different angle',
    explanation: 'Explanation',
    explanationPlaceholder: 'Why this answer is correct...',
    explanationHelp: 'Explain why the answer fits the riddle',
    preview: '👁️ Preview JSON',
    download: '💾 Download Puzzle',
    shareLink: '🔗 Generate Share Link',
    pasteJSON: '📋 Paste JSON',
    loadExample: '📝 Load Example',
    clear: '🗑️ Clear All',
    jsonPreview: 'JSON Preview',
    required: '*'
  },
  he: {
    title: '🎮 עורך חידות Magic Four²',
    subtitle: 'צור וערוך חידות למשחק ריבוע הקסם',
    metadata: '📋 מטא-נתונים של החידה',
    language: 'שפה',
    difficulty: 'רמת קושי',
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
    grid: '🔢 רשת ריבוע הקסם',
    gridHelp: 'הזן 4 אותיות בכל תא ליצירת ריבוע הקסם. כל שורה ועמודה צריכות ליצור מילה בת 4 אותיות.',
    riddles: '🎯 חידות',
    riddlesHelp: 'צור חידה לכל מילה בריבוע הקסם שלך.',
    riddle: 'חידה',
    prompt: 'נוסח החידה',
    promptPlaceholder: 'תאר את המילה מבלי לאיית אותה...',
    promptHelp: 'תאר את משמעות המילה, לא את האותיות שלה',
    hint: 'רמז',
    hintPlaceholder: 'רמז מועיל...',
    hintHelp: 'ספק הקשר נוסף או זווית שונה',
    explanation: 'הסבר',
    explanationPlaceholder: 'למה התשובה הזו נכונה...',
    explanationHelp: 'הסבר למה התשובה מתאימה לחידה',
    preview: '👁️ תצוגה מקדימה של JSON',
    download: '💾 הורד חידה',
    shareLink: '🔗 צור קישור לשיתוף',
    pasteJSON: '📋 הדבק JSON',
    loadExample: '📝 טען דוגמה',
    clear: '🗑️ נקה הכל',
    jsonPreview: 'תצוגה מקדימה של JSON',
    required: '*'
  }
};

let currentLanguage = 'en';

// Get translation
function t(key) {
  return translations[currentLanguage][key] || translations.en[key] || key;
}

// Update UI language
function updateUILanguage() {
  // Header
  document.querySelector('.header h1').textContent = t('title');
  document.querySelector('.header p').textContent = t('subtitle');

  // Metadata section
  document.querySelectorAll('.section h2')[0].textContent = t('metadata');
  document.querySelector('label[for="language"]').textContent = t('language');
  document.querySelector('label[for="difficulty"]').textContent = t('difficulty');

  // Difficulty options
  document.querySelector('#difficulty option[value="easy"]').textContent = t('easy');
  document.querySelector('#difficulty option[value="medium"]').textContent = t('medium');
  document.querySelector('#difficulty option[value="hard"]').textContent = t('hard');

  // Grid section
  document.querySelectorAll('.section h2')[1].textContent = t('grid');
  document.querySelectorAll('.help-text')[0].textContent = t('gridHelp');

  // Riddles section
  document.querySelectorAll('.section h2')[2].textContent = t('riddles');
  document.querySelectorAll('.help-text')[1].textContent = t('riddlesHelp');

  // Update riddle cards
  for (let i = 1; i <= 4; i++) {
    const word = document.getElementById(`word-${i}`).textContent;
    document.querySelector(`#riddle-${i} h3`).innerHTML = `${t('riddle')} ${i}: <span id="word-${i}" style="color: #764ba2;">${word}</span>`;

    document.querySelector(`label[for="prompt-${i}"]`).textContent = t('prompt') + ' ' + t('required');
    document.getElementById(`prompt-${i}`).placeholder = t('promptPlaceholder');
    document.querySelectorAll(`#riddle-${i} .help-text`)[0].textContent = t('promptHelp');

    document.querySelector(`label[for="hint-${i}"]`).textContent = t('hint') + ' ' + t('required');
    document.getElementById(`hint-${i}`).placeholder = t('hintPlaceholder');
    document.querySelectorAll(`#riddle-${i} .help-text`)[1].textContent = t('hintHelp');

    document.querySelector(`label[for="explanation-${i}"]`).textContent = t('explanation') + ' ' + t('required');
    document.getElementById(`explanation-${i}`).placeholder = t('explanationPlaceholder');
    document.querySelectorAll(`#riddle-${i} .help-text`)[2].textContent = t('explanationHelp');
  }

  // Buttons
  document.querySelector('.btn-primary').textContent = t('preview');
  const successButtons = document.querySelectorAll('.btn-success');
  successButtons[0].textContent = t('download');
  successButtons[1].textContent = t('shareLink') || '🔗 Generate Share Link';
  const secondaryButtons = document.querySelectorAll('.btn-secondary');
  secondaryButtons[0].textContent = t('pasteJSON');
  secondaryButtons[1].textContent = t('loadExample');
  document.querySelector('.btn-danger').textContent = t('clear');

  // Preview section
  if (document.querySelector('.preview h3')) {
    document.querySelector('.preview h3').textContent = t('jsonPreview');
  }
}

// Initialize the editor
function init() {
  createGrid();
  createRiddleCards();
  setupEventListeners();
  updateUILanguage();
}

// Create the 4x4 grid
function createGrid() {
  const gridContainer = document.getElementById('grid');
  gridContainer.innerHTML = '';

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';

      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.dataset.row = row;
      input.dataset.col = col;
      input.id = `cell-${row}-${col}`;

      // Auto-advance to next cell
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 1) {
          const nextCol = col + 1;
          const nextRow = nextCol >= 4 ? row + 1 : row;
          const nextColWrapped = nextCol % 4;

          if (nextRow < 4) {
            const nextInput = document.getElementById(`cell-${nextRow}-${nextColWrapped}`);
            if (nextInput) nextInput.focus();
          }
        }
        updateWords();
      });

      cell.appendChild(input);
      gridContainer.appendChild(cell);
    }
  }
}

// Create riddle input cards
function createRiddleCards() {
  const container = document.getElementById('riddles-container');
  container.innerHTML = '';

  for (let i = 1; i <= 4; i++) {
    const card = document.createElement('div');
    card.className = 'riddle-card';
    card.id = `riddle-${i}`;

    card.innerHTML = `
      <h3>Riddle ${i}: <span id="word-${i}" style="color: #764ba2;">____</span></h3>
      
      <div class="form-group">
        <label for="prompt-${i}">Riddle Prompt *</label>
        <textarea id="prompt-${i}" placeholder="Describe the word without spelling it out..." required></textarea>
        <div class="help-text">Describe what the word means, not its letters</div>
      </div>
      
      <div class="form-group">
        <label for="hint-${i}">Hint *</label>
        <textarea id="hint-${i}" placeholder="A helpful clue..." required></textarea>
        <div class="help-text">Provide additional context or a different angle</div>
      </div>
      
      <div class="form-group">
        <label for="explanation-${i}">Explanation *</label>
        <textarea id="explanation-${i}" placeholder="Why this answer is correct..." required></textarea>
        <div class="help-text">Explain why the answer fits the riddle</div>
      </div>
    `;

    container.appendChild(card);
  }
}

// Update word displays when grid changes
function updateWords() {
  const grid = getGridValues();

  // Update each word display
  for (let i = 0; i < 4; i++) {
    const word = grid[i].join('');
    const wordDisplay = document.getElementById(`word-${i + 1}`);
    if (wordDisplay) {
      wordDisplay.textContent = word || '____';
    }
  }
}

// Get grid values as 2D array
function getGridValues() {
  const grid = [];
  for (let row = 0; row < 4; row++) {
    const rowData = [];
    for (let col = 0; col < 4; col++) {
      const input = document.getElementById(`cell-${row}-${col}`);
      rowData.push(input.value.toUpperCase() || '');
    }
    grid.push(rowData);
  }
  return grid;
}

// Get words from grid
function getWords() {
  const grid = getGridValues();
  return grid.map(row => row.join(''));
}

// Generate puzzle JSON
function generatePuzzleJSON() {
  const language = document.getElementById('language').value;
  const difficulty = document.getElementById('difficulty').value;
  const grid = getGridValues();
  const words = getWords();

  // Get riddles
  const riddles = [];
  for (let i = 1; i <= 4; i++) {
    const prompt = document.getElementById(`prompt-${i}`).value.trim();
    const hint = document.getElementById(`hint-${i}`).value.trim();
    const explanation = document.getElementById(`explanation-${i}`).value.trim();
    const answer = words[i - 1];

    riddles.push({
      id: i,
      prompt,
      answer,
      solutionWord: answer,
      position: i - 1,
      hint,
      explanation
    });
  }

  // Create puzzle object
  const puzzle = {
    puzzleId: generateUUID(),
    version: '1.0.0',
    language,
    direction: language === 'he' ? 'rtl' : 'ltr',
    grid,
    words,
    riddles,
    metadata: {
      createdAt: new Date().toISOString(),
      difficulty,
      source: 'manual-editor'
    }
  };

  return puzzle;
}

// Generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Validate puzzle
function validatePuzzleData(puzzle) {
  const errors = [];

  // Check grid
  if (!puzzle.grid || puzzle.grid.length !== 4) {
    errors.push('Grid must have 4 rows');
  } else {
    puzzle.grid.forEach((row, i) => {
      if (row.length !== 4) {
        errors.push(`Row ${i + 1} must have 4 cells`);
      }
      row.forEach((cell, j) => {
        if (!cell || cell.length !== 1) {
          errors.push(`Cell at row ${i + 1}, col ${j + 1} must have exactly 1 character`);
        }
      });
    });
  }

  // Check words
  puzzle.words.forEach((word, i) => {
    if (word.length !== 4) {
      errors.push(`Word ${i + 1} must be 4 letters`);
    }
  });

  // Check riddles
  puzzle.riddles.forEach((riddle, i) => {
    if (!riddle.prompt) errors.push(`Riddle ${i + 1}: Prompt is required`);
    if (!riddle.hint) errors.push(`Riddle ${i + 1}: Hint is required`);
    if (!riddle.explanation) errors.push(`Riddle ${i + 1}: Explanation is required`);

    // Check for letter-spelling
    if (riddle.prompt && riddle.prompt.toLowerCase().includes('letter')) {
      errors.push(`Riddle ${i + 1}: Avoid mentioning letters in the prompt`);
    }
  });

  return errors;
}

// Show message
function showMessage(text, type = 'success') {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type} show`;

  setTimeout(() => {
    messageEl.classList.remove('show');
  }, 5000);
}

// Generate preview
window.generatePreview = function () {
  try {
    const puzzle = generatePuzzleJSON();
    const errors = validatePuzzleData(puzzle);

    if (errors.length > 0) {
      showMessage('Validation errors:\n' + errors.join('\n'), 'error');
      return;
    }

    const json = JSON.stringify(puzzle, null, 2);
    document.getElementById('json-preview').textContent = json;
    document.getElementById('preview-section').style.display = 'block';
    document.getElementById('preview-section').scrollIntoView({ behavior: 'smooth' });

    showMessage('Preview generated successfully!', 'success');
  } catch (error) {
    showMessage('Error generating preview: ' + error.message, 'error');
  }
};

// Puzzle Encoder (inline version - same as client/src/modules/PuzzleEncoder.js)
class PuzzleEncoder {
  static encode(puzzle) {
    const json = JSON.stringify(puzzle);
    const encoder = new TextEncoder();
    const data = encoder.encode(json);
    const compressed = pako.deflate(data);
    return this.base64urlEncode(compressed);
  }

  static base64urlEncode(data) {
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  static getCompressionStats(puzzle) {
    const json = JSON.stringify(puzzle);
    const encoded = this.encode(puzzle);
    return {
      originalSize: json.length,
      compressedSize: encoded.length,
      compressionRatio: (encoded.length / json.length * 100).toFixed(1) + '%',
      urlLength: encoded.length + 5
    };
  }
}

// Generate shareable link
window.generateShareLink = function () {
  try {
    const puzzle = generatePuzzleJSON();
    const errors = validatePuzzleData(puzzle);

    if (errors.length > 0) {
      showMessage('Cannot generate link: ' + errors.join(', '), 'error');
      return;
    }

    // Encode puzzle
    const encoded = PuzzleEncoder.encode(puzzle);
    const stats = PuzzleEncoder.getCompressionStats(puzzle);

    // Generate URL (use current origin or default to localhost)
    const baseUrl = window.location.origin.includes('editor')
      ? window.location.origin.replace('/editor', '')
      : 'http://localhost:5173';
    const shareUrl = `${baseUrl}/?p=${encoded}`;

    // Show modal with the link
    document.getElementById('shareLinkInput').value = shareUrl;
    document.getElementById('compressionStats').innerHTML = `
      Original: ${stats.originalSize} bytes<br>
      Compressed: ${stats.compressedSize} bytes (${stats.compressionRatio})<br>
      URL length: ${shareUrl.length} characters
    `;
    document.getElementById('shareLinkModal').classList.add('active');

    // Select the link text for easy copying
    document.getElementById('shareLinkInput').select();

  } catch (error) {
    showMessage('Error generating share link: ' + error.message, 'error');
  }
};

// Close share link modal
window.closeShareLinkModal = function () {
  document.getElementById('shareLinkModal').classList.remove('active');
};

// Copy share link to clipboard
window.copyShareLink = function () {
  const input = document.getElementById('shareLinkInput');
  input.select();

  navigator.clipboard.writeText(input.value).then(() => {
    showMessage('Link copied to clipboard!', 'success');
    closeShareLinkModal();
  }).catch(() => {
    // Fallback for older browsers
    try {
      document.execCommand('copy');
      showMessage('Link copied to clipboard!', 'success');
      closeShareLinkModal();
    } catch (err) {
      showMessage('Please manually copy the link', 'error');
    }
  });
};

// Download puzzle
window.downloadPuzzle = function () {
  try {
    const puzzle = generatePuzzleJSON();
    const errors = validatePuzzleData(puzzle);

    if (errors.length > 0) {
      showMessage('Cannot download: ' + errors.join(', '), 'error');
      return;
    }

    const json = JSON.stringify(puzzle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `puzzle-${puzzle.language}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showMessage('Puzzle downloaded successfully!', 'success');
  } catch (error) {
    showMessage('Error downloading puzzle: ' + error.message, 'error');
  }
};

// Load example
window.loadExample = function () {
  // English example
  const example = {
    grid: [
      ['P', 'E', 'A', 'R'],
      ['E', 'A', 'C', 'H'],
      ['A', 'C', 'H', 'E'],
      ['R', 'H', 'E', 'A']
    ],
    riddles: [
      {
        prompt: 'A sweet, edible fruit with a single hard stone inside',
        hint: 'Often green or yellow and shaped like a teardrop',
        explanation: 'A pear is a sweet fruit that is edible. It has a hard stone inside and is usually green or yellow.'
      },
      {
        prompt: 'Every one in a group, without exception',
        hint: 'Often used in expressions of distribution',
        explanation: 'The word "each" refers to every one of a group of people or things, often used to indicate distribution.'
      },
      {
        prompt: 'A continuous or prolonged dull pain in a part of the body',
        hint: 'Often cured with painkillers',
        explanation: 'An ache is a continuous or prolonged dull pain in a part of the body. It\'s often treated with painkillers.'
      },
      {
        prompt: 'A large, flightless bird native to South America',
        hint: 'It\'s not an ostrich, but it\'s similar',
        explanation: 'A Rhea is a large, flightless bird that is native to South America. It is often compared to an ostrich.'
      }
    ]
  };

  // Fill grid
  example.grid.forEach((row, i) => {
    row.forEach((cell, j) => {
      const input = document.getElementById(`cell-${i}-${j}`);
      if (input) input.value = cell;
    });
  });

  // Fill riddles
  example.riddles.forEach((riddle, i) => {
    document.getElementById(`prompt-${i + 1}`).value = riddle.prompt;
    document.getElementById(`hint-${i + 1}`).value = riddle.hint;
    document.getElementById(`explanation-${i + 1}`).value = riddle.explanation;
  });

  updateWords();
  showMessage('Example puzzle loaded!', 'success');
};

// Paste JSON modal functions
window.pasteJSON = function () {
  document.getElementById('pasteModal').classList.add('active');
  document.getElementById('jsonPasteArea').value = '';
  document.getElementById('jsonPasteArea').focus();
};

window.closePasteModal = function () {
  document.getElementById('pasteModal').classList.remove('active');
};

window.loadPastedJSON = function () {
  const jsonText = document.getElementById('jsonPasteArea').value.trim();

  if (!jsonText) {
    showMessage('Please paste JSON content', 'error');
    return;
  }

  try {
    const puzzle = JSON.parse(jsonText);

    // Validate basic structure
    if (!puzzle.grid || !puzzle.riddles || puzzle.riddles.length !== 4) {
      throw new Error('Invalid puzzle structure');
    }

    // Load metadata
    document.getElementById('language').value = puzzle.language || 'en';
    document.getElementById('difficulty').value = puzzle.metadata?.difficulty || 'easy';

    // Load grid
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const input = document.getElementById(`cell-${row}-${col}`);
        if (input && puzzle.grid[row] && puzzle.grid[row][col]) {
          input.value = puzzle.grid[row][col];
        }
      }
    }

    // Load riddles
    puzzle.riddles.forEach((riddle, index) => {
      const riddleNum = index + 1;
      document.getElementById(`prompt-${riddleNum}`).value = riddle.prompt || '';
      document.getElementById(`hint-${riddleNum}`).value = riddle.hint || '';
      document.getElementById(`explanation-${riddleNum}`).value = riddle.explanation || '';
    });

    // Update words display
    updateWords();

    // Close modal
    closePasteModal();

    showMessage('Puzzle loaded successfully! You can now generate a share link.', 'success');

  } catch (error) {
    showMessage('Invalid JSON: ' + error.message, 'error');
  }
};

// Close modal on overlay click
document.addEventListener('click', function (e) {
  if (e.target.id === 'pasteModal') {
    closePasteModal();
  }
});

// Clear form
window.clearForm = function () {
  if (!confirm('Are you sure you want to clear all fields?')) {
    return;
  }

  // Clear grid
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const input = document.getElementById(`cell-${row}-${col}`);
      if (input) input.value = '';
    }
  }

  // Clear riddles
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`prompt-${i}`).value = '';
    document.getElementById(`hint-${i}`).value = '';
    document.getElementById(`explanation-${i}`).value = '';
  }

  updateWords();
  document.getElementById('preview-section').style.display = 'none';
  showMessage('Form cleared', 'success');
};

// Setup event listeners
function setupEventListeners() {
  // Language change
  document.getElementById('language').addEventListener('change', (e) => {
    const lang = e.target.value;
    const isRTL = lang === 'he';

    // Update language
    currentLanguage = lang;

    // Update direction
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    document.body.setAttribute('dir', isRTL ? 'rtl' : 'ltr');

    // Update all UI text
    updateUILanguage();
  });
}

// Initialize on load
init();
