# Templating Guide

## Layout

- Use `src/templates/layouts/default.latte` unless the user explicitly asks for another layout.
- Do NOT create a custom layout when the default layout already supports the change.

## Data Sources

- Global data lives in `src/data/main.json`.
- In this repo, global layout sections are typically defined through `head` and `foot` arrays in `src/data/main.json`.
- Page data lives in `src/pages/*.json` and inherits global data.
- Section rendering is handled through `src/templates/utils/sections.latte`.
- Components referenced from page JSON are passed as `$control`.
- In this repo, `src/pages/*.json` is the composition layer for whole pages. Prefer assembling a page there instead of creating a wrapper `*Page.latte` component that just nests the entire page structure.
- Preserve the existing `head` and `foot` layout structure unless the user explicitly asks to change the layout contract.
- If a Figma page includes a site header or site footer, implement those designs in the existing `components/header/Header.latte` and `components/footer/Footer.latte` flow rather than moving them into `body`.

**Global layout data example:**

```json
{
  "head": [
    { "src": "components/header/Header.latte" }
  ],
  "foot": [
    { "src": "components/footer/Footer.latte" }
  ]
}
```

**Layout asset access example:**

```latte
<link n:foreach="$assets->css->all as $url" href="{$url|asset}" rel="stylesheet">
<script src="{$assets->js->main|asset}" type="module"></script>
```

## JSON Rules

- Do NOT store CSS class strings in JSON.
- JSON should contain semantic values and content, NOT presentation classes.
- If a template depends on an optional flag such as `active`, `dropdown`, or variant switches, define that flag explicitly in JSON.
- Keep repeated global UI data in `src/data/main.json` rather than duplicating it across page JSON files.

## Latte Rules

- Prefer direct access to existing variables such as `$control` and global layout data.
- Keep ad hoc `{var ...}` usage to a minimum.
- Use `{default}` for optional fallback values when needed.
- Do NOT combine `class` and `n:class` on the same element. Use one `n:class` expression that includes the base classes.

**`n:class` pattern:**

```latte
<a n:class="'base classes ' . ($isActive ? 'active' : 'idle')">Link</a>
```

**`{default}` pattern:**

```latte
{default $disabled = false}
```

## Components

- Put reusable page sections in `src/templates/components/`.
- Keep component file names in PascalCase.
- If a component is rendered from page JSON, assume `$control` is the primary input object unless the existing local pattern clearly does something else.
- Match the current folder conventions such as `(sections)`, `(ui)`, `header/`, `footer/`, `dialog/`, or `cookieconsent/` before introducing a new grouping.
- Do NOT create a monolithic page wrapper component when the page can be expressed as multiple body sections in JSON.
- Prefer one component per visible section or repeated block, then compose those sections from `src/pages/*.json`.
- If an existing component already matches the Figma element, reuse that component instead of creating a specific duplicate.
- If a Figma element maps to an existing `(ui)` component such as `Pagination.latte`, `Button`, `Dialog`, `Toast`, or similar, extend that existing component if needed; do NOT create parallel specific versions like `ArticlesPagination.latte` unless the user explicitly asks for a separate component.

**Page JSON to component flow:**

```json
{
  "body": [
    {
      "src": "components/HeroSection.latte",
      "heading": "Welcome",
      "buttonText": "Get Started"
    }
  ]
}
```

```latte
{foreach $sections as $section}
    {include ('../' . $section->src), control => $section}
{/foreach}
```

```latte
<section class="x-hero-section">
    <h1 n:if="isset($control->heading)">{$control->heading}</h1>
</section>
```

**Direct include pattern:**

```latte
{include 'components/Button.latte', text: 'Click me'}
```
