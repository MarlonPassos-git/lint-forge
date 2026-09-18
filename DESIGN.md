---
version: alpha
name: Gumroad-Inspired Neo-Brutalist Devtool
description: Desktop React design system for a dense Biome rule review tool with Gumroad-inspired neo-brutalist surfaces.
colors:
  primary: "#151515"
  secondary: "#4c463d"
  tertiary: "#d33b53"
  neutral: "#f6f1e8"
  surface: "#fffdf7"
  canvas: "#f4efe3"
  warning: "#f4c542"
  danger: "#e85d5d"
  off: "#d6d1db"
  reveal: "#cfe4f4"
  code-surface: "#151515"
  code-text: "#f9f1dd"
  gumroad-pink: "#ff90e8"
  gumroad-purple: "#90a8ed"
  gumroad-green: "#23a094"
  gumroad-orange: "#ffc900"
  gumroad-red: "#dc341e"
  gumroad-yellow: "#f1f333"
  gumroad-violet: "#b23386"
  gumroad-dark-gray: "#242423"
typography:
  headline-lg:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: 34px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0px
  headline-md:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: 0px
  body-md:
    fontFamily: '"Trebuchet MS", sans-serif'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0px
  label-sm:
    fontFamily: '"Trebuchet MS", sans-serif'
    fontSize: 11px
    fontWeight: 800
    lineHeight: 1
    letterSpacing: 0px
  control-md:
    fontFamily: '"Trebuchet MS", sans-serif'
    fontSize: 14px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: 0px
  code-md:
    fontFamily: '"Cascadia Code", Consolas, monospace'
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0px
rounded:
  none: 0px
  sm: 0px
  md: 0px
  lg: 0px
spacing:
  hairline: 1px
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 18px
  xl: 24px
  panel: 18px
  workspace-gap: 18px
  desktop-max: 2200px
components:
  shell:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: 18px
  panel:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: 18px
  card-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: 0px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.control-md}"
    rounded: "{rounded.none}"
    padding: 12px
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.control-md}"
    rounded: "{rounded.none}"
    padding: 12px
  chip-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: 7px
    height: 24px
  decision-off:
    backgroundColor: "{colors.off}"
    textColor: "{colors.primary}"
    typography: "{typography.control-md}"
    rounded: "{rounded.none}"
    padding: 8px
    height: 36px
  decision-warn:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.primary}"
    typography: "{typography.control-md}"
    rounded: "{rounded.none}"
    padding: 8px
    height: 36px
  decision-error:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.primary}"
    typography: "{typography.control-md}"
    rounded: "{rounded.none}"
    padding: 8px
    height: 36px
  reveal-tab:
    backgroundColor: "{colors.reveal}"
    textColor: "{colors.primary}"
    typography: "{typography.control-md}"
    rounded: "{rounded.none}"
    padding: 10px
  text-area:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.code-md}"
    rounded: "{rounded.none}"
    padding: 12px
  code-output:
    backgroundColor: "{colors.code-surface}"
    textColor: "{colors.code-text}"
    typography: "{typography.code-md}"
    rounded: "{rounded.none}"
    padding: 14px
  setup-menu:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: 14px
  sound-preview-off:
    backgroundColor: "{colors.off}"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: 4px
  sound-preview-info:
    backgroundColor: "{colors.gumroad-purple}"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: 4px
  sound-preview-warn:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: 4px
  sound-preview-error:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.none}"
    padding: 4px
  gumroad-accent-sample:
    backgroundColor: "{colors.gumroad-pink}"
    textColor: "{colors.primary}"
    typography: "{typography.control-md}"
    rounded: "{rounded.none}"
    padding: 12px
  gumroad-success-sample:
    backgroundColor: "{colors.gumroad-green}"
    textColor: "{colors.primary}"
    typography: "{typography.control-md}"
    rounded: "{rounded.none}"
    padding: 12px
  gumroad-info-sample:
    backgroundColor: "{colors.gumroad-purple}"
    textColor: "{colors.primary}"
    typography: "{typography.control-md}"
    rounded: "{rounded.none}"
    padding: 12px
  gumroad-warning-sample:
    backgroundColor: "{colors.gumroad-orange}"
    textColor: "{colors.primary}"
    typography: "{typography.control-md}"
    rounded: "{rounded.none}"
    padding: 12px
  gumroad-danger-sample:
    backgroundColor: "{colors.gumroad-red}"
    textColor: "{colors.surface}"
    typography: "{typography.control-md}"
    rounded: "{rounded.none}"
    padding: 12px
  gumroad-highlight-sample:
    backgroundColor: "{colors.gumroad-yellow}"
    textColor: "{colors.primary}"
    typography: "{typography.control-md}"
    rounded: "{rounded.none}"
    padding: 12px
  gumroad-violet-sample:
    backgroundColor: "{colors.gumroad-violet}"
    textColor: "{colors.surface}"
    typography: "{typography.control-md}"
    rounded: "{rounded.none}"
    padding: 12px
  gumroad-dark-sample:
    backgroundColor: "{colors.gumroad-dark-gray}"
    textColor: "{colors.code-text}"
    typography: "{typography.control-md}"
    rounded: "{rounded.none}"
    padding: 12px
---

## Overview

Gumroad-inspired neo-brutalism adapted for a desktop developer tool. The UI should feel like a practical rule-review workbench: dense, direct, high-contrast, and intentionally handmade without becoming decorative.

The Gumroad influence is the blunt construction: black outlines, unblurred offset shadows, flat saturated accents, simple controls, and a warm off-white body background. The local product twist is editorial-dev: serif headings give the deck a review-card identity, while monospace areas keep configuration work clear.

This is not a marketing landing page style. Use the playful brutalist language only where it helps task flow, decisions, and scan speed.

Source basis from the original Gumroad repository at commit `e8956980848e5b75a7740d86d2c217fa2f7defe3`:

- `app/javascript/stylesheets/_definitions.scss` is the primary configuration source. It defines `$unit: 1rem`, the six-color accent map, semantic states `success`, `danger`, `warning`, `info`, background names `primary`, `black`, `accent`, `filled`, spacer/font/radius/shadow scales, breakpoints, z-index levels, light and dark body backgrounds, border width, outline, form control sizing, and the `ABC Favorit` font stack.
- `app/javascript/stylesheets/tailwind.css` mirrors those values as Tailwind theme tokens: black, white, pink, purple, green, orange, red, yellow, violet, gray `#f4f4f0`, dark gray `#242423`, semantic foreground/background aliases, `--shadow`, `--shadow-lg`, product page width, sidebar grid, and asset variables.
- `app/javascript/stylesheets/_global.scss` applies global reset behavior: zero margin/padding, border-box sizing, max-width protection, vertical baseline, shared `--border`/`--outline`, full-height `html/body`, `overflow-wrap: anywhere`, body font smoothing, body background, heading scale, underlined links, and list spacing.
- `app/javascript/stylesheets/_font.scss` declares `ABC Favorit` regular, italic, bold, and bold italic font faces.
- `app/javascript/stylesheets/_colors.scss` owns foreground contrast helpers and WCAG relative luminance math for choosing black or white text over saturated colors.
- `app/javascript/stylesheets/_rich_text.scss` configures content rhythm: spacer-driven margins, list/blockquote offsets, figure handling, bordered code blocks, muted syntax, and hover copy affordances.
- `app/javascript/stylesheets/_email.scss` adapts the same token family for email constraints, including pink accent fallback, table-based layout, fixed max stack width, border/radius reuse, and comments documenting client limitations.
- `app/javascript/components/ui` provides the Gumroad UI kit layer: `Alert`, `Avatar`, `Calendar`, `Card`, `Checkbox`, `CodeSnippet`, `ColorPicker`, `DefinitionList`, `Details`, `Fieldset`, `FormSection`, `InlineList`, `Input`, `InputGroup`, `Label`, `Menu`, `PageHeader`, `Pill`, `Placeholder`, `ProductCard`, `ProductCardGrid`, `Radio`, `Range`, `Rows`, `Select`, `Sheet`, `StretchedLink`, `Switch`, `Table`, `Tabs`, and `Textarea`.
- `app/javascript/components/Button.tsx` uses bordered buttons, inherited font, hover `-translate-1`, hover hard shadow, and pressed shadow removal.
- `app/javascript/components/Modal.tsx` and `Popover.tsx` use bordered, rounded, shadowed surfaces with solid backdrops and compact spacing.
- `app/helpers/button_helper.rb` maps navigation buttons to semantic color names: `success`, `warning`, `info`, `danger`, `primary`, `accent`, and `filled`.

## Colors

The palette starts from the current app tokens and borrows Gumroad's public neo-brutalist accent family as optional expansion colors.

- **Primary (#151515):** Ink for text, borders, shadows, and primary buttons.
- **Secondary (#4c463d):** Muted body copy, captions, and supporting text.
- **Tertiary (#d33b53):** Local review accent for progress, eyebrows, and active metadata.
- **Neutral (#f6f1e8):** Warm panel surface.
- **Surface (#fffdf7):** Paper-like input, card, and modal surface.
- **Canvas (#f4efe3):** Page background. Keep it warm and quiet so black borders remain crisp.
- **Warning/Danger/Off/Reveals:** Decision semantics must stay stable: warn is amber, error is red, off is neutral-lavender, reveal tabs are light blue.
- **Gumroad accent samples:** Pink `#ff90e8`, purple `#90a8ed`, green `#23a094`, orange `#ffc900`, red `#dc341e`, yellow `#f1f333`, violet `#b23386`, gray `#f4f4f0`, and dark gray `#242423` come from the pinned Gumroad stylesheet theme. Use them as reference/accent colors, not as a mandate to recolor every control.

## Typography

Use three roles only:

- **Headlines:** Georgia or Times New Roman, bold, compact, editorial. Use for the app title, panel titles, and finish states.
- **Controls and labels:** Trebuchet MS, heavy weight, no letter-spacing. Use for chips, buttons, counters, and rule metadata.
- **Code:** Cascadia Code or Consolas. Use only for imported config and generated output.

Do not introduce soft SaaS fonts for this product unless the full visual system changes. If ABC Favorit is ever licensed and bundled, it can replace Trebuchet for controls, but keep the current serif/code split.

Gumroad's real app uses `ABC Favorit`, falling back through Avenir, Montserrat, Corbel, URW Gothic, and source-sans-pro. This project does not bundle that licensed face, so Trebuchet remains the local approximation for chunky control text.

## Layout

Desktop is the primary environment. Preserve the three-zone workbench:

- Left panel: imported base config.
- Center stage: rule documentation card and decision bar.
- Right panel: generated `biome.json`.

The review setup menu (filters and sound) is a header popover anchored to the button beside reset, so it never consumes workbench width.

Use a max width near `2200px`, tight outer padding, and `18px` workspace gaps. Panels should feel like fixed tools on a desk, not floating marketing cards. The center rule card should dominate the viewport and preserve iframe height.

On narrower screens, collapse to a single column while preserving control order. Hidden side panels become tall reveal tabs on desktop and horizontal reveal buttons on smaller screens.

## Elevation & Depth

Depth is mechanical, not atmospheric. Use hard black offset shadows with zero blur:

- Small controls: `3px 3px 0 #151515`.
- Panels: `5px 5px 0 #151515`.
- Main cards and modals: `8px 8px 0 #151515`.

Hover lifts by translating `-1px, -1px`. Pressed state collapses shadow and translates toward the offset. Avoid blurred shadows, translucent glows, gradient depth, and glassmorphism except for the existing bottom decision bar blur where it preserves iframe visibility.

## Shapes

Corners are square. The shape language depends on rigid rectangles, black outlines, and stable dimensions.

Use `0px` radius for panels, cards, inputs, buttons, chips, modals, progress bars, and iframe wrappers. If a third-party iframe or browser-native control introduces rounded internals, do not fight cross-origin content.

## Components

Gumroad's pinned `components/ui` kit uses a consistent recipe: `border border-border`, `bg-background`, inherited typography, compact `p-3`/`p-4` spacing, `gap-2`/`gap-4` grouping, semantic state colors, `shadow` on elevated/hovered surfaces, and responsive grid/table switches. This project adapts that grammar to a stricter square-corner desktop tool.

**Panels:** Warm neutral background, one-pixel black border, hard offset shadow, `18px` padding. Panels contain controls directly; do not put cards inside panels unless the item is a repeated list entry.

**Rule card:** Paper surface, one-pixel black border, larger hard shadow. Keep three docs iframes mounted but only one visible. Never crop, translate, or mutate cross-origin docs.

**Decision bar:** Fixed over the bottom of the rule card. Use equal-width buttons. Off stays neutral, Info blue-purple, Warn amber, Error red. The Error action must never be green.

**Buttons:** Square, bold, icon-plus-label where the command benefits from recognition. Primary actions are black with paper text. All buttons use hard shadows and active press movement.

**Alerts and status:** Follow Gumroad `Alert.tsx`: flex row, icon, border, light-tinted semantic background. Use success, danger, warning, info, or accent only when the state is meaningful.

**Cards and rows:** Gumroad `Card.tsx`, `Rows.tsx`, and `ProductCard.tsx` use bordered surfaces, internal dividers, `p-4`, and hover hard shadows. In this app, reserve those for repeated items or review cards; do not nest cards inside side panels.

**Forms:** Gumroad `Fieldset`, `Input`, `InputGroup`, `Select`, and `Textarea` use inherited font, `py-3 px-4`, full-width bordered inputs, state-colored borders, muted placeholders, and accent outlines on focus. Keep the same field hierarchy, but preserve the current monospace textarea treatment for JSON config.

**Selection controls:** Gumroad `Checkbox`, `Radio`, `Switch`, and `Range` use visible borders, accent fill when checked, disabled opacity, and stable dimensions. This app should keep native checkbox ergonomics in filters and only introduce custom controls if the workflow needs richer state.

**Menus, tabs, and sheets:** Gumroad `Menu`, `Tabs`, and `Sheet` use bordered backgrounds, compact padding, semantic danger rows, hover active backgrounds, and hard-shadow/slide-over surfaces. Use these patterns for future dense controls, not for decorative navigation.

**Tables and lists:** Gumroad `Table`, `DefinitionList`, `InlineList`, and `PageHeader` prefer scan-friendly grids, dividers, and responsive table-to-card behavior. Use these if the app gains rule summaries, decision history, or config diff views.

**Empty and code states:** Gumroad `Placeholder` uses dashed bordered blocks with centered copy; `CodeSnippet` uses bordered figures with caption and pre/code. Match that for empty filters and generated config snippets, while keeping generated `biome.json` as a high-contrast code surface.

**Filter chips:** Small, bordered, square labels with native checkboxes. They should read as controls, not tags or pills. They live in the review setup menu and wrap in a compact grid; group All/None actions are small bordered buttons with the same hover lift as other controls.

**Setup menu:** A header-anchored popover with the panel recipe: warm neutral surface, black border, offset shadow, `14px` padding, vertical sections separated by rules. It holds language filters, tool filters, and sound settings. The trigger sits beside the reset button, and expanded state inverts the button to ink.

**Sound previews:** A four-column row of small square buttons reserved for Off, Info, Warn, and Error. They mirror decision colors exactly so the preview reads as a decision control, and they disable when decision sounds are off.

**Text areas and code output:** Monospace, high contrast, square corners. Imported config uses paper surface; generated output uses ink surface with warm code text.

**Reset modal:** Destructive actions require a modal with Cancel and Reset everything. Do not require typing confirmation text.

## Do's and Don'ts

- Do keep the app dense, readable, and desktop-first.
- Do use black borders and hard shadows as the main visual grammar.
- Do anchor the review setup menu to its trigger and keep Escape and outside-click dismissal working with focus restored to the trigger.
- Do preserve semantic color meanings for Off, Info, Warn, and Error.
- Do keep iframe documentation normal and uncropped.
- Do prefer stable dimensions for panels, buttons, progress tracks, and decision controls.
- Don't turn this into a Gumroad landing page with oversized hero art.
- Don't use rounded SaaS cards, soft shadows, gradient blobs, or purple-blue gradient backgrounds.
- Don't add decorative color if it competes with decision states.
- Don't replace monospace config surfaces with prose-style typography.
- Don't add nested cards inside side panels.
