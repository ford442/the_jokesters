export const setupDashboard = () => {
    const dashboardBtn = document.getElementById('cloud-dashboard-btn');
    const dashboardModal = document.getElementById('cloud-dashboard-modal');
    const closeBtn = document.getElementById('close-cloud-dashboard-btn');
    const refreshBtn = document.getElementById('refresh-cloud-dashboard-btn');
    const historyList = document.getElementById('cloud-history-list');

    // Pending deltas UI elements
    const checkDeltasBtn = document.getElementById('check-pending-deltas-btn');
    const deltasContainer = document.getElementById('pending-deltas-container');
    const deltasList = document.getElementById('pending-deltas-list');
    const forceMergeBtn = document.getElementById('force-merge-deltas-btn');
    const viewAnalyticsBtn = document.getElementById('view-analytics-btn');
    const analyticsContainer = document.getElementById('episode-analytics-container');
    const analyticsContent = document.getElementById('episode-analytics-content');

    if (!dashboardBtn || !dashboardModal || !closeBtn || !refreshBtn || !historyList) return;

    const loadHistory = async () => {
        historyList.innerHTML = '<div style="color: #888;">Loading history...</div>';
        const getMemMgr = (window as any).getMemoryManager;
        if (!getMemMgr) {
            historyList.innerHTML = '<div style="color: #ff6b6b;">MemoryManager not available.</div>';
            return;
        }
        const memoryManager = getMemMgr();
        const history = await memoryManager.getCloudHistory();

        historyList.innerHTML = '';
        if (!history || history.length === 0) {
            historyList.innerHTML = '<div style="color: #888;">No history found or error fetching.</div>';
            return;
        }

        let items = history;
        if (history.length > 0 && !history[0].commit && !history[0].oid) {
            items.forEach((item: any) => {
                const div = document.createElement('div');
                div.style.background = 'rgba(255,255,255,0.05)';
                div.style.padding = '10px';
                div.style.borderRadius = '4px';
                div.innerHTML = `<div style="font-weight: bold; color: #4ecdc4;">${item.path || 'Unknown file'}</div>
                                 <div style="font-size: 0.85em; color: #ccc;">Size: ${item.size || 0} bytes</div>`;
                historyList.appendChild(div);
            });
            return;
        }

        items.forEach((item: any) => {
            const div = document.createElement('div');
            div.style.background = 'rgba(255,255,255,0.05)';
            div.style.padding = '10px';
            div.style.borderRadius = '4px';

            const date = item.date || item.createdAt || 'Unknown Date';
            const message = item.message || item.commitMessage || item.title || 'No message';
            const author = item.author ? (item.author.name || item.author) : 'Unknown';

            div.innerHTML = `<div style="font-weight: bold; color: #4ecdc4;">${message}</div>
                             <div style="font-size: 0.85em; color: #ccc;">By ${author} on ${new Date(date).toLocaleString()}</div>`;
            historyList.appendChild(div);
        });
    };

    dashboardBtn.addEventListener('click', () => {
        dashboardModal.style.display = 'flex';
        loadHistory();
    });

    closeBtn.addEventListener('click', () => {
        dashboardModal.style.display = 'none';
    });

    refreshBtn.addEventListener('click', () => {
        loadHistory();
    });


    if (viewAnalyticsBtn && analyticsContainer && analyticsContent) {
        viewAnalyticsBtn.addEventListener('click', async () => {

            const getMemMgr = (window as any).getMemoryManager;
            if (!getMemMgr) return;

            const memoryManager = getMemMgr();

            // Toggle visibility
            if (analyticsContainer.style.display === 'block') {
                analyticsContainer.style.display = 'none';
                return;
            }

            analyticsContainer.style.display = 'block';
            analyticsContent.innerHTML = '<div>Loading analytics...</div>';

            try {
                const analytics = await memoryManager.getEpisodeAnalytics();

                // Format top modes
                const modesEntries = Object.entries(analytics.commonModes).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3);
                let modesHtml = modesEntries.map(e => `${e[0]} (${e[1]})`).join(', ') || 'None';

                console.log('Setting innerHTML');
                analyticsContent.innerHTML = `
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #4ecdc4; padding-bottom: 5px; margin-bottom: 5px;">
                        <span>Total Episodes:</span>
                        <strong style="color: white;">${analytics.totalEpisodes}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #4ecdc4; padding-bottom: 5px; margin-bottom: 5px;">
                        <span>Total Tokens (Proxy):</span>
                        <strong style="color: white;">${analytics.totalTokensProxy}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #4ecdc4; padding-bottom: 5px; margin-bottom: 5px;">
                        <span>Avg Episode Length:</span>
                        <strong style="color: white;">${analytics.avgEpisodeLength}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Top Modes:</span>
                        <strong style="color: white;">${modesHtml}</strong>
                    </div>
                `;
            } catch (err) {
                console.error('Failed to load analytics', err);
                console.log('Error setting innerHTML', err);
                analyticsContent.innerHTML = '<div style="color: #ff6b6b;">Failed to load analytics.</div>';
            }
        });
    }



    }

(window as any).triggerAnalytics = async () => {
    const btn = document.getElementById('view-analytics-btn');
    if (btn) btn.click();
};
