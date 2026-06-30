# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install      # install dependencies (first time only)
npm start        # start the server at http://localhost:3000
```

To restart after changes:
```bash
pkill -f "node server.js"; node server.js &
```

There are no tests or linter configured.

## Architecture

This is a two-file web app with no build step.

**`server.js` → `index.html`** is the entire data flow:

1. `index.html` collects job details (and optionally a photo) and POSTs to `/get-quote`
2. `server.js` builds a prompt and calls `claude-sonnet-4-6` via `@anthropic-ai/sdk`
3. If a photo was uploaded, it is sent as a base64 image block alongside the text prompt (Claude vision)
4. Claude returns a strict JSON object — `server.js` extracts it with a regex and forwards it to the browser
5. `index.html` renders the fields directly into the DOM (no framework)

### Claude prompt contract

The prompt in `server.js` instructs Claude to return **only** this JSON shape:

```json
{
  "price": 275,
  "whatIsIncluded": ["...", "...", "...", "..."],
  "estimatedDuration": "45–60 minutes",
  "timeSavings": "...",
  "surfaceCondition": "...",
  "summary": "..."
}
```

`surfaceCondition` is only populated when an image is included in the request; the frontend hides that section when it is an empty string.

### Pricing rules (kept server-side only)

- Standard residential: $0.15–$0.40/sq ft
- Driveway cleaning: $0.35–$0.60/sq ft
- Minimum job: $150
- Add-ons: $50–$100 each
- Photo showing heavy buildup → price toward the high end

These rules live only in the prompt string in `server.js` and are never sent to the browser.

### Environment

Requires a `.env` file at the project root:

```
ANTHROPIC_API_KEY=sk-ant-...
```

`dotenv` loads this before the Anthropic client is initialized. The `.env` file is gitignored.
