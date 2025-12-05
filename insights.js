/**
 * Thoughts in Bloom - Insights Module
 * 
 * @fileoverview Analysis and insights generation for thought patterns, connections, and discoveries.
 * Surfaces interesting patterns in the user's thought collection.
 * 
 * @version 1.0.0
 * @see https://github.com/helloshreyamathur/thoughts-in-bloom
 */

(function() {
    'use strict';

    // ============================================
    // CONSTANTS
    // ============================================
    
    const INSIGHTS_CACHE_KEY = 'insights_cache';
    const INSIGHTS_CACHE_TIMESTAMP_KEY = 'insights_cache_timestamp';
    const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
    const RECENT_DAYS = 7;
    const RECENT_MONTH = 30;
    const MIN_WORD_LENGTH = 4; // Minimum word length for analysis
    const PREVIEW_TEXT_LENGTH = 100; // Characters to show in connection previews
    
    // Common words to exclude from analysis (English stop words)
    const STOP_WORDS = new Set([
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
        'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
        'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
        'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
        'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
        'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
        'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
        'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
        'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
        'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had',
        'were', 'said', 'did', 'having', 'may', 'should'
    ]);

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize the insights view when it becomes active
     */
    function initializeInsights() {
        console.log('Initializing Insights view...');
        
        // Get or compute insights
        const insights = getInsights();
        
        // Render insights to the page
        renderInsights(insights);
    }

    // ============================================
    // CACHE MANAGEMENT
    // ============================================

    /**
     * Check if cached insights are still valid
     * @returns {boolean} True if cache is valid
     */
    function isCacheValid() {
        try {
            const timestamp = localStorage.getItem(INSIGHTS_CACHE_TIMESTAMP_KEY);
            if (!timestamp) return false;
            
            const age = Date.now() - parseInt(timestamp, 10);
            return age < CACHE_DURATION_MS;
        } catch (e) {
            console.error('Error checking cache validity:', e);
            return false;
        }
    }

    /**
     * Get cached insights if available and valid
     * @returns {Object|null} Cached insights or null
     */
    function getCachedInsights() {
        try {
            if (!isCacheValid()) return null;
            
            const cached = localStorage.getItem(INSIGHTS_CACHE_KEY);
            if (!cached) return null;
            
            return JSON.parse(cached);
        } catch (e) {
            console.error('Error reading cached insights:', e);
            return null;
        }
    }

    /**
     * Cache computed insights
     * @param {Object} insights - The insights to cache
     */
    function cacheInsights(insights) {
        try {
            localStorage.setItem(INSIGHTS_CACHE_KEY, JSON.stringify(insights));
            localStorage.setItem(INSIGHTS_CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (e) {
            console.error('Error caching insights:', e);
        }
    }

    /**
     * Invalidate insights cache
     * Should be called whenever thoughts are added, updated, or deleted
     */
    function invalidateInsightsCache() {
        try {
            localStorage.removeItem(INSIGHTS_CACHE_KEY);
            localStorage.removeItem(INSIGHTS_CACHE_TIMESTAMP_KEY);
            console.log('Insights cache invalidated');
        } catch (e) {
            console.error('Error invalidating insights cache:', e);
        }
    }

    // ============================================
    // DATA RETRIEVAL
    // ============================================

    /**
     * Get all thoughts from localStorage
     * @returns {Array} Array of thought objects
     */
    function getThoughts() {
        try {
            const stored = localStorage.getItem('thoughts');
            if (!stored) return [];
            const parsed = JSON.parse(stored);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Error reading thoughts:', e);
            return [];
        }
    }

    /**
     * Get only active (non-archived) thoughts
     * @returns {Array} Array of active thought objects
     */
    function getActiveThoughts() {
        return getThoughts().filter(t => !t.archived);
    }

    // ============================================
    // INSIGHTS COMPUTATION
    // ============================================

    /**
     * Get or compute all insights
     * @returns {Object} Complete insights object
     */
    function getInsights() {
        // Try to get from cache first
        const cached = getCachedInsights();
        if (cached) {
            console.log('Using cached insights');
            return cached;
        }

        console.log('Computing fresh insights...');
        const thoughts = getActiveThoughts();
        
        if (thoughts.length === 0) {
            return getEmptyInsights();
        }

        const insights = {
            patterns: computePatternInsights(thoughts),
            connections: computeConnectionInsights(thoughts),
            hiddenThemes: computeHiddenThemes(thoughts),
            thoughtEvolution: computeThoughtEvolution(thoughts),
            questionPatterns: computeQuestionPatterns(thoughts),
            moodAnalysis: computeMoodAnalysis(thoughts),
            meta: {
                totalThoughts: thoughts.length,
                computedAt: new Date().toISOString()
            }
        };

        // Cache the results
        cacheInsights(insights);
        
        return insights;
    }

    /**
     * Get empty insights structure for display when no thoughts exist
     * @returns {Object} Empty insights object
     */
    function getEmptyInsights() {
        return {
            patterns: { mostActive: [], recentThemes: [], emerging: [], dormant: [] },
            connections: { unexpected: [], clusters: [], standalone: [] },
            hiddenThemes: [],
            thoughtEvolution: [],
            questionPatterns: [],
            moodAnalysis: { overall: 'neutral', patterns: [] },
            meta: { totalThoughts: 0, computedAt: new Date().toISOString() }
        };
    }

    // ============================================
    // PATTERN DETECTION
    // ============================================

    /**
     * Compute pattern-related insights
     * @param {Array} thoughts - Array of thought objects
     * @returns {Object} Pattern insights
     */
    function computePatternInsights(thoughts) {
        const tagCounts = new Map();
        const tagFirstSeen = new Map();
        const tagLastSeen = new Map();
        const now = Date.now();

        // Analyze all tags
        thoughts.forEach(thought => {
            const thoughtDate = new Date(thought.date).getTime();
            const tags = thought.tags || [];
            
            tags.forEach(tag => {
                // Count occurrences
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                
                // Track first and last seen
                if (!tagFirstSeen.has(tag)) {
                    tagFirstSeen.set(tag, thoughtDate);
                }
                const currentLast = tagLastSeen.get(tag) || 0;
                if (thoughtDate > currentLast) {
                    tagLastSeen.set(tag, thoughtDate);
                }
            });
        });

        // Most Active Tags (top 10)
        const mostActive = Array.from(tagCounts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Recent Themes (tags used in last 7 days)
        const recentThreshold = now - (RECENT_DAYS * 24 * 60 * 60 * 1000);
        const recentThemes = Array.from(tagLastSeen.entries())
            .filter(([tag, lastSeen]) => lastSeen >= recentThreshold)
            .map(([tag, lastSeen]) => ({
                tag,
                count: tagCounts.get(tag),
                lastUsed: new Date(lastSeen).toISOString()
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Emerging Topics (new tags in last 30 days, but not in last 7)
        const monthThreshold = now - (RECENT_MONTH * 24 * 60 * 60 * 1000);
        const emerging = Array.from(tagFirstSeen.entries())
            .filter(([tag, firstSeen]) => {
                const lastSeen = tagLastSeen.get(tag);
                return firstSeen >= monthThreshold && lastSeen >= recentThreshold;
            })
            .map(([tag, firstSeen]) => ({
                tag,
                count: tagCounts.get(tag),
                firstUsed: new Date(firstSeen).toISOString()
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Dormant Topics (tags not used in last 30 days but used before)
        const dormant = Array.from(tagLastSeen.entries())
            .filter(([tag, lastSeen]) => lastSeen < monthThreshold)
            .map(([tag, lastSeen]) => ({
                tag,
                count: tagCounts.get(tag),
                lastUsed: new Date(lastSeen).toISOString()
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return { mostActive, recentThemes, emerging, dormant };
    }

    // ============================================
    // CONNECTION DISCOVERY
    // ============================================

    /**
     * Extract words from text for connection analysis
     * @param {string} text - The text to extract words from
     * @returns {Set} Set of normalized words
     */
    function extractWords(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(word));
        return new Set(words);
    }

    /**
     * Compute connection-related insights
     * @param {Array} thoughts - Array of thought objects
     * @returns {Object} Connection insights
     */
    function computeConnectionInsights(thoughts) {
        // Unexpected Links: thoughts sharing words but different tags
        const unexpected = [];
        
        for (let i = 0; i < thoughts.length; i++) {
            for (let j = i + 1; j < thoughts.length; j++) {
                const t1 = thoughts[i];
                const t2 = thoughts[j];
                
                const tags1 = new Set(t1.tags || []);
                const tags2 = new Set(t2.tags || []);
                
                // Check if they have different tags
                const hasCommonTags = [...tags1].some(tag => tags2.has(tag));
                if (hasCommonTags) continue;
                
                // Check if they share words
                const words1 = extractWords(t1.text);
                const words2 = extractWords(t2.text);
                const commonWords = [...words1].filter(word => words2.has(word));
                
                if (commonWords.length >= 2) {
                    unexpected.push({
                        thought1: { id: t1.id, text: t1.text.substring(0, PREVIEW_TEXT_LENGTH), tags: t1.tags },
                        thought2: { id: t2.id, text: t2.text.substring(0, PREVIEW_TEXT_LENGTH), tags: t2.tags },
                        commonWords: commonWords.slice(0, 5),
                        strength: commonWords.length
                    });
                }
            }
        }
        
        unexpected.sort((a, b) => b.strength - a.strength);

        // Tag Clusters: tags that often appear together
        const tagPairs = new Map();
        thoughts.forEach(thought => {
            const tags = thought.tags || [];
            for (let i = 0; i < tags.length; i++) {
                for (let j = i + 1; j < tags.length; j++) {
                    const pair = [tags[i], tags[j]].sort().join('|');
                    tagPairs.set(pair, (tagPairs.get(pair) || 0) + 1);
                }
            }
        });

        const clusters = Array.from(tagPairs.entries())
            .map(([pair, count]) => {
                const [tag1, tag2] = pair.split('|');
                return { tag1, tag2, count };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Standalone Thoughts: thoughts with no tags or unique tags
        const standalone = thoughts
            .filter(thought => {
                const tags = thought.tags || [];
                if (tags.length === 0) return true;
                
                // Check if all tags are unique (only used once)
                return tags.every(tag => {
                    const tagCount = thoughts.filter(t => 
                        (t.tags || []).includes(tag)
                    ).length;
                    return tagCount === 1;
                });
            })
            .map(thought => ({
                id: thought.id,
                text: thought.text.substring(0, PREVIEW_TEXT_LENGTH),
                date: thought.date
            }))
            .slice(0, 10);

        return { 
            unexpected: unexpected.slice(0, 5), 
            clusters, 
            standalone 
        };
    }

    // ============================================
    // HIDDEN THEMES DETECTION
    // ============================================

    /**
     * Detect hidden themes using word frequency and co-occurrence analysis
     * Finds implicit topics not explicitly captured by tags
     * @param {Array} thoughts - Array of thought objects
     * @returns {Array} Array of hidden theme insights
     */
    function computeHiddenThemes(thoughts) {
        if (thoughts.length < 5) return [];

        // Extract all words and their contexts
        const wordContexts = new Map(); // word -> array of thought indices
        
        thoughts.forEach((thought, idx) => {
            const words = extractWords(thought.text);
            words.forEach(word => {
                if (!wordContexts.has(word)) {
                    wordContexts.set(word, []);
                }
                wordContexts.get(word).push(idx);
            });
        });

        // Find words that appear in multiple thoughts but aren't tags
        const allTags = new Set();
        thoughts.forEach(t => (t.tags || []).forEach(tag => {
            // Remove # prefix and convert to lowercase for comparison
            const tagWord = tag.toLowerCase().replace(/^#/, '');
            allTags.add(tagWord);
        }));

        const themes = [];
        wordContexts.forEach((indices, word) => {
            if (indices.length >= 3 && !allTags.has(word)) {
                // Get co-occurring words
                const coOccurring = new Map();
                indices.forEach(idx => {
                    const thoughtWords = extractWords(thoughts[idx].text);
                    thoughtWords.forEach(w => {
                        if (w !== word) {
                            coOccurring.set(w, (coOccurring.get(w) || 0) + 1);
                        }
                    });
                });

                const topCoOccurring = Array.from(coOccurring.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([w]) => w);

                if (topCoOccurring.length > 0) {
                    themes.push({
                        theme: word,
                        relatedWords: topCoOccurring,
                        count: indices.length,
                        thoughtIds: indices.map(i => thoughts[i].id),
                        description: `"${word}" appears ${indices.length} times, often with: ${topCoOccurring.join(', ')}`
                    });
                }
            }
        });

        return themes.sort((a, b) => b.count - a.count).slice(0, 5);
    }

    // ============================================
    // THOUGHT EVOLUTION TRACKING
    // ============================================

    /**
     * Track how ideas and topics evolve over time
     * @param {Array} thoughts - Array of thought objects
     * @returns {Array} Array of evolution insights
     */
    function computeThoughtEvolution(thoughts) {
        if (thoughts.length < 10) return [];

        const evolutions = [];
        
        // Sort thoughts by date
        const sorted = [...thoughts].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Group by tags to track tag-based evolution
        const tagGroups = new Map();
        sorted.forEach(thought => {
            (thought.tags || []).forEach(tag => {
                if (!tagGroups.has(tag)) {
                    tagGroups.set(tag, []);
                }
                tagGroups.get(tag).push(thought);
            });
        });

        // Analyze each tag group with enough data
        tagGroups.forEach((groupThoughts, tag) => {
            if (groupThoughts.length >= 4) {
                // Split into early and late periods
                const midpoint = Math.floor(groupThoughts.length / 2);
                const early = groupThoughts.slice(0, midpoint);
                const late = groupThoughts.slice(midpoint);

                // Extract common words from each period
                const earlyWords = new Set();
                const lateWords = new Set();

                early.forEach(t => {
                    extractWords(t.text).forEach(w => earlyWords.add(w));
                });
                late.forEach(t => {
                    extractWords(t.text).forEach(w => lateWords.add(w));
                });

                // Find unique words in each period
                const uniqueToEarly = [...earlyWords].filter(w => !lateWords.has(w)).slice(0, 3);
                const uniqueToLate = [...lateWords].filter(w => !earlyWords.has(w)).slice(0, 3);

                if (uniqueToLate.length > 0) {
                    const firstDate = new Date(early[0].date).toLocaleDateString();
                    const lastDate = new Date(late[late.length - 1].date).toLocaleDateString();
                    
                    evolutions.push({
                        tag,
                        early: { date: firstDate, keywords: uniqueToEarly },
                        late: { date: lastDate, keywords: uniqueToLate },
                        description: `Your thinking on ${tag} evolved from "${uniqueToEarly.join(', ')}" to "${uniqueToLate.join(', ')}"`,
                        thoughtIds: groupThoughts.map(t => t.id)
                    });
                }
            }
        });

        return evolutions.slice(0, 3);
    }

    // ============================================
    // QUESTION PATTERNS
    // ============================================

    /**
     * Identify recurring questions and uncertainties
     * @param {Array} thoughts - Array of thought objects
     * @returns {Array} Array of question pattern insights
     */
    function computeQuestionPatterns(thoughts) {
        const questions = [];
        const questionWords = ['how', 'what', 'why', 'when', 'where', 'who', 'should', 'could', 'would'];

        thoughts.forEach(thought => {
            const text = thought.text.toLowerCase();
            const sentences = text.split(/[.!?]+/).filter(s => s.trim());
            
            sentences.forEach(sentence => {
                const trimmed = sentence.trim();
                if (trimmed.length > 10) {
                    const words = trimmed.split(/\s+/);
                    const hasQuestionWord = questionWords.some(qw => words.includes(qw));
                    const hasQuestionMark = thought.text.includes('?');
                    
                    if (hasQuestionWord || hasQuestionMark) {
                        questions.push({
                            text: trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : ''),
                            thoughtId: thought.id,
                            date: thought.date
                        });
                    }
                }
            });
        });

        // Group similar questions
        const grouped = new Map();
        questions.forEach(q => {
            const keywords = q.text.split(/\s+/).filter(w => 
                w.length > 4 && !STOP_WORDS.has(w.toLowerCase())
            );
            
            const key = keywords.slice(0, 2).join(' ');
            if (key && key.length > 3) {
                if (!grouped.has(key)) {
                    grouped.set(key, []);
                }
                grouped.get(key).push(q);
            }
        });

        const patterns = [];
        grouped.forEach((questions, key) => {
            if (questions.length >= 2) {
                patterns.push({
                    theme: key,
                    count: questions.length,
                    examples: questions.slice(0, 2),
                    description: `You've explored "${key}" ${questions.length} times`
                });
            }
        });

        return patterns.sort((a, b) => b.count - a.count).slice(0, 5);
    }

    // ============================================
    // MOOD & TONE ANALYSIS
    // ============================================

    /**
     * Analyze emotional patterns and tone in thoughts
     * @param {Array} thoughts - Array of thought objects
     * @returns {Object} Mood analysis insights
     */
    function computeMoodAnalysis(thoughts) {
        if (thoughts.length < 3) {
            return { overall: 'neutral', patterns: [] };
        }

        // Simple sentiment word lists
        const positiveWords = [
            'happy', 'joy', 'excited', 'love', 'great', 'wonderful', 'amazing', 
            'excellent', 'good', 'better', 'best', 'success', 'achieve', 'win',
            'grateful', 'thankful', 'appreciate', 'proud', 'hopeful', 'inspired'
        ];
        
        const negativeWords = [
            'sad', 'angry', 'frustrated', 'difficult', 'hard', 'problem', 'worry',
            'concerned', 'stress', 'anxious', 'fear', 'fail', 'lose', 'wrong',
            'bad', 'worse', 'worst', 'struggle', 'challenge', 'doubt'
        ];

        const reflectiveWords = [
            'think', 'realize', 'understand', 'learn', 'discover', 'reflect',
            'consider', 'wonder', 'question', 'explore', 'insight', 'perspective'
        ];

        let positiveCount = 0;
        let negativeCount = 0;
        let reflectiveCount = 0;

        const moodByThought = thoughts.map(thought => {
            const text = thought.text.toLowerCase();
            const words = text.split(/\s+/);
            
            let pos = 0, neg = 0, ref = 0;
            
            words.forEach(word => {
                if (positiveWords.includes(word)) pos++;
                if (negativeWords.includes(word)) neg++;
                if (reflectiveWords.includes(word)) ref++;
            });

            positiveCount += pos;
            negativeCount += neg;
            reflectiveCount += ref;

            let mood = 'neutral';
            if (ref > pos && ref > neg) mood = 'reflective';
            else if (pos > neg) mood = 'positive';
            else if (neg > pos) mood = 'questioning';

            return { thoughtId: thought.id, mood, date: thought.date };
        });

        const total = positiveCount + negativeCount + reflectiveCount;
        let overall = 'neutral';
        if (reflectiveCount > positiveCount && reflectiveCount > negativeCount) {
            overall = 'reflective';
        } else if (positiveCount > negativeCount) {
            overall = 'optimistic';
        } else if (negativeCount > positiveCount) {
            overall = 'questioning';
        }

        // Group by time periods
        const patterns = [];
        
        // Check weekend vs weekday mood
        const weekendThoughts = thoughts.filter(t => {
            const day = new Date(t.date).getDay();
            return day === 0 || day === 6;
        });
        
        if (weekendThoughts.length >= 2) {
            const weekendReflective = weekendThoughts.filter(t => {
                const mood = moodByThought.find(m => m.thoughtId === t.id);
                return mood && mood.mood === 'reflective';
            }).length;
            
            if (weekendReflective / weekendThoughts.length > 0.5) {
                patterns.push({
                    pattern: 'Weekend Reflection',
                    description: 'You tend to write more reflective thoughts on weekends'
                });
            }
        }

        if (positiveCount > negativeCount * 1.5) {
            patterns.push({
                pattern: 'Optimistic Tone',
                description: `Your thoughts lean positive (${Math.round((positiveCount / total) * 100)}% positive sentiment)`
            });
        }

        if (reflectiveCount > total * 0.4) {
            patterns.push({
                pattern: 'Deep Thinker',
                description: 'Your thoughts often explore ideas deeply and reflectively'
            });
        }

        return { overall, patterns };
    }

    // ============================================
    // RENDERING
    // ============================================

    /**
     * Render all insights to the page
     * @param {Object} insights - The insights to render
     */
    function renderInsights(insights) {
        const container = document.getElementById('insights-view');
        if (!container) {
            console.error('Insights container not found');
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Create main container
        const mainContent = document.createElement('div');
        mainContent.className = 'container';

        // Add header
        const header = document.createElement('div');
        header.className = 'insights-header';
        header.innerHTML = `
            <h1>Insights & <span class="bloom">Discoveries</span></h1>
            <p class="insights-subtitle">AI-powered discoveries and unique patterns from your ${insights.meta.totalThoughts} thoughts</p>
        `;
        mainContent.appendChild(header);

        // Check if no thoughts
        if (insights.meta.totalThoughts === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'insights-empty-state';
            emptyState.innerHTML = `
                <span class="empty-state-icon">🌱</span>
                <h3>No insights yet</h3>
                <p>Start capturing thoughts to see patterns and discoveries here!</p>
            `;
            mainContent.appendChild(emptyState);
            container.appendChild(mainContent);
            return;
        }

        // Create insights grid
        const grid = document.createElement('div');
        grid.className = 'insights-grid';

        // Render each category - focus on discoveries
        if (insights.hiddenThemes && insights.hiddenThemes.length > 0) {
            grid.appendChild(renderHiddenThemes(insights.hiddenThemes));
        }
        if (insights.thoughtEvolution && insights.thoughtEvolution.length > 0) {
            grid.appendChild(renderThoughtEvolution(insights.thoughtEvolution));
        }
        if (insights.questionPatterns && insights.questionPatterns.length > 0) {
            grid.appendChild(renderQuestionPatterns(insights.questionPatterns));
        }
        if (insights.moodAnalysis && insights.moodAnalysis.patterns.length > 0) {
            grid.appendChild(renderMoodAnalysis(insights.moodAnalysis));
        }
        grid.appendChild(renderConnectionInsights(insights.connections));
        grid.appendChild(renderPatternInsights(insights.patterns));

        mainContent.appendChild(grid);
        container.appendChild(mainContent);
    }

    /**
     * Render pattern insights section
     * @param {Object} patterns - Pattern insights data
     * @returns {HTMLElement} Pattern insights section
     */
    function renderPatternInsights(patterns) {
        const section = document.createElement('div');
        section.className = 'insight-section';
        
        const title = document.createElement('h2');
        title.className = 'insight-section-title';
        title.textContent = '🏷️ Tag Patterns';
        section.appendChild(title);

        // Most Active Tags
        if (patterns.mostActive.length > 0) {
            const card = createInsightCard(
                'Most Active Tags',
                `Your top ${patterns.mostActive.length} most-used tags`,
                'tag-list'
            );
            
            const list = document.createElement('div');
            list.className = 'tag-frequency-list';
            patterns.mostActive.forEach(item => {
                const tagItem = document.createElement('div');
                tagItem.className = 'tag-frequency-item';
                tagItem.innerHTML = `
                    <button class="tag-badge clickable" data-tag="${item.tag}">${item.tag}</button>
                    <span class="tag-count">${item.count} thoughts</span>
                `;
                list.appendChild(tagItem);
            });
            
            card.appendChild(list);
            section.appendChild(card);
        }

        // Recent Themes
        if (patterns.recentThemes.length > 0) {
            const card = createInsightCard(
                'Recent Themes',
                `Tags active in the last ${RECENT_DAYS} days`,
                'recent'
            );
            
            const list = document.createElement('div');
            list.className = 'tag-list-simple';
            patterns.recentThemes.slice(0, 5).forEach(item => {
                const tag = document.createElement('button');
                tag.className = 'tag-badge clickable';
                tag.setAttribute('data-tag', item.tag);
                tag.textContent = `${item.tag} (${item.count})`;
                list.appendChild(tag);
            });
            
            card.appendChild(list);
            section.appendChild(card);
        }

        // Emerging Topics
        if (patterns.emerging.length > 0) {
            const card = createInsightCard(
                'Emerging Topics',
                'New tags appearing recently',
                'emerging'
            );
            
            const list = document.createElement('div');
            list.className = 'tag-list-simple';
            patterns.emerging.forEach(item => {
                const tag = document.createElement('button');
                tag.className = 'tag-badge clickable';
                tag.setAttribute('data-tag', item.tag);
                tag.textContent = `${item.tag} (${item.count})`;
                list.appendChild(tag);
            });
            
            card.appendChild(list);
            section.appendChild(card);
        }

        // Dormant Topics
        if (patterns.dormant.length > 0) {
            const card = createInsightCard(
                'Dormant Topics',
                'Tags not used recently',
                'dormant'
            );
            
            const list = document.createElement('div');
            list.className = 'tag-list-simple';
            patterns.dormant.forEach(item => {
                const tag = document.createElement('button');
                tag.className = 'tag-badge clickable';
                tag.setAttribute('data-tag', item.tag);
                tag.textContent = item.tag;
                list.appendChild(tag);
            });
            
            card.appendChild(list);
            section.appendChild(card);
        }

        return section;
    }

    /**
     * Render hidden themes section
     * @param {Array} themes - Hidden themes data
     * @returns {HTMLElement} Hidden themes section
     */
    function renderHiddenThemes(themes) {
        const section = document.createElement('div');
        section.className = 'insight-section';
        
        const title = document.createElement('h2');
        title.className = 'insight-section-title';
        title.textContent = '🔍 Hidden Themes';
        section.appendChild(title);

        const card = createInsightCard(
            'Implicit Topics',
            'Recurring themes not captured by tags',
            'hidden-themes'
        );
        
        const list = document.createElement('div');
        list.className = 'discovery-list';
        
        themes.forEach(theme => {
            const item = document.createElement('div');
            item.className = 'discovery-item';
            item.innerHTML = `
                <div class="discovery-title">${theme.theme}</div>
                <div class="discovery-description">${theme.description}</div>
                <div class="discovery-meta">${theme.count} thoughts</div>
            `;
            list.appendChild(item);
        });
        
        card.appendChild(list);
        section.appendChild(card);
        
        return section;
    }

    /**
     * Render thought evolution section
     * @param {Array} evolutions - Evolution insights
     * @returns {HTMLElement} Evolution section
     */
    function renderThoughtEvolution(evolutions) {
        const section = document.createElement('div');
        section.className = 'insight-section';
        
        const title = document.createElement('h2');
        title.className = 'insight-section-title';
        title.textContent = '🌱 Thought Evolution';
        section.appendChild(title);

        const card = createInsightCard(
            'How Your Ideas Changed',
            'Track how your thinking evolved over time',
            'evolution'
        );
        
        const list = document.createElement('div');
        list.className = 'discovery-list';
        
        evolutions.forEach(evo => {
            const item = document.createElement('div');
            item.className = 'discovery-item evolution-item';
            item.innerHTML = `
                <div class="discovery-title">Evolution of ${evo.tag}</div>
                <div class="evolution-timeline">
                    <div class="evolution-period">
                        <span class="period-label">Early (${evo.early.date})</span>
                        <span class="period-keywords">${evo.early.keywords.join(', ')}</span>
                    </div>
                    <div class="evolution-arrow">→</div>
                    <div class="evolution-period">
                        <span class="period-label">Recent (${evo.late.date})</span>
                        <span class="period-keywords">${evo.late.keywords.join(', ')}</span>
                    </div>
                </div>
                <div class="discovery-description">${evo.description}</div>
            `;
            list.appendChild(item);
        });
        
        card.appendChild(list);
        section.appendChild(card);
        
        return section;
    }

    /**
     * Render question patterns section
     * @param {Array} patterns - Question pattern data
     * @returns {HTMLElement} Question patterns section
     */
    function renderQuestionPatterns(patterns) {
        const section = document.createElement('div');
        section.className = 'insight-section';
        
        const title = document.createElement('h2');
        title.className = 'insight-section-title';
        title.textContent = '❓ Recurring Questions';
        section.appendChild(title);

        const card = createInsightCard(
            'What You Keep Exploring',
            'Themes you question repeatedly',
            'questions'
        );
        
        const list = document.createElement('div');
        list.className = 'discovery-list';
        
        patterns.forEach(pattern => {
            const item = document.createElement('div');
            item.className = 'discovery-item';
            item.innerHTML = `
                <div class="discovery-title">${pattern.theme}</div>
                <div class="discovery-description">${pattern.description}</div>
                <div class="question-examples">
                    ${pattern.examples.map(ex => `<div class="question-example">"${ex.text}"</div>`).join('')}
                </div>
            `;
            list.appendChild(item);
        });
        
        card.appendChild(list);
        section.appendChild(card);
        
        return section;
    }

    /**
     * Render mood analysis section
     * @param {Object} mood - Mood analysis data
     * @returns {HTMLElement} Mood analysis section
     */
    function renderMoodAnalysis(mood) {
        const section = document.createElement('div');
        section.className = 'insight-section';
        
        const title = document.createElement('h2');
        title.className = 'insight-section-title';
        title.textContent = '💭 Mood & Tone';
        section.appendChild(title);

        const card = createInsightCard(
            'Emotional Patterns',
            `Overall tone: ${mood.overall}`,
            'mood'
        );
        
        const list = document.createElement('div');
        list.className = 'discovery-list';
        
        mood.patterns.forEach(pattern => {
            const item = document.createElement('div');
            item.className = 'discovery-item mood-item';
            item.innerHTML = `
                <div class="discovery-title">${pattern.pattern}</div>
                <div class="discovery-description">${pattern.description}</div>
            `;
            list.appendChild(item);
        });
        
        card.appendChild(list);
        section.appendChild(card);
        
        return section;
    }

    /**
     * Render connection insights section
     * @param {Object} connections - Connection insights data
     * @returns {HTMLElement} Connection insights section
     */
    function renderConnectionInsights(connections) {
        const section = document.createElement('div');
        section.className = 'insight-section';
        
        const title = document.createElement('h2');
        title.className = 'insight-section-title';
        title.textContent = '🔗 Connections';
        section.appendChild(title);

        // Tag Clusters
        if (connections.clusters.length > 0) {
            const card = createInsightCard(
                'Tag Clusters',
                'Tags that often appear together',
                'clusters'
            );
            
            const list = document.createElement('div');
            list.className = 'cluster-list';
            connections.clusters.slice(0, 5).forEach(item => {
                const cluster = document.createElement('div');
                cluster.className = 'cluster-item';
                cluster.innerHTML = `
                    <div class="cluster-tags">
                        <button class="tag-badge clickable" data-tag="${item.tag1}">${item.tag1}</button>
                        <span class="cluster-connector">+</span>
                        <button class="tag-badge clickable" data-tag="${item.tag2}">${item.tag2}</button>
                    </div>
                    <span class="cluster-count">${item.count} times</span>
                `;
                list.appendChild(cluster);
            });
            
            card.appendChild(list);
            section.appendChild(card);
        }

        // Unexpected Links
        if (connections.unexpected.length > 0) {
            const card = createInsightCard(
                'Unexpected Links',
                'Different topics sharing similar words',
                'unexpected'
            );
            
            const list = document.createElement('div');
            list.className = 'connection-list';
            connections.unexpected.forEach(item => {
                const link = document.createElement('div');
                link.className = 'connection-item';
                link.innerHTML = `
                    <div class="connection-thoughts">
                        <div class="connection-thought" data-thought-id="${item.thought1.id}">
                            "${item.thought1.text}..."
                            ${item.thought1.tags.map(t => `<span class="tag-badge-small">${t}</span>`).join('')}
                        </div>
                        <div class="connection-indicator">↔</div>
                        <div class="connection-thought" data-thought-id="${item.thought2.id}">
                            "${item.thought2.text}..."
                            ${item.thought2.tags.map(t => `<span class="tag-badge-small">${t}</span>`).join('')}
                        </div>
                    </div>
                    <div class="connection-words">Shared: ${item.commonWords.join(', ')}</div>
                `;
                list.appendChild(link);
            });
            
            card.appendChild(list);
            section.appendChild(card);
        }

        // Standalone Thoughts
        if (connections.standalone.length > 0) {
            const card = createInsightCard(
                'Standalone Thoughts',
                'Unique thoughts with no connections',
                'standalone'
            );
            
            const count = document.createElement('div');
            count.className = 'standalone-count';
            count.textContent = `${connections.standalone.length} standalone thoughts`;
            card.appendChild(count);
            section.appendChild(card);
        }

        return section;
    }

    /**
     * Create an insight card element
     * @param {string} title - Card title
     * @param {string} description - Card description
     * @param {string} type - Card type for styling
     * @returns {HTMLElement} Card element
     */
    function createInsightCard(title, description, type) {
        const card = document.createElement('div');
        card.className = `insight-card insight-card-${type}`;
        
        const header = document.createElement('div');
        header.className = 'insight-card-header';
        header.innerHTML = `
            <h3 class="insight-card-title">${title}</h3>
            <p class="insight-card-description">${description}</p>
        `;
        
        card.appendChild(header);
        return card;
    }

    // ============================================
    // EVENT HANDLING
    // ============================================

    /**
     * Handle click on tag badges to filter thoughts
     * Navigates to home view and triggers tag filter
     */
    function handleTagClick(tag) {
        console.log('Filtering by tag:', tag);
        
        // Switch to home view
        if (typeof window.showView === 'function') {
            window.showView('home');
        }
        
        // Wait for view to load, then filter using data attribute
        setTimeout(() => {
            // Find tag button by data-tag attribute for reliability
            const tagButtons = document.querySelectorAll('.filter-tag-btn[data-tag="' + tag + '"]');
            if (tagButtons.length > 0) {
                tagButtons[0].click();
            } else {
                // Fallback: search by text content
                const allButtons = document.querySelectorAll('.filter-tag-btn');
                allButtons.forEach(btn => {
                    if (btn.textContent.trim() === tag) {
                        btn.click();
                    }
                });
            }
        }, 100);
    }

    /**
     * Set up event listeners for insights view
     */
    function setupEventListeners() {
        // Delegate click events for tag badges
        document.addEventListener('click', function(e) {
            if (e.target.matches('.tag-badge.clickable')) {
                const tag = e.target.getAttribute('data-tag');
                if (tag) {
                    handleTagClick(tag);
                }
            }
        });
    }

    // ============================================
    // PUBLIC API
    // ============================================

    // Initialize when insights view becomes active
    if (typeof window !== 'undefined') {
        window.initializeInsights = initializeInsights;
        window.invalidateInsightsCache = invalidateInsightsCache;
        
        // Set up event listeners on page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupEventListeners);
        } else {
            setupEventListeners();
        }
    }

})();
