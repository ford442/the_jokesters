from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto("http://localhost:8080")
            page.wait_for_selector("#loading", state="attached")
            page.evaluate("""() => {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('chat-container').style.opacity = '1';
                document.getElementById('chat-container').style.pointerEvents = 'auto';
                if (document.getElementById('webgpu-error')) {
                    document.getElementById('webgpu-error').style.display = 'none';
                }
                if (window.getDirector) {
                    window.director = window.getDirector();
                }
            }""")

            page.evaluate("""() => {
                if (window.director) {
                    window.director.playScenario({
                        type: 'customer_service',
                        title: 'Customer Service Hell',
                        description: 'Unhelpful customer service.'
                    });
                }
            }""")

            import time
            time.sleep(3)
            page.screenshot(path="verification/customer_service.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify()
