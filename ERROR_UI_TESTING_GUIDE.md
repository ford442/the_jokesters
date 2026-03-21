# Error UI Testing Guide

This guide walks you through testing the new user-friendly error UI for model loading failures.

## What's New

When model loading fails, instead of a frozen loading screen, users now see:
- **Error Panel** with a clear title and error category badge
- **User-friendly suggestion** specific to the error type
- **Raw error message** (collapsed, for debugging)
- **Retry button** to try loading again
- **Copy Error button** to copy the error message

## Testing Checklist

### ✅ Local Development Testing

#### Setup
1. Start the dev server:
   ```bash
   npm run dev
   ```
   The app should be available at `http://localhost:5173/` (or similar)

2. Open the application in Chrome or Edge with DevTools open

#### Test 1: Network Error Simulation

1. **Block HuggingFace CDN:**
   - Open DevTools → Network tab
   - Click the filter icon (funnel)
   - Add a filter to block HuggingFace requests:
     - Type: `*.huggingface.co`
   - Or manually block by pattern: right-click on any request to huggingface → Block request URL

2. **Trigger Model Load:**
   - Click "Load Model & Start" button
   - A model selection dropdown appears with options

3. **Observe Error Panel:**
   - Should see an error panel replace the progress bar
   - Panel should have:
     - ✓ Red border (error styling)
     - ✓ Title: "Network Error"
     - ✓ Category badge: "Category: network"
     - ✓ Suggestion: "Check your connection and reload. Model weights download from HuggingFace CDN."
     - ✓ Raw error message in monospace font
     - ✓ Two buttons: "Retry" (cyan) and "Copy Error" (outlined)

4. **Test Retry Button:**
   - Unblock HuggingFace CDN in DevTools
   - Click the "Retry" button
   - Model should begin loading successfully
   - Progress bar should appear and advance to completion

5. **Test Copy Button:**
   - Click "Copy Error" button
   - Button text should change to "Copied!" for 2 seconds
   - Paste into a text editor to verify the error message was copied

#### Test 2: WebGPU Error (if applicable)

1. **Disable WebGPU** (simulate unsupported browser):
   - For Chrome: Open DevTools → Settings → Experiments
   - Search for "WebGPU" and disable it
   - Reload the page

2. **Trigger Model Load:**
   - Click "Load Model & Start"

3. **Observe WebGPU Error Panel:**
   - Should see error panel with:
     - ✓ Title: "WebGPU Not Supported"
     - ✓ Category: "webgpu"
     - ✓ Suggestion: "Use Chrome 113+ or Edge 113+ with hardware acceleration enabled."

4. **Re-enable WebGPU** and Retry to verify recovery

#### Test 3: OOM Error (optional - advanced)

Note: Triggering a genuine OOM error requires specific conditions (very large model, very limited VRAM).

If you want to simulate this for testing:
1. Monitor browser memory in DevTools
2. Select a very large model (8B Hermes or Llama) if your GPU has limited VRAM
3. If you see memory/OOM error, verify error panel shows:
   - ✓ Title: "GPU Out of Memory"
   - ✓ Category: "oom"
   - ✓ Suggestion: "Close other GPU-heavy tabs and reload, or try a lower-VRAM model."

#### Test 4: Long Error Messages

1. **Block CDN** and trigger network error
2. **Verify Error Panel UI:**
   - Long error messages should be contained in a scrollable box
   - Max height is 120px with overflow-y: auto
   - Text should wrap and remain readable
   - Panel should not be pushed off-screen or become unresponsive

### ✅ Production Testing

Once you deploy to `https://test.1ink.us/the-jokesters/`:

1. **Test with actual network conditions:**
   - Load the app normally (should work if CDN is reachable)
   - If users report network errors, they should see the error panel with suggestions

2. **Test from different networks:**
   - Test from different ISPs if possible
   - Test on mobile networks
   - Verify error messages are helpful for diagnosing connectivity issues

3. **Verify Retry Works:**
   - If a transient network error occurs, Retry should resolve it
   - Multiple retries should work (idempotent)

### ✅ Cross-Browser Testing

Test in multiple browsers to ensure compatibility:

- [ ] **Chrome** (primary target for WebGPU)
  - Should show error panel correctly
  - Clipboard API should work
  - WebGPU detection should work

- [ ] **Edge** (secondary WebGPU support)
  - Should show error panel correctly
  - Clipboard API should work
  - WebGPU detection should work

- [ ] **Safari** (optional - may not support WebGPU)
  - Should show WebGPU error panel gracefully
  - Buttons should be accessible

- [ ] **Firefox** (optional - WebGPU not yet supported)
  - Should show WebGPU error panel
  - All buttons should be accessible

### ✅ Edge Cases & Accessibility

- [ ] **Very long error messages:**
  - Panel should remain usable and not overflow screen
  - Error message box should be scrollable

- [ ] **Rapid Retry clicks:**
  - Multiple rapid clicks on Retry should not cause duplicate initialization
  - Should be safe to click repeatedly

- [ ] **Copy button without Clipboard API:**
  - Older browsers might not support `navigator.clipboard`
  - Currently code uses Clipboard API without fallback
  - Users should still see readable error message for manual copy

- [ ] **Keyboard accessibility:**
  - Tab through buttons (should focus Retry and Copy buttons)
  - Enter key should activate focused button
  - Escape should be documented (optional feature)

- [ ] **Mobile/Touch:**
  - Error panel should be readable on mobile screens
  - Buttons should be large enough to tap (current: 10px padding + border)
  - Consider testing on phone-sized viewport (375px width)

## Debugging Tips

### If error panel doesn't appear:
1. Check browser console for JavaScript errors
2. Verify CSS is loaded: inspect `.error-panel` in DevTools
3. Check that `#loading` div exists in DOM
4. Verify error is actually thrown during `GroupChatManager.initialize()`

### If error category is wrong:
1. Check the raw error message in panel
2. Review error categorization logic in `GroupChatManager.getErrorCategory()`
3. Add console.log to see which category is detected

### If Retry doesn't work:
1. Check console for errors during retry
2. Verify `initApp()` function is properly scoped
3. Check that new progress section is created in DOM
4. Monitor Network tab to see if model download is attempted

### If Copy button doesn't work:
1. Check browser console for clipboard errors
2. Some browsers require user gesture (click) to access clipboard
3. Try pasting (Ctrl+V / Cmd+V) to verify clipboard has content
4. Verify running over HTTPS (required for Clipboard API on production)

## Test Results Checklist

Document your testing results:

```
Local Dev Testing:
✓ Network error panel appears
✓ Retry button recovers from error
✓ Copy button copies error message
✓ WebGPU error shows correct message
✓ Long errors display correctly
✓ No console errors

Production Testing:
✓ Error panel appears on actual network errors
✓ Fix suggestions are helpful
✓ Retry resolves transient errors

Cross-Browser:
✓ Chrome: Works correctly
✓ Edge: Works correctly
✓ Safari: Works correctly (if tested)
✓ Firefox: Shows appropriate WebGPU error

Accessibility:
✓ Keyboard navigation works
✓ Mobile viewport readable
✓ Tab order logical
```

## Known Limitations

1. **Clipboard API requires HTTPS** - Copy button won't work on HTTP (localhost over HTTPS would work)
2. **Copy button doesn't have explicit fallback** - Older browsers without Clipboard API will see console error but can still read the raw error message
3. **No automatic retry** - User must manually click Retry; we don't retry automatically after a delay

## Future Improvements

- [ ] Add automatic retry after X seconds for transient errors
- [ ] Add fallback for clipboard without Clipboard API (manual select)
- [ ] Add error filtering to hide sensitive information
- [ ] Add help link/documentation for each error category
- [ ] Add analytics to track which errors are most common
