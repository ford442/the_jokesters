from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    try:
        print("Navigating to http://localhost:5173")
        page.goto("http://localhost:5173")

        # Wait for title
        page.wait_for_selector("h1:has-text('The Jokesters')")
        print("Page loaded")

        # Check for Script Mode button
        script_btn = page.locator("#script-mode-btn")
        if script_btn.is_visible():
            print("Script Mode button is visible")
        else:
            print("Script Mode button is NOT visible")

        # Click Script Mode
        script_btn.click()
        print("Clicked Script Mode")

        # Wait for a moment for UI update
        page.wait_for_timeout(1000)

        # Take screenshot
        page.screenshot(path="verification/script_mode.png")
        print("Screenshot saved to verification/script_mode.png")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
