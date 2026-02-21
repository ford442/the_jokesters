from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    print("Navigating to app...")
    page.goto("http://localhost:5173/")

    # Wait for loading to disappear or just hide it
    print("Waiting for app to load...")
    try:
        page.wait_for_selector("#loading", state="hidden", timeout=5000)
    except:
        print("Loading screen didn't disappear, forcing hide...")
        page.eval_on_selector("#loading", "el => el.style.display = 'none'")

    # Hide status overlay if present
    try:
        page.eval_on_selector("#status", "el => el.style.display = 'none'")
    except:
        pass

    print("Taking initial screenshot...")
    page.screenshot(path="verification/initial_state.png")

    # Verify Historical Mode
    print("Testing Historical Mode...")
    # Force click if blocked
    page.click("#historical-mode-btn", force=True)

    # Wait for controls to be visible
    page.wait_for_selector("#historical-mode-controls", state="visible")
    page.wait_for_selector("#historical-figure-1", state="visible")

    page.screenshot(path="verification/historical_mode.png")
    print("Screenshot saved: verification/historical_mode.png")

    # Verify Commentary Mode
    print("Testing Commentary Mode...")
    page.click("#commentary-mode-btn", force=True)

    # Wait for controls to be visible
    page.wait_for_selector("#commentary-mode-controls", state="visible")
    page.wait_for_selector("#commentary-target", state="visible")

    page.screenshot(path="verification/commentary_mode.png")
    print("Screenshot saved: verification/commentary_mode.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
