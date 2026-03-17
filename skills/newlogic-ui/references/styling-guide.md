# Styling Guide

## General

- ALWAYS prefer Tailwind utilities before writing custom CSS.
- Use custom CSS for defaults, complex states, or component-specific behavior that should NOT live in templates.
- Follow nearby files before introducing a new styling pattern.
- Prefer responsive utilities such as `sm:`, `md:`, and `lg:` in templates. Use `@custom-media` only when writing custom CSS.

**Custom breakpoint example:**

```css
.my-component {
    padding: 1rem;

    @media (--media-lg) {
        padding: 2rem;
    }
}
```

## UI Components

- Winduum-based UI components live in `src/styles/components/(ui)/`.
- UI component defaults belong in their CSS files, NOT in template utility piles.
- Define base sizing, padding, radius, font defaults, and default colors in CSS for UI components.
- In templates, only small layout utilities are allowed on UI components, such as width, flex, gap, order, or spacing adjustments.
- Do NOT redefine a UI component's base look directly in templates.
- Do NOT restyle existing `x-*` UI components from a large level CSS file when the change is really a button, badge, control, field, pagination, or other UI-component concern.
- If a Figma page introduces a new shared UI look, extend the relevant file in `src/styles/components/(ui)/` instead of creating specific overrides from a parent component for that component.

## Non-UI Components

- Regular non-UI components SHOULD be styled entirely with Tailwind utilities in the template by default.
- For non-UI components, prefer Tailwind even when the template gets longer. A longer utility-based template is still preferred over creating component CSS too early.
- Create component CSS for non-UI components ONLY when there is styling logic that genuinely should not live in the template, such as complex selectors, state relationships, pseudo-element composition, browser-specific behavior, or similarly non-trivial logic that cannot be expressed cleanly with Tailwind utilities alone.
- Do NOT create component CSS just to group utilities, shorten markup, or move ordinary layout/spacing/typography rules out of the template.
- Treat non-UI component CSS as a true last resort. It should be used only in genuinely exceptional cases, not as a convenience or organizational preference.
- If a non-UI component reaches that exceptional threshold and needs CSS, follow the `data-part` pattern for internal styling instead of inventing extra internal class names.
- Avoid large level CSS files that absorb layout, typography, and UI and other component styling at the same time. If a page file starts becoming the source of truth for `x-*` components, move that logic back into `(ui)` CSS and keep the page mostly utility-driven.

## Tokens And Units

- ALWAYS use theme tokens such as `text-primary`, `bg-main`, or `text-body-foreground` before raw color values.
- If the design needs a new default token, update `src/styles/theme/main.css`.
- Do NOT use `px` units, except `1px` or `2px` borders when needed.

## Component Parts

- This section applies primarily to non-UI components when CSS is truly unavoidable.
- Use `data-part` for stylable internal parts.
- Do NOT create extra part class names such as `x-card-header` or `x-hero-content` when `data-part` is sufficient.
- For non-UI components, `data-part` is the required internal styling pattern whenever an exceptional CSS case is justified.

**Preferred part pattern:**

```html
<div class="x-my-component">
    <div data-part="header">...</div>
    <div data-part="content">...</div>
</div>
```

```css
.x-my-component {
    [data-part="header"] {
        /* complex styles */
    }
}
```

## Winduum Extensions

- Inspect the imported Winduum files in the component CSS to see which custom properties are available.
- Extend Winduum components through their existing imports and local CSS layers instead of re-implementing them from scratch.
