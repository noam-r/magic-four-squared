# Changelog

All notable changes to Magic Four² will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-05-10

### Major UX Overhaul 🎉

This release completely reimagines the gameplay experience with a focus on simplicity, clarity, and modern design.

### Changed
- **Full Grid Editing**: Players can now type in any cell, not just row-by-row
- **Symmetric Auto-Fill**: Letters automatically fill both row and column positions (magic square logic)
- **Grid Validation**: Check entire grid at once instead of row-by-row submission
- **Smart Feedback**: Wrong letters fade to gray then auto-clear, keeping correct ones
- **Global Hints System**: Limited to 2 hints per game via global button (💡 2)
- **Clean Riddle Display**: Removed individual hint buttons, status messages, and clutter
- **Modern Design**: Wordle-style minimalist aesthetic with clean typography

### Added
- **Welcome Modal**: First-time user onboarding with 3-step instructions
- **How to Play Button**: Accessible help (?) in header
- **Clear Grid Button**: One-click clear with Escape key shortcut
- **Grid Labels**: Row/column numbers (1-4) matching riddle numbers
- **Wrong Position Feedback**: Yellow highlighting for letters in wrong spots (Wordle-style)
- **ClearButton Component**: New reusable component for grid clearing

### Removed
- Row-by-row progression system
- Individual "Show Hint" buttons on riddles
- "Solved: 0/4" counter (no longer relevant)
- Active row highlighting
- Row-based status messages

### Improved
- Validation now shows green (correct), yellow (wrong position), and gray (incorrect)
- Error messages auto-clear after feedback animation
- Hints only appear when revealed via global button
- Grid labels create clear visual connection to riddles
- Larger font sizes for better readability
- Simplified UI with less visual noise

### Technical
- Added `ClearButton.js` component
- Enhanced `GameStateManager` with full grid validation
- Updated `GridRenderer` with symmetric cell logic and labels
- Refactored `RiddleDisplay` for minimal design
- Added comprehensive i18n strings for new features
- All tests passing (45 passed, 1 skipped)

### Breaking Changes
- Game state structure updated (old saves may not be compatible)
- Removed row-by-row API methods
- Changed validation flow from incremental to full-grid

## [1.0.0] - 2025-04-10

### Added
- Initial release of Magic Four²
- 4x4 magic square puzzle game with riddles
- URL-encoded puzzles for easy sharing
- Visual puzzle editor with drag-and-drop
- CLI puzzle generator
- Multi-language support (English, Hebrew)
- RTL text support for Hebrew
- Offline-capable gameplay
- Mobile-responsive design
- Paste JSON feature in editor
- Share link modal with compression stats
- Security sanitization for XSS prevention
- Comprehensive test suite

### Features
- **Game Client**: Play riddle-based magic square puzzles
- **Puzzle Editor**: Create custom puzzles visually
- **CLI Generator**: Generate puzzles from wordlists
- **URL Encoding**: Share puzzles via compressed URLs (43% compression ratio)
- **Multi-Language**: Full English and Hebrew support
- **Security**: XSS prevention with input sanitization and CSP
- **Testing**: Unit and integration tests with Vitest

### Technical
- Built with Vanilla JavaScript + Vite
- Pure CSS styling (no frameworks)
- Pako compression for URL encoding
- JSON Schema validation
- LocalStorage for game state persistence

---

## Release Notes

### v1.0.0 - Initial Release

Magic Four² is a word puzzle game that combines riddles with 4x4 magic squares. Players solve riddles to reveal words that form a perfect magic square where every row and column creates a valid 4-letter word.

**Key Highlights:**
- 🎮 Engaging riddle-based gameplay
- 🔗 Revolutionary URL-encoded puzzles
- 🌍 Multi-language support with RTL
- 🎨 Beautiful, responsive design
- 🚀 Zero infrastructure required
- 📱 Works on all devices

**Getting Started:**
```bash
npm install
npm run dev
```

Open http://localhost:5173 and start playing!

---

[1.0.0]: https://github.com/yourusername/magic-four-squared/releases/tag/v1.0.0
