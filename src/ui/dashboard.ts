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

    if (checkDeltasBtn && deltasContainer && deltasList && forceMergeBtn) {
        checkDeltasBtn.addEventListener('click', async () => {
            deltasList.innerHTML = '<div style="color: #888;">Checking for pending deltas...</div>';
            deltasContainer.style.display = 'block';

            const getMemMgr = (window as any).getMemoryManager;
            if (!getMemMgr) {
                deltasList.innerHTML = '<div style="color: #ff6b6b;">MemoryManager not available.</div>';
                return;
            }

            const memoryManager = getMemMgr();
            const deltas = await memoryManager.getPendingDeltas();

            deltasList.innerHTML = '';

            if (!deltas || deltas.length === 0) {
                deltasList.innerHTML = '<div style="color: #4ecdc4;">No pending deltas found. All episodes are fully merged!</div>';
                forceMergeBtn.style.display = 'none';
                return;
            }

            forceMergeBtn.style.display = 'block';

            deltas.forEach((delta: any) => {
                const div = document.createElement('div');
                div.style.background = 'rgba(0,0,0,0.2)';
                div.style.padding = '8px';
                div.style.borderRadius = '4px';
                div.style.fontSize = '0.9em';

                // Extract episode ID from path (episodes/ID/delta-...)
                const match = delta.path.match(/episodes\/([^\/]+)\/delta-/);
                const episodeId = match ? match[1] : 'Unknown';

                div.innerHTML = `<span style="color: #ffd700;">[Episode: ${episodeId}]</span> <span style="color: #ccc;">${delta.path.split('/').pop()}</span>`;
                deltasList.appendChild(div);
            });
        });

        forceMergeBtn.addEventListener('click', async () => {
            const getMemMgr = (window as any).getMemoryManager;
            if (!getMemMgr) return;
            const memoryManager = getMemMgr();

            deltasList.innerHTML = '<div style="color: #4ecdc4;">Triggering manual delta consolidation... Check background sync status.</div>';
            forceMergeBtn.style.display = 'none';

            // Re-run the delta consolidation task
            memoryManager.startDeltaConsolidationTask();
        });
    }
};

setTimeout(setupDashboard, 1000);