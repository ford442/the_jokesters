import re

with open("src/ui/dashboard.ts", "r") as f:
    content = f.read()

diff_code = """
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
                                     <div class="diff-preview-container" style="display: none; margin-top: 10px; font-family: monospace; font-size: 0.8em; white-space: pre-wrap; background: #000; padding: 5px; border-radius: 4px; border: 1px solid #333;"></div>`;
                    deltasList.appendChild(div);
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
                            const cloudManager = (window as any).getHFStorageManager && (window as any).getHFStorageManager();
                            if (cloudManager) {
                                const content = await cloudManager.getFileContent(path);
                                let previewText = "File: " + path + "\\n";
                                try {
                                    const json = JSON.parse(content);
                                    if (json.history) {
                                        previewText += `+ ${json.history.length} messages in history array\\n`;
                                        if (json.history.length > 0) {
                                            previewText += `  Latest: "${json.history[json.history.length-1].content.substring(0, 50)}..."\\n`;
                                        }
                                    } else {
                                         previewText += JSON.stringify(json, null, 2);
                                    }
                                } catch(e) {
                                     previewText += content;
                                }
                                container.innerHTML = `<span style="color: #4ecdc4;">${previewText}</span>`;
                            } else {
                                container.innerHTML = '<span style="color: #ff6b6b;">Cloud manager not available.</span>';
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
"""

print(diff_code)
