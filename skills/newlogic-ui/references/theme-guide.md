# Theme Guide

## Theme Files

- Main website theme tokens live in `src/styles/theme/main.css`.
- Keep website theme defaults in `@theme`.
- Extend the existing token system before inventing component-local hardcoded values.

## Local Rules

- ALWAYS prefer semantic tokens over raw values in templates and components.
- If the design introduces a new shared color, spacing, or layout default, add or adjust the token in `src/styles/theme/main.css`.
- Reuse existing tokens such as `primary`, `main`, `body`, and status colors before creating new ones.
- Keep theme changes centralized instead of scattering hardcoded values across multiple component files.

**Common token usage:**

```html
<div class="bg-primary text-primary-foreground">Primary Button</div>
<div class="bg-main text-main-foreground">Dark Section</div>
<div class="max-w-(--container-width)">Constrained content</div>
<div class="x-button accent-main">Primary text</div>
```
