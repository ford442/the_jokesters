from playwright.sync_api import sync_playwright

def verify(page):
    print("Navigating to local server...")
    page.goto("http://localhost:8080")

    # Wait for the app container
    page.wait_for_selector('#app')

    print("Hiding loading overlay to interact with UI...")
    # Hide the loading overlay which blocks interaction during testing
    try:
        page.evaluate("document.getElementById('loading').style.display = 'none';")
    except Exception as e:
        print("Could not hide loading:", e)

    try:
        page.evaluate("document.getElementById('webgpu-error').style.display = 'none';")
    except:
        pass

    try:
        page.evaluate("document.getElementById('chat-container').style.display = 'flex';")
        page.evaluate("document.getElementById('chat-container').style.opacity = '1';")
        page.evaluate("document.getElementById('chat-container').style.pointerEvents = 'auto';")
    except Exception as e:
        print("Could not display chat container:", e)

    print("Switching to Improv Mode...")
    improv_btn = page.locator("#improv-mode-btn")
    improv_btn.click(force=True)

    print("Taking screenshot...")
    page.screenshot(path="verification/new_modes_verified.png")
    print("Done.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify(page)
        finally:
            browser.close()
