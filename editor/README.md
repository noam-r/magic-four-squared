# Magic Four² Puzzle Editor

## Overview

A web-based puzzle editor that allows administrators to manually create high-quality puzzles for the Magic Four Squared game.

## Why Manual Creation?

Automated puzzle generation for Hebrew (and other languages) has proven unreliable due to:
- Limited AI training data for non-English languages
- Difficulty creating meaningful riddles for uncommon words
- High rejection rate (0-5% success) with quality validation

**Manual creation ensures 100% quality control.**

## Features

### ✨ User-Friendly Interface
- Visual 4x4 grid editor
- Auto-advance between cells
- Real-time word preview
- Form validation

### 🎯 Riddle Creation
- Separate fields for prompt, hint, and explanation
- Helpful guidance text
- Quality checks

### 🌍 Multi-Language Support
- English and Hebrew
- RTL support for Hebrew
- Language-specific validation

### 💾 Export & Preview
- JSON preview before download
- Validation before export
- Downloadable puzzle files
- Example puzzle loader

## Usage

### Starting the Editor

```bash
# Option 1: Using Python (from project root)
python3 -m http.server 8080
# Then open: http://localhost:8080/editor/

# Option 2: Using Python (from editor directory)
cd editor
python3 -m http.server 8080
# Then open: http://localhost:8080/

# Option 3: Using Node.js (from project root)
npx http-server -p 8080
# Then open: http://localhost:8080/editor/

# Option 4: Using PHP (from editor directory)
cd editor
php -S localhost:8080
# Then open: http://localhost:8080/
```

**Important**: Make sure to navigate to the correct URL based on where you started the server!

### Creating a Puzzle

1. **Set Metadata**
   - Choose language (English/Hebrew)
   - Select difficulty (Easy/Medium/Hard)

2. **Fill the Grid**
   - Enter 4 letters in each cell
   - Each row should form a 4-letter word
   - Each column should also form a 4-letter word

3. **Write Riddles**
   - For each word, write:
     - **Prompt**: Describe the word's meaning (not its letters!)
     - **Hint**: Provide additional context
     - **Explanation**: Explain why the answer is correct

4. **Preview & Download**
   - Click "Preview JSON" to see the output
   - Click "Download Puzzle" to save the file
   - Place the file in the `puzzles/` directory

### Example Workflow

**Step 1: Create Grid**
```
P E A R
E A C H
A C H E
R H E A
```

**Step 2: Write Riddles**

**Riddle 1 (PEAR):**
- Prompt: "A sweet, edible fruit with a single hard stone inside"
- Hint: "Often green or yellow and shaped like a teardrop"
- Explanation: "A pear is a sweet fruit that is edible..."

**Step 3: Download**
- File: `puzzle-en-1234567890.json`
- Place in: `puzzles/puzzle-en-1234567890.json`

**Step 4: Test**
```bash
npm run dev
# Open: http://localhost:5173?puzzle=puzzles/puzzle-en-1234567890.json
```

## Quality Guidelines

### ✅ Good Riddles

**Describe Meaning:**
```
"A sweet, edible fruit with a single hard stone inside"
```

**Provide Context:**
```
"Every one in a group, without exception"
```

**Be Specific:**
```
"A large, flightless bird native to South America"
```

### ❌ Bad Riddles

**Don't Spell Letters:**
```
❌ "A word with the letters P, E, A, R"
❌ "מילה עם האותיות א, ב, ג, ד"
```

**Don't Describe Patterns:**
```
❌ "Starts with P and ends with R"
❌ "מתחיל ב-א ומסתיים ב-ד"
```

**Don't Be Generic:**
```
❌ "The answer is PEAR"
❌ "התשובה היא אבגד"
```

## Tips for Hebrew Puzzles

### Use Common Words
- ספר (book)
- בית (house)
- ילד (child)
- מים (water)
- לחם (bread)
- שמש (sun)
- ירח (moon)

### Cultural Context
Include cultural references:
- Biblical terms (מבול - flood)
- Holidays (מצה - matzah)
- Common objects (חלון - window)

### Get Native Speaker Help
- Have a native Hebrew speaker review
- Ensure riddles are clear and natural
- Check for cultural appropriateness

## File Structure

```
editor/
├── index.html          # Main editor interface
├── editor.js           # Editor logic
└── README.md          # This file
```

## Integration

### Adding Puzzles to Game

1. **Create puzzle** using editor
2. **Download JSON** file
3. **Place in puzzles/** directory
4. **Update manifest** (optional):
   ```bash
   # Manifest is auto-updated by CLI, or manually add:
   {
     "filename": "puzzle-en-1234567890.json",
     "language": "en",
     "difficulty": "easy",
     "puzzleId": "uuid-here"
   }
   ```

### Testing Puzzles

```bash
# Test specific puzzle
npm run dev
# Open: http://localhost:5173?puzzle=puzzles/your-puzzle.json

# Validate puzzle
node -e "
  const fs = require('fs');
  const puzzle = JSON.parse(fs.readFileSync('puzzles/your-puzzle.json'));
  const { validatePuzzle } = require('./shared/schemas/validator.js');
  const result = validatePuzzle(puzzle);
  console.log(result.valid ? 'Valid!' : 'Errors:', result.errors);
"
```

## Advantages Over Automated Generation

| Aspect | Automated | Manual Editor |
|--------|-----------|---------------|
| Quality | 0-20% | 100% |
| Control | Low | High |
| Cultural Accuracy | Poor | Excellent |
| Time per Puzzle | 1 min | 5-10 min |
| Success Rate | 0-5% | 100% |
| Hebrew Support | Fails | Works |

## Workflow Recommendations

### For English Puzzles
- Use automated generation for bulk
- Use editor for refinement
- Manual creation for special puzzles

### For Hebrew Puzzles
- **Use editor exclusively**
- Automated generation doesn't work
- Quality requires native speaker

### For Other Languages
- Start with editor
- Test automated generation
- Use whichever works better

## Future Enhancements

### Planned Features
- [ ] Load existing puzzles for editing
- [ ] Batch puzzle creation
- [ ] Magic square validator
- [ ] Word suggestion from dictionary
- [ ] Riddle templates
- [ ] Multi-puzzle management
- [ ] Export to multiple formats

### Nice to Have
- [ ] Collaborative editing
- [ ] Version history
- [ ] Riddle quality scoring
- [ ] AI-assisted riddle suggestions
- [ ] Translation assistance

## Troubleshooting

### Editor Won't Load
- Ensure you're running a web server (not file://)
- Check browser console for errors
- Verify all files are in place

### Download Not Working
- Check browser's download settings
- Ensure popup blocker isn't blocking
- Try different browser

### Validation Errors
- Fill all required fields
- Ensure grid is complete (16 cells)
- Check that words are 4 letters each
- Avoid mentioning letters in riddles

## Support

For issues or questions:
1. Check this README
2. Review example puzzles in `puzzles/`
3. Test with "Load Example" button
4. Verify puzzle JSON format

## Conclusion

The puzzle editor provides a reliable, quality-controlled way to create puzzles when automated generation fails. It's especially valuable for Hebrew and other non-English languages where AI-generated riddles are unreliable.

**Better 10 manually-created quality puzzles than 100 auto-generated bad ones.**
