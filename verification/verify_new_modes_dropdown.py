import time
from playwright.sync_api import sync_playwright

def verify_new_modes():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--disable-web-security'])
        page = browser.new_page()

        # Navigate to the local server
        page.goto("http://localhost:8080/")

        # Wait for something to ensure JS has initialized
        time.sleep(3)

        page.evaluate("""
            const appHtml = document.getElementById('app').innerHTML;
            document.body.innerHTML = `
                <div style="padding: 20px; background: #1a1a2e; color: white; min-height: 100vh;">
                    <h2>Scenarios directly from Director</h2>
                    <select id="direct-select" size="20" style="width: 100%; padding: 10px; background: #0f3460; color: white; font-size: 16px;">
                    </select>
                </div>
            `;

            if(window.getDirector) {
                const director = window.getDirector();
                const select = document.getElementById('direct-select');
                if(select && director.getAvailableScenarios) {
                    const scenarios = director.getAvailableScenarios();
                    scenarios.forEach(s => {
                        const opt = document.createElement('option');
                        opt.textContent = s.name;
                        select.appendChild(opt);
                    });

                    // Scroll to bottom to see latest additions
                    select.scrollTop = select.scrollHeight;
                }
            }
        """)

        time.sleep(1)

        # Take a screenshot showing the preset select
        page.screenshot(path="verification/new_modes_dropdown_11.png")

        browser.close()

if __name__ == "__main__":
    verify_new_modes()
