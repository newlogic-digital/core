# Assets Guide

## Images

- Do NOT use assets from Figma unless the user explicitly asks for them.
- Instead, use the placeholder images below.
- For placeholder images use https://placehold.co/ (preferred by default) or https://picsum.photos/.
- NEVER reinvent or reconstruct the images from scratch. Either use a placeholder image as `img` or a Figma asset as `img`.
- Most content images SHOULD use the `x-image` wrapper.
- Put the aspect ratio utility on the `<img>` element, NOT on the wrapper.
- Transparent images SHOULD NOT use the `x-image` wrapper.

**Preferred markup:**

```html
<div class="x-image before:skeleton">
    <img class="aspect-4/3" src="https://placehold.co/800x600" loading="lazy" alt="">
</div>
```

**Transparent image markup:**

```html
<img class="aspect-3/2" src="https://placehold.co/300x200" loading="lazy" alt="">
```

## Icons

- ALWAYS use SVG for icons.
- Prefer `<use>` for reusable icons.
- If adding reusable outline icons, place them in `src/icons/outline/`.
- If adding reusable solid icons, place them in `src/icons/solid/`.
- Brand icons are available in `src/icons/simpleicons/`.
- Heroicons are already available through the build setup, so do NOT duplicate them in `src/icons/`.
- The `<use href="...">` symbol definitions are generated automatically by the build setup.
- Icon IDs SHOULD generally follow Figma naming when possible.
- Inline `<svg>` without `<use>` is allowed ONLY for one-off icons that will NOT be reused.

**Reusable icon examples:**

```html
<svg class="size-6">
    <use href="#icons-outline/hello"></use>
</svg>
```

```html
<svg class="size-6">
    <use href="#simpleicons-solid/facebook"></use>
</svg>
```

```html
<svg class="size-6">
    <use href="#heroicons-outline/academic-cap"></use>
</svg>
```

### Icon Strategy Summary

1. Heroicons via `<use href="#heroicons-*/*">`
2. Project reusable icons via `src/icons/outline`, `src/icons/solid`, or `src/icons/simpleicons`
3. Inline `<svg>` without `<use>` for one-off icons ONLY

## Example
You are about to translate the Figma output into this project.

### Step 1 – Figma handoff
- Figma output provide provides assets like this `<img alt="" className="absolute block max-w-none size-full" src={imgVector}` 
- with urls like this https://www.figma.com/api/mcp/asset/557d8c1d-efe3-42ad-bccb-e5db8ebd14e6
- You succefully identified a type of the asset as `image` or `icon` from the Figma output.

### Step 2 – Image
- You check the width and height of the image and decide if it is transparent or not.

#### If the user didn't ask to use Figma assets
- In this case you will use the placeholder image.
- You will use the correct width and height and aspect ratio.

```html
<div class="x-image before:skeleton">
    <img class="aspect-4/3" src="https://placehold.co/800x600" loading="lazy" alt="">
</div>
```

- If the image is transparent, you will use the following markup without the `x-image` wrapper:

```html
<img class="aspect-3/2" src="https://placehold.co/300x200" loading="lazy" alt="">
```

#### If the user explicitly asks to use Figma assets

- You downloaded the image from Figma and placed it in `src/assets/images`.
- You renamed the image to match the Figma asset name.
- You updated the markup to use the new image path.
- You will use the correct width and height and aspect ratio.

```html
<div class="x-image before:skeleton">
    <img class="aspect-4/3" src="/src/assets/my-new-image.jpg" loading="lazy" alt="">
</div>
```

### Step 2 – Icon
- You check the width and height of the icon and decide if it is a brand icon, heroicon or other icon.

- If you identify the icon as a brand icon, you will check if it is already available in `src/icons/simpleicons`.
- If it is not available, you will add it to `src/icons/simpleicons`.
- If it is available, you will use the existing icon.
- You will use the following markup in the HTML:

```html
<svg class="size-6">
    <use href="#simpleicons-solid/facebook"></use>
</svg>
```

- If you identify the icon as a heroicon, you will match the figma name to the heroicon name.
- You will use the following markup in the HTML:
```html
<svg class="size-6">
    <use href="#heroicons-outline/academic-cap"></use>
</svg>
```

