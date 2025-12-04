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
            temporal: computeTemporalInsights(thoughts),
            content: computeContentInsights(thoughts),
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
            temporal: { peakHours: [], productiveDays: [], streak: { current: 0, longest: 0 } },
            content: { avgLength: 0, uniqueWords: 0, mostUsed: [] },
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
    // TEMPORAL INSIGHTS
    // ============================================

    /**
     * Compute temporal pattern insights
     * @param {Array} thoughts - Array of thought objects
     * @returns {Object} Temporal insights
     */
    function computeTemporalInsights(thoughts) {
        const hourCounts = new Array(24).fill(0);
        const dayCounts = new Array(7).fill(0);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // Count by hour and day of week
        thoughts.forEach(thought => {
            const date = new Date(thought.date);
            hourCounts[date.getHours()]++;
            dayCounts[date.getDay()]++;
        });

        // Peak Thinking Hours (top 5)
        const peakHours = hourCounts
            .map((count, hour) => ({
                hour,
                hourLabel: formatHour(hour),
                count
            }))
            .filter(h => h.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Most Productive Days (top 3)
        const productiveDays = dayCounts
            .map((count, day) => ({
                day: dayNames[day],
                count
            }))
            .filter(d => d.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        // Thought Streaks (consecutive days with thoughts)
        const dates = thoughts
            .map(t => {
                const d = new Date(t.date);
                return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            })
            .sort((a, b) => b - a); // newest first

        const uniqueDates = [...new Set(dates)];
        
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 1;

        // Calculate current streak (from most recent date)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();
        const yesterday = todayTime - 24 * 60 * 60 * 1000;

        if (uniqueDates.length > 0) {
            const mostRecent = uniqueDates[0];
            if (mostRecent === todayTime || mostRecent === yesterday) {
                currentStreak = 1;
                for (let i = 1; i < uniqueDates.length; i++) {
                    const expectedPrev = uniqueDates[i - 1] - 24 * 60 * 60 * 1000;
                    if (uniqueDates[i] === expectedPrev) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }
        }

        // Calculate longest streak
        for (let i = 1; i < uniqueDates.length; i++) {
            const expectedPrev = uniqueDates[i - 1] - 24 * 60 * 60 * 1000;
            if (uniqueDates[i] === expectedPrev) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 1;
            }
        }
        
        longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

        return {
            peakHours,
            productiveDays,
            streak: { current: currentStreak, longest: longestStreak }
        };
    }

    /**
     * Format hour in 12-hour format
     * @param {number} hour - Hour in 24-hour format (0-23)
     * @returns {string} Formatted hour string
     */
    function formatHour(hour) {
        if (hour === 0) return '12 AM';
        if (hour < 12) return hour + ' AM';
        if (hour === 12) return '12 PM';
        return (hour - 12) + ' PM';
    }

    // ============================================
    // CONTENT ANALYSIS
    // ============================================

    /**
     * Compute content analysis insights
     * @param {Array} thoughts - Array of thought objects
     * @returns {Object} Content insights
     */
    function computeContentInsights(thoughts) {
        // Average thought length
        const totalLength = thoughts.reduce((sum, t) => sum + t.text.length, 0);
        const avgLength = thoughts.length > 0 ? Math.round(totalLength / thoughts.length) : 0;

        // Vocabulary diversity (unique words)
        const allWords = new Set();
        const wordCounts = new Map();

        thoughts.forEach(thought => {
            const words = extractWords(thought.text);
            words.forEach(word => {
                allWords.add(word);
                wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
            });
        });

        // Most used words (top 20)
        const mostUsed = Array.from(wordCounts.entries())
            .map(([word, count]) => ({ word, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);

        return {
            avgLength,
            uniqueWords: allWords.size,
            mostUsed
        };
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
        mainContent.className = 'insights-container';

        // Add header
        const header = document.createElement('div');
        header.className = 'insights-header';
        header.innerHTML = `
            <h1>Insights & <span class="bloom">Discoveries</span></h1>
            <p class="insights-subtitle">Patterns, connections, and discoveries from your ${insights.meta.totalThoughts} thoughts</p>
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

        // Render each category
        grid.appendChild(renderPatternInsights(insights.patterns));
        grid.appendChild(renderTemporalInsights(insights.temporal));
        grid.appendChild(renderContentInsights(insights.content));
        grid.appendChild(renderConnectionInsights(insights.connections));

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
     * Render temporal insights section
     * @param {Object} temporal - Temporal insights data
     * @returns {HTMLElement} Temporal insights section
     */
    function renderTemporalInsights(temporal) {
        const section = document.createElement('div');
        section.className = 'insight-section';
        
        const title = document.createElement('h2');
        title.className = 'insight-section-title';
        title.textContent = '⏰ Time Patterns';
        section.appendChild(title);

        // Thought Streaks
        const streakCard = createInsightCard(
            'Thought Streaks',
            'Your thinking consistency',
            'streak'
        );
        
        const streakContent = document.createElement('div');
        streakContent.className = 'streak-display';
        streakContent.innerHTML = `
            <div class="metric-row">
                <div class="metric-item">
                    <div class="metric-value">${temporal.streak.current}</div>
                    <div class="metric-label">Current Streak</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${temporal.streak.longest}</div>
                    <div class="metric-label">Longest Streak</div>
                </div>
            </div>
        `;
        streakCard.appendChild(streakContent);
        section.appendChild(streakCard);

        // Peak Hours
        if (temporal.peakHours.length > 0) {
            const card = createInsightCard(
                'Peak Thinking Times',
                'When you capture most thoughts',
                'peak-hours'
            );
            
            const chart = document.createElement('div');
            chart.className = 'bar-chart';
            const maxCount = temporal.peakHours[0].count;
            
            temporal.peakHours.forEach(item => {
                const barContainer = document.createElement('div');
                barContainer.className = 'bar-container';
                
                const barWidth = (item.count / maxCount) * 100;
                barContainer.innerHTML = `
                    <div class="bar-label">${item.hourLabel}</div>
                    <div class="bar-wrapper">
                        <div class="bar" style="width: ${barWidth}%"></div>
                        <span class="bar-value">${item.count}</span>
                    </div>
                `;
                chart.appendChild(barContainer);
            });
            
            card.appendChild(chart);
            section.appendChild(card);
        }

        // Productive Days
        if (temporal.productiveDays.length > 0) {
            const card = createInsightCard(
                'Most Productive Days',
                'Days with highest thought activity',
                'productive-days'
            );
            
            const chart = document.createElement('div');
            chart.className = 'bar-chart';
            const maxCount = temporal.productiveDays[0].count;
            
            temporal.productiveDays.forEach(item => {
                const barContainer = document.createElement('div');
                barContainer.className = 'bar-container';
                
                const barWidth = (item.count / maxCount) * 100;
                barContainer.innerHTML = `
                    <div class="bar-label">${item.day}</div>
                    <div class="bar-wrapper">
                        <div class="bar" style="width: ${barWidth}%"></div>
                        <span class="bar-value">${item.count}</span>
                    </div>
                `;
                chart.appendChild(barContainer);
            });
            
            card.appendChild(chart);
            section.appendChild(card);
        }

        return section;
    }

    /**
     * Render content insights section
     * @param {Object} content - Content insights data
     * @returns {HTMLElement} Content insights section
     */
    function renderContentInsights(content) {
        const section = document.createElement('div');
        section.className = 'insight-section';
        
        const title = document.createElement('h2');
        title.className = 'insight-section-title';
        title.textContent = '📝 Content Analysis';
        section.appendChild(title);

        // Writing Metrics
        const metricsCard = createInsightCard(
            'Writing Metrics',
            'Your thought characteristics',
            'metrics'
        );
        
        const metricsContent = document.createElement('div');
        metricsContent.className = 'metric-row';
        metricsContent.innerHTML = `
            <div class="metric-item">
                <div class="metric-value">${content.avgLength}</div>
                <div class="metric-label">Avg. Length</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${content.uniqueWords}</div>
                <div class="metric-label">Unique Words</div>
            </div>
        `;
        metricsCard.appendChild(metricsContent);
        section.appendChild(metricsCard);

        // Most Used Words
        if (content.mostUsed.length > 0) {
            const card = createInsightCard(
                'Most Used Words',
                'Your frequently used vocabulary',
                'word-cloud'
            );
            
            const wordCloud = document.createElement('div');
            wordCloud.className = 'word-cloud';
            
            const maxCount = content.mostUsed[0].count;
            content.mostUsed.slice(0, 15).forEach(item => {
                const word = document.createElement('span');
                word.className = 'word-cloud-item';
                const size = 0.8 + (item.count / maxCount) * 1.2; // Scale from 0.8 to 2.0
                word.style.fontSize = size + 'em';
                word.textContent = item.word;
                word.title = `Used ${item.count} times`;
                wordCloud.appendChild(word);
            });
            
            card.appendChild(wordCloud);
            section.appendChild(card);
        }

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
        
        // Set up event listeners on page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupEventListeners);
        } else {
            setupEventListeners();
        }
    }

})();
