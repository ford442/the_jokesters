
function generateVisualDiff(localObj: any, cloudObj: any) {
  let diffHtml = '<div style="display: flex; flex-direction: column; gap: 5px; margin-top: 5px; padding: 5px; background: rgba(0,0,0,0.2); border-radius: 4px;">';
  const allKeys = new Set([...Object.keys(localObj || {}), ...Object.keys(cloudObj || {})]);

  let diffsFound = 0;
  allKeys.forEach(key => {
    const localVal = localObj[key];
    const cloudVal = cloudObj[key];

    if (JSON.stringify(localVal) === JSON.stringify(cloudVal)) {
      return;
    }

    diffsFound++;

    if (localVal === undefined) {
      diffHtml += `<div style="color: #ff6b6b; padding: 4px; background: rgba(255,107,107,0.1);"><strong>${key}:</strong> Removed (was ${JSON.stringify(cloudVal)})</div>`;
    } else if (cloudVal === undefined) {
      diffHtml += `<div style="color: #4ecdc4; padding: 4px; background: rgba(78,205,196,0.1);"><strong>${key}:</strong> Added (${JSON.stringify(localVal)})</div>`;
    } else if (Array.isArray(localVal) && Array.isArray(cloudVal)) {
      diffHtml += `<div style="color: #ffd700; padding: 4px; background: rgba(255,215,0,0.1);"><strong>${key}:</strong> Array length ${localVal.length} (local) vs ${cloudVal.length} (cloud)</div>`;
    } else {
      diffHtml += `<div style="color: #ffd700; padding: 4px; background: rgba(255,215,0,0.1);"><strong>${key}:</strong> Changed</div>`;
    }
  });

  if (diffsFound === 0) {
    return '<div style="color: #888; font-size: 0.85em; margin-top: 5px;">No differences found.</div>';
  }

  return diffHtml + '</div>';
}

export const setupDashboard = () => {
    const dashboardBtn = document.getElementById('cloud-dashboard-btn');
    const reviewSyncBtn = document.getElementById('review-sync-btn');
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

    // Ensure the modal never blocks the initial launch UI; it should only
    // appear when explicitly opened via the dashboard/review-sync buttons.
    dashboardModal.style.display = 'none';

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

    if (reviewSyncBtn) {
        reviewSyncBtn.addEventListener('click', () => {
            dashboardModal.style.display = 'flex';
        });
    }

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

    if (checkDeltasBtn && deltasContainer && deltasList) {
        checkDeltasBtn.addEventListener('click', async () => {
            const getMemMgr = (window as any).getMemoryManager;
            if (!getMemMgr) return;
            const memoryManager = getMemMgr();

            if (deltasContainer.style.display === 'block') {
                deltasContainer.style.display = 'none';
                return;
            }

            deltasContainer.style.display = 'block';
            deltasList.innerHTML = '<div>Loading pending deltas...</div>';

            try {
                const pendingDeltas = await memoryManager.getPendingDeltas();
                deltasList.innerHTML = '';

                if (!pendingDeltas || pendingDeltas.length === 0) {
                    deltasList.innerHTML = '<div style="color: #888;">No pending deltas found.</div>';
                    return;
                }

                pendingDeltas.forEach((delta: any) => {
                    const div = document.createElement('div');
                    div.style.background = 'rgba(255,255,255,0.05)';
                    div.style.padding = '10px';
                    div.style.borderRadius = '4px';

                    const localState = delta.localState || {};
                    const cloudState = delta.cloudState || {};
                    const diffHtml = generateVisualDiff(localState, cloudState);

                    div.innerHTML = `<div style="font-weight: bold; color: #ffd700;">${delta.id || 'Delta'}</div>
                                     <div style="font-size: 0.85em; color: #ccc;">Action: ${delta.action || 'Unknown'}</div>
                                     ${diffHtml}`;
                    deltasList.appendChild(div);
                });

            } catch(e) {
                console.error(e);
                deltasList.innerHTML = '<div style="color: #ff6b6b;">Error loading deltas.</div>';
            }
        });
    }

    if (forceMergeBtn) {
        forceMergeBtn.addEventListener('click', async () => {
            const getMemMgr = (window as any).getMemoryManager;
            if (!getMemMgr) return;
            const memoryManager = getMemMgr();

            try {
                forceMergeBtn.textContent = 'Merging...';
                await memoryManager.processSyncQueue();
                forceMergeBtn.textContent = 'Force Merge All Deltas';

                // Refresh lists
                if (checkDeltasBtn) checkDeltasBtn.click();
                loadHistory();
            } catch(e) {
                console.error(e);
                forceMergeBtn.textContent = 'Error (Retry)';
            }
        });
    }



    if (checkDeltasBtn && deltasContainer && deltasList) {
        checkDeltasBtn.addEventListener('click', async () => {
            const getMemMgr = (window as any).getMemoryManager;
            if (!getMemMgr) return;
            const memoryManager = getMemMgr();

            if (deltasContainer.style.display === 'block') {
                deltasContainer.style.display = 'none';
                return;
            }

            deltasContainer.style.display = 'block';
            deltasList.innerHTML = '<div>Loading pending deltas...</div>';

            try {
                const deltas = await memoryManager.getPendingDeltas();
                deltasList.innerHTML = '';
                if (!deltas || deltas.length === 0) {
                    deltasList.innerHTML = '<div style="color: #888;">No pending deltas found.</div>';
                    return;
                }

                deltas.forEach((delta: any) => {
                    const div = document.createElement('div');
                    div.style.background = 'rgba(255,255,255,0.05)';
                    div.style.padding = '10px';
                    div.style.borderRadius = '4px';
                    div.innerHTML = `<div style="font-weight: bold; color: #ffd700;">${delta.path || 'Unknown file'}</div>
                                     <div style="font-size: 0.85em; color: #ccc;">Size: ${delta.size || 0} bytes</div>
                                     <button class="preview-diff-btn" data-path="${delta.path}" style="margin-top: 5px; background: #0f3460; color: white; border: 1px solid #4ecdc4; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">Preview Diff</button>
                                     <button class="accept-local-btn" data-path="${delta.path}" style="margin-top: 5px; margin-left: 5px; background: #27ae60; color: white; border: 1px solid #2ecc71; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">Accept Local</button>
                                     <button class="accept-cloud-btn" data-path="${delta.path}" style="margin-top: 5px; margin-left: 5px; background: #c0392b; color: white; border: 1px solid #e74c3c; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8em;">Accept Cloud</button>
                                     <div class="diff-preview-container" style="display: none; margin-top: 10px; font-family: monospace; font-size: 0.8em; white-space: pre-wrap; background: #000; padding: 5px; border-radius: 4px; border: 1px solid #333;"></div>`;
                    deltasList.appendChild(div);
                });

                // Add event listeners for Accept Local / Accept Cloud
                document.querySelectorAll('.accept-local-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const target = e.target as HTMLButtonElement;
                        const path = target.getAttribute('data-path');
                        alert("Accept Local clicked for " + path + ". (Placeholder for local merge logic)");
                    });
                });

                document.querySelectorAll('.accept-cloud-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const target = e.target as HTMLButtonElement;
                        const path = target.getAttribute('data-path');
                        alert("Accept Cloud clicked for " + path + ". (Placeholder for cloud merge logic)");
                    });
                });

                // Add event listeners to diff buttons
                document.querySelectorAll('.preview-diff-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const target = e.target as HTMLButtonElement;
                        const path = target.getAttribute('data-path');
                        const container = target.nextElementSibling as HTMLDivElement;

                        if (container.style.display === 'block') {
                            container.style.display = 'none';
                            target.innerText = 'Preview Diff';
                            return;
                        }

                        container.style.display = 'block';
                        container.innerHTML = '<span style="color: #888;">Loading diff...</span>';
                        target.innerText = 'Hide Diff';

                        try {
                            // Simple property diff preview
                            // Normally we would fetch the cloud content and local content,
                            // but since this is a delta, we'll just show the delta contents
                            // We need to fetch the file content from huggingface directly since HFStorageManager doesn't have getFileContent
                            const getMemMgr = (window as any).getMemoryManager;
                            if (getMemMgr) {
                                const memoryManager = getMemMgr();
                                const token = memoryManager.hfToken;
                                const repoId = memoryManager.hfRepoId;

                                if (token && repoId) {
                                    let cleanRepoId = repoId;
                                    if (cleanRepoId.startsWith("datasets/")) {
                                        cleanRepoId = cleanRepoId.replace("datasets/", "");
                                    }
                                    const url = `https://huggingface.co/datasets/${cleanRepoId}/resolve/main/${path}`;
                                    const response = await fetch(url, {
                                        headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    if (response.ok) {
                                        const content = await response.text();
                                        let previewText = "File: " + path + "\n";
                                        try {
                                            const json = JSON.parse(content);
                                            if (json.history) {
                                                previewText += `+ ${json.history.length} messages in history array\n`;
                                                if (json.history.length > 0) {
                                                    previewText += `  Latest: "${json.history[json.history.length-1].content.substring(0, 50)}..."\n`;
                                                }
                                            } else if (json.content) {
                                                previewText += `Delta Message Role: ${json.role || 'unknown'}\n`;
                                                previewText += `Delta Content: "${json.content.substring(0, 100)}..."\n`;
                                            } else {
                                                previewText += JSON.stringify(json, null, 2);
                                            }
                                        } catch(e) {
                                             previewText += content.substring(0, 500) + (content.length > 500 ? "..." : "");
                                        }
                                        container.innerHTML = `<span style="color: #4ecdc4;">${previewText}</span>`;
                                    } else {
                                        container.innerHTML = '<span style="color: #ff6b6b;">Failed to fetch from HuggingFace.</span>';
                                    }
                                } else {
                                    container.innerHTML = '<span style="color: #ff6b6b;">Cloud credentials not available.</span>';
                                }
                            } else {
                                container.innerHTML = '<span style="color: #ff6b6b;">MemoryManager not available.</span>';
                            }
                        } catch(err) {
                            container.innerHTML = '<span style="color: #ff6b6b;">Failed to load diff.</span>';
                        }
                    });
                });
            } catch (err) {
                console.error('Failed to load pending deltas', err);
                deltasList.innerHTML = '<div style="color: #ff6b6b;">Failed to load pending deltas.</div>';
            }
        });
    }

    if (forceMergeBtn) {
        forceMergeBtn.addEventListener('click', async () => {
             const getMemMgr = (window as any).getMemoryManager;
             if (!getMemMgr) return;
             const memoryManager = getMemMgr();
             try {
                 // Triggers consolidation logic in worker
                 const worker = (window as any).syncWorker;
                 if (worker) {
                     worker.postMessage({ action: 'consolidate_deltas', episodeId: 'latest' }); // simplification for demo
                     alert("Merge requested. Check background worker.");
                 } else {
                     alert("Sync worker not available.");
                 }
             } catch(err) {
                 console.error(err);
                 alert("Failed to trigger merge.");
             }
        });
    }


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
