# Career Assets

This folder was originally designed to contain resume assets, but the current implementation embeds the resume content directly in the career page to avoid CORS issues.

## Current Implementation:

### Resume Content:
- Resume content is now embedded directly in `website/career.html`
- This avoids CORS issues when opening files locally (file:// protocol)
- Single source of truth for both web display and PDF generation

### Benefits:
- ✅ No CORS issues when developing locally
- ✅ No external file dependencies
- ✅ Instant loading
- ✅ Simplified maintenance

### PDF Generation:
- Download button creates a new window with print-optimized resume
- Uses browser's built-in print-to-PDF functionality
- Each page container becomes a physical PDF page
- Footers automatically position at bottom of pages

### Future Options:
If you prefer to maintain resume content in a separate file, you could:
1. Serve the website through a local web server (avoids CORS)
2. Use a build process to embed the content
3. Create a JSON-based resume system

## Customization:
Edit the embedded resume content in `website/career.html` to update your professional information. The dual layout system handles web vs PDF presentation automatically.