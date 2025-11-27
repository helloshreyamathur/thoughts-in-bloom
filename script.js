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
    
    // Edit mode state
    let currentEditingId = null;
    
    // Load and display existing thoughts on page load
    loadThoughts();
    
    // Update character counter and button state on initial load
    updateCharCounter();
    
    // Add click event listener to save button
    saveButton.addEventListener('click', handleSave);
    
    // Add keyboard shortcut (Ctrl+Enter or Cmd+Enter to save)
    thoughtInput.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleSave();
        }
    });
    
    // Add input event listener for character counter
    thoughtInput.addEventListener('input', updateCharCounter);
    
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
        
        // Create thought object
        const thought = {
            id: crypto.randomUUID(),
            text: text,
            date: new Date().toISOString(),
            tags: [],
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
        allCards.forEach(card => card.classList.remove('editing'));
        const editingCard = document.querySelector(`.thought-card[data-id="${thoughtId}"]`);
        if (editingCard) {
            editingCard.classList.add('editing');
        }
        
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
        
        // Update the thought - preserve original date, add updatedAt
        thoughts[thoughtIndex].text = text;
        thoughts[thoughtIndex].updatedAt = new Date().toISOString();
        
        // Save to localStorage
        localStorage.setItem('thoughts', JSON.stringify(thoughts));
        
        console.log('Thought updated:', thoughts[thoughtIndex]);
        
        // Reset form to add mode
        cancelEdit();
        
        // Re-render all cards to show updated content
        loadThoughts();
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
    
    function getThoughts() {
        const stored = localStorage.getItem('thoughts');
        return stored ? JSON.parse(stored) : [];
    }
    
    function loadThoughts() {
        const thoughts = getThoughts();
        
        // Clear current display
        thoughtsContainer.innerHTML = '';
        
        // Create card for each thought
        thoughts.forEach(function(thought) {
            if (!thought.archived) {
                const card = createThoughtCard(thought);
                thoughtsContainer.appendChild(card);
            }
        });
    }
    
    function createThoughtCard(thought, isNew = false) {
        const card = document.createElement('div');
        card.className = 'thought-card';
        if (isNew) {
            card.classList.add('slide-in');
        }
        card.dataset.id = thought.id;
        
        const textElement = document.createElement('p');
        textElement.className = 'thought-text';
        
        const needsTruncation = thought.text.length > PREVIEW_CHAR_LIMIT;
        
        if (needsTruncation) {
            // Store full text in data attribute for toggling
            textElement.dataset.fullText = thought.text;
            textElement.dataset.truncated = 'true';
            textElement.textContent = getTruncatedText(thought.text);
        } else {
            textElement.textContent = thought.text;
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
        
        // Add Edit button
        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', function(e) {
            e.stopPropagation();
            editThought(thought.id);
        });
        actionsContainer.appendChild(editButton);
        
        // Add "Show more" button if thought is truncated
        if (needsTruncation) {
            const toggleButton = document.createElement('button');
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
        
        if (isTruncated) {
            // Expand to full text
            textElement.textContent = fullText;
            textElement.dataset.truncated = 'false';
            toggleButton.textContent = 'Show less';
        } else {
            // Collapse to truncated text
            textElement.textContent = getTruncatedText(fullText);
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
});
