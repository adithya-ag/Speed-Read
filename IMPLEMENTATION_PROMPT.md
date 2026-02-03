# SPEED READER APP - IMPLEMENTATION BRIEF

## PROJECT OVERVIEW
Build a lightweight, client-side speed reading application using RSVP (Rapid Serial Visual Presentation) technique. The app displays text one word at a time at a fixed screen position, allowing users to read without eye movement. Zero backend required - pure static site.

## CORE REQUIREMENTS

### 1. FUNCTIONAL REQUIREMENTS
- Accept text input via paste (textarea) OR file upload (.txt, .pdf)
- Parse text into individual words
- Display words sequentially at a fixed screen position
- Adjustable reading speed (200-1000 WPM)
- Play/Pause/Reset controls
- Progress tracking (current word / total words)
- Save user preferences (speed, theme) to localStorage

### 2. TECHNICAL CONSTRAINTS
- 100% client-side JavaScript (no backend)
- Vanilla JavaScript preferred (or lightweight React if needed)
- Use PDF.js for PDF parsing
- Must work on mobile devices (responsive)
- Total bundle size: <500KB
- Browser support: Modern browsers (Chrome, Firefox, Safari, Edge)

## FILE STRUCTURE

Create the following structure:
```
speed-reader-app/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styles
├── js/
│   ├── app.js          # Main application logic
│   ├── parser.js       # Text/PDF parsing functions
│   └── reader.js       # Reading engine (word display)
├── libs/
│   └── pdf.min.js      # PDF.js library (CDN or local)
├── assets/
│   └── favicon.ico     # App icon
└── README.md           # Setup and usage instructions
```

## DETAILED FEATURE SPECIFICATIONS

### INPUT MODULE
**Text Input:**
- Large textarea (min 300px height)
- Placeholder: "Paste your text here or upload a file..."
- Character counter
- Clear button to reset textarea

**File Upload:**
- Accept: .txt, .pdf files
- Max file size: 10MB
- Show upload progress/loading state
- Error handling for unsupported formats

**PDF Parsing:**
- Use PDF.js library from CDN: https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
- Extract all text from PDF
- Preserve paragraph breaks
- Handle multi-page PDFs

### READING ENGINE

**Word Processing:**
- Split text by whitespace
- Preserve punctuation
- Handle contractions (don't, can't) as single words
- Ignore empty strings

**Display Logic:**
- Show one word at a time in center of screen
- Fixed position (vertically and horizontally centered)
- Large, readable font (32-48px)
- Optional: Highlight center letter for better focus

**Timing Mechanism:**
- Use `requestAnimationFrame` for smooth timing
- Convert WPM to milliseconds per word: `60000 / WPM`
- Precise interval control
- Pause on punctuation: add 200ms extra for periods, 100ms for commas

### CONTROLS & UI

**Control Panel:**
- Play button (▶) - starts reading
- Pause button (⏸) - pauses reading
- Reset button (↺) - returns to start
- All buttons must be large (min 44x44px for mobile)

**Speed Control:**
- Slider: 200 WPM to 1000 WPM
- Display current WPM value
- Default: 300 WPM
- Step: 50 WPM increments

**Progress Bar:**
- Visual bar showing reading progress (0-100%)
- Display: "Word 45 / 234"
- Estimate time remaining

**Keyboard Shortcuts:**
- Space: Play/Pause toggle
- Left Arrow: Decrease speed (-50 WPM)
- Right Arrow: Increase speed (+50 WPM)
- R: Reset to beginning
- Escape: Stop and return to input

### UI/UX DESIGN GUIDELINES

**Layout:**
- Clean, minimal interface
- Two main sections:
  1. Input section (top or left)
  2. Reading section (center, large)
- Controls sticky at bottom
- Mobile-first responsive design

**Color Scheme (suggested):**
- Background: #1a1a1a (dark) or #f5f5f5 (light)
- Text: #ffffff (dark mode) or #333333 (light mode)
- Primary accent: #6366f1 (indigo)
- Success: #10b981 (green)
- Error: #ef4444 (red)

**Typography:**
- Primary font: 'Inter', 'Roboto', or system font
- Reading word: 'Fira Code', 'Monaco', or monospace
- Font sizes: 16px base, 32-48px for reading word

**Animations:**
- Smooth transitions (200ms ease)
- Button hover states
- Word fade-in effect (optional, 100ms)

### ADDITIONAL FEATURES

**Settings Panel:**
- Theme toggle (Light/Dark mode)
- Font size adjustment for reading word
- Focus guide toggle (crosshair or dot at word center)
- Word pause duration settings

**LocalStorage Persistence:**
Store these user preferences:
- Selected WPM speed
- Theme preference (light/dark)
- Font size
- Last position in text (optional)

**Error Handling:**
- Invalid file format message
- File too large warning
- Empty input validation
- Browser compatibility check

## TECHNICAL IMPLEMENTATION NOTES

### Word Timing Algorithm
```javascript
// Pseudocode for timing
const millisecondsPerWord = 60000 / wordsPerMinute;

function displayNextWord() {
  if (currentIndex < words.length) {
    displayElement.textContent = words[currentIndex];
    currentIndex++;
    
    // Add pause for punctuation
    let delay = millisecondsPerWord;
    if (words[currentIndex-1].match(/[.!?]$/)) {
      delay += 200; // Extra pause for sentence end
    }
    
    setTimeout(displayNextWord, delay);
  }
}
```

### PDF.js Integration
```javascript
// Load PDF.js from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Parse PDF
async function parsePDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + ' ';
  }
  
  return fullText;
}
```

### Responsive Design Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## DEPLOYMENT SETUP

### Vercel Deployment
1. Create `vercel.json` (optional, for custom config):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ]
}
```

2. Add deploy commands to README:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### GitHub Pages Alternative
1. Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

## SUCCESS CRITERIA

The application is complete when:
- ✅ Can paste text and start reading immediately
- ✅ Can upload and parse PDF files
- ✅ Reading speed is accurate (300 WPM = 200ms per word)
- ✅ Keyboard shortcuts work
- ✅ Mobile responsive (tested on 375px width)
- ✅ Settings persist after page reload
- ✅ No console errors
- ✅ Loads in < 3 seconds on 3G connection

## TESTING CHECKLIST

Before considering MVP complete, test:
- [ ] Paste 1000+ word article - reads smoothly
- [ ] Upload 5-page PDF - parses correctly
- [ ] Change speed mid-reading - updates immediately
- [ ] Pause and resume - maintains position
- [ ] Reset button - returns to beginning
- [ ] Keyboard shortcuts - all functional
- [ ] Mobile view - UI usable on iPhone SE
- [ ] LocalStorage - preferences saved
- [ ] Empty input - shows validation message
- [ ] Large file (9MB) - uploads successfully

## DEVELOPMENT APPROACH

1. **Start with HTML structure** - Build semantic markup first
2. **Create CSS layout** - Mobile-first responsive design
3. **Implement text parsing** - Get word array working
4. **Build reading engine** - Core word display logic
5. **Add controls** - Play/Pause/Reset functionality
6. **Integrate PDF.js** - PDF upload feature
7. **Add settings** - Speed, theme, preferences
8. **Polish UX** - Animations, error states
9. **Test thoroughly** - All browsers, all features
10. **Deploy** - Push to Vercel/GitHub Pages

## DELIVERABLES

Upon completion, provide:
1. Fully functional application (all files)
2. README.md with setup instructions
3. Comments in code explaining complex logic
4. Live demo URL (after deployment)

## ADDITIONAL NOTES

- Prioritize performance - should handle 10,000+ word documents
- Keep dependencies minimal (only PDF.js required)
- Ensure accessibility (keyboard navigation, proper ARIA labels)
- Add meta tags for SEO and social sharing
- Consider adding "Export progress" feature for later enhancement

---

**START IMPLEMENTATION NOW. Build the complete application following this specification.**