# Synthetic Test Sites

This directory contains sanitized local copies of competitor pages for testing the change detection system.

## Directory Structure

```
test-sites/
├── [competitor-name]/
│   ├── pricing/
│   │   ├── before.html
│   │   └── after.html
│   ├── features/
│   │   ├── before.html  
│   │   └── after.html
│   ├── blog/
│   │   ├── before.html
│   │   └── after.html
│   ├── homepage/
│   │   ├── before.html
│   │   └── after.html
│   └── about/
│       ├── before.html
│       └── after.html
```

## Usage

Test sites are served at: `http://localhost:3005/test-sites/[competitor]/[page-type]/[version].html`

Examples:
- `http://localhost:3005/test-sites/testsaas/pricing/before.html`
- `http://localhost:3005/test-sites/testsaas/pricing/after.html`

## Creating Test Sites

Use the test site generator to create sanitized versions of live pages:
1. Extract competitor pages with inline CSS and localized assets
2. Remove external scripts, tracking, and dependencies  
3. Generate paired before/after versions for change testing
4. Validate that pages load properly in isolation

## Benefits

- **Isolated Testing**: No network dependencies or rate limits
- **Consistent Results**: Stable test environment
- **Dynamic Behavior**: JS/CSS still execute for realistic testing
- **Version Control**: Track test site changes over time