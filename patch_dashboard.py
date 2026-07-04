import re

with open("src/ui/dashboard.ts", "r") as f:
    content = f.read()

diff_code = """
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
                                        let previewText = "File: " + path + "\\n";
                                        try {
                                            const json = JSON.parse(content);
                                            if (json.history) {
                                                previewText += `+ ${json.history.length} messages in history array\\n`;
                                                if (json.history.length > 0) {
                                                    previewText += `  Latest: "${json.history[json.history.length-1].content.substring(0, 50)}..."\\n`;
                                                }
                                            } else if (json.content) {
                                                previewText += `Delta Message Role: ${json.role || 'unknown'}\\n`;
                                                previewText += `Delta Content: "${json.content.substring(0, 100)}..."\\n`;
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
"""

replacement = """
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
"""

content = content.replace(replacement, diff_code)

with open("src/ui/dashboard.ts", "w") as f:
    f.write(content)
