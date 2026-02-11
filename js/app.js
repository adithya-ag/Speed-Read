/**
 * SPEED READER APP - Main Application Logic
 * Handles UI, user interactions, and app state
 */

class SpeedReaderApp {
    constructor() {
        // State
        this.reader = null;
        this.words = [];
        this.currentDocId = null;
        this.progressSaveTimeout = null;
        this.pendingReupload = []; // Docs from other devices that need content re-upload

        // Double-tap tracking
        this._lastTap = 0;
        this._lastTapX = 0;

        // Settings with defaults
        this.settings = {
            wpm: 300,
            theme: 'light',
            fontSize: 40,
            showFocusGuide: false,
            punctuationPause: 200
        };

        // DOM Elements
        this.elements = {
            // Sections
            inputSection: document.getElementById('inputSection'),
            librarySection: document.getElementById('librarySection'),
            documentList: document.getElementById('documentList'),
            refreshLibraryBtn: document.getElementById('refreshLibraryBtn'),
            readingSection: document.getElementById('readingSection'),

            // Input
            textInput: document.getElementById('textInput'),
            fileInput: document.getElementById('fileInput'),
            charCounter: document.getElementById('charCounter'),
            uploadStatus: document.getElementById('uploadStatus'),
            clearBtn: document.getElementById('clearBtn'),
            startBtn: document.getElementById('startBtn'),

            // Reading
            readingDisplay: document.querySelector('.reading-display'),
            wordDisplay: document.getElementById('wordDisplay'),
            previousWord: document.getElementById('previousWord'),
            nextWord: document.getElementById('nextWord'),
            focusGuide: document.getElementById('focusGuide'),
            progressBar: document.getElementById('progressBar'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            progressTooltip: document.getElementById('progressTooltip'),
            timeRemaining: document.getElementById('timeRemaining'),

            // Controls
            speedSlider: document.getElementById('speedSlider'),
            speedValue: document.getElementById('speedValue'),
            playBtn: document.getElementById('playBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            exitBtn: document.getElementById('exitBtn'),
            skipBackBtn: document.getElementById('skipBackBtn'),
            skipForwardBtn: document.getElementById('skipForwardBtn'),

            // Settings
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            themeToggle: document.getElementById('themeToggle'),
            fontSizeSlider: document.getElementById('fontSizeSlider'),
            fontSizeValue: document.getElementById('fontSizeValue'),
            focusGuideToggle: document.getElementById('focusGuideToggle'),
            punctuationPause: document.getElementById('punctuationPause'),
            pauseValue: document.getElementById('pauseValue'),

            // Toasts and modals
            errorToast: document.getElementById('errorToast'),
            errorMessage: document.getElementById('errorMessage'),
            skipToast: document.getElementById('skipToast'),
            skipMessage: document.getElementById('skipMessage'),
            keyboardHelpModal: document.getElementById('keyboardHelpModal'),
            closeKeyboardHelpBtn: document.getElementById('closeKeyboardHelpBtn')
        };

        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        this.loadSettings();
        this.applySettings();
        this.setupEventListeners();
        this.updateCharCounter();

        // Initialize local database first (source of truth)
        if (typeof DB !== 'undefined') {
            await DB.init();
            await this.recoverFromCrash();
        }

        // Always show library (works without sign-in)
        this.elements.librarySection.classList.remove('hidden');
        this.loadLibrary();

        // Initialize Supabase Auth (optional sync layer)
        if (typeof SupabaseClient !== 'undefined') {
            SupabaseClient.init();
            this.setupAuthListeners();
        }

        // Load stats dashboard
        if (typeof StatsEngine !== 'undefined') {
            await this.refreshStats();
        }

        // Check for stale documents
        this.checkStaleDocuments();
    }

    /**
     * Setup Auth listeners
     */
    setupAuthListeners() {
        const authBtn = document.getElementById('authBtn');

        // Button Click
        authBtn.addEventListener('click', async () => {
            if (SupabaseClient.user) {
                await SupabaseClient.signOut();
            } else {
                await SupabaseClient.signInWithGoogle();
            }
        });

        // Auth State Change
        window.addEventListener('auth:change', (e) => {
            this.handleAuthChange(e.detail.user);
        });
    }

    /**
     * Handle Auth State Change
     */
    async handleAuthChange(user) {
        const authBtn = document.getElementById('authBtn');
        authBtn.classList.remove('hidden'); // Show button now that auth is ready

        if (user) {
            authBtn.textContent = 'Sign Out';
            authBtn.title = `Signed in as ${user.email}`;
            console.log('Auth: Signed in as', user.email);

            // Sync with Supabase if available
            if (typeof SyncManager !== 'undefined') {
                console.log('Auth: Starting sync...');
                const needsReupload = await SyncManager.syncAll();
                console.log('Auth: Sync complete, needsReupload:', needsReupload?.length || 0);
                this.pendingReupload = needsReupload || [];
                if (needsReupload && needsReupload.length > 0) {
                    this.showReuploadNotice(needsReupload);
                }
            }
            this.loadLibrary(); // Refresh after sync
        } else {
            console.log('Auth: Signed out');
            authBtn.textContent = 'Sign In';
            authBtn.title = 'Sign in with Google';
            this.pendingReupload = [];
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Library Controls
        this.elements.refreshLibraryBtn.addEventListener('click', () => {
            this.loadLibrary();
        });

        // Input section
        this.elements.textInput.addEventListener('input', () => {
            this.updateCharCounter();
        });

        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        this.elements.clearBtn.addEventListener('click', () => {
            this.clearInput();
        });

        this.elements.startBtn.addEventListener('click', () => {
            this.startReading();
        });

        // Reading controls
        this.elements.speedSlider.addEventListener('input', (e) => {
            this.updateSpeed(parseInt(e.target.value));
        });

        this.elements.playBtn.addEventListener('click', () => {
            this.play();
        });

        this.elements.pauseBtn.addEventListener('click', () => {
            this.pause();
        });

        this.elements.resetBtn.addEventListener('click', () => {
            this.reset();
        });

        this.elements.exitBtn.addEventListener('click', () => {
            this.exitToInput();
        });

        // Skip controls
        this.elements.skipBackBtn.addEventListener('click', () => {
            this.skip(-10);
        });

        this.elements.skipForwardBtn.addEventListener('click', () => {
            this.skip(10);
        });

        // Progress bar click
        this.elements.progressBar.addEventListener('click', (e) => {
            this.handleProgressBarClick(e);
        });

        // Progress bar hover
        this.elements.progressBar.addEventListener('mousemove', (e) => {
            this.handleProgressBarHover(e);
        });

        this.elements.progressBar.addEventListener('mouseleave', () => {
            this.elements.progressTooltip.classList.add('hidden');
        });

        // Settings
        this.elements.settingsBtn.addEventListener('click', () => {
            this.openSettings();
        });

        this.elements.closeSettingsBtn.addEventListener('click', () => {
            this.closeSettings();
        });

        this.elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.closeSettings();
            }
        });

        this.elements.themeToggle.addEventListener('change', (e) => {
            this.setTheme(e.target.checked ? 'dark' : 'light');
        });

        this.elements.fontSizeSlider.addEventListener('input', (e) => {
            this.setFontSize(parseInt(e.target.value));
        });

        this.elements.focusGuideToggle.addEventListener('change', (e) => {
            this.setFocusGuide(e.target.checked);
        });

        this.elements.punctuationPause.addEventListener('input', (e) => {
            this.setPunctuationPause(parseInt(e.target.value));
        });

        // Export/Import
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const importFileInput = document.getElementById('importFileInput');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportLibrary());
        if (importBtn) importBtn.addEventListener('click', () => importFileInput.click());
        if (importFileInput) importFileInput.addEventListener('change', (e) => this.importLibrary(e));

        // Streak Freeze
        const streakFreezeBtn = document.getElementById('streakFreezeBtn');
        if (streakFreezeBtn) {
            streakFreezeBtn.addEventListener('click', async () => {
                if (typeof DB !== 'undefined' && DB.db) {
                    await DB.activateStreakFreeze();
                    if (typeof SupabaseClient !== 'undefined' && SupabaseClient.user) {
                        await SupabaseClient.saveUserStats({ streak_freeze_active: true, streak_freeze_used_at: new Date() });
                    }
                    streakFreezeBtn.style.display = 'none';
                    this.showSkipFeedback('Streak frozen! Documents safe for 14 days.');
                }
            });
        }

        // Clear All Data
        const clearAllBtn = document.getElementById('clearAllDataBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllLocalData());
        }

        // Keyboard help modal
        this.elements.closeKeyboardHelpBtn.addEventListener('click', () => {
            this.closeKeyboardHelp();
        });

        this.elements.keyboardHelpModal.addEventListener('click', (e) => {
            if (e.target === this.elements.keyboardHelpModal) {
                this.closeKeyboardHelp();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Tap/click on reading display to play/pause
        this.elements.readingDisplay.addEventListener('click', (e) => {
            this.handleReadingDisplayClick(e);
        });

        // Click on previous word to jump back
        this.elements.previousWord.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.reader && this.reader.currentIndex > 0) {
                this.reader.jumpToWord(this.reader.currentIndex - 1);
            }
        });

        // Click on next word to jump forward
        this.elements.nextWord.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.reader && this.reader.currentIndex < this.words.length - 1) {
                this.reader.jumpToWord(this.reader.currentIndex + 1);
            }
        });

        // Double-tap on reading display to skip 10 words
        this.elements.readingDisplay.addEventListener('touchend', (e) => {
            this.handleDoubleTap(e);
        });

        // Crash protection: save progress on tab close/hide
        window.addEventListener('beforeunload', () => {
            this.saveProgressImmediate();
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.saveProgressImmediate();
            }
        });
    }

    /**
     * Update character counter
     */
    updateCharCounter() {
        const text = this.elements.textInput.value;
        const charCount = text.length;
        this.elements.charCounter.textContent = `${charCount} character${charCount !== 1 ? 's' : ''}`;

        // Enable/disable start button
        this.elements.startBtn.disabled = charCount === 0;
    }

    /**
     * Clear text input
     */
    clearInput() {
        this.elements.textInput.value = '';
        this.elements.fileInput.value = '';
        this.elements.uploadStatus.textContent = '';
        this.updateCharCounter();
    }

    /**
     * Handle file upload
     */
    async handleFileUpload(file) {
        if (!file) return;

        this.elements.uploadStatus.textContent = 'Processing file...';
        this.elements.uploadStatus.style.color = 'var(--text-secondary)';

        try {
            const words = await Parser.parseFile(file);
            const text = words.join(' ');
            this.elements.textInput.value = text;
            this.updateCharCounter();
            this.elements.uploadStatus.textContent = `✓ Loaded ${words.length} words from ${file.name}`;
            this.elements.uploadStatus.style.color = 'var(--success-color)';

            // Always save to local IndexedDB
            if (typeof DB !== 'undefined' && DB.db) {
                const wordHash = await generateWordHash(text);

                // Check if this file matches a pending re-upload from another device
                let restoredProgress = 0;
                let matchedSupabaseId = null;
                if (this.pendingReupload && this.pendingReupload.length > 0) {
                    const match = this.pendingReupload.find(p => p.wordHash === wordHash);
                    if (match) {
                        restoredProgress = match.bookmarkIndex || 0;
                        matchedSupabaseId = match.id;
                        // Remove from pending list
                        this.pendingReupload = this.pendingReupload.filter(p => p.wordHash !== wordHash);
                    }
                }

                // Also check if doc already exists locally (re-upload of same file or ghost)
                const existingDoc = await DB.getDocumentByHash(wordHash);
                if (existingDoc) {
                    const wasGhost = existingDoc.isGhost;

                    // Update existing doc with new content
                    existingDoc.content = text;
                    existingDoc.lastReadAt = new Date().toISOString();
                    if (restoredProgress > existingDoc.bookmarkIndex) {
                        existingDoc.bookmarkIndex = restoredProgress;
                    }
                    if (matchedSupabaseId && !existingDoc.supabaseId) {
                        existingDoc.supabaseId = matchedSupabaseId;
                    }
                    // Convert ghost to real document
                    if (existingDoc.isGhost) {
                        delete existingDoc.isGhost;
                        existingDoc.source = 'upload';
                    }
                    await DB.saveDocument(existingDoc);
                    this.currentDocId = existingDoc.id;

                    if (wasGhost) {
                        // Ghost document is now restored with content
                        this.elements.uploadStatus.textContent = `✓ Progress restored from cloud (${Math.round((existingDoc.bookmarkIndex / existingDoc.totalWords) * 100)}% read)`;
                    } else if (existingDoc.bookmarkIndex > 0) {
                        this.elements.uploadStatus.textContent = `✓ Found in Library (${Math.round((existingDoc.bookmarkIndex / existingDoc.totalWords) * 100)}% read)`;
                    } else {
                        this.elements.uploadStatus.textContent = `✓ Already in Library`;
                    }
                } else {
                    // Create new doc
                    const doc = {
                        id: crypto.randomUUID(),
                        title: file.name,
                        content: text,
                        wordHash: wordHash,
                        totalWords: words.length,
                        bookmarkIndex: restoredProgress,
                        source: 'upload',
                        createdAt: new Date().toISOString(),
                        lastReadAt: new Date().toISOString(),
                        supabaseId: matchedSupabaseId
                    };
                    await DB.saveDocument(doc);
                    this.currentDocId = doc.id;

                    if (restoredProgress > 0) {
                        this.elements.uploadStatus.textContent = `✓ Saved + restored progress (${Math.round((restoredProgress / words.length) * 100)}%)`;
                    } else {
                        this.elements.uploadStatus.textContent = `✓ Saved to Library`;
                    }

                    // Sync metadata to Supabase if signed in (and not already linked)
                    if (!matchedSupabaseId && typeof SyncManager !== 'undefined' && SupabaseClient.user) {
                        await SyncManager.syncDocument(doc);
                    }
                }

                this.loadLibrary();
                this.showUploadNotice();
            }

        } catch (error) {
            this.showError(error.message);
            this.elements.uploadStatus.textContent = `✗ ${error.message}`;
            this.elements.uploadStatus.style.color = 'var(--error-color)';
        }
    }

    /**
     * Start reading session
     */
    async startReading() {
        const text = this.elements.textInput.value.trim();

        if (!text) {
            this.showError('Please enter some text to read');
            return;
        }

        // Parse text into words
        this.words = Parser.parseText(text);

        if (this.words.length === 0) {
            this.showError('No valid words found in the text');
            return;
        }

        // Auto-save pasted text as a document if no doc is loaded
        if (!this.currentDocId && typeof DB !== 'undefined' && DB.db) {
            const wordHash = await generateWordHash(text);
            const firstWords = this.words.slice(0, 5).join(' ');
            const title = firstWords + (this.words.length > 5 ? '...' : '');
            const doc = {
                id: crypto.randomUUID(),
                title: title,
                content: text,
                wordHash: wordHash,
                totalWords: this.words.length,
                bookmarkIndex: 0,
                source: 'paste',
                createdAt: new Date().toISOString(),
                lastReadAt: new Date().toISOString(),
                supabaseId: null
            };
            await DB.saveDocument(doc);
            this.currentDocId = doc.id;
        }

        // Create reader instance
        this.reader = new SpeedReader(this.words, {
            wpm: this.settings.wpm,
            punctuationPause: this.settings.punctuationPause,
            onWordChange: (word, index) => {
                this.displayWord(word);
            },
            onProgress: (progress, current, total) => {
                this.updateProgress(progress, current, total);
                // Save progress to DB
                if (this.currentDocId) {
                    this.saveProgressDebounced(this.currentDocId, current, total);
                }
            },
            onComplete: () => {
                this.onReadingComplete();
            }
        });

        // Switch to reading view
        this.showReadingSection();

        // Start reading
        this.play();
    }

    /**
     * Display current word with context (previous and next)
     */
    displayWord(word) {
        this.elements.wordDisplay.textContent = word;

        // Trigger pulse animation
        this.elements.wordDisplay.classList.remove('pulse');
        void this.elements.wordDisplay.offsetWidth; // Trigger reflow
        this.elements.wordDisplay.classList.add('pulse');

        // Update context words if reader exists
        if (this.reader) {
            const context = this.reader.getContextWords();
            this.elements.previousWord.textContent = context.previous;
            this.elements.nextWord.textContent = context.next;
        }
    }

    /**
     * Update progress indicators
     */
    updateProgress(progress, current, total) {
        this.elements.progressFill.style.width = `${progress}%`;
        this.elements.progressText.textContent = `Word ${current} / ${total}`;

        if (this.reader) {
            this.elements.timeRemaining.textContent = `Time: ${this.reader.getTimeRemaining()}`;
        }
    }

    /**
     * Play reading
     */
    play() {
        if (!this.reader) return;

        this.reader.play();
        this.elements.playBtn.classList.add('hidden');
        this.elements.pauseBtn.classList.remove('hidden');

        // Start stats session
        if (typeof StatsEngine !== 'undefined') {
            StatsEngine.startSession(this.reader.currentIndex);
        }
    }

    /**
     * Pause reading
     */
    pause() {
        if (!this.reader) return;

        this.reader.pause();
        this.elements.pauseBtn.classList.add('hidden');
        this.elements.playBtn.classList.remove('hidden');

        // Save progress immediately on pause
        if (this.currentDocId && typeof DB !== 'undefined' && DB.db) {
            DB.updateProgress(this.currentDocId, this.reader.currentIndex);
        }

        // End stats session
        if (typeof StatsEngine !== 'undefined') {
            StatsEngine.endSession(this.reader.currentIndex, this.settings.wpm);
        }
    }

    /**
     * Reset to beginning
     */
    reset() {
        if (!this.reader) return;

        this.reader.reset();
        this.elements.pauseBtn.classList.add('hidden');
        this.elements.playBtn.classList.remove('hidden');
    }

    /**
     * Exit to input section
     */
    exitToInput() {
        if (this.reader) {
            // End stats session if active
            if (typeof StatsEngine !== 'undefined') {
                StatsEngine.endSession(this.reader.currentIndex, this.settings.wpm);
            }
            this.saveProgressImmediate();
            this.reader.destroy();
            this.reader = null;
        }

        this.showInputSection();
        this.loadLibrary();
    }

    /**
     * Handle reading completion
     */
    async onReadingComplete() {
        // End stats session and mark as completed
        if (typeof StatsEngine !== 'undefined') {
            await StatsEngine.endSession(this.words.length, this.settings.wpm, true);
            this.refreshStats();
        }

        this.elements.wordDisplay.textContent = '✓ Complete!';
        this.elements.pauseBtn.classList.add('hidden');
        this.elements.playBtn.classList.remove('hidden');
    }

    /**
     * Show reading section
     */
    showReadingSection() {
        this.elements.inputSection.classList.add('hidden');
        this.elements.readingSection.classList.remove('hidden');
    }

    /**
     * Show input section
     */
    showInputSection() {
        this.elements.readingSection.classList.add('hidden');
        this.elements.inputSection.classList.remove('hidden');
    }

    /**
     * Update reading speed
     */
    updateSpeed(wpm) {
        this.settings.wpm = wpm;
        this.elements.speedValue.textContent = wpm;

        if (this.reader) {
            this.reader.setSpeed(wpm);
        }

        this.saveSettings();
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        // Only handle shortcuts when in reading section
        if (!this.elements.readingSection.classList.contains('hidden')) {
            // Prevent default for shortcuts
            if ([' ', 'ArrowLeft', 'ArrowRight', 'r', 'R', 'j', 'J', 'l', 'L', 'Escape', '?'].includes(e.key)) {
                e.preventDefault();
            }

            switch (e.key) {
                case ' ':
                    // Space: Play/Pause toggle
                    if (this.reader && this.reader.isPlaying) {
                        this.pause();
                    } else {
                        this.play();
                    }
                    break;

                case 'j':
                case 'J':
                    // J: Skip back 10 words
                    this.skip(-10);
                    break;

                case 'l':
                case 'L':
                    // L: Skip forward 10 words
                    this.skip(10);
                    break;

                case 'ArrowLeft':
                    // Left arrow: Decrease speed
                    const newSpeedDown = Math.max(200, this.settings.wpm - 50);
                    this.elements.speedSlider.value = newSpeedDown;
                    this.updateSpeed(newSpeedDown);
                    break;

                case 'ArrowRight':
                    // Right arrow: Increase speed
                    const newSpeedUp = Math.min(1000, this.settings.wpm + 50);
                    this.elements.speedSlider.value = newSpeedUp;
                    this.updateSpeed(newSpeedUp);
                    break;

                case 'r':
                case 'R':
                    // R: Reset
                    this.reset();
                    break;

                case '?':
                    // ?: Show keyboard help
                    this.showKeyboardHelp();
                    break;

                case 'Escape':
                    // Escape: Exit to input
                    this.exitToInput();
                    break;
            }
        }

        // Modal closes with Escape
        if (e.key === 'Escape') {
            if (!this.elements.settingsModal.classList.contains('hidden')) {
                this.closeSettings();
            }
            if (!this.elements.keyboardHelpModal.classList.contains('hidden')) {
                this.closeKeyboardHelp();
            }
        }
    }

    /**
     * Skip forward or backward by word count
     */
    skip(wordCount) {
        if (!this.reader) return;

        const wordsSkipped = this.reader.skip(wordCount);

        // Visual feedback
        const direction = wordCount > 0 ? '+' : '';
        this.showSkipFeedback(`${direction}${Math.abs(wordCount)} words`);

        // Button animation
        const button = wordCount > 0 ? this.elements.skipForwardBtn : this.elements.skipBackBtn;
        button.classList.add('skip-active');
        setTimeout(() => {
            button.classList.remove('skip-active');
        }, 200);
    }

    /**
     * Handle click on reading display to toggle play/pause
     */
    handleReadingDisplayClick(e) {
        if (!this.reader) return;

        // Don't toggle if clicking on context words (they have their own handlers)
        if (e.target.closest('.context-word')) return;

        if (this.reader.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Handle double-tap on reading display to skip 10 words
     */
    handleDoubleTap(e) {
        if (!this.reader) return;

        const now = Date.now();
        const timeSinceLastTap = now - this._lastTap;

        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
            // Double tap detected
            e.preventDefault();

            const rect = this.elements.readingDisplay.getBoundingClientRect();
            const tapX = this._lastTapX;
            const midpoint = rect.left + rect.width / 2;

            if (tapX < midpoint) {
                this.skip(-10);
            } else {
                this.skip(10);
            }

            this._lastTap = 0; // Reset to prevent triple-tap
            return;
        }

        this._lastTap = now;
        this._lastTapX = e.changedTouches[0].clientX;
    }

    /**
     * Handle progress bar click to jump to position
     */
    handleProgressBarClick(e) {
        if (!this.reader) return;

        const rect = this.elements.progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        const targetIndex = Math.floor(percentage * this.words.length);

        this.reader.jumpToWord(targetIndex);
    }

    /**
     * Handle progress bar hover to show tooltip
     */
    handleProgressBarHover(e) {
        if (!this.reader) return;

        const rect = this.elements.progressBar.getBoundingClientRect();
        const hoverX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
        const wordIndex = Math.floor(percentage * this.words.length);

        // Position and show tooltip
        this.elements.progressTooltip.style.left = `${hoverX}px`;
        this.elements.progressTooltip.textContent = `Word ${wordIndex} / ${this.words.length}`;
        this.elements.progressTooltip.classList.remove('hidden');
    }

    /**
     * Show skip feedback toast
     */
    showSkipFeedback(message) {
        this.elements.skipMessage.textContent = message;
        this.elements.skipToast.classList.remove('hidden');

        setTimeout(() => {
            this.elements.skipToast.classList.add('hidden');
        }, 800);
    }

    /**
     * Show keyboard shortcuts help
     */
    showKeyboardHelp() {
        this.elements.keyboardHelpModal.classList.remove('hidden');
    }

    /**
     * Close keyboard shortcuts help
     */
    closeKeyboardHelp() {
        this.elements.keyboardHelpModal.classList.add('hidden');
    }

    /**
     * Open settings modal
     */
    openSettings() {
        this.elements.settingsModal.classList.remove('hidden');
    }

    /**
     * Close settings modal
     */
    closeSettings() {
        this.elements.settingsModal.classList.add('hidden');
    }

    /**
     * Set theme
     */
    setTheme(theme) {
        this.settings.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.elements.themeToggle.checked = (theme === 'dark');
        this.saveSettings();
    }

    /**
     * Set font size
     */
    setFontSize(size) {
        this.settings.fontSize = size;
        document.documentElement.style.setProperty('--word-font-size', `${size}px`);
        this.elements.fontSizeValue.textContent = size;
        this.saveSettings();
    }

    /**
     * Set focus guide visibility
     */
    setFocusGuide(show) {
        this.settings.showFocusGuide = show;
        this.elements.focusGuideToggle.checked = show;

        if (show) {
            this.elements.focusGuide.classList.remove('hidden');
        } else {
            this.elements.focusGuide.classList.add('hidden');
        }

        this.saveSettings();
    }

    /**
     * Set punctuation pause duration
     */
    setPunctuationPause(ms) {
        this.settings.punctuationPause = ms;
        this.elements.pauseValue.textContent = ms;

        if (this.reader) {
            this.reader.setPunctuationPause(ms);
        }

        this.saveSettings();
    }

    /**
     * Apply all settings
     */
    applySettings() {
        // Theme
        this.setTheme(this.settings.theme);

        // Font size
        this.setFontSize(this.settings.fontSize);

        // Focus guide
        this.setFocusGuide(this.settings.showFocusGuide);

        // Speed
        this.elements.speedSlider.value = this.settings.wpm;
        this.elements.speedValue.textContent = this.settings.wpm;

        // Punctuation pause
        this.elements.punctuationPause.value = this.settings.punctuationPause;
        this.elements.pauseValue.textContent = this.settings.punctuationPause;
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('speedReaderSettings');
            if (saved) {
                const parsedSettings = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsedSettings };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('speedReaderSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Load Library Documents (from local IndexedDB)
     */
    async loadLibrary() {
        this.elements.documentList.innerHTML = '<div class="empty-state">Loading library...</div>';

        if (typeof DB === 'undefined' || !DB.db) {
            this.elements.documentList.innerHTML = '<div class="empty-state">Upload a file or paste text to get started!</div>';
            return;
        }

        const documents = await DB.getAllDocuments();
        this.renderLibrary(documents);
    }

    /**
     * Render Library List
     */
    renderLibrary(documents) {
        if (!documents || documents.length === 0) {
            this.elements.documentList.innerHTML = '<div class="empty-state">No documents yet. Upload a file or paste text to get started!</div>';
            return;
        }

        this.elements.documentList.innerHTML = '';

        documents.forEach(doc => {
            const el = document.createElement('div');
            el.className = doc.isGhost ? 'doc-item doc-ghost' : 'doc-item';

            const progress = doc.totalWords > 0
                ? Math.round((doc.bookmarkIndex / doc.totalWords) * 100)
                : 0;

            // Build DOM safely to prevent XSS from malicious file names
            const docInfo = document.createElement('div');
            docInfo.className = 'doc-info';

            const docTitle = document.createElement('div');
            docTitle.className = 'doc-title';

            // Add cloud icon for ghost documents
            if (doc.isGhost) {
                const cloudIcon = document.createElement('span');
                cloudIcon.className = 'ghost-icon';
                cloudIcon.innerHTML = '&#9729;'; // Cloud icon
                cloudIcon.title = 'Synced from another device';
                docTitle.appendChild(cloudIcon);
            }

            const titleText = document.createTextNode(doc.title || 'Untitled');
            docTitle.appendChild(titleText);

            const docMeta = document.createElement('div');
            docMeta.className = 'doc-meta';

            if (doc.isGhost) {
                // Ghost document: show progress and "upload to continue" hint
                docMeta.innerHTML = `
                    <span class="progress-badge ghost-badge">${progress}%</span>
                    <span class="ghost-hint">Upload file to continue</span>
                `; // Safe: no user input
            } else {
                docMeta.innerHTML = `
                    <span class="progress-badge">${progress}%</span>
                    <span>${new Date(doc.createdAt).toLocaleDateString()}</span>
                `; // Safe: no user input in this innerHTML
            }

            docInfo.appendChild(docTitle);
            docInfo.appendChild(docMeta);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'doc-delete-btn';
            deleteBtn.title = 'Delete document';
            deleteBtn.setAttribute('aria-label', `Delete ${doc.title}`);
            deleteBtn.innerHTML = '&times;';

            el.appendChild(docInfo);
            el.appendChild(deleteBtn);

            if (doc.isGhost) {
                // Ghost document: clicking prompts to upload
                docInfo.addEventListener('click', () => {
                    this.promptGhostUpload(doc);
                });
            } else {
                // Normal document: open for reading
                docInfo.addEventListener('click', () => {
                    this.openDocument(doc);
                });
            }

            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.confirmDeleteDocument(doc);
            });

            this.elements.documentList.appendChild(el);
        });
    }

    /**
     * Prompt user to upload file for a ghost document
     */
    promptGhostUpload(ghostDoc) {
        const progress = ghostDoc.totalWords > 0
            ? Math.round((ghostDoc.bookmarkIndex / ghostDoc.totalWords) * 100)
            : 0;

        this.showSkipFeedback(`Upload "${ghostDoc.title}" to continue (${progress}% progress synced)`);

        // Focus on file input area
        this.elements.fileInput.click();
    }

    /**
     * Open a document from library
     */
    async openDocument(doc) {
        this.elements.textInput.value = doc.content;
        this.updateCharCounter();
        this.currentDocId = doc.id;

        await this.startReading();

        // Restore bookmark after reader init
        if (this.reader && doc.bookmarkIndex > 0) {
            setTimeout(() => {
                this.reader.jumpToWord(doc.bookmarkIndex);
                this.showSkipFeedback(`Resumed at word ${doc.bookmarkIndex}`);
                this.pause(); // Start paused
            }, 100);
        }
    }

    /**
     * Save Progress (Debounced) — saves locally always, syncs to Supabase if signed in
     */
    saveProgressDebounced(docId, index, total) {
        if (this.progressSaveTimeout) {
            clearTimeout(this.progressSaveTimeout);
        }

        this.progressSaveTimeout = setTimeout(async () => {
            // Always save locally
            if (typeof DB !== 'undefined' && DB.db) {
                await DB.updateProgress(docId, index);
            }

            // Sync to Supabase if signed in and document is synced
            if (typeof SupabaseClient !== 'undefined' && SupabaseClient.user) {
                const doc = await DB.getDocument(docId);
                if (doc && doc.supabaseId) {
                    SupabaseClient.saveProgress(doc.supabaseId, index, total);
                }
            }
        }, 2000);
    }

    // ========== CRASH PROTECTION ==========

    /**
     * Save progress immediately (for beforeunload/visibilitychange)
     */
    async saveProgressImmediate() {
        if (!this.reader || !this.currentDocId) return;

        if (this.progressSaveTimeout) {
            clearTimeout(this.progressSaveTimeout);
            this.progressSaveTimeout = null;
        }

        const index = this.reader.currentIndex;
        const total = this.words.length;

        // Stash in localStorage as crash buffer (sync-safe for beforeunload)
        const progressData = {
            docId: this.currentDocId,
            index: index,
            total: total,
            timestamp: Date.now()
        };
        localStorage.setItem('speedReader_crashBuffer', JSON.stringify(progressData));

        // Save locally
        if (typeof DB !== 'undefined' && DB.db) {
            await DB.updateProgress(this.currentDocId, index);

            // Also sync to Supabase if signed in
            if (typeof SupabaseClient !== 'undefined' && SupabaseClient.user) {
                const doc = await DB.getDocument(this.currentDocId);
                if (doc && doc.supabaseId) {
                    SupabaseClient.saveProgress(doc.supabaseId, index, total);
                }
            }
        }
    }

    /**
     * Recover progress from crash buffer on app init
     */
    async recoverFromCrash() {
        const buffer = localStorage.getItem('speedReader_crashBuffer');
        if (!buffer) return;

        try {
            const { docId, index, timestamp } = JSON.parse(buffer);
            // Only recover if less than 1 hour old
            if (Date.now() - timestamp < 3600000 && typeof DB !== 'undefined' && DB.db) {
                await DB.updateProgress(docId, index);
            }
        } catch (e) {
            console.warn('Crash recovery failed:', e);
        }

        localStorage.removeItem('speedReader_crashBuffer');
    }

    // ========== DELETE DOCUMENT ==========

    /**
     * Confirm and delete a document
     */
    async confirmDeleteDocument(doc) {
        const confirmed = await this.showConfirmDialog(
            'Delete Document',
            `Are you sure you want to delete "${doc.title}"? This cannot be undone.`
        );

        if (confirmed) {
            await DB.deleteDocument(doc.id);
            if (doc.supabaseId && typeof SupabaseClient !== 'undefined' && SupabaseClient.user) {
                await SupabaseClient.deleteDocument(doc.supabaseId);
            }
            if (this.currentDocId === doc.id) {
                this.currentDocId = null;
            }
            this.loadLibrary();
            this.showSkipFeedback('Document deleted');
        }
    }

    /**
     * Show a confirmation dialog, returns Promise<boolean>
     */
    showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const titleEl = document.getElementById('confirmTitle');
            const msgEl = document.getElementById('confirmMessage');
            const cancelBtn = document.getElementById('confirmCancelBtn');
            const okBtn = document.getElementById('confirmOkBtn');

            titleEl.textContent = title;
            msgEl.textContent = message;
            modal.classList.remove('hidden');

            const cleanup = () => {
                modal.classList.add('hidden');
                cancelBtn.removeEventListener('click', onCancel);
                okBtn.removeEventListener('click', onConfirm);
            };

            const onCancel = () => { cleanup(); resolve(false); };
            const onConfirm = () => { cleanup(); resolve(true); };

            cancelBtn.addEventListener('click', onCancel);
            okBtn.addEventListener('click', onConfirm);
        });
    }

    // ========== UPLOAD NOTICE ==========

    /**
     * Show upload policy notice (7-day cleanup warning)
     */
    showUploadNotice() {
        if (localStorage.getItem('speedReader_uploadNoticeDismissed') === 'true') return;

        let banner = document.getElementById('uploadNoticeBanner');
        if (banner) return; // Already showing

        banner = document.createElement('div');
        banner.id = 'uploadNoticeBanner';
        banner.className = 'notice-banner';
        banner.innerHTML = `
            <div class="notice-content">
                <strong>Heads up:</strong> If you sign in, documents synced to our servers are automatically
                cleaned up after 7 days of inactivity. Use <strong>Streak Freeze</strong> to extend to 14 days.
                Your files are always safe locally on this device.
                <label class="notice-dismiss">
                    <input type="checkbox" id="dontShowAgainCheck">
                    Understood, don't show this again
                </label>
            </div>
            <button class="notice-close" aria-label="Close notice">&times;</button>
        `;

        this.elements.inputSection.prepend(banner);

        banner.querySelector('.notice-close').addEventListener('click', () => {
            if (document.getElementById('dontShowAgainCheck').checked) {
                localStorage.setItem('speedReader_uploadNoticeDismissed', 'true');
            }
            banner.remove();
        });
    }

    /**
     * Show notice about documents that need re-uploading from another device
     */
    showReuploadNotice(docs) {
        if (!docs || docs.length === 0) return;

        // Remove existing notice if any
        const existing = document.getElementById('reuploadNoticeBanner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'reuploadNoticeBanner';
        banner.className = 'notice-banner sync-banner';

        const docList = docs.map(d => {
            const progress = d.totalWords > 0 ? Math.round((d.bookmarkIndex / d.totalWords) * 100) : 0;
            return `<strong>${d.title}</strong> (${progress}% read)`;
        }).join(', ');

        banner.innerHTML = `
            <div class="notice-content">
                <strong>Sync:</strong> You have ${docs.length} document${docs.length > 1 ? 's' : ''} from another device:
                ${docList}.
                <br><em>Re-upload the same file${docs.length > 1 ? 's' : ''} to restore your progress.</em>
            </div>
            <button class="notice-close" aria-label="Close notice">&times;</button>
        `;

        this.elements.inputSection.prepend(banner);

        banner.querySelector('.notice-close').addEventListener('click', () => {
            banner.remove();
        });
    }

    // ========== STALE DOCUMENT CHECK ==========

    /**
     * Check for documents not read in 7+ days and show cleanup banner
     */
    async checkStaleDocuments() {
        if (typeof DB === 'undefined' || !DB.db) return;

        const docs = await DB.getAllDocuments();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const staleDocs = docs.filter(d => new Date(d.lastReadAt) < sevenDaysAgo);
        if (staleDocs.length === 0) return;

        // Don't show if already dismissed this session
        if (sessionStorage.getItem('speedReader_staleBannerDismissed')) return;

        const banner = document.createElement('div');
        banner.className = 'notice-banner stale-banner';
        banner.innerHTML = `
            <div class="notice-content">
                You have <strong>${staleDocs.length}</strong> document${staleDocs.length > 1 ? 's' : ''}
                unread for over a week. Want to clean up?
            </div>
            <div class="notice-actions">
                <button class="btn btn-secondary btn-small" id="staleDismissBtn">Keep</button>
                <button class="btn btn-danger btn-small" id="staleCleanBtn">Clean Up</button>
            </div>
        `;

        this.elements.inputSection.prepend(banner);

        document.getElementById('staleDismissBtn').addEventListener('click', () => {
            sessionStorage.setItem('speedReader_staleBannerDismissed', 'true');
            banner.remove();
        });

        document.getElementById('staleCleanBtn').addEventListener('click', async () => {
            for (const doc of staleDocs) {
                await DB.deleteDocument(doc.id);
                if (doc.supabaseId && typeof SupabaseClient !== 'undefined' && SupabaseClient.user) {
                    await SupabaseClient.deleteDocument(doc.supabaseId);
                }
            }
            banner.remove();
            this.loadLibrary();
            this.showSkipFeedback(`Cleaned up ${staleDocs.length} document${staleDocs.length > 1 ? 's' : ''}`);
        });
    }

    // ========== STATS DASHBOARD ==========

    /**
     * Refresh the stats dashboard display
     */
    async refreshStats() {
        if (typeof StatsEngine === 'undefined') return;

        const stats = await StatsEngine.getDisplayStats();
        const streakEl = document.getElementById('streakValue');
        const todayEl = document.getElementById('wordsReadTodayValue');
        const totalEl = document.getElementById('totalWordsValue');
        const avgWpmEl = document.getElementById('avgWpmValue');
        const docsEl = document.getElementById('docsCompletedValue');
        const freezeBtn = document.getElementById('streakFreezeBtn');

        if (streakEl) streakEl.textContent = stats.currentStreak;
        if (todayEl) todayEl.textContent = this.formatNumber(stats.wordsReadToday);
        if (totalEl) totalEl.textContent = this.formatNumber(stats.totalWordsRead);
        if (avgWpmEl) avgWpmEl.textContent = stats.averageWpm;
        if (docsEl) docsEl.textContent = stats.documentsCompleted;
        if (freezeBtn) {
            freezeBtn.style.display = stats.streakFreezeActive ? 'none' : 'inline-block';
        }
    }

    /**
     * Format large numbers (e.g., 1234 → "1,234")
     */
    formatNumber(num) {
        if (!num) return '0';
        return num.toLocaleString();
    }

    // ========== EXPORT / IMPORT ==========

    /**
     * Export library as JSON download
     */
    async exportLibrary() {
        if (typeof DB === 'undefined' || !DB.db) return;

        const data = await DB.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `speed-reader-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showSkipFeedback('Library exported!');
    }

    /**
     * Import library from JSON file
     */
    async importLibrary(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            const confirmed = await this.showConfirmDialog(
                'Import Library',
                `This will merge ${data.documents?.length || 0} documents and stats into your library. Continue?`
            );

            if (confirmed) {
                await DB.importAll(data);
                this.loadLibrary();
                await this.refreshStats();
                this.showSkipFeedback('Library imported!');
            }
        } catch (err) {
            this.showError('Invalid backup file: ' + err.message);
        }

        e.target.value = ''; // Reset file input
    }

    /**
     * Clear all local data (IndexedDB + localStorage)
     */
    async clearAllLocalData() {
        const confirmed = await this.showConfirmDialog(
            'Clear All Data',
            'This will delete ALL your local documents, reading stats, and settings. This cannot be undone. Continue?'
        );

        if (!confirmed) return;

        try {
            // Clear IndexedDB
            if (typeof DB !== 'undefined' && DB.db) {
                const tx = DB.db.transaction(['documents', 'stats', 'meta'], 'readwrite');
                await tx.objectStore('documents').clear();
                await tx.objectStore('stats').clear();
                await tx.objectStore('meta').clear();
                await tx.done;
            }

            // Clear localStorage items
            localStorage.removeItem('speedReaderSettings');
            localStorage.removeItem('speedReader_migrated');
            localStorage.removeItem('speedReader_crashBuffer');
            localStorage.removeItem('speedReader_uploadNoticeDismissed');

            // Reset app state
            this.currentDocId = null;
            this.settings = {
                wpm: 300,
                theme: 'light',
                fontSize: 40,
                showFocusGuide: false,
                punctuationPause: 200
            };
            this.applySettings();
            this.loadLibrary();
            await this.refreshStats();

            // Close settings modal
            this.elements.settingsModal.classList.add('hidden');

            this.showSkipFeedback('All local data cleared');
        } catch (err) {
            this.showError('Failed to clear data: ' + err.message);
        }
    }

    /**
     * Show error toast
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorToast.classList.remove('hidden');

        setTimeout(() => {
            this.elements.errorToast.classList.add('hidden');
        }, 3000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.speedReaderApp = new SpeedReaderApp();
});
