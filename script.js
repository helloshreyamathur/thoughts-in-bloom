// Thoughts in Bloom - Main JavaScript
// A living digital garden where ideas grow and connect over time

document.addEventListener('DOMContentLoaded', function() {
    console.log('Thoughts in Bloom - Ready');
    
    // Get references to DOM elements
    const thoughtInput = document.getElementById('thought-input');
    const saveButton = document.getElementById('save-button');
    const thoughtsContainer = document.getElementById('thoughts-container');
    
    // Load and display existing thoughts on page load
    loadThoughts();
    
    // Add click event listener to save button
    saveButton.addEventListener('click', saveThought);
    
    // Add keyboard shortcut (Ctrl+Enter to save)
    thoughtInput.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            saveThought();
        }
    });
    
    function saveThought() {
        const text = thoughtInput.value.trim();
        
        // Don't save empty thoughts
        if (!text) {
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
        
        // Clear textarea
        thoughtInput.value = '';
        
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
        
        const dateElement = document.createElement('span');
        dateElement.className = 'thought-date';
        dateElement.textContent = formatDate(thought.date);
        
        card.appendChild(textElement);
        card.appendChild(dateElement);
        
        return card;
    }
    
    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }
});
