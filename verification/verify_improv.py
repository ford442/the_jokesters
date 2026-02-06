from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_ui(page: Page):
    print("Navigating to app...")
    page.goto("http://localhost:5173/")

    print("Waiting for title...")
    expect(page.get_by_role("heading", name="The Jokesters")).to_be_visible()

    # Check if Chat Mode is active by default
    print("Checking default mode...")
    expect(page.locator("#chat-mode-controls")).to_be_visible()

    # Click Improv Mode
    print("Switching to Improv Mode...")
    page.get_by_role("button", name="Improv Mode").click()

    # Check if Improv Controls are visible
    print("Verifying Improv Controls...")
    expect(page.locator("#improv-mode-controls")).to_be_visible()

    # Check inputs
    expect(page.locator("#scene-title")).to_be_visible()
    expect(page.locator("#scene-description")).to_be_visible()

    # Check Start button exists
    expect(page.get_by_role("button", name="Start Scene")).to_be_visible()

    print("Taking screenshot...")
    page.screenshot(path="verification/improv_ui.png")
    print("Done.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_ui(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
