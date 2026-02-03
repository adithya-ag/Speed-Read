# ⚡ Speed Reader App

A lightweight, client-side speed reading application using RSVP (Rapid Serial Visual Presentation) technique. Read faster by displaying text one word at a time at a fixed screen position, eliminating the need for eye movement.

## ✨ Features

- **RSVP Reading Engine**: Display words sequentially at a fixed position for efficient reading
- **Adjustable Speed**: Control reading speed from 200 to 1000 WPM (Words Per Minute)
- **Multiple Input Methods**:
  - Direct text paste via textarea
  - .txt file upload
  - .pdf file upload (powered by PDF.js)
- **Smart Pausing**: Automatic pauses at punctuation marks for better comprehension
- **Progress Tracking**: Real-time progress bar and time remaining indicator
- **Customizable Settings**:
  - Light/Dark theme toggle
  - Adjustable font size (24-72px)
  - Focus guide (crosshair overlay)
  - Customizable punctuation pause duration
- **Keyboard Shortcuts**: Full keyboard control for efficient navigation
- **Persistent Preferences**: Settings saved to localStorage
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **100% Client-Side**: No backend required, works offline after initial load

## 🚀 Quick Start

### Option 1: Open Directly
Simply open `index.html` in your web browser. No build process or server required!

### Option 2: Local Server (Recommended)
For the best experience, serve the files using a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (http-server)
npx http-server -p 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

## 📖 How to Use

1. **Enter Your Text**:
   - Paste text directly into the textarea, OR
   - Click "Upload File" to load a .txt or .pdf file

2. **Click "Start Reading"**:
   - The app switches to reading mode
   - Words appear one at a time in the center of the screen

3. **Control Your Reading**:
   - Use the **Play** (▶️) button to start/resume
   - Use the **Pause** (⏸️) button to pause
   - Use the **Reset** (↺) button to start from the beginning
   - Use the **Exit** (❌) button to return to input

4. **Adjust Speed**:
   - Use the slider to change reading speed (200-1000 WPM)
   - Default: 300 WPM

5. **Customize Settings**:
   - Click the ⚙️ icon to open settings
   - Toggle between light/dark themes
   - Adjust font size and other preferences

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause toggle |
| `←` Left Arrow | Decrease speed by 50 WPM |
| `→` Right Arrow | Increase speed by 50 WPM |
| `R` | Reset to beginning |
| `Esc` | Exit to input section |

## 🛠️ Technical Details

### Technology Stack
- **HTML5**: Semantic markup
- **CSS3**: Custom properties, flexbox, grid, animations
- **Vanilla JavaScript**: No frameworks required
- **PDF.js**: For PDF parsing (loaded from CDN)

### File Structure
```
speed-reader/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styles with theme support
├── js/
│   ├── app.js          # Main application logic
│   ├── parser.js       # Text/PDF parsing functions
│   └── reader.js       # Reading engine (RSVP implementation)
├── libs/               # External libraries (PDF.js via CDN)
├── assets/             # Images, icons, etc.
└── README.md           # This file
```

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance
- Bundle size: < 50KB (excluding PDF.js)
- Handles 10,000+ word documents smoothly
- Optimized timing mechanism using setTimeout
- Efficient DOM updates

## 🎨 Customization

### Themes
The app supports light and dark themes. Toggle via the settings panel or by modifying the CSS variables in `styles.css`:

```css
:root {
    --bg-primary: #f5f5f5;
    --text-primary: #333333;
    --accent-color: #6366f1;
    /* ... more variables */
}

[data-theme="dark"] {
    --bg-primary: #1a1a1a;
    --text-primary: #ffffff;
    /* ... more variables */
}
```

### Reading Settings
- **Speed Range**: 200-1000 WPM (default: 300 WPM)
- **Font Size**: 24-72px (default: 40px)
- **Punctuation Pause**: 0-500ms (default: 200ms for periods, 100ms for commas)

## 📊 Reading Tips

1. **Start Slow**: Begin at 250-300 WPM and gradually increase
2. **Use Pauses**: Enable punctuation pauses for better comprehension
3. **Focus Guide**: Turn on the focus guide if you find your eyes wandering
4. **Practice**: Speed reading is a skill that improves with practice
5. **Break Long Texts**: For documents over 5000 words, consider taking breaks

## 🚀 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. For production:
```bash
vercel --prod
```

### Deploy to GitHub Pages

1. Push your code to a GitHub repository

2. Go to Settings → Pages

3. Select the main branch as source

4. Your app will be live at `https://yourusername.github.io/repository-name/`

### Deploy to Netlify

1. Drag and drop the entire project folder to [Netlify Drop](https://app.netlify.com/drop)

2. Your site is instantly live!

## 🧪 Testing Checklist

- [x] Paste text and start reading
- [x] Upload .txt file
- [x] Upload .pdf file
- [x] Adjust speed during reading
- [x] Play/Pause/Reset controls
- [x] Keyboard shortcuts
- [x] Settings persistence
- [x] Theme toggle
- [x] Mobile responsive
- [x] Error handling
- [x] Progress tracking

## 🐛 Troubleshooting

### PDF Upload Not Working
- Ensure you have an internet connection (PDF.js loads from CDN)
- Check browser console for errors
- Try a different PDF file (some PDFs may have text as images)

### Settings Not Saving
- Check if localStorage is enabled in your browser
- Some browsers in private/incognito mode may disable localStorage

### Slow Performance
- For very large documents (>10,000 words), consider splitting the text
- Close other browser tabs to free up resources
- Try reducing the font size in settings

## 📝 License

This project is open source and available for free use.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📧 Support

For issues or questions, please open an issue in the repository.

## 🎯 Future Enhancements

Potential features for future versions:
- [ ] Bookmarking/saving progress for long texts
- [ ] Multiple reading modes (word grouping, bionic reading)
- [ ] Statistics and reading history
- [ ] Export reading sessions
- [ ] Browser extension version
- [ ] Audio narration sync
- [ ] Eye tracking optimization

---

**Happy Speed Reading!** ⚡📚

Made with ❤️ for efficient readers everywhere.
