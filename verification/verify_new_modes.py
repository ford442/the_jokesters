from playwright.sync_api import sync_playwright

def verify_modes():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173")

            # Manually hide loading overlay and WebGPU error overlay as per AGENTS.md
            print("Hiding loading overlay and WebGPU error...")
            page.evaluate("""
                document.getElementById('loading').style.display = 'none';
                const webgpuError = document.getElementById('webgpu-error');
                if (webgpuError) webgpuError.style.display = 'none';

                const chatContainer = document.getElementById('chat-container');
                if (chatContainer) {
                    chatContainer.classList.add('enabled');
                    chatContainer.style.opacity = '1';
                    chatContainer.style.pointerEvents = 'auto';
                }
            """)

            # Wait for mode buttons to be visible
            print("Waiting for mode buttons...")
            page.wait_for_selector("#code-mode-btn")

            # 1. Verify Code Review Mode
            print("Clicking Code Review button...")
            page.click("#code-mode-btn")

            # Wait a bit for the UI to update
            page.wait_for_timeout(500)

            print("Checking code controls visibility...")
            controls = page.locator("#code-mode-controls")
            if controls.is_visible():
                print("Code Review controls visible!")
            else:
                print("ERROR: Code Review controls NOT visible.")

            # Take screenshot of Code Review Mode
            page.screenshot(path="verification/code_review_mode.png")

            # 2. Verify Therapy Mode
            print("Clicking Therapy button...")
            page.click("#therapy-mode-btn")

            # Wait a bit for the UI to update
            page.wait_for_timeout(500)

            print("Checking therapy controls visibility...")
            controls = page.locator("#therapy-mode-controls")
            if controls.is_visible():
                print("Therapy controls visible!")
            else:
                print("ERROR: Therapy controls NOT visible.")

            # Take screenshot of Therapy Mode
            page.screenshot(path="verification/therapy_mode.png")

            print("Verification complete.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_modes()
