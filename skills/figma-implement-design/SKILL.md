---
name: figma-implement-design
description: Translate Figma nodes into production-ready code with 1:1 visual fidelity using the Figma MCP workflow (design context, screenshots, assets, and project-convention translation). Trigger when the user provides Figma URLs or node IDs, or asks to implement designs or components that must match Figma specs. Requires a working Figma MCP server connection.
---

# Implement Design

## Overview

This skill provides a structured workflow for translating Figma designs into production-ready code with pixel-perfect accuracy. It ensures consistent integration with the Figma MCP server, proper use of design tokens, and 1:1 visual parity with designs.

## Prerequisites

- Figma MCP server must be connected and accessible
- User must provide a Figma URL in the format: `https://figma.com/design/:fileKey/:fileName?node-id=1-2`
    - `:fileKey` is the file key
    - `1-2` is the node ID (the specific component or frame to implement)
- **OR** when using `figma-desktop` MCP: User can select a node directly in the Figma desktop app (no URL required)
- Project should have an established design system or component library (preferred)

### Step 1: Get Node ID

#### Option A: Parse from Figma URL

When the user provides a Figma URL, extract the file key and node ID to pass as arguments to MCP tools.

**URL format:** `https://figma.com/design/:fileKey/:fileName?node-id=1-2`

**Extract:**

- **File key:** `:fileKey` (the segment after `/design/`)
- **Node ID:** `1-2` (the value of the `node-id` query parameter)

**Note:** When using the local desktop MCP (`figma-desktop`), `fileKey` is not passed as a parameter to tool calls. The server automatically uses the currently open file, so only `nodeId` is needed.

**Example:**

- URL: `https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15`
- File key: `kL9xQn2VwM8pYrTb4ZcHjF`
- Node ID: `42-15`

#### Option B: Use Current Selection from Figma Desktop App (figma-desktop MCP only)

When using the `figma-desktop` MCP and the user has NOT provided a URL, the tools automatically use the currently selected node from the open Figma file in the desktop app.

**Note:** Selection-based prompting only works with the `figma-desktop` MCP server. The remote server requires a link to a frame or layer to extract context. The user must have the Figma desktop app open with a node selected.

### Step 2: Fetch Design Context

Run `get_design_context` with the extracted file key and node ID.

```
get_design_context(fileKey=":fileKey", nodeId="1-2")
```

This provides the structured data including:

- Layout properties (Auto Layout, constraints, sizing)
- Typography specifications
- Color values and design tokens
- Component structure and variants
- Spacing and padding values

**If the response is too large or truncated:**

1. Run `get_metadata(fileKey=":fileKey", nodeId="1-2")` to get the high-level node map
2. Identify the specific child nodes needed from the metadata
3. Fetch individual child nodes with `get_design_context(fileKey=":fileKey", nodeId=":childNodeId")`
4. Run `get_variable_defs(fileKey=":fileKey", nodeId="1-2")` to get the variable definitions for the child nodes

### Step 3: Resolve Code Connect Mappings

Run `get_code_connect_map` on the same top-level node before implementation starts.

```
get_code_connect_map(fileKey=":fileKey", nodeId="1-2")
```

This step is mandatory for a correct design-system handoff.

**Interpretation rules:**

- If `nodeId="1-2"` is a page, frame, or large section, treat the returned map as the authoritative list of mapped descendant components that MUST be preserved in the final handoff.
- Do NOT assume the explicit `CodeConnectSnippet` wrappers shown in `get_design_context` are the full list. A page-level `get_code_connect_map` may return many more mapped descendants.
- `CodeConnectSnippet` wrapper elements are never part of final code. Use only the inner snippet or the actual mapped component in the codebase.
- Do NOT rename Code Connect classes, collapse modifier classes into new aliases, or replace mapped snippet APIs with custom helper classes just because the implementation is standalone or the classes do not exist yet. Implement the missing styles behind the mapped contract instead.
- If you must diverge from the mapped markup or class API for technical reasons, STOP and get explicit user approval first. Explain the exact incompatibility and the minimal required deviation.

### Step 3: Capture Visual Reference

Run `get_screenshot` with the same file key and node ID for a visual reference.

```
get_screenshot(fileKey=":fileKey", nodeId="1-2")
```

This screenshot serves as the source of truth for visual validation. Keep it accessible throughout implementation.

### Step 4: Download Assets

Download any assets (images, icons, SVGs) returned by the Figma MCP server, BUT ONLY if the user specifically asks, otherwise skip this step.

**IMPORTANT:** Follow these asset rules:

- NEVER invent, redraw, approximate, reconstruct, or substitute assets that already exist in the Figma payload. If Figma provides an icon, SVG, image, or vector, use that original asset or exact markup. If you are about to replace an existing asset ALWAYS STOP AND ASK the user first.
- If the original Figma code already contains the asset markup, preserve or translate that exact asset instead of recreating it by hand.
- Assets are served through the Figma MCP server's built-in assets endpoint
- If the user or other skill specifies to use placeholder assets, or icon packs, follow the provided guidelines and do NOT use figma assets.
- If an asset URL or payload cannot be consumed in the target runtime, treat that as a blocker for exact fidelity. Report the failure clearly and ask the user before recreating, approximating, or substituting the asset.

### Step 5: Translate to Project Conventions

Translate the Figma output into this project's framework, styles, and conventions.

**Key principles:**

- Treat the Figma MCP output (typically React + Tailwind) as a representation of design and behavior, not as final code style
- Treat Code Connect mappings as authoritative handoff requirements, not optional hints
- Review that the Tailwind utility classes are using the latest Tailwind conventions and patterns (MUST be version 4 and above)
- Always use Tailwind CSS v4. If the project does not already have a Tailwind build pipeline, use the browser build from `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4`. Do NOT use the legacy `https://cdn.tailwindcss.com` script.
- Reuse existing components (buttons, inputs, typography, icon wrappers) instead of duplicating functionality
- Search the codebase for mapped component sources before falling back to raw snippets
- Use the project's color system, typography scale, and spacing tokens consistently
- Respect existing routing, state management, and data-fetch patterns
- Preserve the original Figma layout and DOM structure as closely as possible. Do NOT redesign, simplify, restructure, or "improve" the layout unless responsiveness, technical constraints, or an explicit user request requires it.
- Responsiveness is the default exception: adapt layout only as much as needed for smaller breakpoints while keeping the desktop structure faithful to the original frame.
- If you are about to make a large structural change, invent missing structure, or replace original layout patterns with new ones, STOP and ASK the user first.
- If Code Connect provides raw HTML class contracts instead of framework components, preserve those contracts in the final output. Add CSS/Tailwind support for them if needed, but do not silently translate them into a different API.

### Step 6: Achieve 1:1 Visual Parity

Strive for pixel-perfect visual parity with the Figma design.

**Guidelines:**

- Prioritize Figma fidelity to match designs exactly
- Avoid hardcoded values - use design tokens from Figma where available
- When conflicts arise between design system tokens and Figma specs, prefer design system tokens but adjust spacing or sizes minimally to match visuals
- Follow WCAG requirements for accessibility
- Add component documentation as needed

### Step 7: Validate Against Figma

Before marking complete, validate the final UI against the Figma screenshot.

**Validation checklist:**

- [ ] Layout matches (spacing, alignment, sizing)
- [ ] Typography matches (font, size, weight, line height)
- [ ] Colors match exactly
- [ ] Interactive states work as designed (hover, active, disabled)
- [ ] Responsive behavior follows Figma constraints
- [ ] Assets render correctly
- [ ] Every descendant returned by `get_code_connect_map` on the top-level node is represented in the final code
- [ ] Accessibility standards met

### Step 8: Validate Against Browser

Use the /agent-browser skill if exists to validate the final UI in the browser. 

- If the skill does not exist, skip this step.
- If the skill command fails, ask the user to manually validate the UI in the browser and skip this step.

## Implementation Rules

### Component Organization

- Place UI components in the project's designated design system directory
- Follow the project's component naming conventions
- Avoid inline styles unless truly necessary for dynamic values

### Design System Integration

- ALWAYS use components from the project's design system when possible
- ALWAYS preserve mapped Code Connect components in the final handoff when they exist
- When using mapped Code Connect snippets directly, preserve their public contract exactly: same tags, same classes, same attributes, same variant/modifier naming.
- Map Figma design tokens to project design tokens
- When a matching component exists, extend it rather than creating a new one
- Document any new components added to the design system
- If any workaround would change assets, mapped component contracts, markup structure, or visual composition in a way that is not explicitly present in Figma, STOP and get user approval first.

## Examples

### Example 1: Implementing a Button Component

User says: "Implement this Figma button component: https://figma.com/design/kL9xQn2VwM8pYrTb4ZcHjF/DesignSystem?node-id=42-15"

**Actions:**

1. Parse URL to extract fileKey=`kL9xQn2VwM8pYrTb4ZcHjF` and nodeId=`42-15`
2. Run `get_design_context(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")` and `get_code_connect_map(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")`
3. Run `get_screenshot(fileKey="kL9xQn2VwM8pYrTb4ZcHjF", nodeId="42-15")` for visual reference
4. Download any button icons from the assets endpoint
5. Check if project has existing button component
6. If yes, extend it with new variant; if no, create new component using project conventions
7. Map Figma colors to project design tokens (e.g., `primary-500`, `primary-hover`)
8. Validate against screenshot for padding, border radius, typography

**Result:** Button component matching Figma design, integrated with project design system.

### Example 2: Building a Dashboard Layout

User says: "Build this dashboard: https://figma.com/design/pR8mNv5KqXzGwY2JtCfL4D/Dashboard?node-id=10-5"

**Actions:**

1. Parse URL to extract fileKey=`pR8mNv5KqXzGwY2JtCfL4D` and nodeId=`10-5`
2. Run `get_metadata(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId="10-5")` to understand the page structure
3. Identify main sections from metadata (header, sidebar, content area, cards) and their child node IDs
4. Run `get_design_context(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId=":childNodeId")` and `get_code_connect_map(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId=":childNodeId")` for each major section
5. Run `get_screenshot(fileKey="pR8mNv5KqXzGwY2JtCfL4D", nodeId="10-5")` for the full page
6. Download all assets (logos, icons, charts)
7. Build layout using project's layout primitives
8. Implement each section using existing components where possible
9. Validate responsive behavior against Figma constraints

### Code Quality

- Avoid hardcoded values - extract to constants or design tokens
- Keep components composable and reusable

## Best Practices

### Always Start with Context

Never implement based on assumptions. Always fetch `get_design_context`, `get_code_connect_map` and `get_screenshot` first.

### Original Assets First

If Figma already provides an asset, vector, or exact SVG/code representation, use that original source. Do NOT redraw icons, invent substitute artwork, or replace provided assets with lookalikes.

### Incremental Validation

Validate frequently during implementation, not just at the end. This catches issues early.

### Ask Before Large Inventions

If the implementation required inventing significant structure, changing layout patterns, or making large visual/architectural decisions that were not explicitly requested, STOP and ask the user before proceeding.

### Reuse Over Recreation

Always check for existing components before creating new ones. Consistency across the codebase is more important than exact Figma replication.

### Design System First

When in doubt, prefer the project's design system patterns over literal Figma translation.