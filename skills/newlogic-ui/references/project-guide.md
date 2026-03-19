# Project Guide

## Naming

- Use PascalCase for component files such as `Button.latte`, `HeroSection.latte`, `Reveal.js`, `Header.css`.
- Use kebab-case with `x-` prefix for component classes such as `x-button`, `x-hero-section`.
- ALWAYS check if the component class name matches the file name, e.g. `HeroSection.latte` and `x-hero-section` matches
- ALWAYS keep one primary `x-*` component per file.
- Use kebab-case for generic utility files such as `format-date.js` or `scrollbar.css`.

## Placement

- Latte components belong in `src/templates/components/`.
- UI component templates belong in `src/templates/components/(ui)/` when they are reusable UI building blocks.
- Section or layout groupings MAY use parentheses directories such as `(sections)` or `(layout)`.
- Component CSS belongs in `src/styles/components/`.
- Winduum-based UI component CSS belongs in `src/styles/components/(ui)/`.
- Component scripts belong in `src/scripts/components/`.
- Winduum-based UI controllers belong in `src/scripts/components/(ui)/`.

## Structure

- Match template, style, and script names when the same component exists across layers.
- Keep the repo structure aligned with existing files before introducing a new folder or naming pattern.
- If a pattern already exists in nearby files, ALWAYS follow that pattern instead of inventing a parallel one.
