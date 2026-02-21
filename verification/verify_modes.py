from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Wait for the app to load
    page.goto("http://localhost:5173")

    # Check for new buttons
    trivia_btn = page.get_by_role("button", name="Trivia Mode")
    dream_btn = page.get_by_role("button", name="Dream Mode")
    vision_btn = page.get_by_role("button", name="Vision Mode")

    expect(trivia_btn).to_be_visible()
    expect(dream_btn).to_be_visible()
    expect(vision_btn).to_be_visible()

    print("New buttons visible.")

    # Click Trivia Mode and check controls
    trivia_btn.click()
    trivia_controls = page.locator("#trivia-mode-controls")
    expect(trivia_controls).to_be_visible()
    expect(page.get_by_placeholder("e.g., 'Science Fiction Movies'")).to_be_visible()
    print("Trivia controls verified.")

    # Click Vision Mode and check controls
    vision_btn.click()
    vision_controls = page.locator("#vision-mode-controls")
    expect(vision_controls).to_be_visible()
    expect(page.get_by_placeholder("https://example.com/image.jpg")).to_be_visible()
    # Use generic locator for file input as get_by_role('textbox') might not work for file
    expect(page.locator("#vision-file")).to_be_visible()
    print("Vision controls verified.")

    # Take screenshot
    page.screenshot(path="verification/modes_verification.png")
    print("Screenshot saved.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
