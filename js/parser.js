/**
 * PARSER MODULE
 * Handles text and PDF file parsing
 */

const Parser = {
    /**
     * Parse text into an array of words
     * @param {string} text - Raw text to parse
     * @returns {string[]} - Array of words
     */
    parseText(text) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        // Split by whitespace and filter empty strings
        const words = text
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 0);

        return words;
    },

    /**
     * Parse a .txt file
     * @param {File} file - Text file to parse
     * @returns {Promise<string[]>} - Promise resolving to array of words
     */
    async parseTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const text = e.target.result;
                const words = this.parseText(text);
                resolve(words);
            };

            reader.onerror = () => {
                reject(new Error('Failed to read text file'));
            };

            reader.readAsText(file);
        });
    },

    /**
     * Parse a PDF file using PDF.js
     * @param {File} file - PDF file to parse
     * @returns {Promise<string[]>} - Promise resolving to array of words
     */
    async parsePDFFile(file) {
        try {
            // Check if PDF.js is loaded
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js library not loaded');
            }

            // Set worker source for PDF.js
            pdfjsLib.GlobalWorkerOptions.workerSrc =
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // Load PDF document
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            let fullText = '';

            // Extract text from all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                // Combine text items
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ');

                fullText += pageText + ' ';
            }

            // Parse the extracted text into words
            const words = this.parseText(fullText);
            return words;

        } catch (error) {
            throw new Error(`Failed to parse PDF: ${error.message}`);
        }
    },

    /**
     * Parse uploaded file based on type
     * @param {File} file - File to parse
     * @returns {Promise<string[]>} - Promise resolving to array of words
     */
    async parseFile(file) {
        // Validate file
        if (!file) {
            throw new Error('No file provided');
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new Error('File too large. Maximum size is 10MB');
        }

        // Determine file type and parse accordingly
        const fileType = file.type;
        const fileName = file.name.toLowerCase();

        if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
            return await this.parseTextFile(file);
        } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
            return await this.parsePDFFile(file);
        } else {
            throw new Error('Unsupported file format. Please use .txt or .pdf files');
        }
    },

    /**
     * Calculate estimated reading time
     * @param {number} wordCount - Total number of words
     * @param {number} wpm - Words per minute
     * @returns {string} - Formatted time string (e.g., "5:30")
     */
    estimateReadingTime(wordCount, wpm) {
        const totalSeconds = Math.ceil((wordCount / wpm) * 60);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    /**
     * Get word statistics
     * @param {string[]} words - Array of words
     * @returns {Object} - Statistics object
     */
    getStatistics(words) {
        return {
            wordCount: words.length,
            characterCount: words.join('').length,
            averageWordLength: words.length > 0
                ? Math.round(words.join('').length / words.length)
                : 0
        };
    }
};
