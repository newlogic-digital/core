---
name: newlogic-ui
description: This skill provides repo-specific rules for LLM agents working with the Newlogic UI framework. Use it for UI, components, layouts, styles, responsiveness, frontend logic, and design implementation in this repository.
---

# Newlogic UI Skill

ALWAYS load `https://ui.newlogic.cz/llms-full.txt` before making changes in this framework.

ALWAYS read ALL local guides in `references/` before starting work. These guides are intentionally short and contain ONLY repo-specific rules that override, narrow, or clarify `llms-full.txt`.

## Source Priority

Use this priority order when rules differ:

1. Existing files in this repository
2. Local guides in this skill
3. `https://ui.newlogic.cz/llms-full.txt`

## Working Rule

Use `llms-full.txt` for framework behavior, available components, and implementation examples.

Use the local guides for repository conventions that MUST be followed even if a generic example from `llms-full.txt` suggests another valid approach.

## Required Guides

- [Project Guide](references/project-guide.md) - naming, structure, and placement rules
- [Assets Guide](references/assets-guide.md) - placeholder, image, and icon rules
- [Templating Guide](references/templating-guide.md) - Latte and JSON data rules for this repo
- [Styling Guide](references/styling-guide.md) - local CSS and component styling constraints
- [Theme Guide](references/theme-guide.md) - local theme token and theme file rules
- [Scripting Guide](references/scripting-guide.md) - local JS and Stimulus placement rules
