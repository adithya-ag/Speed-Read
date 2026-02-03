# 🚀 Quick Start Guide - Speed Reader App

## Step 1: Start the Server (2 minutes)

### Method A: Using Python (You have Python 3.13.3)

1. **Open Command Prompt or Terminal**
   - Press `Win + R`
   - Type `cmd` and press Enter

2. **Navigate to the project folder**
   ```bash
   cd "c:\Adithya Work\speed-reader"
   ```

3. **Start the server**
   ```bash
   python -m http.server 8000
   ```

4. **You'll see:**
   ```
   Serving HTTP on :: port 8000 (http://[::]:8000/) ...
   ```

5. **Open your browser and go to:**
   ```
   http://localhost:8000
   ```

6. **The app opens!** 🎉

**To stop the server:** Press `Ctrl + C` in the terminal

---

### Method B: Direct Open (No Server Needed)

1. Open File Explorer
2. Navigate to `c:\Adithya Work\speed-reader\`
3. Double-click `index.html`
4. App opens in your default browser

**Note:** Method A (server) is better for PDF support.

---

## Step 2: How to Use the App (5 minutes)

### 📝 Getting Started

1. **You'll see the input screen with a text area**

2. **Choose one of these options:**

   **Option A: Use Sample Text (Fastest)**
   - Click "📁 Upload File" button
   - Browse to `c:\Adithya Work\speed-reader\`
   - Select `sample-text.txt`
   - Click Open
   - Text loads automatically!

   **Option B: Paste Your Own Text**
   - Copy any text (article, book chapter, etc.)
   - Paste into the text area
   - You'll see character count update

   **Option C: Upload a PDF**
   - Click "📁 Upload File"
   - Select any .pdf file (up to 10MB)
   - Wait for processing (few seconds)
   - Text extracts automatically!

3. **Click "Start Reading" button**
   - Screen changes to reading mode
   - Words appear one at a time in center

---

### ▶️ Reading Controls

**Main Controls (Bottom of screen):**
- **▶️ Play** - Starts/resumes reading
- **⏸️ Pause** - Pauses reading
- **↺ Reset** - Goes back to the beginning
- **❌ Exit** - Returns to input screen

**Speed Control:**
- Use the slider to adjust (200-1000 WPM)
- Default is 300 WPM (good starting point)
- Higher = faster reading

**Progress Bar:**
- Shows how far you've read
- Displays "Word 45 / 234" (example)
- Shows time remaining

---

### ⌨️ Keyboard Shortcuts (Super Useful!)

While reading:
- `Space` - Play/Pause toggle
- `←` Left Arrow - Slow down (decrease by 50 WPM)
- `→` Right Arrow - Speed up (increase by 50 WPM)
- `R` - Reset to beginning
- `Esc` - Exit to input

**Pro tip:** Use Space to pause, then Left/Right to adjust speed!

---

### ⚙️ Settings Panel

1. **Click the ⚙️ icon** (top right)

2. **Available settings:**

   **Theme Toggle**
   - Switch between Light and Dark mode
   - Try both to see which you prefer!

   **Reading Font Size**
   - Adjust from 24px to 72px
   - Default: 40px
   - Bigger = easier to see

   **Focus Guide**
   - Toggle crosshair overlay on/off
   - Helps some people focus on center

   **Sentence Pause**
   - How long to pause at periods
   - 0ms = no pause, 500ms = half second
   - Default: 200ms (recommended)

3. **All settings save automatically** - They'll be there when you come back!

---

## Step 3: Testing (10 minutes)

### Quick Test Checklist

**Test the Basics:**
- [ ] Load sample-text.txt
- [ ] Click Start Reading
- [ ] Press Space to pause
- [ ] Press Space to resume
- [ ] Use slider to change speed
- [ ] Click Reset button
- [ ] Press Esc to exit

**Test Keyboard Shortcuts:**
- [ ] Press Space (play/pause)
- [ ] Press → arrow 3 times (speed increases to 450 WPM)
- [ ] Press ← arrow 2 times (speed decreases to 350 WPM)
- [ ] Press R (resets to start)
- [ ] Press Esc (exits to input)

**Test Settings:**
- [ ] Click ⚙️ icon
- [ ] Toggle Dark mode (see theme change)
- [ ] Adjust font size slider (see word size change)
- [ ] Turn on Focus Guide (see crosshair appear)
- [ ] Close settings (click X or outside modal)
- [ ] Refresh page (settings should persist!)

**Test File Upload:**
- [ ] Upload sample-text.txt
- [ ] Upload a PDF (if you have one)
- [ ] Try pasting your own text

**Test Progress Tracking:**
- [ ] Start reading
- [ ] Watch progress bar fill
- [ ] Check word counter updates (e.g., "Word 45 / 234")
- [ ] Check time remaining updates

---

## 📱 Test on Mobile (Optional)

1. **Get your computer's IP address:**
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (something like 192.168.1.x)

2. **On your phone, open browser and go to:**
   ```
   http://YOUR_IP_ADDRESS:8000
   ```
   (Replace YOUR_IP_ADDRESS with actual IP)

3. **Test mobile controls:**
   - Touch controls should work
   - All buttons should be tappable
   - Text should be readable

---

## 🎯 Recommended Reading Speeds

| Experience Level | WPM | Description |
|-----------------|-----|-------------|
| **Beginner** | 250-300 | Start here, comfortable pace |
| **Intermediate** | 350-450 | After a few sessions |
| **Advanced** | 500-650 | Good comprehension maintained |
| **Expert** | 700-1000 | Requires practice |

**Pro tip:** Start at 250 WPM and increase by 50 each session!

---

## 🐛 Troubleshooting

### "Module not found" or Server Error
- Make sure you're in the right folder:
  ```bash
  cd "c:\Adithya Work\speed-reader"
  ```
- Check you typed the command correctly

### PDF Upload Not Working
- Make sure you started with Method A (server)
- Check internet connection (PDF.js loads from internet)
- Try a different PDF (some have text as images)

### Settings Not Saving
- Check if you're in Incognito/Private mode (localStorage disabled)
- Try a different browser

### Words Too Fast/Slow
- Use the speed slider or arrow keys
- Remember: 300 WPM is a good starting point
- Don't start too fast!

---

## 📊 What to Look For (Quality Check)

### ✅ Good Signs:
- Words appear smoothly in center
- Progress bar updates in real time
- No lag or stuttering
- Keyboard shortcuts respond instantly
- Settings save after refresh
- Mobile layout looks good
- No console errors (press F12 to check)

### ⚠️ Potential Issues:
- Words flickering → Try reducing speed
- PDF not loading → Check internet connection
- Settings not saving → Disable incognaito mode
- Layout broken on mobile → Report as bug

---

## 📤 Share Your Report

I've created **PROJECT_STATUS_REPORT.md** for you to share!

**What it includes:**
- ✅ Complete project status
- ✅ All features implemented
- ✅ How to run/test
- ✅ Technical specifications
- ✅ Deployment options
- ✅ Performance metrics

**To share:**
1. Open `PROJECT_STATUS_REPORT.md`
2. Copy all content
3. Share in chat, email, or documentation

---

## 🎓 Tips for Best Experience

1. **Start Slow:** Begin at 250-300 WPM
2. **Practice Daily:** Even 10 minutes helps
3. **Use Pauses:** Keep punctuation pauses enabled
4. **Take Breaks:** Every 15-20 minutes
5. **Dark Mode:** Try it for less eye strain
6. **Focus Guide:** Turn on if eyes wander
7. **Keyboard Shortcuts:** Much faster than clicking!

---

## 🚀 What's Next?

After testing, you can:

1. **Deploy Online:**
   - Follow README.md deployment section
   - Use Vercel, GitHub Pages, or Netlify
   - Share with others!

2. **Customize:**
   - Edit colors in `css/styles.css`
   - Change default speed in `js/app.js`
   - Add your own features

3. **Share:**
   - Use PROJECT_STATUS_REPORT.md
   - Share the live URL
   - Get feedback from users

---

## 📋 Quick Command Reference

```bash
# Navigate to project
cd "c:\Adithya Work\speed-reader"

# Start server
python -m http.server 8000

# Stop server
Ctrl + C

# Open in browser
http://localhost:8000
```

---

## ✅ You're Ready!

You now know:
- ✅ How to start the server
- ✅ How to use all features
- ✅ How to test the app
- ✅ How to troubleshoot issues
- ✅ What to share with others

**Go ahead and try it now!** 🎉

---

*Need more help? Check:*
- **README.md** - Full documentation
- **TEST_GUIDE.md** - Comprehensive testing
- **PROJECT_STATUS_REPORT.md** - Status to share
