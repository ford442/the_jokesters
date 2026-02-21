from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173")

        # Force hide the loading screen and enable interactivity
        page.wait_for_timeout(2000)
        page.evaluate("""
            document.getElementById('loading').style.display = 'none';
            document.getElementById('chat-container').style.pointerEvents = 'auto';
            document.getElementById('chat-container').style.opacity = '1';
        """)

        # Check for Language Select
        expect(page.locator("#language-select")).to_be_visible()

        # Check for New Mode Buttons
        expect(page.locator("#trial-mode-btn")).to_be_visible()
        expect(page.locator("#tech-mode-btn")).to_be_visible()

        # Click Trial Mode and check controls
        page.click("#trial-mode-btn")
        expect(page.locator("#trial-mode-controls")).to_be_visible()
        expect(page.locator("#trial-topic")).to_be_visible()

        # Click Tech Support Mode and check controls
        page.click("#tech-mode-btn")
        expect(page.locator("#tech-mode-controls")).to_be_visible()
        expect(page.locator("#tech-issue")).to_be_visible()

        # Take screenshot
        page.screenshot(path="verification/ui_verification.png")

        browser.close()

if __name__ == "__main__":
    run()
