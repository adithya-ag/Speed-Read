/**
 * SPEED READER APP - Main Application Logic
 * Handles UI, user interactions, and app state
 */

class SpeedReaderApp {
    constructor() {
        // State
        this.reader = null;
        this.words = [];

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
            readingSection: document.getElementById('readingSection'),

            // Input
            textInput: document.getElementById('textInput'),
            fileInput: document.getElementById('fileInput'),
            charCounter: document.getElementById('charCounter'),
            uploadStatus: document.getElementById('uploadStatus'),
            clearBtn: document.getElementById('clearBtn'),
            startBtn: document.getElementById('startBtn'),

            // Reading
            wordDisplay: document.getElementById('wordDisplay'),
            focusGuide: document.getElementById('focusGuide'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            timeRemaining: document.getElementById('timeRemaining'),

            // Controls
            speedSlider: document.getElementById('speedSlider'),
            speedValue: document.getElementById('speedValue'),
            playBtn: document.getElementById('playBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            exitBtn: document.getElementById('exitBtn'),

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

            // Error toast
            errorToast: document.getElementById('errorToast'),
            errorMessage: document.getElementById('errorMessage')
        };

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.loadSettings();
        this.applySettings();
        this.setupEventListeners();
        this.updateCharCounter();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
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

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
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
        } catch (error) {
            this.showError(error.message);
            this.elements.uploadStatus.textContent = `✗ ${error.message}`;
            this.elements.uploadStatus.style.color = 'var(--error-color)';
        }
    }

    /**
     * Start reading session
     */
    startReading() {
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

        // Create reader instance
        this.reader = new SpeedReader(this.words, {
            wpm: this.settings.wpm,
            punctuationPause: this.settings.punctuationPause,
            onWordChange: (word, index) => {
                this.displayWord(word);
            },
            onProgress: (progress, current, total) => {
                this.updateProgress(progress, current, total);
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
     * Display current word
     */
    displayWord(word) {
        this.elements.wordDisplay.textContent = word;
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
    }

    /**
     * Pause reading
     */
    pause() {
        if (!this.reader) return;

        this.reader.pause();
        this.elements.pauseBtn.classList.add('hidden');
        this.elements.playBtn.classList.remove('hidden');
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
            this.reader.destroy();
            this.reader = null;
        }

        this.showInputSection();
    }

    /**
     * Handle reading completion
     */
    onReadingComplete() {
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
            if ([' ', 'ArrowLeft', 'ArrowRight', 'r', 'R', 'Escape'].includes(e.key)) {
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

                case 'Escape':
                    // Escape: Exit to input
                    this.exitToInput();
                    break;
            }
        }

        // Settings modal close with Escape
        if (e.key === 'Escape' && !this.elements.settingsModal.classList.contains('hidden')) {
            this.closeSettings();
        }
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
