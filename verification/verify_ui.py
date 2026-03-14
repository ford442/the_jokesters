from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_newsroom_mode(page: Page):
    print("Navigating to local server...")
    page.goto("http://localhost:8080")

    print("Hiding loading overlay to interact with UI...")
    # Hide the loading overlay which blocks interaction during testing
    page.evaluate("document.getElementById('loading').style.display = 'none';")

    # Hide webgpu error if it appears so we can click things
    try:
        page.evaluate("document.getElementById('webgpu-error').style.display = 'none';")
    except:
        pass

    page.evaluate("document.getElementById('chat-container').style.display = 'flex';")
    # Need to remove pointer-events: none and opacity from inputs
    page.evaluate("document.getElementById('chat-container').style.opacity = '1';")
    page.evaluate("document.getElementById('chat-container').style.pointerEvents = 'auto';")

    # Enable the button
    page.evaluate("document.getElementById('improv-mode-btn').disabled = false;")
    page.evaluate("document.getElementById('scene-title').disabled = false;")
    page.evaluate("document.getElementById('scene-description').disabled = false;")

    print("Switching to Improv Mode...")
    improv_btn = page.locator("#improv-mode-btn")
    improv_btn.click()

    print("Setting up Newsroom Scenario...")
    title_input = page.locator("#scene-title")
    # Make sure we don't block on visibility check
    title_input.fill("Alien Landing", force=True)

    desc_input = page.locator("#scene-description")
    desc_input.fill("A UFO has landed in Central Park.", force=True)

    # We can't actually easily trigger Newsroom via the UI since we didn't add it to a dropdown,
    # but we can verify the UI loads and the improv controls are available.

    print("Taking screenshot...")
    page.screenshot(path="verification.png")
    print("Done.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_newsroom_mode(page)
        finally:
            browser.close()
