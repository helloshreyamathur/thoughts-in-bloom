/**
 * Thoughts in Bloom - Analytics Module
 * 
 * @fileoverview Statistical metrics and analytics for thought patterns.
 * Shows time-based metrics, productivity stats, and content statistics.
 * 
 * @version 1.0.0
 * @see https://github.com/helloshreyamathur/thoughts-in-bloom
 */

(function() {
    'use strict';

    // ============================================
    // CONSTANTS
    // ============================================
    
    const ANALYTICS_CACHE_KEY = 'analytics_cache';
    const ANALYTICS_CACHE_TIMESTAMP_KEY = 'analytics_cache_timestamp';
    const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
    const MIN_WORD_LENGTH = 4;
    
    // Common words to exclude from analysis
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
     * Initialize the analytics view when it becomes active
     */
    function initializeAnalytics() {
        console.log('Initializing Analytics view...');
        
        const analytics = getAnalytics();
        renderAnalytics(analytics);
    }

    // ============================================
    // CACHE MANAGEMENT
    // ============================================

    function isCacheValid() {
        try {
            const timestamp = localStorage.getItem(ANALYTICS_CACHE_TIMESTAMP_KEY);
            if (!timestamp) return false;
            
            const age = Date.now() - parseInt(timestamp, 10);
            return age < CACHE_DURATION_MS;
        } catch (e) {
            console.error('Error checking cache validity:', e);
            return false;
        }
    }

    function getCachedAnalytics() {
        try {
            if (!isCacheValid()) return null;
            
            const cached = localStorage.getItem(ANALYTICS_CACHE_KEY);
            if (!cached) return null;
            
            return JSON.parse(cached);
        } catch (e) {
            console.error('Error reading cached analytics:', e);
            return null;
        }
    }

    function cacheAnalytics(analytics) {
        try {
            localStorage.setItem(ANALYTICS_CACHE_KEY, JSON.stringify(analytics));
            localStorage.setItem(ANALYTICS_CACHE_TIMESTAMP_KEY, Date.now().toString());
        } catch (e) {
            console.error('Error caching analytics:', e);
        }
    }

    function invalidateAnalyticsCache() {
        try {
            localStorage.removeItem(ANALYTICS_CACHE_KEY);
            localStorage.removeItem(ANALYTICS_CACHE_TIMESTAMP_KEY);
            console.log('Analytics cache invalidated');
        } catch (e) {
            console.error('Error invalidating analytics cache:', e);
        }
    }

    // ============================================
    // DATA RETRIEVAL
    // ============================================

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

    function getActiveThoughts() {
        return getThoughts().filter(t => !t.archived);
    }

    // ============================================
    // ANALYTICS COMPUTATION
    // ============================================

    function getAnalytics() {
        const cached = getCachedAnalytics();
        if (cached) {
            console.log('Using cached analytics');
            return cached;
        }

        console.log('Computing fresh analytics...');
        const thoughts = getActiveThoughts();
        
        if (thoughts.length === 0) {
            return getEmptyAnalytics();
        }

        const analytics = {
            temporal: computeTemporalAnalytics(thoughts),
            content: computeContentAnalytics(thoughts),
            productivity: computeProductivityAnalytics(thoughts),
            meta: {
                totalThoughts: thoughts.length,
                computedAt: new Date().toISOString()
            }
        };

        cacheAnalytics(analytics);
        return analytics;
    }

    function getEmptyAnalytics() {
        return {
            temporal: { peakHours: [], productiveDays: [] },
            content: { avgLength: 0, uniqueWords: 0, mostUsed: [] },
            productivity: { streak: { current: 0, longest: 0 }, thoughtsByDay: [] },
            meta: { totalThoughts: 0, computedAt: new Date().toISOString() }
        };
    }

    // ============================================
    // TEMPORAL ANALYTICS
    // ============================================

    function computeTemporalAnalytics(thoughts) {
        const hourCounts = new Array(24).fill(0);
        const dayCounts = new Array(7).fill(0);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        thoughts.forEach(thought => {
            const date = new Date(thought.date);
            hourCounts[date.getHours()]++;
            dayCounts[date.getDay()]++;
        });

        const peakHours = hourCounts
            .map((count, hour) => ({
                hour,
                hourLabel: formatHour(hour),
                count
            }))
            .filter(h => h.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const productiveDays = dayCounts
            .map((count, day) => ({
                day: dayNames[day],
                count
            }))
            .filter(d => d.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        return { peakHours, productiveDays };
    }

    function formatHour(hour) {
        if (hour === 0) return '12 AM';
        if (hour < 12) return hour + ' AM';
        if (hour === 12) return '12 PM';
        return (hour - 12) + ' PM';
    }

    // ============================================
    // CONTENT ANALYTICS
    // ============================================

    function computeContentAnalytics(thoughts) {
        const totalLength = thoughts.reduce((sum, t) => sum + t.text.length, 0);
        const avgLength = thoughts.length > 0 ? Math.round(totalLength / thoughts.length) : 0;

        const allWords = new Set();
        const wordCounts = new Map();

        thoughts.forEach(thought => {
            const words = extractWords(thought.text);
            words.forEach(word => {
                allWords.add(word);
                wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
            });
        });

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

    function extractWords(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(word));
        return new Set(words);
    }

    // ============================================
    // PRODUCTIVITY ANALYTICS
    // ============================================

    function computeProductivityAnalytics(thoughts) {
        const dates = thoughts
            .map(t => {
                const d = new Date(t.date);
                return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            })
            .sort((a, b) => b - a);

        const uniqueDates = [...new Set(dates)];
        
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 1;

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

        // Thoughts by day (last 30 days)
        const thirtyDaysAgo = todayTime - (30 * 24 * 60 * 60 * 1000);
        const thoughtsByDay = [];
        for (let i = 0; i < 30; i++) {
            const dayTime = todayTime - (i * 24 * 60 * 60 * 1000);
            const count = uniqueDates.filter(d => d === dayTime).length > 0 ? 
                thoughts.filter(t => {
                    const d = new Date(t.date);
                    const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                    return dTime === dayTime;
                }).length : 0;
            
            thoughtsByDay.unshift({
                date: new Date(dayTime).toISOString().split('T')[0],
                count
            });
        }

        return {
            streak: { current: currentStreak, longest: longestStreak },
            thoughtsByDay
        };
    }

    // ============================================
    // RENDERING
    // ============================================

    function renderAnalytics(analytics) {
        const container = document.getElementById('analytics-view');
        if (!container) {
            console.error('Analytics container not found');
            return;
        }

        container.innerHTML = '';

        const mainContent = document.createElement('div');
        mainContent.className = 'analytics-container';

        const header = document.createElement('div');
        header.className = 'analytics-header';
        header.innerHTML = `
            <h1>Analytics & <span class="bloom">Metrics</span></h1>
            <p class="analytics-subtitle">Statistical insights from your ${analytics.meta.totalThoughts} thoughts</p>
        `;
        mainContent.appendChild(header);

        if (analytics.meta.totalThoughts === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'analytics-empty-state';
            emptyState.innerHTML = `
                <span class="empty-state-icon">📊</span>
                <h3>No analytics yet</h3>
                <p>Start capturing thoughts to see statistics here!</p>
            `;
            mainContent.appendChild(emptyState);
            container.appendChild(mainContent);
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'analytics-grid';

        grid.appendChild(renderProductivitySection(analytics.productivity));
        grid.appendChild(renderTemporalSection(analytics.temporal));
        grid.appendChild(renderContentSection(analytics.content));

        mainContent.appendChild(grid);
        container.appendChild(mainContent);
    }

    function renderProductivitySection(productivity) {
        const section = document.createElement('div');
        section.className = 'analytics-section';
        
        const title = document.createElement('h2');
        title.className = 'analytics-section-title';
        title.textContent = '📈 Productivity';
        section.appendChild(title);

        const streakCard = createAnalyticsCard(
            'Thought Streaks',
            'Your consistency in capturing thoughts',
            'streak'
        );
        
        const streakContent = document.createElement('div');
        streakContent.className = 'streak-display';
        streakContent.innerHTML = `
            <div class="metric-row">
                <div class="metric-item">
                    <div class="metric-value">${productivity.streak.current}</div>
                    <div class="metric-label">Current Streak (days)</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${productivity.streak.longest}</div>
                    <div class="metric-label">Longest Streak (days)</div>
                </div>
            </div>
        `;
        streakCard.appendChild(streakContent);
        section.appendChild(streakCard);

        return section;
    }

    function renderTemporalSection(temporal) {
        const section = document.createElement('div');
        section.className = 'analytics-section';
        
        const title = document.createElement('h2');
        title.className = 'analytics-section-title';
        title.textContent = '⏰ Time Patterns';
        section.appendChild(title);

        if (temporal.peakHours.length > 0) {
            const card = createAnalyticsCard(
                'Peak Thinking Times',
                'Hours when you capture most thoughts',
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

        if (temporal.productiveDays.length > 0) {
            const card = createAnalyticsCard(
                'Most Productive Days',
                'Days of the week with highest activity',
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

    function renderContentSection(content) {
        const section = document.createElement('div');
        section.className = 'analytics-section';
        
        const title = document.createElement('h2');
        title.className = 'analytics-section-title';
        title.textContent = '📝 Content Metrics';
        section.appendChild(title);

        const metricsCard = createAnalyticsCard(
            'Writing Statistics',
            'Your thought characteristics',
            'metrics'
        );
        
        const metricsContent = document.createElement('div');
        metricsContent.className = 'metric-row';
        metricsContent.innerHTML = `
            <div class="metric-item">
                <div class="metric-value">${content.avgLength}</div>
                <div class="metric-label">Avg. Chars per Thought</div>
            </div>
            <div class="metric-item">
                <div class="metric-value">${content.uniqueWords}</div>
                <div class="metric-label">Unique Words</div>
            </div>
        `;
        metricsCard.appendChild(metricsContent);
        section.appendChild(metricsCard);

        if (content.mostUsed.length > 0) {
            const card = createAnalyticsCard(
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
                const size = 0.8 + (item.count / maxCount) * 1.2;
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

    function createAnalyticsCard(title, description, type) {
        const card = document.createElement('div');
        card.className = `analytics-card analytics-card-${type}`;
        
        const header = document.createElement('div');
        header.className = 'analytics-card-header';
        header.innerHTML = `
            <h3 class="analytics-card-title">${title}</h3>
            <p class="analytics-card-description">${description}</p>
        `;
        
        card.appendChild(header);
        return card;
    }

    // ============================================
    // PUBLIC API
    // ============================================

    if (typeof window !== 'undefined') {
        window.initializeAnalytics = initializeAnalytics;
        window.invalidateAnalyticsCache = invalidateAnalyticsCache;
    }

})();
