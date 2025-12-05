/**
 * Thoughts in Bloom - Main JavaScript
 * A living digital garden where ideas grow and connect over time.
 * 
 * @fileoverview Main application logic for capturing, storing, and displaying thoughts.
 * Uses browser localStorage for data persistence.
 * 
 * @version 1.0.0
 * @see https://github.com/helloshreyamathur/thoughts-in-bloom
 * 
 * Data Structure (stored in localStorage as 'thoughts'):
 * @typedef {Object} Thought
 * @property {string} id - Unique identifier (UUID)
 * @property {string} text - The thought content
 * @property {string} date - ISO 8601 creation timestamp
 * @property {string[]} tags - Array of hashtags extracted from text (lowercase)
 * @property {boolean} archived - Whether the thought is archived
 * @property {string} [updatedAt] - ISO 8601 timestamp of last edit (optional)
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Thoughts in Bloom - Ready');
    
    // ============================================
    // CONSTANTS
    // ============================================
    
    /** @const {number} Maximum characters allowed per thought */
    const MAX_CHARS = 1000;
    
    /** @const {number} Character count threshold for warning indicator */
    const WARNING_THRESHOLD = 500;
    
    /** @const {number} Characters to show before truncating with "Show more" */
    const PREVIEW_CHAR_LIMIT = 280;
    
    // ============================================
    // DOM ELEMENT REFERENCES
    // ============================================
    
    const thoughtInput = document.getElementById('thought-input');
    const saveButton = document.getElementById('save-button');
    const thoughtsContainer = document.getElementById('thoughts-container');
    const charCounter = document.getElementById('char-counter');
    const errorMessage = document.getElementById('error-message');
    const inputSection = document.querySelector('.input-section');
    const tagFilterContainer = document.getElementById('tag-filter-container');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const searchResultsCount = document.getElementById('search-results-count');
    const searchToggleBtn = document.getElementById('search-toggle-btn');
    const searchSection = document.querySelector('.search-section');
    
    // Archive View Elements
    const archiveThoughtsContainer = document.getElementById('archive-thoughts-container');
    const archiveTagFilterContainer = document.getElementById('archive-tag-filter-container');
    const archiveSearchInput = document.getElementById('archive-search-input');
    const archiveClearSearchBtn = document.getElementById('archive-clear-search');
    const archiveSearchResultsCount = document.getElementById('archive-search-results-count');
    const archiveSearchToggleBtn = document.getElementById('archive-search-toggle-btn');
    const archiveSearchSection = document.querySelector('#archive-view .search-section');
    
    // Sidebar Navigation
    const sidebar = document.querySelector('.sidebar');
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    // ============================================
    // APPLICATION STATE
    // ============================================
    
    /** @type {string|null} ID of the thought currently being edited, null if not in edit mode */
    let currentEditingId = null;
    
    /** @type {string|null} Current tag filter for home view, null means show all tags */
    let currentTagFilter = null;
    
    /** @type {string} Current search query for home view (lowercase, trimmed) */
    let currentSearchQuery = '';
    
    /** @type {number|null} Timer ID for search debouncing */
    let searchDebounceTimer = null;
    
    /** @type {boolean} Whether the search UI is currently expanded */
    let isSearchExpanded = false; // Matches initial HTML class="collapsed"
    
    // Archive View State
    /** @type {string|null} Current tag filter for archive view, null means show all tags */
    let archiveTagFilter = null;
    
    /** @type {string} Current search query for archive view (lowercase, trimmed) */
    let archiveSearchQuery = '';
    
    /** @type {number|null} Timer ID for archive search debouncing */
    let archiveSearchDebounceTimer = null;
    
    /** @type {boolean} Whether the archive search UI is currently expanded */
    let isArchiveSearchExpanded = false;
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    // Load and display existing thoughts on page load
    loadThoughts();
    
    // Render tag filter UI
    renderTagFilter();
    
    // Update character counter and button state on initial load
    updateCharCounter();
    
    // Restore Sidebar State on Load
    if (localStorage.getItem('sidebarExpanded') === 'true') {
        sidebar.classList.add('expanded');
    }
    
    // Restore Active View on Load
    const savedView = localStorage.getItem('activeView') || 'home';
    showView(savedView);
    sidebarItems.forEach(item => {
        if (item.getAttribute('data-view') === savedView) {
            item.classList.add('active');
        }
    });
    
    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    // Save button click handler
    saveButton.addEventListener('click', handleSave);
    
    // Textarea input handler - updates character counter and button state
    thoughtInput.addEventListener('input', updateCharCounter);
    
    // Home View Search input with debouncing (300ms delay for performance)
    searchInput.addEventListener('input', function() {
        // Clear previous debounce timer
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        
        // Set new debounce timer (300ms)
        searchDebounceTimer = setTimeout(function() {
            handleSearch();
        }, 300);
    });
    
    // Clear search button handler
    clearSearchBtn.addEventListener('click', function() {
        clearSearch();
    });
    
    // Escape key clears search or collapses when focused on search input
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (currentSearchQuery) {
                clearSearch();
            } else {
                collapseSearch();
            }
        }
    });
    
    // Search toggle button handler
    searchToggleBtn.addEventListener('click', function() {
        expandSearch();
    });
    
    // Global keyboard shortcut: Ctrl+K / Cmd+K to open search
    // Only intercept if not currently typing in a form field
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            const activeElement = document.activeElement;
            const isTyping = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.isContentEditable
            );
            
            // Only prevent default and expand if not typing in a field
            if (!isTyping) {
                e.preventDefault();
                expandSearch();
            }
        }
    });
    
    /**
     * Handler for click-outside to collapse search.
     * @param {MouseEvent} e - The click event
     */
    function handleClickOutside(e) {
        if (searchSection && !searchSection.contains(e.target)) {
            collapseSearch();
        }
    }
    
    // Mobile: Handle virtual keyboard appearance
    // Scroll input into view when focused on mobile
    // Using 150ms delay as a reasonable balance for various devices
    /** @const {number} Delay before scrolling input into view on mobile */
    const KEYBOARD_SCROLL_DELAY = 150;
    
    /**
     * Scrolls an input element into view when focused on mobile phones.
     * Helps ensure the input remains visible when the virtual keyboard appears.
     * @param {HTMLElement} inputElement - The input element to scroll into view
     */
    function handleMobileInputFocus(inputElement) {
        // Check if on mobile phone (touch device with phone-sized screen)
        // Using 480px to better distinguish phones from tablets
        const isMobilePhone = window.matchMedia('(max-width: 480px)').matches && 
                              ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        
        if (isMobilePhone) {
            // Small delay to let the keyboard start appearing
            setTimeout(function() {
                inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, KEYBOARD_SCROLL_DELAY);
        }
    }
    
    thoughtInput.addEventListener('focus', function() {
        handleMobileInputFocus(thoughtInput);
    });
    
    searchInput.addEventListener('focus', function() {
        handleMobileInputFocus(searchInput);
    });
    
    // Archive View Search input with debouncing (300ms delay for performance)
    if (archiveSearchInput) {
        archiveSearchInput.addEventListener('input', function() {
            // Clear previous debounce timer
            if (archiveSearchDebounceTimer) {
                clearTimeout(archiveSearchDebounceTimer);
            }
            
            // Set new debounce timer (300ms)
            archiveSearchDebounceTimer = setTimeout(function() {
                handleArchiveSearch();
            }, 300);
        });
        
        // Clear search button handler
        archiveClearSearchBtn.addEventListener('click', function() {
            clearArchiveSearch();
        });
        
        // Escape key clears search or collapses when focused on search input
        archiveSearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (archiveSearchQuery) {
                    clearArchiveSearch();
                } else {
                    collapseArchiveSearch();
                }
            }
        });
        
        // Search toggle button handler
        archiveSearchToggleBtn.addEventListener('click', function() {
            expandArchiveSearch();
        });
        
        archiveSearchInput.addEventListener('focus', function() {
            handleMobileInputFocus(archiveSearchInput);
        });
    }
    
    // Mobile: Handle viewport resize when keyboard appears/disappears
    // This helps with iOS Safari where the viewport doesn't resize properly
    if ('visualViewport' in window) {
        window.visualViewport.addEventListener('resize', function() {
            // Adjust scroll position if an input is focused
            const activeElement = document.activeElement;
            if (activeElement && (activeElement === thoughtInput || activeElement === searchInput || activeElement === archiveSearchInput)) {
                // Use same delay for consistency
                setTimeout(function() {
                    activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, KEYBOARD_SCROLL_DELAY);
            }
        });
    }
    
    // ============================================
    // CHARACTER COUNTER & VALIDATION
    // ============================================
    
    /**
     * Updates the character counter display and save button state.
     * Shows warning/danger colors based on character count thresholds.
     * Disables save button if input is empty or exceeds MAX_CHARS.
     */
    function updateCharCounter() {
        const text = thoughtInput.value;
        const length = text.length;
        
        // Update counter text
        charCounter.textContent = length + ' / ' + MAX_CHARS;
        
        // Update counter color based on length
        charCounter.classList.remove('warning', 'danger');
        if (length > MAX_CHARS) {
            charCounter.classList.add('danger');
        } else if (length >= WARNING_THRESHOLD) {
            charCounter.classList.add('warning');
        }
        
        // Update save button state
        // Disabled if: no meaningful content (trimmed is empty) OR exceeds character limit (raw length)
        const trimmedText = text.trim();
        saveButton.disabled = trimmedText.length === 0 || length > MAX_CHARS;
        
        // Clear error message when user starts typing
        if (trimmedText.length > 0) {
            errorMessage.textContent = '';
        }
    }
    
    // ============================================
    // SAVE/UPDATE THOUGHT FUNCTIONS
    // ============================================
    
    /**
     * Handles the save button click - either saves a new thought or updates existing one.
     * Routes to saveThought() or updateThought() based on edit mode state.
     */
    function handleSave() {
        if (currentEditingId) {
            updateThought();
        } else {
            saveThought();
        }
    }
    
    /**
     * Extracts hashtags from text content.
     * @param {string} text - The text to extract tags from
     * @returns {string[]} Array of unique lowercase tags (including # prefix)
     * @example
     * extractTags("Meeting with #john about #project") // ['#john', '#project']
     */
    function extractTags(text) {
        // Extract hashtags from text using regex
        const matches = text.match(/#\w+/g);
        if (!matches) {
            return [];
        }
        // Remove duplicates and convert to lowercase for consistency
        const uniqueTags = [...new Set(matches.map(tag => tag.toLowerCase()))];
        return uniqueTags;
    }
    
    /**
     * Saves a new thought to localStorage.
     * Creates a new thought object with UUID, extracts tags, and prepends to thoughts array.
     * Includes visual feedback with save button animations.
     */
    function saveThought() {
        const text = thoughtInput.value.trim();
        const rawLength = thoughtInput.value.length;
        
        // Don't save empty thoughts
        if (!text) {
            errorMessage.textContent = 'Please enter a thought before saving.';
            return;
        }
        
        // Don't save if over character limit (check raw length including whitespace)
        if (rawLength > MAX_CHARS) {
            errorMessage.textContent = 'Thought exceeds character limit.';
            return;
        }
        
        // Create thought object with extracted tags
        const thought = {
            id: crypto.randomUUID(),
            text: text,
            date: new Date().toISOString(),
            tags: extractTags(text),
            archived: false
        };
        
        // Get existing thoughts from localStorage
        const thoughts = getThoughts();
        
        // Add new thought to the beginning (newest first)
        thoughts.unshift(thought);
        
        // Save to localStorage with visual feedback
        saveButton.classList.add('saving');
        
        if (!saveThoughtsToStorage(thoughts)) {
            // Remove the thought we just added since save failed
            thoughts.shift();
            saveButton.classList.remove('saving');
            return;
        }
        
        console.log('Thought saved:', thought);
        
        // Invalidate insights and analytics cache since thoughts have changed
        if (typeof window.invalidateInsightsCache === 'function') {
            window.invalidateInsightsCache();
        }
        if (typeof window.invalidateAnalyticsCache === 'function') {
            window.invalidateAnalyticsCache();
        }
        
        // Add success animation
        saveButton.classList.remove('saving');
        saveButton.classList.add('save-success');
        setTimeout(function() {
            saveButton.classList.remove('save-success');
        }, 600);
        
        // Clear textarea and update counter
        thoughtInput.value = '';
        updateCharCounter();
        
        // Remove empty state if it exists
        const emptyState = thoughtsContainer.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }
        
        // Create and prepend new card with animation
        const card = createThoughtCard(thought, true);
        thoughtsContainer.prepend(card);
        
        // Refresh tag filter UI to include new tags
        renderTagFilter();
    }
    
    // ============================================
    // EDIT MODE FUNCTIONS
    // ============================================
    
    /**
     * Enters edit mode for a specific thought.
     * Populates the input with the thought's text and highlights the card being edited.
     * @param {string} thoughtId - The UUID of the thought to edit
     */
    function editThought(thoughtId) {
        const thoughts = getThoughts();
        const thought = thoughts.find(t => t.id === thoughtId);
        
        if (!thought) {
            console.error('Thought not found:', thoughtId);
            return;
        }
        
        // Enter edit mode
        currentEditingId = thoughtId;
        
        // Populate textarea with thought text
        thoughtInput.value = thought.text;
        updateCharCounter();
        
        // Update UI to show edit mode
        inputSection.classList.add('edit-mode');
        saveButton.innerHTML = '✓';
        saveButton.setAttribute('aria-label', 'Update thought');
        
        // Highlight the card being edited
        const allCards = document.querySelectorAll('.thought-card');
        allCards.forEach(card => {
            card.classList.remove('editing');
            if (card.dataset.id === thoughtId) {
                card.classList.add('editing');
            }
        });
        
        // Focus the textarea
        thoughtInput.focus();
    }
    
    /**
     * Updates an existing thought in localStorage.
     * Preserves original date, adds updatedAt timestamp, and re-extracts tags.
     */
    function updateThought() {
        const text = thoughtInput.value.trim();
        const rawLength = thoughtInput.value.length;
        
        // Don't save empty thoughts
        if (!text) {
            errorMessage.textContent = 'Please enter a thought before saving.';
            return;
        }
        
        // Don't save if over character limit
        if (rawLength > MAX_CHARS) {
            errorMessage.textContent = 'Thought exceeds character limit.';
            return;
        }
        
        // Get existing thoughts and find the one to update
        const thoughts = getThoughts();
        const thoughtIndex = thoughts.findIndex(t => t.id === currentEditingId);
        
        if (thoughtIndex === -1) {
            console.error('Thought not found for update:', currentEditingId);
            cancelEdit();
            return;
        }
        
        // Update the thought - preserve original date, add updatedAt, re-extract tags
        thoughts[thoughtIndex].text = text;
        thoughts[thoughtIndex].tags = extractTags(text);
        thoughts[thoughtIndex].updatedAt = new Date().toISOString();
        
        // Save to localStorage
        if (!saveThoughtsToStorage(thoughts)) {
            return;
        }
        
        console.log('Thought updated:', thoughts[thoughtIndex]);
        
        // Invalidate insights and analytics cache since thoughts have changed
        if (typeof window.invalidateInsightsCache === 'function') {
            window.invalidateInsightsCache();
        }
        if (typeof window.invalidateAnalyticsCache === 'function') {
            window.invalidateAnalyticsCache();
        }
        
        // Reset form to add mode
        cancelEdit();
        
        // Re-render all cards to show updated content
        loadThoughts();
        
        // Refresh tag filter UI to reflect any tag changes
        renderTagFilter();
    }
    
    /**
     * Exits edit mode and resets the input area.
     * Clears the textarea, resets button appearance, and removes card highlight.
     */
    function cancelEdit() {
        currentEditingId = null;
        thoughtInput.value = '';
        updateCharCounter();
        
        // Reset UI
        inputSection.classList.remove('edit-mode');
        saveButton.innerHTML = '→';
        saveButton.setAttribute('aria-label', 'Save thought');
        
        // Remove editing highlight from all cards
        const allCards = document.querySelectorAll('.thought-card');
        allCards.forEach(card => card.classList.remove('editing'));
    }
    
    // ============================================
    // ARCHIVE/RESTORE FUNCTIONS
    // ============================================
    
    /**
     * Archives a thought (soft delete).
     * Sets archived flag to true and re-renders the view.
     * @param {string} thoughtId - The UUID of the thought to archive
     */
    function archiveThought(thoughtId) {
        const thoughts = getThoughts();
        const thoughtIndex = thoughts.findIndex(t => t.id === thoughtId);
        
        if (thoughtIndex === -1) {
            console.error('Thought not found for archive:', thoughtId);
            return;
        }
        
        // Set archived to true
        thoughts[thoughtIndex].archived = true;
        
        // Save to localStorage
        if (!saveThoughtsToStorage(thoughts)) {
            return;
        }
        
        console.log('Thought archived:', thoughts[thoughtIndex]);
        
        // Invalidate insights and analytics cache since thoughts have changed
        if (typeof window.invalidateInsightsCache === 'function') {
            window.invalidateInsightsCache();
        }
        if (typeof window.invalidateAnalyticsCache === 'function') {
            window.invalidateAnalyticsCache();
        }
        
        // Re-render to remove from active view
        loadThoughts();
        // Also update tag filter UI
        renderTagFilter();
    }
    
    /**
     * Restores an archived thought back to active state.
     * Sets archived flag to false and re-renders the view.
     * @param {string} thoughtId - The UUID of the thought to restore
     */
    function restoreThought(thoughtId) {
        const thoughts = getThoughts();
        const thoughtIndex = thoughts.findIndex(t => t.id === thoughtId);
        
        if (thoughtIndex === -1) {
            console.error('Thought not found for restore:', thoughtId);
            return;
        }
        
        // Set archived to false
        thoughts[thoughtIndex].archived = false;
        
        // Save to localStorage
        if (!saveThoughtsToStorage(thoughts)) {
            return;
        }
        
        console.log('Thought restored:', thoughts[thoughtIndex]);
        
        // Invalidate insights and analytics cache since thoughts have changed
        if (typeof window.invalidateInsightsCache === 'function') {
            window.invalidateInsightsCache();
        }
        if (typeof window.invalidateAnalyticsCache === 'function') {
            window.invalidateAnalyticsCache();
        }
        
        // Re-render to remove from archived view
        loadArchivedThoughts();
        // Also update tag filter UI for archive view
        renderArchiveTagFilter();
    }
    
    // ============================================
    // LOCALSTORAGE FUNCTIONS
    // ============================================
    
    /**
     * Retrieves all thoughts from localStorage.
     * Handles corrupted data gracefully by returning empty array.
     * @returns {Thought[]} Array of thought objects, or empty array if none exist
     */
    function getThoughts() {
        try {
            const stored = localStorage.getItem('thoughts');
            if (!stored) {
                return [];
            }
            const parsed = JSON.parse(stored);
            // Validate data structure
            if (!Array.isArray(parsed)) {
                console.warn('Corrupted localStorage data: expected array, got', typeof parsed);
                return [];
            }
            return parsed;
        } catch (e) {
            console.error('Error reading thoughts from localStorage:', e);
            showErrorMessage('Unable to load saved thoughts. Data may be corrupted.');
            return [];
        }
    }
    
    /**
     * Saves thoughts array to localStorage.
     * Handles QuotaExceededError and other storage errors gracefully.
     * @param {Thought[]} thoughts - Array of thought objects to save
     * @returns {boolean} True if save successful, false otherwise
     */
    function saveThoughtsToStorage(thoughts) {
        try {
            localStorage.setItem('thoughts', JSON.stringify(thoughts));
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                showErrorMessage('Storage is full. Please archive or remove some thoughts.');
            } else {
                showErrorMessage('Unable to save thought. Please try again.');
            }
            console.error('Error saving to localStorage:', e);
            return false;
        }
    }
    
    /**
     * Displays an error message to the user.
     * @param {string} message - The error message to display
     */
    function showErrorMessage(message) {
        errorMessage.textContent = message;
    }
    
    // ============================================
    // DISPLAY/RENDER FUNCTIONS
    // ============================================
    
    /**
     * Loads and displays active thoughts based on tag filter and search query.
     * Handles filtering logic and shows appropriate empty states.
     * Uses document fragments for efficient DOM updates.
     */
    function loadThoughts() {
        const thoughts = getThoughts();
        
        // Clear current display
        thoughtsContainer.innerHTML = '';
        
        // Check if there are no thoughts at all
        if (thoughts.length === 0) {
            showEmptyState('welcome');
            searchResultsCount.textContent = '';
            return;
        }
        
        // Filter to show only active (non-archived) thoughts
        // Note: !thought.archived handles both false and undefined (for backward compatibility)
        let filteredThoughts = thoughts.filter(function(thought) {
            return !thought.archived;
        });
        
        // Check for empty active (all archived)
        if (filteredThoughts.length === 0 && !currentSearchQuery && !currentTagFilter) {
            showEmptyState('all-archived');
            searchResultsCount.textContent = '';
            return;
        }
        
        // Apply tag filter if one is set
        if (currentTagFilter) {
            filteredThoughts = filteredThoughts.filter(function(thought) {
                // Handle backward compatibility for thoughts without tags property
                const thoughtTags = thought.tags || extractTags(thought.text);
                return thoughtTags && thoughtTags.includes(currentTagFilter);
            });
        }
        
        // Apply search filter if query exists
        if (currentSearchQuery) {
            filteredThoughts = filteredThoughts.filter(function(thought) {
                return thought.text.toLowerCase().includes(currentSearchQuery);
            });
        }
        
        // Update search results count
        if (currentSearchQuery) {
            const count = filteredThoughts.length;
            const plural = count === 1 ? '' : 's';
            searchResultsCount.textContent = count + ' result' + plural + ' found';
        } else {
            searchResultsCount.textContent = '';
        }
        
        // Check for no results from search or filter
        if (filteredThoughts.length === 0) {
            if (currentSearchQuery) {
                showEmptyState('no-search-results');
            } else if (currentTagFilter) {
                showEmptyState('no-tag-results');
            }
            return;
        }
        
        // Create cards using document fragment for better performance with large lists
        // This minimizes DOM reflows by batching all appendChild operations
        const fragment = document.createDocumentFragment();
        filteredThoughts.forEach(function(thought) {
            const card = createThoughtCard(thought);
            fragment.appendChild(card);
        });
        thoughtsContainer.appendChild(fragment);
    }
    
    /**
     * Loads and displays archived thoughts based on tag filter and search query.
     * Handles filtering logic and shows appropriate empty states.
     * Uses document fragments for efficient DOM updates.
     */
    function loadArchivedThoughts() {
        if (!archiveThoughtsContainer) return;
        
        const thoughts = getThoughts();
        
        // Clear current display
        archiveThoughtsContainer.innerHTML = '';
        
        // Filter to show only archived thoughts
        let filteredThoughts = thoughts.filter(function(thought) {
            return thought.archived === true;
        });
        
        // Check for empty archive
        if (filteredThoughts.length === 0 && !archiveSearchQuery && !archiveTagFilter) {
            showArchiveEmptyState('archive');
            if (archiveSearchResultsCount) archiveSearchResultsCount.textContent = '';
            return;
        }
        
        // Apply tag filter if one is set
        if (archiveTagFilter) {
            filteredThoughts = filteredThoughts.filter(function(thought) {
                // Handle backward compatibility for thoughts without tags property
                const thoughtTags = thought.tags || extractTags(thought.text);
                return thoughtTags && thoughtTags.includes(archiveTagFilter);
            });
        }
        
        // Apply search filter if query exists
        if (archiveSearchQuery) {
            filteredThoughts = filteredThoughts.filter(function(thought) {
                return thought.text.toLowerCase().includes(archiveSearchQuery);
            });
        }
        
        // Update search results count
        if (archiveSearchQuery && archiveSearchResultsCount) {
            const count = filteredThoughts.length;
            const plural = count === 1 ? '' : 's';
            archiveSearchResultsCount.textContent = count + ' result' + plural + ' found';
        } else if (archiveSearchResultsCount) {
            archiveSearchResultsCount.textContent = '';
        }
        
        // Check for no results from search or filter
        if (filteredThoughts.length === 0) {
            if (archiveSearchQuery) {
                showArchiveEmptyState('no-search-results');
            } else if (archiveTagFilter) {
                showArchiveEmptyState('no-tag-results');
            }
            return;
        }
        
        // Create cards using document fragment for better performance with large lists
        const fragment = document.createDocumentFragment();
        filteredThoughts.forEach(function(thought) {
            const card = createThoughtCard(thought, false, archiveSearchQuery);
            fragment.appendChild(card);
        });
        archiveThoughtsContainer.appendChild(fragment);
    }
    
    /**
     * Displays an empty state message based on the context.
     * @param {'welcome'|'archive'|'all-archived'|'no-search-results'|'no-tag-results'} type - The type of empty state to show
     */
    function showEmptyState(type) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        let icon = '';
        let title = '';
        let message = '';
        
        switch (type) {
            case 'welcome':
                icon = '🌱';
                title = 'Plant your first thought';
                message = 'Your digital garden is ready. Start capturing ideas above!';
                break;
            case 'archive':
                icon = '📦';
                title = 'Archive is empty';
                message = 'Archived thoughts will appear here.';
                break;
            case 'all-archived':
                icon = '🌿';
                title = 'All thoughts archived';
                message = 'Your active thoughts have been archived. Add new ones or restore from the archive.';
                break;
            case 'no-search-results':
                icon = '🔍';
                title = 'No matches found';
                message = 'Try a different search term.';
                break;
            case 'no-tag-results':
                icon = '🏷️';
                title = 'No thoughts with this tag';
                message = 'Try selecting a different tag or clear the filter.';
                break;
            default:
                icon = '💭';
                title = 'No thoughts here';
                message = '';
        }
        
        emptyState.innerHTML = '<span class="empty-state-icon">' + icon + '</span>' +
            '<h3 class="empty-state-title">' + title + '</h3>' +
            '<p class="empty-state-message">' + message + '</p>';
        
        thoughtsContainer.appendChild(emptyState);
    }
    
    /**
     * Displays an empty state message in the archive view based on the context.
     * @param {'archive'|'no-search-results'|'no-tag-results'} type - The type of empty state to show
     */
    function showArchiveEmptyState(type) {
        if (!archiveThoughtsContainer) return;
        
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        let icon = '';
        let title = '';
        let message = '';
        
        switch (type) {
            case 'archive':
                icon = '📦';
                title = 'Archive is empty';
                message = 'Archived thoughts will appear here.';
                break;
            case 'no-search-results':
                icon = '🔍';
                title = 'No matches found';
                message = 'Try a different search term.';
                break;
            case 'no-tag-results':
                icon = '🏷️';
                title = 'No thoughts with this tag';
                message = 'Try selecting a different tag or clear the filter.';
                break;
            default:
                icon = '📦';
                title = 'No archived thoughts';
                message = '';
        }
        
        emptyState.innerHTML = '<span class="empty-state-icon">' + icon + '</span>' +
            '<h3 class="empty-state-title">' + title + '</h3>' +
            '<p class="empty-state-message">' + message + '</p>';
        
        archiveThoughtsContainer.appendChild(emptyState);
    }
    
    /**
     * Creates a DOM element for a thought card.
     * Handles text truncation, tags display, action buttons, and search highlighting.
     * @param {Thought} thought - The thought object to create a card for
     * @param {boolean} [isNew=false] - Whether this is a newly created thought (triggers animation)
     * @param {string} [searchQuery=''] - Search query to highlight in the card text
     * @returns {HTMLDivElement} The created card element
     */
    function createThoughtCard(thought, isNew = false, searchQuery = '') {
        const card = document.createElement('div');
        card.className = 'thought-card';
        if (isNew) {
            card.classList.add('slide-in');
        }
        // Add archived class for styling archived cards
        if (thought.archived) {
            card.classList.add('archived');
        }
        card.dataset.id = thought.id;
        
        // Phase P4: Add random pastel tint to each card
        const tints = ['tint-blue', 'tint-purple', 'tint-pink', 'tint-peach', 'tint-mint'];
        const randomTint = tints[Math.floor(Math.random() * tints.length)];
        card.classList.add(randomTint);
        
        const textElement = document.createElement('p');
        textElement.className = 'thought-text';
        
        // Use provided searchQuery or fall back to current home search query
        const effectiveSearchQuery = searchQuery || currentSearchQuery;
        
        const needsTruncation = thought.text.length > PREVIEW_CHAR_LIMIT;
        
        if (needsTruncation) {
            // Store full text in data attribute for toggling
            textElement.dataset.fullText = thought.text;
            textElement.dataset.truncated = 'true';
            textElement.dataset.searchQuery = effectiveSearchQuery; // Store for toggle function
            // Apply search highlighting to truncated text
            const truncatedText = getTruncatedText(thought.text);
            if (effectiveSearchQuery) {
                textElement.appendChild(highlightSearchText(truncatedText, effectiveSearchQuery));
            } else {
                textElement.textContent = truncatedText;
            }
        } else {
            // Apply search highlighting to full text
            if (effectiveSearchQuery) {
                textElement.appendChild(highlightSearchText(thought.text, effectiveSearchQuery));
            } else {
                textElement.textContent = thought.text;
            }
        }
        
        // Create tags container if thought has tags
        // Handle backward compatibility for thoughts without tags property
        const thoughtTags = thought.tags || extractTags(thought.text);
        let tagsContainer = null;
        if (thoughtTags && thoughtTags.length > 0) {
            tagsContainer = document.createElement('div');
            tagsContainer.className = 'thought-tags';
            
            thoughtTags.forEach(function(tag) {
                const tagElement = document.createElement('button');
                tagElement.type = 'button';
                tagElement.className = 'tag-badge';
                tagElement.textContent = tag;
                tagElement.setAttribute('aria-label', 'Filter by tag ' + tag);
                tagElement.addEventListener('click', function(e) {
                    e.stopPropagation();
                    // Use appropriate filter function based on thought's archived status
                    if (thought.archived) {
                        filterArchiveByTag(tag);
                    } else {
                        filterByTag(tag);
                    }
                });
                tagsContainer.appendChild(tagElement);
            });
        }
        
        const footer = document.createElement('div');
        footer.className = 'thought-footer';
        
        const dateElement = document.createElement('span');
        dateElement.className = 'thought-date';
        
        // Show creation date and "edited" indicator if updated
        if (thought.updatedAt) {
            dateElement.textContent = formatDate(thought.date) + ' (edited)';
            dateElement.title = 'Last edited: ' + formatDateTime(thought.updatedAt);
        } else {
            dateElement.textContent = formatDate(thought.date);
        }
        
        footer.appendChild(dateElement);
        
        // Add actions container for buttons
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'thought-actions';
        
        // Add Edit button (only for active thoughts)
        if (!thought.archived) {
            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'edit-btn';
            editButton.textContent = 'Edit';
            editButton.setAttribute('aria-label', 'Edit thought');
            editButton.addEventListener('click', function(e) {
                e.stopPropagation();
                editThought(thought.id);
            });
            actionsContainer.appendChild(editButton);
        }
        
        // Add Archive/Restore button
        const archiveButton = document.createElement('button');
        archiveButton.type = 'button';
        archiveButton.className = 'archive-btn';
        if (thought.archived) {
            archiveButton.textContent = 'Restore';
            archiveButton.setAttribute('aria-label', 'Restore thought from archive');
            archiveButton.addEventListener('click', function(e) {
                e.stopPropagation();
                restoreThought(thought.id);
            });
        } else {
            archiveButton.textContent = 'Archive';
            archiveButton.setAttribute('aria-label', 'Archive thought');
            archiveButton.addEventListener('click', function(e) {
                e.stopPropagation();
                archiveThought(thought.id);
            });
        }
        actionsContainer.appendChild(archiveButton);
        
        // Add "Show more" button if thought is truncated
        if (needsTruncation) {
            const toggleButton = document.createElement('button');
            toggleButton.type = 'button';
            toggleButton.className = 'toggle-text-btn';
            toggleButton.textContent = 'Show more';
            toggleButton.setAttribute('aria-label', 'Expand thought text');
            toggleButton.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleTextExpansion(textElement, toggleButton);
            });
            actionsContainer.appendChild(toggleButton);
        }
        
        footer.appendChild(actionsContainer);
        
        card.appendChild(textElement);
        if (tagsContainer) {
            card.appendChild(tagsContainer);
        }
        card.appendChild(footer);
        
        return card;
    }
    
    // ============================================
    // TEXT UTILITIES
    // ============================================
    
    /**
     * Truncates text to PREVIEW_CHAR_LIMIT and adds ellipsis.
     * @param {string} text - The text to truncate
     * @returns {string} Truncated text with ellipsis
     */
    function getTruncatedText(text) {
        return text.substring(0, PREVIEW_CHAR_LIMIT) + '...';
    }
    
    /**
     * Toggles between truncated and full text display for a thought card.
     * Updates button text and aria-label accordingly.
     * @param {HTMLElement} textElement - The paragraph element containing the thought text
     * @param {HTMLButtonElement} toggleButton - The "Show more/less" button
     */
    function toggleTextExpansion(textElement, toggleButton) {
        const isTruncated = textElement.dataset.truncated === 'true';
        const fullText = textElement.dataset.fullText;
        const searchQuery = textElement.dataset.searchQuery || '';
        
        // Safety check: if fullText is not available, do nothing
        if (!fullText) {
            return;
        }
        
        // Clear existing content
        textElement.innerHTML = '';
        
        if (isTruncated) {
            // Expand to full text
            if (searchQuery) {
                textElement.appendChild(highlightSearchText(fullText, searchQuery));
            } else {
                textElement.textContent = fullText;
            }
            textElement.dataset.truncated = 'false';
            toggleButton.textContent = 'Show less';
            toggleButton.setAttribute('aria-label', 'Collapse thought text');
        } else {
            // Collapse to truncated text
            const truncatedText = getTruncatedText(fullText);
            if (searchQuery) {
                textElement.appendChild(highlightSearchText(truncatedText, searchQuery));
            } else {
                textElement.textContent = truncatedText;
            }
            textElement.dataset.truncated = 'true';
            toggleButton.textContent = 'Show more';
            toggleButton.setAttribute('aria-label', 'Expand thought text');
        }
    }
    
    // ============================================
    // DATE FORMATTING
    // ============================================
    
    /**
     * Formats an ISO date string to short format (M.D.YY).
     * @param {string} isoString - ISO 8601 date string
     * @returns {string} Formatted date string (e.g., "1.15.24")
     */
    function formatDate(isoString) {
        const date = new Date(isoString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear().toString().slice(-2);
        return `${month}.${day}.${year}`;
    }
    
    /**
     * Formats an ISO date string to full date and time format.
     * Used for tooltip display of edit timestamps.
     * @param {string} isoString - ISO 8601 date string
     * @returns {string} Formatted date and time string (e.g., "1.15.24 at 3:45 PM")
     */
    function formatDateTime(isoString) {
        const date = new Date(isoString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear().toString().slice(-2);
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${month}.${day}.${year} at ${hour12}:${minutes} ${ampm}`;
    }
    
    // ============================================
    // TAG FILTER FUNCTIONS
    // ============================================
    
    /**
     * Collects all unique tags from all thoughts (active and archived).
     * Used to populate the tag filter UI.
     * @returns {string[]} Sorted array of unique tags
     */
    function getAllUniqueTags() {
        const thoughts = getThoughts();
        const allTags = new Set();
        
        thoughts.forEach(function(thought) {
            // Handle backward compatibility for thoughts without tags property
            const thoughtTags = thought.tags || extractTags(thought.text);
            if (thoughtTags && thoughtTags.length > 0) {
                thoughtTags.forEach(function(tag) {
                    allTags.add(tag);
                });
            }
        });
        
        // Sort tags alphabetically
        return Array.from(allTags).sort();
    }
    
    /**
     * Renders the tag filter button bar.
     * Shows "All" button plus a button for each unique tag.
     * Hides the container if no tags exist.
     */
    function renderTagFilter() {
        if (!tagFilterContainer) return;
        
        const allTags = getAllUniqueTags();
        
        // Clear current filter UI
        tagFilterContainer.innerHTML = '';
        
        // If no tags exist, hide the container
        if (allTags.length === 0) {
            tagFilterContainer.style.display = 'none';
            return;
        }
        
        tagFilterContainer.style.display = 'flex';
        
        // Add "All" button (clear filter)
        const allButton = document.createElement('button');
        allButton.type = 'button';
        allButton.className = 'filter-tag-btn' + (currentTagFilter === null ? ' active' : '');
        allButton.textContent = 'All';
        allButton.setAttribute('aria-label', 'Show all thoughts');
        allButton.setAttribute('aria-pressed', currentTagFilter === null ? 'true' : 'false');
        allButton.addEventListener('click', function() {
            clearTagFilter();
        });
        tagFilterContainer.appendChild(allButton);
        
        // Add a button for each unique tag
        allTags.forEach(function(tag) {
            const tagButton = document.createElement('button');
            tagButton.type = 'button';
            tagButton.className = 'filter-tag-btn' + (currentTagFilter === tag ? ' active' : '');
            tagButton.textContent = tag;
            tagButton.setAttribute('data-tag', tag);
            tagButton.setAttribute('aria-label', 'Filter by ' + tag);
            tagButton.setAttribute('aria-pressed', currentTagFilter === tag ? 'true' : 'false');
            tagButton.addEventListener('click', function() {
                filterByTag(tag);
            });
            tagFilterContainer.appendChild(tagButton);
        });
    }
    
    /**
     * Sets the active tag filter and re-renders thoughts.
     * @param {string} tag - The tag to filter by
     */
    function filterByTag(tag) {
        currentTagFilter = tag;
        loadThoughts();
        renderTagFilter();
    }
    
    /**
     * Clears the tag filter and shows all thoughts.
     */
    function clearTagFilter() {
        currentTagFilter = null;
        loadThoughts();
        renderTagFilter();
    }
    
    // ============================================
    // ARCHIVE TAG FILTER FUNCTIONS
    // ============================================
    
    /**
     * Renders the tag filter button bar for the archive view.
     * Shows "All" button plus a button for each unique tag in archived thoughts.
     * Hides the container if no tags exist.
     */
    function renderArchiveTagFilter() {
        if (!archiveTagFilterContainer) return;
        
        const thoughts = getThoughts();
        const archivedThoughts = thoughts.filter(t => t.archived === true);
        const allTags = new Set();
        
        archivedThoughts.forEach(function(thought) {
            const thoughtTags = thought.tags || extractTags(thought.text);
            if (thoughtTags && thoughtTags.length > 0) {
                thoughtTags.forEach(function(tag) {
                    allTags.add(tag);
                });
            }
        });
        
        const sortedTags = Array.from(allTags).sort();
        
        // Clear current filter UI
        archiveTagFilterContainer.innerHTML = '';
        
        // If no tags exist, hide the container
        if (sortedTags.length === 0) {
            archiveTagFilterContainer.style.display = 'none';
            return;
        }
        
        archiveTagFilterContainer.style.display = 'flex';
        
        // Add "All" button (clear filter)
        const allButton = document.createElement('button');
        allButton.type = 'button';
        allButton.className = 'filter-tag-btn' + (archiveTagFilter === null ? ' active' : '');
        allButton.textContent = 'All';
        allButton.setAttribute('aria-label', 'Show all archived thoughts');
        allButton.setAttribute('aria-pressed', archiveTagFilter === null ? 'true' : 'false');
        allButton.addEventListener('click', function() {
            clearArchiveTagFilter();
        });
        archiveTagFilterContainer.appendChild(allButton);
        
        // Add a button for each unique tag
        sortedTags.forEach(function(tag) {
            const tagButton = document.createElement('button');
            tagButton.type = 'button';
            tagButton.className = 'filter-tag-btn' + (archiveTagFilter === tag ? ' active' : '');
            tagButton.textContent = tag;
            tagButton.setAttribute('data-tag', tag);
            tagButton.setAttribute('aria-label', 'Filter by ' + tag);
            tagButton.setAttribute('aria-pressed', archiveTagFilter === tag ? 'true' : 'false');
            tagButton.addEventListener('click', function() {
                filterArchiveByTag(tag);
            });
            archiveTagFilterContainer.appendChild(tagButton);
        });
    }
    
    /**
     * Sets the active tag filter for archive view and re-renders archived thoughts.
     * @param {string} tag - The tag to filter by
     */
    function filterArchiveByTag(tag) {
        archiveTagFilter = tag;
        loadArchivedThoughts();
        renderArchiveTagFilter();
    }
    
    /**
     * Clears the archive tag filter and shows all archived thoughts.
     */
    function clearArchiveTagFilter() {
        archiveTagFilter = null;
        loadArchivedThoughts();
        renderArchiveTagFilter();
    }
    
    // ============================================
    // SEARCH FUNCTIONS
    // ============================================
    
    /**
     * Expands the search UI and focuses the input.
     * Adds click-outside listener for better performance.
     */
    function expandSearch() {
        if (isSearchExpanded) return;
        
        isSearchExpanded = true;
        searchSection.classList.remove('collapsed');
        searchToggleBtn.setAttribute('aria-expanded', 'true');
        
        // Add click-outside listener only when expanded
        document.addEventListener('click', handleClickOutside);
        
        // Auto-focus the input after the animation starts
        setTimeout(function() {
            searchInput.focus();
        }, 100);
    }
    
    /**
     * Collapses the search UI.
     * If there's an active search, it clears it first.
     * Removes click-outside listener for better performance.
     */
    function collapseSearch() {
        if (!isSearchExpanded) return;
        
        isSearchExpanded = false;
        searchSection.classList.add('collapsed');
        searchToggleBtn.setAttribute('aria-expanded', 'false');
        searchInput.blur();
        
        // Remove click-outside listener when collapsed
        document.removeEventListener('click', handleClickOutside);
        
        // Clear search if there's an active query
        if (currentSearchQuery) {
            clearSearch();
        }
    }
    
    /**
     * Handles search input changes.
     * Updates the search state and re-renders thoughts with matching results.
     */
    function handleSearch() {
        const query = searchInput.value.trim().toLowerCase();
        currentSearchQuery = query;
        
        // Update clear button visibility
        clearSearchBtn.style.display = query.length > 0 ? 'flex' : 'none';
        
        // Re-render thoughts with search filter
        loadThoughts();
    }
    
    /**
     * Clears the search input and resets search state.
     */
    function clearSearch() {
        searchInput.value = '';
        currentSearchQuery = '';
        clearSearchBtn.style.display = 'none';
        searchResultsCount.textContent = '';
        loadThoughts();
    }
    
    // ============================================
    // ARCHIVE SEARCH FUNCTIONS
    // ============================================
    
    /**
     * Handler for click-outside to collapse archive search.
     * @param {MouseEvent} e - The click event
     */
    function handleArchiveClickOutside(e) {
        if (archiveSearchSection && !archiveSearchSection.contains(e.target)) {
            collapseArchiveSearch();
        }
    }
    
    /**
     * Expands the archive search UI and focuses the input.
     * Adds click-outside listener for better performance.
     */
    function expandArchiveSearch() {
        if (!archiveSearchSection || isArchiveSearchExpanded) return;
        
        isArchiveSearchExpanded = true;
        archiveSearchSection.classList.remove('collapsed');
        archiveSearchToggleBtn.setAttribute('aria-expanded', 'true');
        
        // Add click-outside listener only when expanded
        document.addEventListener('click', handleArchiveClickOutside);
        
        // Auto-focus the input after the animation starts
        setTimeout(function() {
            if (archiveSearchInput) archiveSearchInput.focus();
        }, 100);
    }
    
    /**
     * Collapses the archive search UI.
     * If there's an active search, it clears it first.
     * Removes click-outside listener for better performance.
     */
    function collapseArchiveSearch() {
        if (!archiveSearchSection || !isArchiveSearchExpanded) return;
        
        isArchiveSearchExpanded = false;
        archiveSearchSection.classList.add('collapsed');
        archiveSearchToggleBtn.setAttribute('aria-expanded', 'false');
        if (archiveSearchInput) archiveSearchInput.blur();
        
        // Remove click-outside listener when collapsed
        document.removeEventListener('click', handleArchiveClickOutside);
        
        // Clear search if there's an active query
        if (archiveSearchQuery) {
            clearArchiveSearch();
        }
    }
    
    /**
     * Handles archive search input changes.
     * Updates the search state and re-renders archived thoughts with matching results.
     */
    function handleArchiveSearch() {
        if (!archiveSearchInput) return;
        const query = archiveSearchInput.value.trim().toLowerCase();
        archiveSearchQuery = query;
        
        // Update clear button visibility
        if (archiveClearSearchBtn) {
            archiveClearSearchBtn.style.display = query.length > 0 ? 'flex' : 'none';
        }
        
        // Re-render archived thoughts with search filter
        loadArchivedThoughts();
    }
    
    /**
     * Clears the archive search input and resets search state.
     */
    function clearArchiveSearch() {
        if (!archiveSearchInput) return;
        archiveSearchInput.value = '';
        archiveSearchQuery = '';
        if (archiveClearSearchBtn) archiveClearSearchBtn.style.display = 'none';
        if (archiveSearchResultsCount) archiveSearchResultsCount.textContent = '';
        loadArchivedThoughts();
    }
    
    /**
     * Escapes special regex characters in a string.
     * Prevents regex injection attacks when using user input in RegExp.
     * @param {string} string - The string to escape
     * @returns {string} The escaped string safe for use in RegExp
     */
    function escapeRegExp(string) {
        // Escape special regex characters to prevent regex injection
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * Creates a document fragment with highlighted search matches.
     * Wraps matching text in <mark> elements for visual highlighting.
     * @param {string} text - The full text to search within
     * @param {string} query - The search query to highlight
     * @returns {DocumentFragment} Fragment with highlighted text nodes
     */
    function highlightSearchText(text, query) {
        if (!query) {
            return document.createTextNode(text);
        }
        
        // Create a document fragment to hold the highlighted text
        const fragment = document.createDocumentFragment();
        const escapedQuery = escapeRegExp(query);
        const regex = new RegExp('(' + escapedQuery + ')', 'gi');
        const parts = text.split(regex);
        const lowerQuery = query.toLowerCase();
        
        parts.forEach(function(part) {
            if (part.toLowerCase() === lowerQuery) {
                const highlight = document.createElement('mark');
                highlight.className = 'search-highlight';
                highlight.textContent = part;
                fragment.appendChild(highlight);
            } else {
                fragment.appendChild(document.createTextNode(part));
            }
        });
        
        return fragment;
    }
    
    // Sidebar Navigation Logic
    // View Switching Logic
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            sidebarItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');

            // Get the view name from data attribute
            const viewName = item.getAttribute('data-view');

            // Show the selected view
            showView(viewName);
        });
    });

    // Show View Function
    function showView(viewName) {
        const views = document.querySelectorAll('.view-container');
        views.forEach(view => {
            if (view.id === `${viewName}-view`) {
                view.style.display = 'block';
            } else {
                view.style.display = 'none';
            }
        });
        localStorage.setItem('activeView', viewName);
        
        // Initialize constellation view when it becomes active
        if (viewName === 'constellation' && typeof window.initializeConstellation === 'function') {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                window.initializeConstellation();
            }, 100);
        }
        
        // Initialize insights view when it becomes active
        if (viewName === 'insights' && typeof window.initializeInsights === 'function') {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                window.initializeInsights();
            }, 100);
        }
        
        // Initialize analytics view when it becomes active
        if (viewName === 'analytics' && typeof window.initializeAnalytics === 'function') {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                window.initializeAnalytics();
            }, 100);
        }
        
        // Initialize archive view when it becomes active
        if (viewName === 'archive') {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                loadArchivedThoughts();
                renderArchiveTagFilter();
            }, 100);
        }
    }
    
    // Make showView and editThought globally accessible for constellation.js
    window.showView = showView;
    window.editThought = editThought;
});
