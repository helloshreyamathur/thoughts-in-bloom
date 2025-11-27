// Thoughts in Bloom - Main JavaScript
// A living digital garden where ideas grow and connect over time

document.addEventListener('DOMContentLoaded', function() {
    console.log('Thoughts in Bloom - Ready');
    
    // Constants
    const MAX_CHARS = 1000;
    const WARNING_THRESHOLD = 500;
    
    // Get references to DOM elements
    const thoughtInput = document.getElementById('thought-input');
    const saveButton = document.getElementById('save-button');
    const thoughtsContainer = document.getElementById('thoughts-container');
    const charCounter = document.getElementById('char-counter');
    const errorMessage = document.getElementById('error-message');
    
    // Load and display existing thoughts on page load
    loadThoughts();
    
    // Update character counter and button state on initial load
    updateCharCounter();
    
    // Add click event listener to save button
    saveButton.addEventListener('click', saveThought);
    
    // Add keyboard shortcut (Ctrl+Enter or Cmd+Enter to save)
    thoughtInput.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            saveThought();
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
        textElement.textContent = thought.text;
        
        const footer = document.createElement('div');
        footer.className = 'thought-footer';
        
        const dateElement = document.createElement('span');
        dateElement.className = 'thought-date';
        dateElement.textContent = formatDate(thought.date);
        
        footer.appendChild(dateElement);
        
        card.appendChild(textElement);
        card.appendChild(footer);
        
        return card;
    }
    
    function formatDate(isoString) {
        const date = new Date(isoString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear().toString().slice(-2);
        return `${month}.${day}.${year}`;
    }
});
