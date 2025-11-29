// Thoughts in Bloom - Main JavaScript
// A living digital garden where ideas grow and connect over time

document.addEventListener('DOMContentLoaded', function() {
    console.log('Thoughts in Bloom - Ready');
    
    // Constants
    const MAX_CHARS = 1000;
    const WARNING_THRESHOLD = 500;
    const PREVIEW_CHAR_LIMIT = 280;
    
    // Get references to DOM elements
    const thoughtInput = document.getElementById('thought-input');
    const saveButton = document.getElementById('save-button');
    const thoughtsContainer = document.getElementById('thoughts-container');
    const charCounter = document.getElementById('char-counter');
    const errorMessage = document.getElementById('error-message');
    const inputSection = document.querySelector('.input-section');
    const viewActiveBtn = document.getElementById('view-active');
    const viewArchivedBtn = document.getElementById('view-archived');
    const tagFilterContainer = document.getElementById('tag-filter-container');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const searchResultsCount = document.getElementById('search-results-count');
    
    // Edit mode state
    let currentEditingId = null;
    
    // View mode state: 'active' or 'archived'
    let currentViewMode = 'active';
    
    // Tag filter state: null means no filter, otherwise it's the tag to filter by
    let currentTagFilter = null;
    
    // Search state
    let currentSearchQuery = '';
    let searchDebounceTimer = null;
    
    // Load and display existing thoughts on page load
    loadThoughts();
    
    // Render tag filter UI
    renderTagFilter();
    
    // Update character counter and button state on initial load
    updateCharCounter();
    
    // Add click event listener to save button
    saveButton.addEventListener('click', handleSave);
    
    // Add keyboard shortcut (Ctrl+Enter or Cmd+Enter to save)
    thoughtInput.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleSave();
        }
        // ESC key to cancel edit mode
        if (e.key === 'Escape' && currentEditingId) {
            cancelEdit();
        }
    });
    
    // Add input event listener for character counter
    thoughtInput.addEventListener('input', updateCharCounter);
    
    // Add click event listeners for view toggle buttons
    viewActiveBtn.addEventListener('click', function() {
        setViewMode('active');
    });
    
    viewArchivedBtn.addEventListener('click', function() {
        setViewMode('archived');
    });
    
    // Add input event listener for search with debouncing
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
    
    // Add click event listener for clear search button
    clearSearchBtn.addEventListener('click', function() {
        clearSearch();
    });
    
    // Add keyboard shortcut (Escape to clear search when focused on search input)
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            clearSearch();
            searchInput.blur();
        }
    });
    
    function setViewMode(mode) {
        currentViewMode = mode;
        
        // Update button states
        if (mode === 'active') {
            viewActiveBtn.classList.add('active');
            viewActiveBtn.setAttribute('aria-pressed', 'true');
            viewArchivedBtn.classList.remove('active');
            viewArchivedBtn.setAttribute('aria-pressed', 'false');
        } else {
            viewArchivedBtn.classList.add('active');
            viewArchivedBtn.setAttribute('aria-pressed', 'true');
            viewActiveBtn.classList.remove('active');
            viewActiveBtn.setAttribute('aria-pressed', 'false');
        }
        
        // Cancel any edit mode when switching views
        if (currentEditingId) {
            cancelEdit();
        }
        
        // Re-render thoughts for the selected view
        loadThoughts();
    }
    
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
    
    function handleSave() {
        if (currentEditingId) {
            updateThought();
        } else {
            saveThought();
        }
    }
    
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
        
        // Save to localStorage
        localStorage.setItem('thoughts', JSON.stringify(thoughts));
        
        console.log('Thought saved:', thought);
        
        // Clear textarea and update counter
        thoughtInput.value = '';
        updateCharCounter();
        
        // Create and prepend new card with animation
        const card = createThoughtCard(thought, true);
        thoughtsContainer.prepend(card);
        
        // Refresh tag filter UI to include new tags
        renderTagFilter();
    }
    
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
        localStorage.setItem('thoughts', JSON.stringify(thoughts));
        
        console.log('Thought updated:', thoughts[thoughtIndex]);
        
        // Reset form to add mode
        cancelEdit();
        
        // Re-render all cards to show updated content
        loadThoughts();
        
        // Refresh tag filter UI to reflect any tag changes
        renderTagFilter();
    }
    
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
        localStorage.setItem('thoughts', JSON.stringify(thoughts));
        
        console.log('Thought archived:', thoughts[thoughtIndex]);
        
        // Re-render to remove from active view
        loadThoughts();
    }
    
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
        localStorage.setItem('thoughts', JSON.stringify(thoughts));
        
        console.log('Thought restored:', thoughts[thoughtIndex]);
        
        // Re-render to remove from archived view
        loadThoughts();
    }
    
    function getThoughts() {
        const stored = localStorage.getItem('thoughts');
        return stored ? JSON.parse(stored) : [];
    }
    
    function loadThoughts() {
        const thoughts = getThoughts();
        
        // Clear current display
        thoughtsContainer.innerHTML = '';
        
        // Filter based on current view mode
        // Note: !thought.archived handles both false and undefined (for backward compatibility)
        let filteredThoughts = thoughts.filter(function(thought) {
            if (currentViewMode === 'archived') {
                return thought.archived === true;
            } else {
                return !thought.archived;
            }
        });
        
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
        
        // Create card for each thought
        filteredThoughts.forEach(function(thought) {
            const card = createThoughtCard(thought);
            thoughtsContainer.appendChild(card);
        });
    }
    
    function createThoughtCard(thought, isNew = false) {
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
        
        const textElement = document.createElement('p');
        textElement.className = 'thought-text';
        
        const needsTruncation = thought.text.length > PREVIEW_CHAR_LIMIT;
        
        if (needsTruncation) {
            // Store full text in data attribute for toggling
            textElement.dataset.fullText = thought.text;
            textElement.dataset.truncated = 'true';
            // Apply search highlighting to truncated text
            const truncatedText = getTruncatedText(thought.text);
            if (currentSearchQuery) {
                textElement.appendChild(highlightSearchText(truncatedText, currentSearchQuery));
            } else {
                textElement.textContent = truncatedText;
            }
        } else {
            // Apply search highlighting to full text
            if (currentSearchQuery) {
                textElement.appendChild(highlightSearchText(thought.text, currentSearchQuery));
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
                tagElement.addEventListener('click', function(e) {
                    e.stopPropagation();
                    filterByTag(tag);
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
            archiveButton.addEventListener('click', function(e) {
                e.stopPropagation();
                restoreThought(thought.id);
            });
        } else {
            archiveButton.textContent = 'Archive';
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
    
    function getTruncatedText(text) {
        return text.substring(0, PREVIEW_CHAR_LIMIT) + '...';
    }
    
    function toggleTextExpansion(textElement, toggleButton) {
        const isTruncated = textElement.dataset.truncated === 'true';
        const fullText = textElement.dataset.fullText;
        
        // Safety check: if fullText is not available, do nothing
        if (!fullText) {
            return;
        }
        
        // Clear existing content
        textElement.innerHTML = '';
        
        if (isTruncated) {
            // Expand to full text
            if (currentSearchQuery) {
                textElement.appendChild(highlightSearchText(fullText, currentSearchQuery));
            } else {
                textElement.textContent = fullText;
            }
            textElement.dataset.truncated = 'false';
            toggleButton.textContent = 'Show less';
        } else {
            // Collapse to truncated text
            const truncatedText = getTruncatedText(fullText);
            if (currentSearchQuery) {
                textElement.appendChild(highlightSearchText(truncatedText, currentSearchQuery));
            } else {
                textElement.textContent = truncatedText;
            }
            textElement.dataset.truncated = 'true';
            toggleButton.textContent = 'Show more';
        }
    }
    
    function formatDate(isoString) {
        const date = new Date(isoString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear().toString().slice(-2);
        return `${month}.${day}.${year}`;
    }
    
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
            tagButton.addEventListener('click', function() {
                filterByTag(tag);
            });
            tagFilterContainer.appendChild(tagButton);
        });
    }
    
    function filterByTag(tag) {
        currentTagFilter = tag;
        loadThoughts();
        renderTagFilter();
    }
    
    function clearTagFilter() {
        currentTagFilter = null;
        loadThoughts();
        renderTagFilter();
    }
    
    function handleSearch() {
        const query = searchInput.value.trim().toLowerCase();
        currentSearchQuery = query;
        
        // Update clear button visibility
        clearSearchBtn.style.display = query.length > 0 ? 'flex' : 'none';
        
        // Re-render thoughts with search filter
        loadThoughts();
    }
    
    function clearSearch() {
        searchInput.value = '';
        currentSearchQuery = '';
        clearSearchBtn.style.display = 'none';
        searchResultsCount.textContent = '';
        loadThoughts();
    }
    
    function escapeRegExp(string) {
        // Escape special regex characters to prevent regex injection
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    function highlightSearchText(text, query) {
        if (!query) {
            return document.createTextNode(text);
        }
        
        // Create a document fragment to hold the highlighted text
        const fragment = document.createDocumentFragment();
        const escapedQuery = escapeRegExp(query);
        const regex = new RegExp('(' + escapedQuery + ')', 'gi');
        const parts = text.split(regex);
        
        parts.forEach(function(part) {
            if (part.toLowerCase() === query.toLowerCase()) {
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
});
