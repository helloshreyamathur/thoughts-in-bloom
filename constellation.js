/**
 * Constellation View - Interactive Thought Network Visualization
 * Uses D3.js for force-directed graph layout
 */

// Wait for DOM and D3 to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on constellation view
    const constellationView = document.getElementById('constellation-view');
    if (!constellationView) return;
    
    // ============================================
    // CONSTELLATION STATE
    // ============================================
    
    let svg, g, simulation;
    let nodes = [], links = [];
    let connectionStrength = 0.2; // 20% threshold
    let currentLayout = 'force';
    let highlightedNodes = new Set();
    let selectedNode = null;
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    /**
     * Initialize the constellation view when it becomes active
     */
    window.initializeConstellation = function() {
        console.log('Initializing Constellation View');
        
        // Clear any existing SVG
        d3.select('#constellation-container').selectAll('*').remove();
        
        // Setup the visualization
        setupConstellationCanvas();
        loadConstellationData();
        setupEventListeners();
    };
    
    /**
     * Setup the SVG canvas and D3 force simulation
     */
    function setupConstellationCanvas() {
        // Check if D3 is available
        if (typeof d3 === 'undefined') {
            console.error('D3.js library is not loaded. Please check your internet connection.');
            showD3ErrorMessage();
            return;
        }
        
        const container = d3.select('#constellation-container');
        const width = container.node().offsetWidth;
        const height = container.node().offsetHeight;
        
        // Create SVG element
        svg = container.append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);
        
        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.5, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
        
        svg.call(zoom);
        
        // Create container group for zooming/panning
        g = svg.append('g');
        
        // Initialize force simulation
        simulation = d3.forceSimulation()
            .force('link', d3.forceLink().id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(40));
    }
    
    /**
     * Load thoughts data and calculate connections
     */
    function loadConstellationData() {
        const thoughts = getThoughts();
        
        // Filter out archived thoughts
        const activeThoughts = thoughts.filter(t => !t.archived);
        
        if (activeThoughts.length === 0) {
            showEmptyConstellation();
            return;
        }
        
        // Convert thoughts to nodes
        nodes = activeThoughts.map(thought => ({
            id: thought.id,
            text: thought.text,
            tags: thought.tags || [],
            date: thought.date,
            connections: 0
        }));
        
        // Calculate connections between nodes based on similarity
        links = calculateConnections(nodes);
        
        // Update connection counts
        links.forEach(link => {
            const sourceNode = nodes.find(n => n.id === link.source.id || n.id === link.source);
            const targetNode = nodes.find(n => n.id === link.target.id || n.id === link.target);
            if (sourceNode) sourceNode.connections++;
            if (targetNode) targetNode.connections++;
        });
        
        // Render the graph
        renderGraph();
    }
    
    /**
     * Calculate connections between thoughts based on shared tags and text similarity
     * @param {Array} nodes - Array of thought nodes
     * @returns {Array} Array of link objects
     */
    function calculateConnections(nodes) {
        const connections = [];
        
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const strength = calculateSimilarity(nodes[i], nodes[j]);
                
                if (strength >= connectionStrength) {
                    connections.push({
                        source: nodes[i].id,
                        target: nodes[j].id,
                        strength: strength
                    });
                }
            }
        }
        
        return connections;
    }
    
    /**
     * Calculate similarity between two thoughts
     * Uses Jaccard similarity for tags and text overlap
     * @param {Object} node1 - First thought node
     * @param {Object} node2 - Second thought node
     * @returns {number} Similarity score between 0 and 1
     */
    function calculateSimilarity(node1, node2) {
        let score = 0;
        
        // Tag similarity (weighted 60%)
        if (node1.tags.length > 0 && node2.tags.length > 0) {
            const tags1 = new Set(node1.tags);
            const tags2 = new Set(node2.tags);
            const intersection = new Set([...tags1].filter(x => tags2.has(x)));
            const union = new Set([...tags1, ...tags2]);
            
            const tagScore = intersection.size / union.size;
            score += tagScore * 0.6;
        }
        
        // Text similarity (weighted 40%) - simple word overlap
        const words1 = new Set(node1.text.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        const words2 = new Set(node2.text.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        const wordIntersection = new Set([...words1].filter(x => words2.has(x)));
        const wordUnion = new Set([...words1, ...words2]);
        
        if (wordUnion.size > 0) {
            const textScore = wordIntersection.size / wordUnion.size;
            score += textScore * 0.4;
        }
        
        return score;
    }
    
    /**
     * Render the graph with D3
     */
    function renderGraph() {
        // Clear existing elements
        g.selectAll('*').remove();
        
        // Apply current layout
        if (currentLayout === 'force') {
            applyForceLayout();
        } else if (currentLayout === 'circular') {
            applyCircularLayout();
        } else if (currentLayout === 'hierarchical') {
            applyHierarchicalLayout();
        }
        
        // Create links (lines)
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('class', 'link')
            .attr('stroke', '#999')
            .attr('stroke-opacity', d => 0.3 + (d.strength * 0.5))
            .attr('stroke-width', d => Math.max(1, d.strength * 3));
        
        // Create nodes (circles with labels)
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(nodes)
            .enter().append('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', dragStarted)
                .on('drag', dragged)
                .on('end', dragEnded));
        
        // Add circles for nodes
        node.append('circle')
            .attr('r', d => 10 + Math.min(d.connections * 2, 20))
            .attr('fill', d => getNodeColor(d))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer');
        
        // Add labels
        node.append('text')
            .text(d => getTruncatedLabel(d.text))
            .attr('x', 0)
            .attr('y', d => 15 + Math.min(d.connections * 2, 20))
            .attr('text-anchor', 'middle')
            .attr('fill', 'rgba(255, 255, 255, 0.9)')
            .attr('font-size', '12px')
            .attr('font-family', 'var(--font-body)')
            .style('pointer-events', 'none');
        
        // Add interactivity
        node.on('click', handleNodeClick)
            .on('dblclick', handleNodeDoubleClick)
            .on('mouseenter', handleNodeHover)
            .on('mouseleave', handleNodeLeave);
        
        // Start simulation if using force layout
        if (currentLayout === 'force') {
            simulation
                .nodes(nodes)
                .on('tick', () => {
                    link
                        .attr('x1', d => d.source.x)
                        .attr('y1', d => d.source.y)
                        .attr('x2', d => d.target.x)
                        .attr('y2', d => d.target.y);
                    
                    node.attr('transform', d => `translate(${d.x},${d.y})`);
                });
            
            simulation.force('link').links(links);
            simulation.alpha(1).restart();
        } else {
            // For static layouts, just position the nodes
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            node.attr('transform', d => `translate(${d.x},${d.y})`);
        }
    }
    
    /**
     * Apply force-directed layout
     */
    function applyForceLayout() {
        // Reset positions to let force simulation handle them
        nodes.forEach(node => {
            delete node.x;
            delete node.y;
            delete node.fx;
            delete node.fy;
        });
    }
    
    /**
     * Apply circular layout
     */
    function applyCircularLayout() {
        const container = d3.select('#constellation-container');
        const width = container.node().offsetWidth;
        const height = container.node().offsetHeight;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;
        
        nodes.forEach((node, i) => {
            const angle = (i / nodes.length) * 2 * Math.PI;
            node.x = centerX + radius * Math.cos(angle);
            node.y = centerY + radius * Math.sin(angle);
        });
        
        // Stop force simulation for static layout
        if (simulation) simulation.stop();
    }
    
    /**
     * Apply hierarchical layout (simple top-down based on connections)
     */
    function applyHierarchicalLayout() {
        const container = d3.select('#constellation-container');
        const width = container.node().offsetWidth;
        const height = container.node().offsetHeight;
        
        // Sort nodes by connection count
        const sortedNodes = [...nodes].sort((a, b) => b.connections - a.connections);
        
        // Position in layers
        const layers = 5;
        const nodesPerLayer = Math.ceil(sortedNodes.length / layers);
        
        sortedNodes.forEach((node, i) => {
            const layer = Math.floor(i / nodesPerLayer);
            const posInLayer = i % nodesPerLayer;
            const totalInLayer = Math.min(nodesPerLayer, sortedNodes.length - layer * nodesPerLayer);
            
            node.x = (width / (totalInLayer + 1)) * (posInLayer + 1);
            node.y = (height / (layers + 1)) * (layer + 1);
        });
        
        // Stop force simulation for static layout
        if (simulation) simulation.stop();
    }
    
    /**
     * Get color for node based on tags
     */
    function getNodeColor(node) {
        if (node.tags.length === 0) return '#B8B8FF'; // Light purple for untagged
        
        // Use consistent color for same tag
        const primaryTag = node.tags[0];
        const colors = ['#5B9BD5', '#9B59B6', '#E91E63', '#FF9800', '#4CAF50'];
        const hash = primaryTag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }
    
    /**
     * Truncate text for label display
     */
    function getTruncatedLabel(text) {
        const words = text.split(' ');
        if (words.length <= 2) return text;
        return words.slice(0, 2).join(' ') + '...';
    }
    
    /**
     * Show empty state for constellation
     */
    function showEmptyConstellation() {
        const container = d3.select('#constellation-container');
        container.selectAll('*').remove();
        
        container.append('div')
            .attr('class', 'empty-state')
            .html(`
                <span class="empty-state-icon">🌌</span>
                <h3 class="empty-state-title">No thoughts to visualize</h3>
                <p class="empty-state-message">Add some thoughts to see your constellation!</p>
            `);
    }
    
    /**
     * Show error message when D3.js fails to load
     */
    function showD3ErrorMessage() {
        const container = document.getElementById('constellation-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-state-icon">⚠️</span>
                <h3 class="empty-state-title">Visualization Library Not Available</h3>
                <p class="empty-state-message">The D3.js library could not be loaded. Please check your internet connection and refresh the page.</p>
            </div>
        `;
    }
    
    // ============================================
    // EVENT HANDLERS
    // ============================================
    
    /**
     * Handle node click - show detail modal
     */
    function handleNodeClick(event, d) {
        event.stopPropagation();
        selectedNode = d;
        showNodeModal(d);
    }
    
    /**
     * Handle node double-click - edit thought
     */
    function handleNodeDoubleClick(event, d) {
        event.stopPropagation();
        // Switch to home view and enter edit mode
        showView('home');
        setTimeout(() => {
            if (typeof editThought === 'function') {
                editThought(d.id);
            }
        }, 100);
    }
    
    /**
     * Handle node hover - highlight connected nodes
     */
    function handleNodeHover(event, d) {
        highlightedNodes.clear();
        highlightedNodes.add(d.id);
        
        // Find all connected nodes
        links.forEach(link => {
            const sourceId = link.source.id || link.source;
            const targetId = link.target.id || link.target;
            
            if (sourceId === d.id) highlightedNodes.add(targetId);
            if (targetId === d.id) highlightedNodes.add(sourceId);
        });
        
        // Update visual highlighting
        g.selectAll('.node circle')
            .style('opacity', node => highlightedNodes.has(node.id) ? 1 : 0.3);
        
        g.selectAll('.link')
            .style('opacity', link => {
                const sourceId = link.source.id || link.source;
                const targetId = link.target.id || link.target;
                return (sourceId === d.id || targetId === d.id) ? 0.8 : 0.1;
            });
    }
    
    /**
     * Handle node leave - reset highlighting
     */
    function handleNodeLeave(event, d) {
        highlightedNodes.clear();
        
        g.selectAll('.node circle')
            .style('opacity', 1);
        
        g.selectAll('.link')
            .style('opacity', link => 0.3 + (link.strength * 0.5));
    }
    
    /**
     * Show modal with node details
     */
    function showNodeModal(node) {
        const modal = document.getElementById('node-detail-modal');
        const modalText = document.getElementById('modal-thought-text');
        const modalTags = document.getElementById('modal-thought-tags');
        const modalDate = document.getElementById('modal-thought-date');
        
        modalText.textContent = node.text;
        
        // Display tags
        modalTags.innerHTML = '';
        if (node.tags && node.tags.length > 0) {
            node.tags.forEach(tag => {
                const tagBadge = document.createElement('span');
                tagBadge.className = 'tag-badge';
                tagBadge.textContent = tag;
                modalTags.appendChild(tagBadge);
            });
        }
        
        modalDate.textContent = formatDate(node.date);
        
        modal.style.display = 'flex';
    }
    
    /**
     * Drag event handlers
     */
    function dragStarted(event, d) {
        if (!event.active && currentLayout === 'force') simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragEnded(event, d) {
        if (!event.active && currentLayout === 'force') simulation.alphaTarget(0);
        // Note: d.fx and d.fy keep the node fixed at its dragged position
        // To allow the node to be free again, uncomment the following lines:
        // d.fx = null;
        // d.fy = null;
    }
    
    /**
     * Setup event listeners for controls
     */
    function setupEventListeners() {
        // Close modal
        const closeModalBtn = document.getElementById('close-modal');
        const modal = document.getElementById('node-detail-modal');
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        // Click outside modal to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Edit button in modal
        const editBtn = document.getElementById('modal-edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                if (selectedNode) {
                    handleNodeDoubleClick(new Event('click'), selectedNode);
                }
            });
        }
        
        // Connection strength slider
        const strengthSlider = document.getElementById('connection-strength');
        const strengthValue = document.getElementById('strength-value');
        
        if (strengthSlider) {
            strengthSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                strengthValue.textContent = value + '%';
                connectionStrength = value / 100;
                loadConstellationData(); // Recalculate and re-render
            });
        }
        
        // Layout selector
        const layoutSelect = document.getElementById('layout-select');
        if (layoutSelect) {
            layoutSelect.addEventListener('change', (e) => {
                currentLayout = e.target.value;
                renderGraph();
            });
        }
        
        // Search input
        const searchInput = document.getElementById('constellation-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                filterNodesBySearch(query);
            });
        }
    }
    
    /**
     * Filter nodes by search query
     */
    function filterNodesBySearch(query) {
        if (!query) {
            // Reset all nodes to visible
            g.selectAll('.node')
                .style('opacity', 1)
                .style('display', 'block');
            g.selectAll('.link')
                .style('opacity', d => 0.3 + (d.strength * 0.5));
            return;
        }
        
        // Filter nodes
        const matchingNodeIds = new Set();
        nodes.forEach(node => {
            if (node.text.toLowerCase().includes(query)) {
                matchingNodeIds.add(node.id);
            }
        });
        
        // Update visibility
        g.selectAll('.node')
            .style('opacity', d => matchingNodeIds.has(d.id) ? 1 : 0.2)
            .style('display', 'block');
        
        // Only show links between visible nodes
        g.selectAll('.link')
            .style('opacity', d => {
                const sourceId = d.source.id || d.source;
                const targetId = d.target.id || d.target;
                return (matchingNodeIds.has(sourceId) && matchingNodeIds.has(targetId)) 
                    ? 0.6 
                    : 0.1;
            });
    }
    
    /**
     * Format date (reuse from main script)
     */
    function formatDate(isoString) {
        const date = new Date(isoString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear().toString().slice(-2);
        return `${month}.${day}.${year}`;
    }
    
    /**
     * Get thoughts from localStorage (reuse from main script)
     */
    function getThoughts() {
        try {
            const stored = localStorage.getItem('thoughts');
            if (!stored) return [];
            const parsed = JSON.parse(stored);
            if (!Array.isArray(parsed)) return [];
            return parsed;
        } catch (e) {
            console.error('Error reading thoughts:', e);
            return [];
        }
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (document.getElementById('constellation-view').style.display !== 'none') {
            // Reinitialize on resize
            setTimeout(() => {
                initializeConstellation();
            }, 300);
        }
    });
});
