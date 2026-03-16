from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Start the local server serving the dist directory on a specific port
        import subprocess
        import time
        server_process = subprocess.Popen(["python3", "-m", "http.server", "8080", "--directory", "dist"])
        time.sleep(2) # Wait for server to start

        try:
            # Navigate to the app
            page.goto("http://localhost:8080")

            # Wait for loading overlay to appear and then execute script to hide it
            page.wait_for_selector("#loading", state="attached")
            page.evaluate("""() => {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('chat-container').style.opacity = '1';
                document.getElementById('chat-container').style.pointerEvents = 'auto';
                if (document.getElementById('webgpu-error')) {
                    document.getElementById('webgpu-error').style.display = 'none';
                }

                // Expose Director globally if not already
                if (window.getDirector) {
                    window.director = window.getDirector();
                }
            }""")

            # 1. Test Support Group Mode
            page.evaluate("""() => {
                if (window.director) {
                    window.director.playScenario({
                        type: 'support_group',
                        title: 'The Support Group',
                        description: 'AI models who just want to paint.'
                    });
                }
            }""")

            # Wait a bit for the intro message to render
            time.sleep(2)
            page.screenshot(path="verification/support_group.png")

            # Stop the scene
            page.evaluate("if (window.director) window.director.stopScene();")
            time.sleep(1)

            # Clear messages visually for clean screenshot
            page.evaluate("""() => {
                const msgs = document.getElementById('chat-history');
                if (msgs) msgs.innerHTML = '';
            }""")

            # 2. Test Heist Planner Mode
            page.evaluate("""() => {
                if (window.director) {
                    window.director.playScenario({
                        type: 'heist_planner',
                        title: 'The Heist Planner',
                        description: 'Planning to steal the moon.',
                        config: { heistTarget: 'the moon' }
                    });
                }
            }""")

            # Wait a bit for the intro message to render
            time.sleep(2)
            page.screenshot(path="verification/heist_planner.png")

        finally:
            server_process.terminate()
            browser.close()

if __name__ == "__main__":
    verify()
