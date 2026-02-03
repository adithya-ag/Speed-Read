# Testing Guide for Speed Reader App

This document provides a comprehensive testing checklist to ensure all features work correctly.

## Pre-Testing Setup

1. Open `index.html` in your web browser
2. Open the browser's Developer Console (F12) to check for errors
3. Ensure you have a stable internet connection (required for PDF.js CDN)

## Test Checklist

### ✅ Input Section Tests

#### Text Input
- [ ] Paste text into textarea
- [ ] Character counter updates in real-time
- [ ] Clear button empties the textarea
- [ ] Start button is disabled when textarea is empty
- [ ] Start button is enabled when text is present

#### File Upload
- [ ] Click "Upload File" button
- [ ] Select a .txt file (should load successfully)
- [ ] Select a .pdf file (should parse and display text)
- [ ] Upload status shows success message
- [ ] Uploaded text appears in textarea
- [ ] Character counter updates with uploaded content

#### Error Handling
- [ ] Try uploading a file > 10MB (should show error)
- [ ] Try uploading unsupported format (e.g., .docx) (should show error)
- [ ] Start reading with empty text (should show validation error)

### ✅ Reading Section Tests

#### Display
- [ ] Words appear one at a time in center of screen
- [ ] Words are clearly visible and readable
- [ ] Font size is appropriate (adjustable in settings)
- [ ] No flickering or jumping

#### Timing & Speed
- [ ] Default speed is 300 WPM
- [ ] Words change at correct intervals
- [ ] Speed slider works (200-1000 WPM range)
- [ ] Changing speed during reading updates immediately
- [ ] Speed value displays correctly

#### Punctuation Pauses
- [ ] Extra pause at periods (.)
- [ ] Extra pause at exclamation marks (!)
- [ ] Extra pause at question marks (?)
- [ ] Shorter pause at commas (,)
- [ ] Shorter pause at semicolons (;)

### ✅ Control Tests

#### Playback Controls
- [ ] Play button (▶️) starts reading
- [ ] Pause button (⏸️) pauses reading
- [ ] Play button shows when paused
- [ ] Pause button shows when playing
- [ ] Reset button (↺) returns to beginning
- [ ] Exit button (❌) returns to input section

#### Progress Tracking
- [ ] Progress bar fills as reading progresses
- [ ] "Word X / Total" counter updates correctly
- [ ] Time remaining shows and updates
- [ ] Progress bar reaches 100% at end

#### Completion
- [ ] "✓ Complete!" message shows when finished
- [ ] Pause button hides on completion
- [ ] Can press Play to restart from beginning
- [ ] Can press Reset to go back to start

### ✅ Keyboard Shortcuts Tests

Test these shortcuts while in reading mode:

- [ ] `Space` toggles Play/Pause
- [ ] `←` (Left Arrow) decreases speed by 50 WPM
- [ ] `→` (Right Arrow) increases speed by 50 WPM
- [ ] `R` resets to beginning
- [ ] `Esc` exits to input section
- [ ] Shortcuts don't work when not in reading mode (correct behavior)

### ✅ Settings Panel Tests

#### Opening/Closing
- [ ] Click ⚙️ icon to open settings
- [ ] Settings modal appears
- [ ] Click ✕ to close settings
- [ ] Click outside modal to close
- [ ] Press `Esc` to close

#### Theme Toggle
- [ ] Toggle switches between Light and Dark themes
- [ ] Background colors change appropriately
- [ ] Text colors remain readable
- [ ] All UI elements adapt to theme

#### Font Size
- [ ] Slider adjusts reading word font size (24-72px)
- [ ] Font size value displays correctly
- [ ] Changes apply immediately to word display
- [ ] Readable at both extremes (24px and 72px)

#### Focus Guide
- [ ] Toggle shows/hides crosshair overlay
- [ ] Crosshair is centered on word
- [ ] Crosshair doesn't interfere with reading

#### Punctuation Pause
- [ ] Slider adjusts pause duration (0-500ms)
- [ ] Pause value displays correctly
- [ ] Changes apply to current reading session
- [ ] Noticeable difference between 0ms and 500ms

### ✅ LocalStorage/Persistence Tests

- [ ] Change WPM speed, refresh page → speed persists
- [ ] Change theme, refresh page → theme persists
- [ ] Change font size, refresh page → font size persists
- [ ] Change focus guide setting, refresh page → setting persists
- [ ] Change punctuation pause, refresh page → setting persists

### ✅ Responsive Design Tests

#### Mobile (< 768px)
- [ ] Open on mobile device or resize browser to 375px width
- [ ] All controls are tappable (min 44x44px)
- [ ] Text is readable
- [ ] Layout doesn't break
- [ ] Buttons don't overflow
- [ ] Input section is usable

#### Tablet (768px - 1024px)
- [ ] Resize to 768px width
- [ ] Layout adjusts appropriately
- [ ] Reading word size increases slightly
- [ ] Controls remain accessible

#### Desktop (> 1024px)
- [ ] Full screen display works well
- [ ] Maximum width constraint applies (1200px)
- [ ] Content is centered
- [ ] Word display is prominent

### ✅ Browser Compatibility Tests

Test on multiple browsers:

- [ ] Google Chrome (latest)
- [ ] Mozilla Firefox (latest)
- [ ] Safari (if on Mac)
- [ ] Microsoft Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

For each browser, verify:
- No console errors
- PDF parsing works
- Keyboard shortcuts work
- localStorage works
- Animations are smooth

### ✅ Performance Tests

#### Small Text (< 1000 words)
- [ ] Loads instantly
- [ ] Smooth word transitions
- [ ] No lag or stuttering

#### Medium Text (1000-5000 words)
- [ ] Loads quickly
- [ ] Maintains smooth playback
- [ ] Progress bar updates smoothly

#### Large Text (5000-10000 words)
- [ ] Loads within 2 seconds
- [ ] Playback remains smooth
- [ ] Time remaining calculates correctly
- [ ] Progress bar remains accurate

### ✅ PDF Parsing Tests

- [ ] Single-page PDF loads correctly
- [ ] Multi-page PDF (5+ pages) loads all text
- [ ] PDF with images (text should be extracted)
- [ ] PDF maintains paragraph breaks
- [ ] Loading status shows while processing
- [ ] Success message after parsing

### ✅ Edge Cases

- [ ] Text with only punctuation marks
- [ ] Text with numbers
- [ ] Text with special characters (@, #, $, etc.)
- [ ] Text with emojis
- [ ] Very long words (> 20 characters)
- [ ] Text with multiple spaces
- [ ] Text with line breaks
- [ ] Empty PDF file
- [ ] Corrupted PDF file

### ✅ Accessibility Tests

- [ ] Tab navigation works through all controls
- [ ] Focus indicators are visible
- [ ] Screen reader can read UI labels (test with screen reader if available)
- [ ] Keyboard-only navigation is fully functional
- [ ] Color contrast is sufficient (use browser DevTools)
- [ ] Reduced motion is respected (if browser setting is enabled)

## Performance Benchmarks

### Expected Performance
- Initial page load: < 1 second
- Text parsing (1000 words): < 50ms
- PDF parsing (5-page): < 2 seconds
- Settings save/load: < 10ms
- Speed change response: Immediate
- Smooth playback at all speeds (200-1000 WPM)

### Memory Usage
- Initial: ~5-10 MB
- With 10,000 words loaded: ~15-25 MB
- Should not increase significantly during reading

## Known Limitations

1. **PDF Images**: Text embedded as images in PDFs cannot be extracted
2. **File Size**: Limited to 10MB files
3. **Browser Storage**: Settings require localStorage (may not work in incognito mode)
4. **Offline PDF**: PDF.js requires internet connection on first load

## Reporting Issues

When reporting issues, please include:
- Browser name and version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Console errors (if any)

## Success Criteria

The app passes testing if:
- ✅ All core features work as expected
- ✅ No critical bugs
- ✅ Smooth performance with typical usage
- ✅ Works on mobile and desktop
- ✅ Works in all major browsers
- ✅ Settings persist correctly
- ✅ PDF parsing is functional

---

**Happy Testing!** 🧪
