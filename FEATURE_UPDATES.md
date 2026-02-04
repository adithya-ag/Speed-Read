# Speed Reader App - Feature Updates & UI Improvements

## CONTEXT
The base Speed Reader app has been built and is functional. The following enhancements are requested to improve user experience, especially on mobile devices.

---

## FEATURE REQUESTS

### 1. 10-Second Skip Controls (High Priority)
**Description:** Add YouTube-style forward/backward skip buttons

**Requirements:**
- Add two new buttons: "⏪ -10s" and "⏩ +10s"
- Skip 10 seconds worth of words (calculate based on current WPM)
- Place buttons next to Play/Pause control
- Example: At 300 WPM → 300/60 = 5 words/sec → 10s = 50 words
- Keyboard shortcuts: 
  - `J` key = backward 10s
  - `L` key = forward 10s
- Visual feedback when skipping (brief highlight/animation)
- Prevent skipping beyond start (0) or end (total words)

**Implementation Notes:**
```javascript
// Pseudocode
function skip(seconds) {
  const wordsPerSecond = currentWPM / 60;
  const wordsToSkip = Math.round(wordsPerSecond * seconds);
  const newIndex = Math.max(0, Math.min(currentIndex + wordsToSkip, totalWords));
  currentIndex = newIndex;
  updateProgress();
}
```

---

### 2. Improved Mobile Controls (High Priority)
**Description:** Make controls easily accessible on mobile without scrolling

**Requirements:**
- Convert control panel to **sticky/fixed position** at bottom of screen
- Controls should always be visible, even when reading
- On mobile (< 768px):
  - Control bar fixed at bottom with safe padding
  - Increase button sizes: min 48x48px (thumb-friendly)
  - Stack controls if needed (2 rows on small screens)
- Add subtle backdrop blur to control bar for readability
- Ensure controls don't overlap with reading word
- Test on iPhone SE (375px width) and larger devices

**Visual Design:**
```
┌─────────────────────────┐
│                         │
│   [READING WORD]        │
│                         │
│                         │
├─────────────────────────┤
│ 🎚️ WPM  [⏪][⏸][⏩]   │  ← Fixed bottom bar
└─────────────────────────┘
```

---

### 3. Clickable Progress Bar (High Priority)
**Description:** Allow users to click/tap anywhere on progress bar to jump to that position

**Requirements:**
- Make progress bar interactive (clickable)
- Calculate clicked position as percentage of total words
- Jump to clicked word position immediately
- Show hover effect on desktop (cursor: pointer)
- Visual feedback on click (brief ripple/pulse)
- Update word counter and time remaining after jump
- Works on mobile touch events

**Implementation:**
```javascript
progressBar.addEventListener('click', (e) => {
  const rect = progressBar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percentage = clickX / rect.width;
  const targetIndex = Math.floor(percentage * totalWords);
  jumpToWord(targetIndex);
});
```

**Accessibility:**
- Add ARIA label: "Click to jump to position"
- Show tooltip on hover: "Jump to X%"

---

### 4. Context Words Display (High Priority)
**Description:** Show previous and next words alongside the main reading word for context

**Requirements:**
- Display 3 words total:
  - **Previous word** (left side, dimmed/smaller)
  - **Current word** (center, large and prominent)
  - **Next word** (right side, dimmed/smaller)

**Visual Design:**
```
┌─────────────────────────────────────┐
│                                     │
│   previous   CURRENT   next         │
│   (gray)     (white)   (gray)       │
│   (24px)     (48px)    (24px)       │
│                                     │
└─────────────────────────────────────┘
```

**Styling:**
- Previous/Next words:
  - Font size: 50% of main word (24px if main is 48px)
  - Opacity: 0.4-0.5
  - Color: Same as main word but dimmed
  - Position: Horizontally aligned with main word
- Main word remains fully prominent
- Responsive: Hide context words on very small screens (< 375px) if space is tight

**Edge Cases:**
- At start (word 0): Show only current + next
- At end (last word): Show only previous + current
- Single word text: Show only current

**Optional Enhancement:**
- Add setting toggle: "Show context words" (default: ON)
- Allow adjustment: 1 word, 2 words, or 3 words context

---

## ADDITIONAL IMPROVEMENTS (Bonus)

### A. Enhanced Keyboard Shortcuts Display
- Add a "?" key shortcut to show all keyboard shortcuts overlay
- Display shortcuts in a modal/tooltip

### B. Visual Skip Feedback
- When skipping 10s, briefly show "+10s" or "-10s" toast notification
- Fade out after 500ms

### C. Progress Bar Timestamp
- On hover, show word number at that position: "Word 245 / 500"

---

## TESTING REQUIREMENTS

After implementation, verify:
- [ ] 10s skip buttons work correctly at different WPM speeds
- [ ] Controls remain accessible on mobile (iPhone SE, Android)
- [ ] Progress bar click jumps to correct position
- [ ] Context words display properly (previous + current + next)
- [ ] Keyboard shortcuts J/L work for skipping
- [ ] No layout breaks on mobile screens
- [ ] Control bar doesn't cover reading area
- [ ] All features work in both light and dark themes

---

## UI/UX NOTES

**Button Layout (Suggested):**
```
Desktop:
[⏪ -10s] [⏮ Reset] [⏸ Pause] [⏭ Exit] [⏩ +10s]

Mobile:
Row 1: [⏪] [⏸] [⏩]
Row 2: [Reset] [Exit] [⚙️]
```

**Priority Order:**
1. Sticky mobile controls (biggest UX impact)
2. Clickable progress bar (intuitive interaction)
3. 10s skip buttons (power user feature)
4. Context words (reading enhancement)

---

## IMPLEMENTATION APPROACH

1. **Start with sticky controls** - Foundation for mobile UX
2. **Add clickable progress bar** - Quick win, high impact
3. **Implement 10s skip logic** - Core feature with keyboard support
4. **Add context words display** - Visual enhancement

**Estimated time:** 30-45 minutes for all features

---

## SUCCESS CRITERIA

✅ All 4 features implemented and working
✅ Mobile usability greatly improved
✅ No regressions in existing features
✅ Smooth animations and feedback
✅ Responsive across all screen sizes
✅ Keyboard shortcuts documented and working

---

**IMPLEMENT ALL FEATURES ABOVE. Maintain existing functionality while adding these enhancements.**