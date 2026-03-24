from playwright.sync_api import sync_playwright

def verify_feature(page):
    page.goto("http://localhost:8000")
    page.wait_for_timeout(2000)

    # We just need to check if the app loads, no new UI elements were added for the new modes, they are just configurations
    # Wait for the main UI to be visible
    page.wait_for_selector("#app")

    # Hide loading overlay manually as per AGENTS.md instructions for playwright verification
    try:
        page.evaluate("document.getElementById('loading').style.display = 'none'")
        page.evaluate("document.getElementById('chat-container').style.opacity = '1'")
        page.evaluate("document.getElementById('chat-container').style.pointerEvents = 'auto'")
    except:
        pass

    try:
        page.evaluate("document.getElementById('webgpu-error').style.display = 'none'")
    except:
        pass

    page.wait_for_timeout(1000)
    page.screenshot(path="verification/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="verification/video")
        page = context.new_page()
        try:
            verify_feature(page)
        finally:
            context.close()
            browser.close()
