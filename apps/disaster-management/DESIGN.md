---
name: "Smart Tha Pho — ระบบป้องกันและบรรเทาสาธารณภัย"
description: "Observed design system for the browser-local disaster operations prototype."
colors:
  accent: "#116536"
  navigation: "#104b2a"
  soft: "#e8f5e7"
  surface: "#f7faf6"
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
  danger-background: "#ffe5df"
  danger-text: "#9f3023"
  error-background: "#fff0eb"
  error-text: "#942d20"
  message-success-background: "#e7f6ec"
  message-success-text: "#175b31"
  selected-row: "#eef8ec"
  board-column: "#edf3ed"
  history-line: "#e4ede6"
  map-high-severity: "#b43e2e"
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
rounded:
  badge: "5px"
  field: "6px"
  control: "8px"
  board: "10px"
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
---

# Design System: Smart Tha Pho — Disaster Management

## Overview

This is an observed record of the approved Smart Tha Pho disaster operations interface, not a new identity proposal. It uses a forest-green navigation rail, pale working background, white bordered panels, Thai text, Prompt headings, Sarabun body text, and Phosphor interface icons. Information is presented in tables, a selected-incident detail panel, and separate map and status-board views.

The implemented surface is a functional browser-local prototype. Storage, emergency-channel, LINE, and GPS limitations remain visible; no visual treatment implies a production connection. The existing identity and surface choices are recorded in [PRODUCT.md](PRODUCT.md) and the [approved direction](../../docs/design/disaster-water-direction.md).

**Key Characteristics:**

- Forest-green navigation and action accents over white working panels.
- Readable Thai labels and explicit status text beside semantic color.
- Flat borders and tonal selection rather than ornamental depth.
- Shared operations controls with a task-specific incident detail panel.

Source authority: `packages/web-core/src/operations.css`, `OperationsShell.jsx`, this app's `src/presentation/disaster-operations.css`, `DisasterOperationsApp.jsx`, and `IncidentMap.jsx`. The YAML records reused implemented values; it does not establish new CSS variables. Existing captures checked: `qa-systems/disaster-desktop-final.png` and `qa-systems/disaster-mobile-detail.png`.

## Colors

### Primary

Forest green is the action accent and dark forest green anchors navigation. The pale green soft surface marks active navigation; the separate selected-row tone identifies the incident being inspected. These are the disaster overrides of the shared operations palette.

### Neutral

Dark blue-teal ink and muted blue-gray text are inherited from the shared shell. White panels sit on the pale green page surface; cool gray borders separate rows, fields, panels, and sections. The pale blue-gray table header is also shared rather than recolored for this app.

Warning, success, danger, and neutral badges combine background, text, and a written label. Error and success messages use separate message tones. The amber prototype strip is not an incident severity indicator. Map circles use the primary green, a separate high-severity red, and a white selected fill.

Observed inheritance is retained: informational text, table headers, text selection, and scrollbars still use the shared water-leaning blue values. The detail heading always uses the warning badge treatment, while list statuses use neutral badges and severity has its own badge. These are current implementation differences, not instructions to repair or expand the palette.

## Typography

Prompt is used for headings and the Smart Tha Pho brand; Sarabun is used for the working interface, with Tahoma and sans-serif fallbacks for body text. Both families are requested through the existing Google Fonts import. Heading weight is not explicitly declared in the heading rules; do not infer a new weight token from the font files requested by the import.

The frontmatter describes desktop roles. The page headline reduces to (28px) at the shared (1100px) breakpoint and (25px) at (760px); panel titles reduce to (19px) at the latter breakpoint. Helper text uses the small role. Incident detail definitions and history body copy use (15px). Paragraphs are capped at (75ch), except the inline disaster limitation notice.

Tables use tabular numerals. Dates are rendered using Thai locale formatting. Status, resource readiness, severity, and field labels remain text, not color-only meaning.

## Layout

The desktop shell has an (80px) sticky header and a fixed, scrollable (230px) side rail. Main content is offset by the rail, padded (26px 30px 48px), and capped at (1900px). At (1100px), the rail and offset reduce to (190px), main padding becomes (20px), and the page heading stacks. At (760px), navigation becomes a static horizontal scrolling row, the main offset clears, the page uses (16px) padding, and forms become one column. Header account text is hidden at the intermediate breakpoint; small screens retain icon controls.

The incident workspace uses `minmax(0, 1.55fr) minmax(340px, 1fr)` with a section-sized gap. At (1280px), the list/map and detail stack. Selecting an incident at that width or narrower scrolls to and focuses the detail panel; its (96px) scroll margin leaves room for the sticky header. The supplied mobile detail capture records this completed behavior.

The status board has three columns and the resource view has two; both collapse to one at (900px). Map height steps from (580px) to (480px) at (1280px) and (380px) at (900px). Data tables keep their own horizontal scroll wrappers. The minimum body width is (320px).

## Elevation & Depth

The operations shell and disaster panels define no box shadows. Depth comes from the dark rail, pale page, white panels, thin borders, and selected-row fill. The sticky header has stacking order (500); the map container uses (0), keeping its controls below shell content. Leaflet supplies its own map-control presentation; that is not a new Smart Tha Pho component style.

There are no authored transitions in the shared operations shell or disaster presentation stylesheet. The global operations reduced-motion query removes animation, transitions, and smooth scrolling inside the app.

## Shapes

Panels and the square brand mark share the panel radius. Buttons and navigation use the control radius; fields and notices use the field radius; badges are slightly tighter. Board columns use the distinct board radius. Borders are generally one pixel. Incident rows are full-width table rows rather than detached rounded cards; history and assignment sections are divided by lines.

## Components

### Buttons

Primary actions use the green accent, white text, a matching border, and the label role. Secondary actions use white, ink text, and the shared line border, changing to the soft tone on hover. Both have a (44px) minimum height. Disabled controls use opacity (0.55) and a not-allowed cursor. Focus uses an amber (3px) outline offset by (3px).

The source has no distinct primary-hover background: the primary class remains more specific than the generic button hover rule. This is recorded as existing behavior, not a newly designed state.

### Inputs / Fields

Inputs, selects, and textareas use the same white fill, control-line border, field radius, and minimum height as the source. Labels are placed above fields. The standard form is two columns on desktop and one on mobile. Assignment fields stack in the detail panel; its note field has a (90px) minimum height. Validation is communicated through native required constraints and the shared alert/status message blocks.

### Navigation

The rail includes the approved system title, text-and-icon menu buttons, and the prototype footer note. Active navigation has a pale green fill, dark green text, and `aria-current="page"`. The footer note is hidden when navigation becomes horizontal. Phosphor navigation icons are (22px); header controls use (19px) icons. No new raster navigation assets are used.

### Badges and messages

Badges pair text with neutral, warning, success, or danger treatments. They normally do not wrap; detail-panel badges explicitly allow wrapping. Error messages use `role="alert"`, success messages use `role="status"`. The persistent prototype strip remains distinct from task results.

### Panels, tables, and incident detail

Panel headings are separated from their bodies by a line. The standard body uses the panel spacing token and reduces to regular spacing on mobile. Table cells use (14px 16px) padding, reducing to (12px) on mobile. Incident row buttons have no border or fill and remain left aligned; the selected table row provides the selection signal.

The detail panel contains the incident ID and title, location, definition list, available-resource assignment, permitted next-status controls, and reverse-chronological history. Its tighter definition grid uses a (90px) label column. The selected detail panel is focusable for narrow-screen navigation.

### Map and status board

The map uses recorded incident coordinates, circle markers, text tooltips, and visible OpenStreetMap attribution. The selected marker is larger and white-filled. A notice states that background tiles require internet and that the view is not vehicle GPS. The board groups actual status text into three workflow columns; selecting a card returns to the incident workspace.

## Do's and Don'ts

### Do:

- Do retain the approved Smart Tha Pho identity, Thai system title, Prompt headings, and Sarabun working text.
- Do reuse the shared operations controls and pair status color with its written label.
- Do keep the browser-local and emergency-channel limitations visible.
- Do preserve the narrow-screen selection-to-detail focus and scroll behavior.

### Don't:

- Don't describe this prototype as live emergency dispatch, automatic LINE delivery, central storage, or vehicle GPS.
- Don't turn the map or status board into the default incident-inbox composition.
- Don't replace inherited tokens or normalize the documented palette and badge differences as a side effect of extending a screen.
- Don't use the generated design references as shipping backgrounds or raster assets; none were shipped for this extension.
