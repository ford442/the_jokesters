from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173")

            # Wait for title
            print("Waiting for title...")
            page.wait_for_selector("h1", timeout=10000)

            # Click Auto Mode button
            print("Clicking Auto Mode...")
            page.click("#autonomous-mode-btn")

            # Wait for controls to appear
            print("Waiting for controls...")
            page.wait_for_selector("#autonomous-mode-controls", state="visible", timeout=5000)

            # Take screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/autonomous_mode.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
            try:
                page.screenshot(path="verification/error.png")
            except:
                pass
        finally:
            browser.close()

if __name__ == "__main__":
    run()
