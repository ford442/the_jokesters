import time
from playwright.sync_api import sync_playwright

def verify_new_modes():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--disable-web-security'])
        page = browser.new_page()

        # Navigate to the local server
        page.goto("http://localhost:8080/")

        # Wait for something to ensure JS has initialized
        page.wait_for_selector("#app")
        time.sleep(1)

        # Make UI visible by forcing opacity and hiding webgpu-error
        page.evaluate("""
            document.getElementById('chat-container').style.opacity = '1';
            document.getElementById('chat-container').style.pointerEvents = 'auto';
            const loading = document.getElementById('loading');
            if(loading) loading.style.display = 'none';
            const webgpuError = document.getElementById('webgpu-error');
            if(webgpuError) webgpuError.style.display = 'none';
        """)

        # Wait a moment for UI to settle
        time.sleep(1)

        # Click the setup dropdown to open it
        page.click("#improv-setup-select", force=True)
        time.sleep(1)

        # Take a screenshot showing the setup dropdown options
        page.screenshot(path="verification/suburbia_modes_verified.png")

        browser.close()

if __name__ == "__main__":
    verify_new_modes()
