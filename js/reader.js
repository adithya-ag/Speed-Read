/**
 * READER MODULE
 * Handles the core reading engine with RSVP technique
 */

class SpeedReader {
    constructor(words, options = {}) {
        this.words = words;
        this.currentIndex = 0;
        this.isPlaying = false;
        this.timeoutId = null;

        // Settings with defaults
        this.wpm = options.wpm || 300;
        this.punctuationPause = options.punctuationPause || 200;

        // Callbacks
        this.onWordChange = options.onWordChange || (() => {});
        this.onComplete = options.onComplete || (() => {});
        this.onProgress = options.onProgress || (() => {});
    }

    /**
     * Calculate delay for current word (in milliseconds)
     * Adds extra pause for punctuation
     */
    getWordDelay() {
        const baseDelay = 60000 / this.wpm;
        const currentWord = this.words[this.currentIndex - 1];

        if (!currentWord) {
            return baseDelay;
        }

        // Check for sentence-ending punctuation
        if (/[.!?]$/.test(currentWord)) {
            return baseDelay + this.punctuationPause;
        }

        // Check for comma or semicolon
        if (/[,;:]$/.test(currentWord)) {
            return baseDelay + (this.punctuationPause / 2);
        }

        return baseDelay;
    }

    /**
     * Display next word in sequence
     */
    displayNextWord() {
        if (this.currentIndex >= this.words.length) {
            this.complete();
            return;
        }

        const word = this.words[this.currentIndex];

        // Call word change callback
        this.onWordChange(word, this.currentIndex);

        // Update progress
        const progress = ((this.currentIndex + 1) / this.words.length) * 100;
        this.onProgress(progress, this.currentIndex + 1, this.words.length);

        this.currentIndex++;

        // Schedule next word
        if (this.isPlaying) {
            const delay = this.getWordDelay();
            this.timeoutId = setTimeout(() => {
                this.displayNextWord();
            }, delay);
        }
    }

    /**
     * Start or resume reading
     */
    play() {
        if (this.isPlaying) {
            return;
        }

        // Reset if at the end
        if (this.currentIndex >= this.words.length) {
            this.reset();
        }

        this.isPlaying = true;
        this.displayNextWord();
    }

    /**
     * Pause reading
     */
    pause() {
        this.isPlaying = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    /**
     * Reset to beginning
     */
    reset() {
        this.pause();
        this.currentIndex = 0;
        this.onWordChange('', 0);
        this.onProgress(0, 0, this.words.length);
    }

    /**
     * Complete reading session
     */
    complete() {
        this.pause();
        this.onComplete();
    }

    /**
     * Update reading speed
     */
    setSpeed(wpm) {
        this.wpm = Math.max(200, Math.min(1000, wpm));
    }

    /**
     * Update punctuation pause duration
     */
    setPunctuationPause(ms) {
        this.punctuationPause = Math.max(0, Math.min(500, ms));
    }

    /**
     * Jump to specific word index
     */
    jumpToWord(index) {
        const wasPlaying = this.isPlaying;
        this.pause();
        this.currentIndex = Math.max(0, Math.min(index, this.words.length));

        if (this.currentIndex < this.words.length) {
            const word = this.words[this.currentIndex];
            this.onWordChange(word, this.currentIndex);
        }

        const progress = (this.currentIndex / this.words.length) * 100;
        this.onProgress(progress, this.currentIndex, this.words.length);

        if (wasPlaying) {
            this.play();
        }
    }

    /**
     * Get current state
     */
    getState() {
        return {
            currentIndex: this.currentIndex,
            totalWords: this.words.length,
            isPlaying: this.isPlaying,
            wpm: this.wpm,
            progress: (this.currentIndex / this.words.length) * 100
        };
    }

    /**
     * Estimate time remaining
     */
    getTimeRemaining() {
        const wordsLeft = this.words.length - this.currentIndex;
        const secondsLeft = Math.ceil((wordsLeft / this.wpm) * 60);
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Destroy reader and cleanup
     */
    destroy() {
        this.pause();
        this.words = [];
        this.currentIndex = 0;
    }
}
