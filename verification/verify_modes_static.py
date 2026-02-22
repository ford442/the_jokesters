from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    print("Navigating to app...")
    page.goto("http://localhost:5173/")

    # Wait a bit for DOM to be ready
    page.wait_for_timeout(2000)

    print("Forcing UI visibility...")
    # Force show chat container
    page.eval_on_selector("#chat-container", "el => { el.style.opacity = '1'; el.style.pointerEvents = 'auto'; }")
    # Hide loading
    try:
        page.eval_on_selector("#loading", "el => el.style.display = 'none'")
    except:
        pass

    # Verify Buttons Exist
    print("Verifying buttons exist...")
    assert page.query_selector("#historical-mode-btn") is not None
    assert page.query_selector("#commentary-mode-btn") is not None

    # Show Historical Controls manually for screenshot
    print("Showing Historical Controls...")
    page.eval_on_selector("#historical-mode-controls", "el => el.style.display = 'block'")
    page.screenshot(path="verification/historical_mode_static.png")
    print("Screenshot saved: verification/historical_mode_static.png")

    # Hide Historical, Show Commentary
    page.eval_on_selector("#historical-mode-controls", "el => el.style.display = 'none'")
    page.eval_on_selector("#commentary-mode-controls", "el => el.style.display = 'block'")
    page.screenshot(path="verification/commentary_mode_static.png")
    print("Screenshot saved: verification/commentary_mode_static.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
