from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:5173")

        # Hide loading overlay and webgpu error manually to speed up test
        print("Hiding overlays...")
        page.add_style_tag(content="#loading, #webgpu-error { display: none !important; } #chat-container { opacity: 1 !important; pointer-events: auto !important; }")

        # Wait for mode buttons
        print("Waiting for mode buttons...")
        page.wait_for_selector("#philosopher-mode-btn")

        # Click Philosopher Mode
        print("Clicking Philosopher Mode button...")
        page.click("#philosopher-mode-btn")
        time.sleep(1)

        # Check if controls are visible
        is_visible = page.is_visible("#philosopher-mode-controls")
        print(f"Philosopher controls visible: {is_visible}")
        if not is_visible:
            print("Error: Philosopher controls not visible")

        # Take screenshot 1
        page.screenshot(path="verification/philosopher_mode.png")

        # Click Alien Mode
        print("Clicking Alien Mode button...")
        page.click("#alien-mode-btn")
        time.sleep(1)

        # Check if controls are visible
        is_visible = page.is_visible("#alien-mode-controls")
        print(f"Alien controls visible: {is_visible}")
        if not is_visible:
            print("Error: Alien controls not visible")

        # Take screenshot 2
        page.screenshot(path="verification/alien_mode.png")

        browser.close()

if __name__ == "__main__":
    run()
