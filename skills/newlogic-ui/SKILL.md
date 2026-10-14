---
name: newlogic-ui
description: This skill provides repo-specific rules for LLM agents working with the Newlogic UI framework. Use it for UI, components, layouts, styles, responsiveness, frontend logic, and design implementation in this repository.
---

# Newlogic UI Skill

ALWAYS load `https://ui.newlogic.cz/llms.txt` before making changes in this framework. It is the index of the Newlogic UI docs and its links are relative to `https://ui.newlogic.cz`. Then load ONLY the pages relevant to the task, e.g. `https://ui.newlogic.cz/docs/components/button.md` when working with `x-button` or `https://ui.newlogic.cz/docs/usage.md` for the project structure. Do NOT load `llms-full.txt`.

ALWAYS read ALL local guides in `references/` before starting work. These guides are intentionally short and contain ONLY repo-specific rules that override, narrow, or clarify the Newlogic UI docs.

## Source Priority

Use this priority order when rules differ:

1. Existing files in this repository
2. Local guides in this skill
3. Newlogic UI docs (`https://ui.newlogic.cz/llms.txt` and the pages it links to)

## Working Rule

Use the Newlogic UI docs for framework behavior, available components, and implementation examples.

Use the local guides for repository conventions that MUST be followed even if a generic example from the docs suggests another valid approach.

## Required Guides

- [Project Guide](references/project-guide.md) - naming, structure, and placement rules
- [Assets Guide](references/assets-guide.md) - placeholder, image, and icon rules
- [Templating Guide](references/templating-guide.md) - Latte and JSON data rules for this repo
- [Styling Guide](references/styling-guide.md) - local CSS and component styling constraints
- [Theme Guide](references/theme-guide.md) - local theme token and theme file rules
- [Scripting Guide](references/scripting-guide.md) - local JS and Stimulus placement rules

## Verification

Before reporting the work as done:

- `npm run lint` MUST pass.
- `npm run build` MUST pass. It compiles the Latte templates and requires PHP.
- Generated `+.css` / `+.js` files are up to date and committed, see the Scripting and Styling guides.
- If a command cannot run in your environment, say so instead of claiming the work is verified.
