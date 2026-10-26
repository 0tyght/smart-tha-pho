---
name: "Smart Tha Pho — ระบบมอนิเตอร์การใช้น้ำประปา"
description: "Observed design system for the browser-local water reconciliation prototype."
colors:
  accent: "#087ca7"
  navigation: "#07465b"
  soft: "#e7f6fc"
  surface: "#f5f9fa"
  ink: "#143946"
  muted: "#526e79"
  line: "#d8e5e9"
  white: "#fff"
  control-line: "#9fb6c0"
  table-header: "#f0f6f8"
  navigation-text: "#e7f4f8"
  navigation-note: "#cae2e5"
  navigation-hover: "#ffffff16"
  focus: "#db9a15"
  prototype-background: "#fff6df"
  prototype-text: "#80551a"
  notice-text: "#245364"
  badge-background: "#eaf0f3"
  badge-text: "#365a69"
  warning-background: "#fff1cf"
  warning-text: "#84540b"
  success-background: "#e2f4e9"
  success-text: "#1f653d"
  error-background: "#fff0eb"
  error-text: "#942d20"
  message-success-background: "#e7f6ec"
  message-success-text: "#175b31"
  output-bar: "#1599ca"
  usage-bar: "#19a291"
  meter-track: "#e9f3f6"
  diagram-surface: "#f8fcfd"
typography:
  headline:
    fontFamily: "Prompt, Sarabun, sans-serif"
    fontSize: "32px"
    lineHeight: 1.4
  title:
    fontFamily: "Prompt, Sarabun, sans-serif"
    fontSize: "21px"
    lineHeight: 1.4
  subtitle:
    fontFamily: "Prompt, Sarabun, sans-serif"
    fontSize: "18px"
    lineHeight: 1.4
  body:
    fontFamily: "Sarabun, Tahoma, sans-serif"
    fontSize: "16px"
    lineHeight: 1.55
  label:
    fontFamily: "Sarabun, Tahoma, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.55
  small:
    fontFamily: "Sarabun, Tahoma, sans-serif"
    fontSize: "14px"
    lineHeight: 1.55
  display:
    fontFamily: "Prompt, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.6
rounded:
  meter: "4px"
  badge: "5px"
  field: "6px"
  control: "8px"
  panel: "12px"
spacing:
  tight: "8px"
  control-gap: "10px"
  compact: "12px"
  row: "14px"
  regular: "16px"
  loose: "18px"
  section: "20px"
  panel: "22px"
  stack: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.soft}"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
  navigation-item:
    backgroundColor: "transparent"
    textColor: "{colors.navigation-text}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "13px 16px"
  navigation-item-active:
    backgroundColor: "{colors.soft}"
    textColor: "{colors.navigation}"
  badge-warning:
    backgroundColor: "{colors.warning-background}"
    textColor: "{colors.warning-text}"
    typography: "{typography.small}"
    rounded: "{rounded.badge}"
    padding: "4px 9px"
  panel:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.panel}"
  output-meter:
    backgroundColor: "{colors.output-bar}"
    rounded: "{rounded.meter}"
    height: "34px"
  usage-meter:
    backgroundColor: "{colors.usage-bar}"
    rounded: "{rounded.meter}"
    height: "34px"
---

# Design System: Smart Tha Pho — Waterworks Management

## Overview

This is an observed record of the approved Smart Tha Pho water operations interface, not a new identity proposal. It uses a dark-teal rail, pale working background, white bordered panels, Thai text, Prompt headings, Sarabun body text, and Phosphor interface icons. Summary figures, household reading tables, and round-review controls share the municipal operations shell.

The implemented surface is a functional browser-local prototype for volume reconciliation. The existing process diagram is retained as a separate code-native SVG illustration, not a new raster or live device view. The existing identity and surface choices are recorded in [PRODUCT.md](PRODUCT.md) and the [approved direction](../../docs/design/disaster-water-direction.md).

**Key Characteristics:**

- Dark-teal navigation and blue action accents over white working panels.
- Full volume figures, units, scoped dates, and tabular numerals.
- Flat borders and tonal selection rather than ornamental depth.
- A retained process illustration separated from the reconciliation calculation.

Source authority: `packages/web-core/src/operations.css`, `OperationsShell.jsx`, this app's `src/presentation/water-operations.css`, `WaterOperationsApp.jsx`, `src/waterworks-dashboard.css`, and `WaterTreatmentProcessDiagram.jsx`. The YAML records reused implemented values; it does not establish new CSS variables. Existing captures checked: `qa-systems/water-desktop-final.png` and `qa-systems/water-diagram-final.png`.

## Colors

### Primary

The operations accent is blue; the navigation rail is dark teal. The pale blue soft surface is used for active navigation, informational notices, secondary-button hover, and the active review step. Output and household usage use separate blue and teal bars with explicit labels and full figures.

### Neutral

Dark blue-teal ink and muted blue-gray text sit on white panels and a pale page surface. Cool gray borders divide panels, rows, and fields. The pale blue-gray table header provides a stable scanning band rather than a raised surface.

Warning and success badges pair color with written completeness or saved-state labels. Error and success messages use their separate message tones. The amber prototype strip identifies storage limitations, not water quantity or quality.

Existing palette coexistence is retained: the imported diagram stylesheet still defines its older `--water-*` ramp, muted, line, and surface values, while the new operations shell uses scoped `--ops-*` values. The frontmatter records the operations surface and comparison bars, not every illustration fill or unused legacy dashboard token. The retained diagram keeps its original multi-color equipment illustration; it is not a replacement operations palette.

## Typography

Prompt is used for headings, the Smart Tha Pho brand, and summary numbers; Sarabun is used for working text, with Tahoma and sans-serif fallbacks for the operations body. The existing Google Fonts imports request both families. Heading weight is not explicitly declared in the operations heading rules; do not infer a new weight token from the imported font weights.

The frontmatter describes desktop roles. The page headline reduces to (28px) at the shared (1100px) breakpoint and (25px) at (760px); panel titles reduce to (19px) at the latter breakpoint. The display role is the summary figure, not a marketing headline, and reduces to (24px) on mobile. Summary labels use (15px), helper text uses the small role, and paragraphs are capped at (75ch).

Tables and numeric inputs use tabular numerals. Volume columns are right aligned; native number fields are (128px) wide and right aligned. Display formatting uses Thai locale, up to two fractional digits, and an em dash for unavailable values. Units and dates remain visible with the figures. The retained SVG has its own compact equipment-label typography and is not the scale for new operational forms.

## Layout

The desktop shell has an (80px) sticky header and a fixed, scrollable (230px) side rail. Main content is offset by the rail, padded (26px 30px 48px), and capped at (1900px). At (1100px), the rail and offset reduce to (190px), main padding becomes (20px), and the page heading stacks. At (760px), navigation becomes a static horizontal scrolling row, the main offset clears, the page uses (16px) padding, and forms become one column. Header account text is hidden at the intermediate breakpoint; small screens retain icon controls.

The summary metrics are flex items separated by borders; mobile uses a two-column grid. The comparison row uses `150px minmax(100px, 1fr) 100px`; on mobile the bar moves beneath its label and value. The review view has a (210px) step column plus a flexible panel with a stack-sized gap. At (1000px), the steps move above the panel into a horizontal row; at (760px), they become a vertical list and the action buttons share the available row width.

Tables retain their own horizontal scroll wrappers; household readings paginate in groups of twelve. The process illustration remains displayed at (1100px) width, including mobile, within its own scroll container. This deliberately overrides the older diagram stylesheet's mobile hide rule. The minimum body width is (320px).

## Elevation & Depth

The new operations shell and working panels define no box shadows. Depth comes from the dark rail, pale page, white panels, thin borders, and active soft fill. The sticky header has stacking order (500). Legacy dashboard shadows are not part of the new shell.

The retained SVG illustration includes its original `plantShadow` filter: a drop shadow with offset (0, 6), standard deviation (5), flood color (#163e4c), and opacity (0.14). The wrapper removes the selected equipment glow and uses opacity (0.8) for selected equipment; inherited hover and keyboard-focus treatments remain. Pipe-flow animation is explicitly disabled in the reference wrapper. The operations reduced-motion query also disables animation and transitions throughout the app.

## Shapes

Panels and the square brand mark share the panel radius. Buttons and navigation use the control radius; fields and notices use the field radius; badges are slightly tighter. Comparison bars have the meter radius. Standard borders are one pixel. Tables remain continuous row structures, not detached cards. The retained illustration keeps its existing equipment geometry, (15px) outer SVG radius, and internal strokes rather than being normalized to operational controls.

## Components

### Buttons

Primary actions use the blue accent, white text, a matching border, and the label role. Secondary actions use white, ink text, and the shared line border, changing to the soft tone on hover. Both have a (44px) minimum height. Disabled controls use opacity (0.55) and a not-allowed cursor. Focus uses an amber (3px) outline offset by (3px).

The source has no distinct primary-hover background: the primary class remains more specific than the generic button hover rule. This is recorded as existing behavior, not a newly designed state.

### Inputs / Fields

Inputs, selects, and textareas use the same white fill, control-line border, and field radius as the source. Labels are above fields. The standard form is two columns on desktop and one on mobile. Household numeric inputs remain within the scrolling table, with saved, missing, and unsaved text states. Locked rounds disable reading and output controls. Unsaved-work and round-confirmation prompts use the browser's native confirmation UI; there is no custom modal design to extract.

### Navigation

The rail includes the approved system title, text-and-icon menu buttons, and the prototype footer note. Active navigation has a pale blue fill, dark-teal text, and `aria-current="page"`. The footer note is hidden when navigation becomes horizontal. Phosphor navigation icons are (22px); header controls use (19px) icons. No new raster navigation assets are used.

### Badges and messages

Badges pair the shared warning and success treatments with data-completeness or reading-state text. Error messages use `role="alert"`, success messages use `role="status"`. The persistent prototype strip remains distinct from task results. Incomplete or suspicious totals remain accompanied by their explanatory message rather than being presented as an unqualified final balance.

### Panels, tables, and review steps

Panel headings are separated from their bodies by a line. The standard body uses the panel spacing token and reduces to regular spacing on mobile. Table cells use (14px 16px) padding, reducing to (12px) on mobile. Summary values keep full numerals and units. The native meter bars supplement, not replace, those figures.

Review steps are an ordered list in a white bordered panel. The current step uses the soft fill and control radius. The review definition list aligns labels with values, and the final action displays the locked-round state when confirmation is complete.

### Retained process illustration

`WaterTreatmentProcessDiagram.jsx` is the retained code-native asset. The operations wrapper hides metric tags, level text, status pins, and the stage-button strip; the illustration remains separate from volume reconciliation. It includes equipment-selection interaction and the selected equipment name below it. Its heading and explanatory copy explicitly deny real telemetry/device connectivity and exclude pressure or quality readings from the new calculation. No shipping raster was created; generated mockups remain development references only.

## Do's and Don'ts

### Do:

- Do retain the approved Smart Tha Pho identity, Thai system title, Prompt headings, and Sarabun working text.
- Do keep full numbers, cubic-metre units, round dates, and area scope visible when comparing volume.
- Do reuse the shared operations controls and pair saved or completeness color with its written label.
- Do retain the process illustration as a separate, horizontally scrollable code-native reference.

### Don't:

- Don't label the water difference as money, proven leakage, pressure, or water quality.
- Don't present an incomplete or suspicious round as a confirmed balance.
- Don't describe browser-local storage or the retained illustration as a central database or live device connection.
- Don't normalize the older diagram palette into the operations tokens or replace the approved diagram as a side effect of extending a screen.
- Don't use the generated design references as shipping backgrounds or raster assets; none were shipped for this extension.
