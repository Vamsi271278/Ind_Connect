# V1 DESIGN SYSTEM SPECIFICATION

## Product
**Project Connect**

## Version
**V1.0**

## Product Category
Verified Indian-diaspora social, community, event, and dating platform

## Platforms
- iOS
- Android
- Admin Web Console

## Status
Approved downstream artifact based on:
- Product Requirements Document
- Screen-by-Screen UX + Functional Specification
- Business Rules Catalog
- Data Model + Data Dictionary
- Authorization Specification
- Trust & Safety Operating Specification
- Notification Matrix
- Analytics Specification

---

# 1. PURPOSE

This document defines the visual and interaction system for Project Connect.

Its purpose is to ensure that every screen, component, state, and interaction feels like one coherent product regardless of:

- designer;
- engineer;
- platform;
- feature team;
- release date.

This specification governs:

- design tokens;
- color;
- typography;
- spacing;
- sizing;
- layout;
- radius;
- elevation;
- icons;
- motion;
- haptics;
- accessibility;
- component states;
- navigation;
- messaging;
- events;
- profile discovery;
- dating surfaces;
- verification;
- safety surfaces;
- subscription surfaces;
- dark mode;
- Figma organization;
- React Native component contracts.

---

# 2. DESIGN POSITIONING

Project Connect should feel:

- trustworthy;
- warm;
- premium;
- modern;
- welcoming;
- intentional;
- culturally neutral enough for a broad Indian-diaspora audience;
- socially sophisticated;
- safe.

It must not feel like:

- a matrimony portal;
- a wedding website;
- a noisy Indian classifieds app;
- a teenage dating app;
- a generic social-media clone;
- a neon hookup app;
- a sterile enterprise app.

---

# 3. CORE DESIGN PRINCIPLE

The visual system should communicate:

> **Belonging without pressure.**

Every design decision should help users feel:

- this platform is for real people;
- interaction is respectful;
- privacy is under their control;
- it is easy to understand someone's intent;
- nothing feels manipulative or desperate.

---

# 4. DESIGN PERSONALITY

Use these six personality pillars.

## 4.1 Human

Faces, names, interests, context, and natural copy matter more than abstract icons and gamification.

---

## 4.2 Calm

Avoid visual overload.

Screens should have clear hierarchy and generous whitespace.

---

## 4.3 Trustworthy

Verification, safety, permissions, and state changes should look serious and understandable.

---

## 4.4 Premium

Use deliberate typography, restrained color, polished spacing, and refined motion.

---

## 4.5 Social

The product should still feel alive and inviting.

Avoid excessive grayscale or financial-app austerity.

---

## 4.6 Intentional

The user should always understand:

- what mode they are in;
- why another person is recommended;
- what action they are about to take.

---

# 5. BRAND VISUAL DIRECTION

Recommended brand direction:

**Modern Global Indian**

Not:

- temple motifs;
- mandalas everywhere;
- saffron/green tricolor clichés;
- ornate wedding graphics;
- generic lotus logos.

The identity should feel globally usable while retaining warmth and cultural relevance through content, people, and experiences rather than decorative stereotypes.

---

# 6. COLOR PHILOSOPHY

The color system should use:

- one confident primary brand color;
- restrained accent colors;
- neutral backgrounds;
- highly legible text;
- semantic colors for system meaning.

Do not use multiple saturated colors competing for attention.

---

# 7. PRIMARY BRAND COLOR

Recommended direction:

A sophisticated deep indigo / blue-violet family.

Why:

- trust;
- modern technology;
- social warmth;
- premium feel;
- works well in light and dark modes;
- differentiated from Tinder red and Bumble yellow.

Example token direction:

```text
brand.50   very light tint
brand.100
brand.200
brand.300
brand.400
brand.500  primary interaction color
brand.600
brand.700
brand.800
brand.900  deepest shade
```

Exact HEX values should be finalized in visual design/Figma.

Do not hard-code raw HEX values in feature code.

---

# 8. SECONDARY ACCENT

Use a warm complementary accent sparingly.

Recommended direction:

soft coral / warm rose.

Use for:

- selected dating context;
- occasional highlight;
- illustration accents.

Do not use as universal CTA color.

---

# 9. NEUTRAL PALETTE

Define:

```text
neutral.0
neutral.25
neutral.50
neutral.100
neutral.200
neutral.300
neutral.400
neutral.500
neutral.600
neutral.700
neutral.800
neutral.900
neutral.950
```

Neutral palette must support:

- background;
- surface;
- borders;
- text;
- disabled states;
- dark mode.

---

# 10. SEMANTIC COLOR TOKENS

Never bind product meaning directly to raw colors.

Use:

```text
color.background.primary
color.background.secondary
color.surface.primary
color.surface.secondary

color.text.primary
color.text.secondary
color.text.tertiary
color.text.inverse
color.text.disabled

color.border.default
color.border.strong
color.border.focus

color.action.primary
color.action.primaryPressed
color.action.secondary

color.success.background
color.success.text
color.success.border

color.warning.background
color.warning.text
color.warning.border

color.error.background
color.error.text
color.error.border

color.info.background
color.info.text
color.info.border
```

---

# 11. DATING MODE COLOR

Dating should not look like a completely separate product.

Use a subtle contextual accent.

Example token:

```text
color.context.dating
color.context.datingSoft
```

Used for:

- intent badge;
- dating tab indicator;
- contextual icon.

Do not recolor the entire app red/pink.

---

# 12. VERIFICATION COLOR

Verification should use:

```text
color.verification
```

Recommendation:
brand-adjacent blue.

Avoid bright celebrity-social blue that implies popularity.

Meaning:

> identity process completed

not:

> endorsed or safe person.

---

# 13. SAFETY COLORS

Use:

- warning for caution;
- error/destructive for irreversible safety actions;
- neutral for report navigation.

Do not make reporting visually alarming before user chooses severity.

---

# 14. COLOR CONTRAST

All text and essential controls must meet WCAG 2.2 AA contrast expectations where applicable.

Minimum target:

- standard text: 4.5:1;
- large text: 3:1;
- UI components: 3:1.

---

# 15. TYPOGRAPHY PHILOSOPHY

Typography should feel:

- modern;
- highly readable;
- warm but professional.

Use system fonts unless a licensed brand font provides clear benefit.

Recommended mobile:

iOS:
SF Pro.

Android:
Roboto / system sans.

This improves:

- accessibility;
- rendering;
- performance;
- international scripts.

---

# 16. TYPE SCALE

Define semantic tokens.

```text
display.large
display.medium

heading.xl
heading.lg
heading.md
heading.sm

body.lg
body.md
body.sm

label.lg
label.md
label.sm

caption
```

---

# 17. RECOMMENDED MOBILE TYPE SIZES

Approximate starting system:

```text
Display Large      32 / 40
Display Medium     28 / 36

Heading XL         24 / 32
Heading LG         22 / 30
Heading MD         20 / 28
Heading SM         18 / 24

Body Large         17 / 24
Body Medium        16 / 22
Body Small         14 / 20

Label Large        16 / 20
Label Medium       14 / 18
Label Small        12 / 16

Caption            12 / 16
```

Final values should be tokenized.

---

# 18. FONT WEIGHTS

Recommended:

```text
Regular    400
Medium     500
Semibold   600
Bold       700
```

Avoid excessive bold text.

Semibold should handle most emphasis.

---

# 19. DYNAMIC TYPE

All critical text must scale with user accessibility settings.

Do not hard-code fixed-height text containers.

---

# 20. LINE LENGTH

For long explanatory text:

target approximately 45–75 characters per line where screen width permits.

Avoid edge-to-edge paragraphs.

---

# 21. SPACING SYSTEM

Use 4-point base grid.

Recommended spacing tokens:

```text
space.0   0
space.1   4
space.2   8
space.3   12
space.4   16
space.5   20
space.6   24
space.8   32
space.10  40
space.12  48
space.16  64
```

Avoid arbitrary values such as:
13px, 19px, 27px

unless component geometry genuinely requires it.

---

# 22. SCREEN HORIZONTAL PADDING

Default mobile content gutter:

**16–20pt**

Recommended initial:
20pt for premium spacious layout.

Dense screens:
16pt permitted.

---

# 23. VERTICAL RHYTHM

Standard section spacing:

24–32pt.

Major screen transitions:

32–40pt.

Do not stack unrelated content with only 8px gaps.

---

# 24. GRID

Mobile:

single-column primary layout.

Use:

- 4pt internal grid;
- screen gutter;
- consistent card widths.

Admin web can use 12-column responsive grid.

---

# 25. BORDER RADIUS

Recommended radius system:

```text
radius.none   0
radius.sm     6
radius.md     10
radius.lg     14
radius.xl     20
radius.full   999
```

---

# 26. RADIUS USAGE

Buttons:
10–14.

Inputs:
10–12.

Cards:
14–20.

Chips:
full or 16+.

Bottom sheets:
20+ top corners.

Avoid using different random radii per screen.

---

# 27. ELEVATION SYSTEM

Use elevation sparingly.

Most surfaces should rely on:

- background contrast;
- subtle borders.

Recommended:

```text
elevation.0
elevation.1
elevation.2
elevation.3
elevation.overlay
```

---

# 28. SHADOW PRINCIPLE

Avoid strong floating-card shadows.

Use light, diffuse shadows.

Dark mode should rely more on tonal surface separation than shadows.

---

# 29. ICONOGRAPHY

Use one consistent icon library.

Requirements:

- simple;
- rounded or balanced stroke;
- recognizable;
- platform-consistent.

Do not mix:

- filled icons;
- thin-line icons;
- cartoon icons

without semantic reason.

---

# 30. ICON SIZES

Recommended:

```text
icon.sm   16
icon.md   20
icon.lg   24
icon.xl   32
```

---

# 31. ICON BUTTON TARGET

Minimum interactive target:
44x44pt equivalent.

Icon itself may remain 20–24.

---

# 32. PHOTOGRAPHY

Profile photography is the most important visual content.

The design system must make people feel authentic.

Avoid:

- excessive image filters;
- artificial gradients over faces;
- tiny profile images.

---

# 33. PROFILE IMAGE RATIOS

Profile discovery cards:

Recommended:
4:5 portrait.

Profile detail:
4:5 or adaptive portrait carousel.

Avatar:
1:1.

---

# 34. PROFILE IMAGE CROPPING

Use face-aware crop where possible.

Never crop face aggressively.

Users control primary image positioning if technically practical.

---

# 35. IMAGE PLACEHOLDER

Before load:

- neutral skeleton;
- no generic silhouette that may imply gender.

---

# 36. DESIGN TOKEN ARCHITECTURE

Three levels recommended:

```text
Primitive Tokens
↓
Semantic Tokens
↓
Component Tokens
```

Example:

```text
purple.600
↓
color.action.primary
↓
button.primary.background.default
```

---

# 37. PRIMITIVE TOKEN EXAMPLE

```text
color.indigo.500
space.4
radius.lg
font.size.16
```

---

# 38. SEMANTIC TOKEN EXAMPLE

```text
color.text.primary
color.surface.primary
color.border.default
```

---

# 39. COMPONENT TOKEN EXAMPLE

```text
button.primary.background
button.primary.text
button.primary.radius
button.primary.height
```

---

# 40. NO RAW VALUES IN FEATURE CODE

Feature implementation should use tokens.

Bad:

```text
backgroundColor: "#6C4CF5"
```

Good conceptually:

```text
backgroundColor: theme.colors.actionPrimary
```

---

# PART I — BUTTONS

# 41. BUTTON VARIANTS

Required:

```text
Primary
Secondary
Tertiary/Text
Destructive
Icon
```

---

# 42. PRIMARY BUTTON

Use for one dominant action.

Examples:

- Continue
- Send Request
- Accept
- RSVP
- Upgrade

Height:
48–52pt.

---

# 43. PRIMARY STATES

```text
default
pressed
focused
disabled
loading
```

Loading state:

- spinner;
- preserve width;
- prevent duplicate tap.

---

# 44. SECONDARY BUTTON

Outlined or tonal.

Use for:

- Not Now
- Reset
- View Profile.

---

# 45. DESTRUCTIVE BUTTON

Used for:

- Block;
- Delete Account;
- Permanent destructive actions.

Do not use red for ordinary decline actions unnecessarily.

---

# 46. BUTTON LABELS

Use verbs.

Good:
**Send Request**

Bad:
**Submit**

unless context clearly defines submission.

---

# PART II — INPUTS

# 47. INPUT VARIANTS

- text;
- phone;
- textarea;
- search;
- numeric/OTP;
- select;
- date;
- autocomplete.

---

# 48. INPUT ANATOMY

```text
Label
Input Container
Leading Icon optional
Input Value
Trailing Action optional
Helper/Error Text
Character Counter optional
```

---

# 49. INPUT STATES

```text
default
focused
filled
error
disabled
read-only
loading
```

---

# 50. LABEL RULE

Never rely solely on placeholder as field label.

---

# 51. ERROR STATE

Show:

- border semantic error;
- error icon if helpful;
- concise explanatory text.

Do not use only red color.

---

# 52. PASSWORD INPUT

Not primary if phone OTP architecture used.

If introduced:
support reveal/hide.

---

# 53. OTP INPUT

6 digit.

Features:

- auto-advance;
- backspace navigation;
- OS autofill;
- paste full code;
- clear error after edit.

---

# PART III — CHIPS & SELECTORS

# 54. CHIP TYPES

- interest;
- language;
- filter;
- intent;
- status.

---

# 55. CHIP STATES

```text
default
selected
disabled
pressed
```

---

# 56. INTENT CHIPS

Intent chips need clear semantic icon + label.

Examples:

Friendship:
people icon.

Activities:
activity icon.

Networking:
briefcase/network icon.

Dating:
heart icon.

Avoid ambiguous color-only distinction.

---

# PART IV — CARDS

# 57. CARD TYPES

- person card;
- event card;
- request card;
- subscription card;
- info/safety card.

---

# 58. PERSON CARD

Mandatory anatomy:

```text
Profile Image

Name + Age where appropriate

Verification Badge

Location / Approx Distance

Shared Interest Chips

Intent Label

Primary CTA
```

---

# 59. PERSON CARD HIERARCHY

Priority order:

1. human identity;
2. connection relevance;
3. trust;
4. action.

Do not overload with ten fields.

---

# 60. PERSON CARD CTA

Preferred:
**View Profile**

Optional:
**Connect**

Do not use swipe-only behavior as core V1 interaction.

---

# 61. REQUEST CARD

Display:

- image;
- first name;
- verification;
- reason;
- intro snippet;
- shared context.

Buttons:

- Accept
- Decline

Accept visually primary.

Decline neutral, not destructive red.

---

# 62. EVENT CARD

Display:

- image;
- date/time;
- title;
- location;
- category;
- RSVP indicator;
- free/paid if applicable.

---

# PART V — BADGES

# 63. BADGE TYPES

```text
Verified
Intent
Premium
Status
Event Category
Safety/Admin Status internal
```

---

# 64. VERIFICATION BADGE

Use checkmark icon + label where space permits.

Tooltip/help:

> Profile verification completed.

Never say:
**Trusted User**

or:
**Safe User**

---

# 65. PREMIUM BADGE

Do not display premium status publicly by default.

Premium should be entitlement, not social status.

---

# PART VI — NAVIGATION

# 66. BOTTOM NAVIGATION

Five items:

```text
Discover
Events
Connections
Messages
Profile
```

---

# 67. BOTTOM NAV RULES

- fixed position;
- clear selected state;
- icon + label;
- unread badges only where useful;
- no hidden navigation items.

---

# 68. BADGE COUNTS

Connections:
show pending-request indicator/count.

Messages:
show unread count.

Cap visual count:

`99+`

---

# 69. TOP APP BAR

Supports:

- title;
- back;
- optional contextual action;
- notification icon.

Avoid excessive actions.

---

# 70. MODE SELECTOR

Discovery mode control:

```text
For You
Friends
Activities
Networking
Dating
```

Use horizontally scrollable segmented/tabs.

Selected state must be unmistakable.

---

# PART VII — MODALS / SHEETS

# 71. BOTTOM SHEET

Preferred for:

- connection composer;
- filter options;
- action menus;
- confirmation contexts.

---

# 72. FULL-SCREEN MODAL

Use for:

- complex verification;
- multi-step safety flow;
- subscription purchase only if warranted.

---

# 73. CONFIRMATION DIALOG

Use only for meaningful irreversible actions.

Examples:

- Block;
- Delete Account;
- Cancel paid event future.

Do not ask confirmation for harmless actions.

---

# PART VIII — TOASTS / SNACKBARS

# 74. TOAST

Use for simple success:

- Request sent;
- Profile updated.

Duration:
2–4 seconds.

---

# 75. SNACKBAR

Use when action has optional undo.

Example:
request declined if undo implemented.

---

# 76. ERROR BANNER

Use persistent inline error for:

- network outage;
- degraded services.

---

# PART IX — SKELETONS

# 77. SKELETON RULES

Use skeletons for:

- discovery cards;
- event lists;
- profile pages;
- message lists.

Skeleton geometry should match eventual content.

Avoid spinner-filled screens.

---

# PART X — EMPTY STATES

# 78. EMPTY STATE ANATOMY

- simple illustration/icon;
- title;
- explanation;
- CTA.

---

# 79. DISCOVERY EMPTY

Title:
**No new matches nearby right now**

Body:
Try expanding your distance or adjusting your interests.

Actions:
- Adjust Filters
- Invite Friends

---

# 80. MESSAGE EMPTY

Title:
**Your conversations will appear here**

CTA:
**Discover People**

---

# 81. EVENT EMPTY

Title:
**No events match your filters**

CTA:
**Clear Filters**

---

# PART XI — PROFILE EXPERIENCE

# 82. PROFILE DETAIL LAYOUT

Recommended:

```text
Photo Carousel
↓
Name / Age / Verification
↓
Location
↓
Primary Intent
↓
Bio
↓
Shared Interests
↓
Languages
↓
Profession if visible
↓
Connect CTA
```

---

# 83. STICKY CTA

On long profile detail, keep Connect/Message accessible through bottom sticky action area.

---

# 84. SHARED CONTEXT EMPHASIS

Use visual emphasis for:

- shared interests;
- same language;
- same event;
- same city context.

This explains recommendation relevance.

---

# PART XII — DISCOVERY EXPERIENCE

# 85. DISCOVERY CARD STYLE

Cards should feel like editorial profile previews, not gambling tiles.

No:
- giant swipe arrows;
- red X / green check;
- endless deck animation.

---

# 86. RECOMMENDATION EXPLANATION

Where useful show:

```text
3 shared interests
Both speak Telugu
New to DFW
```

This supports trust and meaningful decision-making.

---

# PART XIII — CONNECTION COMPOSER

# 87. CONNECTION COMPOSER LAYOUT

```text
Profile Summary
↓
Connection Reason
↓
Intro Message
↓
Character Counter
↓
Send Request
```

---

# 88. REQUEST REASON UI

Use single-select list/cards.

Do not use dropdown if only 4–8 options.

---

# 89. INTRO MESSAGE HELP

Optional suggestion:

> Mention something you have in common.

Do not auto-generate manipulative/flirtatious language.

---

# PART XIV — MESSAGING

# 90. MESSAGE BUBBLES

Use familiar but refined layout.

Own message:
brand-tonal surface.

Other:
neutral surface.

Avoid overly bright colors.

---

# 91. MESSAGE WIDTH

Max:
75–80% of conversation width.

---

# 92. TIMESTAMPS

Use grouped display.

Avoid timestamp under every tiny message.

---

# 93. DATE SEPARATORS

Examples:

- Today
- Yesterday
- Oct 4

---

# 94. MESSAGE COMPOSER

Components:

- text field;
- optional media button future;
- Send.

Send disabled when empty.

---

# 95. FAILED MESSAGE

Display:
small error indicator + **Retry**.

Do not silently fail.

---

# PART XV — EVENTS

# 96. EVENT DETAIL HERO

Include:

- image;
- category badge;
- date/time;
- title;
- venue.

---

# 97. RSVP CTA

States:

```text
RSVP
Going ✓
Join Waitlist
Cancelled
```

Keep state unambiguous.

---

# 98. EVENT SAFETY CARD

For dating/social events where appropriate:

Small contextual reminder:

> Meet in public and use your own transportation when possible.

Do not overwhelm every event.

---

# PART XVI — VERIFICATION

# 99. VERIFICATION EXPERIENCE

Verification should feel positive, not suspicious.

Use:

- simple shield/checkmark;
- concise benefits;
- transparent process.

---

# 100. VERIFICATION STATUS COMPONENT

States:

```text
Not Verified
In Review
Verified
Retry Needed
```

---

# 101. VERIFIED PROFILE DESIGN

Use subtle badge.

Do not elevate verified profiles with excessive gold/glow.

---

# PART XVII — SAFETY UI

# 102. REPORT ENTRY

Report must be in:

- overflow menu;
- conversation menu;
- event menu.

At most 2 taps away from relevant surface.

---

# 103. BLOCK UI

Block confirmation should explain consequences clearly.

Avoid:
`Are you sure?`

Prefer:
**Block Ananya?**

`They will no longer be able to find or contact you.`

---

# 104. REPORT CATEGORY UI

Use list with short descriptions for ambiguous categories.

Example:

**Harassment**
Repeated or abusive unwanted communication.

---

# 105. HIGH-SEVERITY REPORT COPY

Do not alarm user unnecessarily.

But for threats:

> If you believe you are in immediate danger, contact local emergency services.

---

# 106. SUSPENSION / BAN UI

Use calm neutral styling.

Do not use giant red screens.

Display:

- account status;
- general reason category;
- duration;
- appeal/support action.

---

# PART XVIII — PREMIUM

# 107. PREMIUM DESIGN PRINCIPLE

Premium should feel like additional utility, not social superiority.

Avoid:
- gold crowns;
- VIP badges visible to others;
- artificial prestige.

---

# 108. PAYWALL STRUCTURE

Recommended:

```text
Headline
↓
3–5 clear benefits
↓
Plan Selector
↓
Primary Purchase CTA
↓
Restore Purchases
↓
Terms / Billing Disclosure
```

---

# 109. PREMIUM BENEFIT LANGUAGE

Good:
**See more relevant profiles with advanced filters**

Avoid:
**Get more attention than everyone else**

---

# PART XIX — LIGHT MODE

# 110. BACKGROUND

Primary:
off-white / very light neutral.

Avoid pure white everywhere.

Use tonal surfaces to create depth.

---

# 111. CARD SURFACES

Primary card:
white or elevated neutral.

Border:
subtle neutral.

---

# PART XX — DARK MODE

# 112. DARK MODE PRINCIPLE

Dark mode is not simply inverted colors.

Use:

- deep neutral background;
- slightly lighter surfaces;
- softened brand saturation;
- reduced shadow reliance.

---

# 113. DARK MODE TOKENS

Semantic tokens should map independently.

Example:

```text
light:
color.surface.primary = neutral.0

dark:
color.surface.primary = neutral.900
```

Feature components should not care.

---

# 114. DARK MODE PHOTOS

Do not dim profile photos aggressively.

Image content remains natural.

---

# 115. DARK MODE SAFETY COLORS

Ensure warning/error colors retain accessible contrast without neon saturation.

---

# PART XXI — MOTION

# 116. MOTION PHILOSOPHY

Motion should:

- clarify hierarchy;
- show state change;
- support delight.

Not distract.

---

# 117. MOTION DURATION

Recommended:

```text
motion.fast       120–160ms
motion.standard   180–240ms
motion.slow       280–360ms
```

---

# 118. MOTION CURVES

Use platform-native easing or tokenized curves.

Avoid spring animation for every interaction.

---

# 119. REDUCED MOTION

Respect OS reduced-motion setting.

Replace large transitions with:

- fade;
- immediate state changes.

---

# 120. CONNECTION SUCCESS ANIMATION

Small subtle confirmation is acceptable.

Avoid heart explosions/confetti unless design direction intentionally supports it.

---

# PART XXII — HAPTICS

# 121. HAPTIC USE

Allowed:

- successful connection;
- RSVP confirmation;
- toggle selection where platform appropriate;
- destructive confirmation.

Do not haptic on every tap.

---

# 122. HAPTIC SEVERITY

Success:
light/medium.

Destructive:
warning haptic where native platform supports it.

---

# PART XXIII — ACCESSIBILITY

# 123. TOUCH TARGETS

Minimum:
44x44pt equivalent.

---

# 124. SCREEN READER

Every interactive control needs:

- accessible name;
- state;
- value.

Example:

`Dating mode, selected`

not just:
`Heart icon`

---

# 125. PROFILE IMAGES

Accessible label:

`Profile photo of Ananya`

Do not include age/other sensitive data in image label unless context requires.

---

# 126. CAROUSELS

Screen reader must announce:

`Photo 2 of 5`

---

# 127. BUTTON STATE

Disabled controls should be semantically disabled, not only visually faded.

---

# 128. COLOR INDEPENDENCE

Verification/status/error must have:

- icon;
- label;
- color.

Never color alone.

---

# 129. LARGE TEXT

Layout must tolerate at least typical accessibility text scaling without cutting essential actions.

---

# 130. FOCUS ORDER

Follow visual reading order.

Modal opening should move focus into modal.

Closing returns focus to triggering element where applicable.

---

# PART XXIV — RESPONSIVE BEHAVIOR

# 131. SMALL MOBILE WIDTHS

Minimum supported design width approximately:
320pt logical width.

No horizontal clipping.

---

# 132. LARGE PHONES

Use additional whitespace, not oversized content everywhere.

---

# 133. TABLETS

V1 mobile app may use centered max-width content.

Potential:

two-column discovery in tablet landscape only if polished.

Do not stretch profile text edge-to-edge.

---

# 134. ADMIN WEB

Responsive breakpoints should use design system rather than mobile values copied directly.

Recommended:

```text
sm
md
lg
xl
2xl
```

---

# PART XXV — SAFE AREA

# 135. MOBILE SAFE AREAS

Respect:

- notch;
- Dynamic Island;
- Android cutouts;
- home indicator;
- bottom gesture region.

No critical CTA behind system areas.

---

# PART XXVI — KEYBOARD BEHAVIOR

# 136. KEYBOARD AVOIDANCE

Inputs must remain visible when keyboard opens.

Especially:

- onboarding;
- connection composer;
- chat;
- report details.

---

# 137. RETURN KEY

Use semantic return types:

- Next;
- Done;
- Send;
- Search.

---

# PART XXVII — LOADING BEHAVIOR

# 138. BUTTON LOADING

When submitting:

- button disabled;
- spinner;
- no duplicate requests.

---

# 139. FULL-SCREEN LOADING

Use only when entire route depends on initialization.

Avoid during simple API requests.

---

# PART XXVIII — ERRORS

# 140. ERROR HIERARCHY

## Field Error
Specific input problem.

## Inline Error
Local component/API failure.

## Banner
Page-level recoverable problem.

## Full State
Resource cannot load.

## Blocking Modal
Only when immediate intervention required.

---

# 141. ERROR COPY

Good:
**We couldn't send your request. Try again.**

Bad:
**HTTP 500 Internal Server Error**

---

# PART XXIX — OFFLINE

# 142. OFFLINE BANNER

Show persistent subtle banner:

**You're offline**

Hide automatically when connectivity returns.

---

# 143. OFFLINE MESSAGE COMPOSER

Allow local pending message only if retry semantics are robust.

Clearly mark:
**Sending...**

then:
**Not sent**

---

# PART XXX — DESIGN SYSTEM COMPONENT API

React Native components should expose consistent typed props.

Example conceptual Button:

```text
<Button
  variant="primary"
  size="lg"
  loading={false}
  disabled={false}
  onPress={...}
>
  Continue
</Button>
```

---

# 144. NO FEATURE-SPECIFIC BUTTON COMPONENTS

Do not create:

```text
DatingButton
EventBlueButton
ProfilePurpleButton
```

Use variants/tokens.

---

# PART XXXI — COMPONENT CONTRACTS

# 145. Button

Props:

```text
variant
size
loading
disabled
iconStart
iconEnd
fullWidth
accessibilityLabel
onPress
```

---

# 146. TextField

Props:

```text
label
value
placeholder
helperText
errorText
required
keyboardType
maxLength
disabled
readOnly
leadingIcon
trailingAction
```

---

# 147. Chip

Props:

```text
label
selected
disabled
icon
onPress
```

---

# 148. PersonCard

Props:

```text
profile
context
sharedInterests
intent
verificationState
distanceLabel
primaryAction
secondaryAction
```

No internal network fetching.

---

# 149. EventCard

Props:

```text
event
rsvpState
compact
onPress
```

---

# 150. VerificationBadge

Props:

```text
state
size
showLabel
```

---

# 151. EmptyState

Props:

```text
icon
title
description
primaryAction
secondaryAction
```

---

# 152. ScreenHeader

Props:

```text
title
backAction
rightActions
subtitle
```

---

# PART XXXII — FIGMA FILE STRUCTURE

Recommended:

```text
00 — Foundations
01 — Tokens
02 — Components
03 — Patterns
04 — Mobile Screens
05 — Admin Screens
06 — Prototypes
07 — Archive
```

---

# 153. FIGMA FOUNDATIONS PAGE

Include:

- color;
- typography;
- spacing;
- radius;
- shadows;
- grid;
- icons;
- accessibility examples.

---

# 154. COMPONENT NAMING

Use hierarchical naming.

Examples:

```text
Button/Primary/Large
Button/Secondary/Medium

Input/Text/Default
Input/Text/Error

Card/Person/Standard
Card/Event/Standard

Badge/Verification/Verified
```

---

# 155. FIGMA VARIANTS

Every reusable component should use variants for states.

Example Button properties:

```text
Variant
Size
State
Icon
```

Avoid duplicating frames.

---

# 156. AUTO LAYOUT

All components should use Auto Layout.

Avoid hand-positioned static designs that engineers cannot translate responsively.

---

# 157. VARIABLES

Use Figma variables for:

- colors;
- spacing;
- radius;
- typography where supported;
- light/dark modes.

---

# PART XXXIII — DESIGN-TO-CODE MAPPING

Each Figma token must map to implementation token.

Example:

```text
Figma:
color/action/primary

Code:
theme.colors.action.primary
```

Maintain one mapping registry.

---

# PART XXXIV — DESIGN QA

# 158. VISUAL QA CHECKLIST

Before release verify:

- spacing tokens;
- typography;
- color;
- radius;
- icon size;
- component states;
- loading state;
- error state;
- dark mode;
- large text;
- safe area.

---

# 159. DEVICE MATRIX

At minimum visual QA:

- small iPhone;
- current standard iPhone;
- large iPhone;
- small Android;
- standard Android;
- large Android.

---

# PART XXXV — CONTENT DESIGN

# 160. COPY TONE

Use:

- warm;
- clear;
- respectful;
- direct.

Avoid:
- overly cute language;
- slang-heavy copy;
- corporate jargon.

---

# 161. CTA COPY

Prefer:
- Connect
- Send Request
- Accept
- RSVP
- Continue
- Try Again

Avoid:
- Submit
- Execute
- Confirm Action

unless context requires.

---

# 162. DATING COPY

Avoid:
- "Hot matches"
- "People who want you"
- "Score a date"

Use:
- Dating Matches
- People You May Connect With
- Interested in Dating

---

# PART XXXVI — PREMIUM COPY

# 163. PREMIUM PRINCIPLE

Communicate utility.

Example:

**Find more relevant people with advanced filters**

not:

**Become more desirable**

---

# PART XXXVII — EMPTY/ERROR ILLUSTRATIONS

# 164. ILLUSTRATION STYLE

If illustrations are used:

- minimal;
- modern;
- human;
- inclusive;
- flat or softly dimensional;
- not cartoonish childish.

---

# 165. CULTURAL REPRESENTATION

Representation should be broad.

Avoid:
- one-region stereotyping;
- one-language dominance;
- wedding-only imagery;
- traditional clothing on every person.

Show:
- urban professionals;
- diverse Indian diaspora;
- various ages 18+;
- modern and traditional contexts.

---

# PART XXXVIII — PROFILE PHOTO SAFETY UI

# 166. REJECTED PHOTO

Show specific but safe guidance.

Example:

**This photo can't be used**

`Choose a clear photo of yourself without contact information or promotional graphics.`

---

# PART XXXIX — PRODUCT MODE DIFFERENTIATION

# 167. SOCIAL MODE

Visual tone:
neutral + brand primary.

---

# 168. ACTIVITIES MODE

Can use subtle energetic accent.

---

# 169. NETWORKING MODE

Use professional neutral accent.

---

# 170. DATING MODE

Use contextual warm accent.

Still same design system.

---

# PART XL — STATE TOKENS

# 171. INTERACTION STATES

Every interactive component must support:

```text
default
hover (web)
pressed
focus
selected
disabled
loading
error
```

---

# PART XLI — FOCUS RING

Web/admin:
visible focus ring.

Mobile:
native accessibility focus and clear selected states.

---

# PART XLII — COMPONENT OWNERSHIP

Design-system components should be owned centrally.

Feature teams may compose but should not fork components casually.

---

# PART XLIII — VERSIONING

Component breaking change requires:

- version note;
- migration impact;
- affected screens.

---

# PART XLIV — DEPRECATION

Deprecated components remain available temporarily with warning.

Do not instantly delete components used across app.

---

# PART XLV — DESIGN SYSTEM PACKAGE

Recommended code structure:

```text
packages/design-tokens/      ← single source of tokens
packages/ui/
├── theme/
├── components/
├── icons/
├── hooks/
└── index.ts
```

> **Amended 2026-10-04 — [SPEC-RECONCILIATION](../architecture/SPEC-RECONCILIATION.md) R-23:** tokens live only in `packages/design-tokens`. `packages/ui` consumes `@project-connect/design-tokens` and does not contain a second `tokens/` implementation.

---

# PART XLVI — THEME TOKENS

Suggested object:

```text
theme.colors
theme.typography
theme.spacing
theme.radius
theme.elevation
theme.motion
theme.sizing
```

---

# PART XLVII — DARK MODE IMPLEMENTATION

Components consume semantic tokens only.

No:

```text
if (darkMode) use '#111'
```

inside every feature.

Theme provider resolves values centrally.

---

# PART XLVIII — COMPONENT TESTING

Core components require:

- unit/render tests;
- interaction tests;
- accessibility checks;
- visual regression where practical.

---

# PART XLIX — VISUAL REGRESSION

Recommended for:

- buttons;
- inputs;
- cards;
- navigation;
- modals;
- paywall;
- critical screens.

---

# PART L — DESIGN SYSTEM RELEASE GATE

Before feature development scales, core components must exist:

1. Theme
2. Typography
3. Button
4. TextField
5. Select/Chip
6. Avatar
7. VerificationBadge
8. PersonCard
9. EventCard
10. BottomNavigation
11. ScreenHeader
12. Modal/BottomSheet
13. EmptyState
14. Skeleton
15. Toast/Snackbar
16. InlineError
17. ConversationRow
18. MessageBubble

---

# PART LI — FIRST SCREEN DESIGN PRIORITY

Design these before secondary screens:

```text
Welcome
Onboarding
Discover
Person Profile
Connection Composer
Received Request
Message List
Conversation
Events
Event Detail
My Profile
Report
Block
```

These establish the main design language.

---

# PART LII — DESIGN ACCEPTANCE CRITERIA

A screen is not design-complete until:

- light mode defined;
- dark mode defined or explicitly deferred;
- loading state;
- error state;
- empty state where relevant;
- long-text behavior;
- keyboard state;
- accessibility labels;
- dynamic type consideration;
- navigation behavior;
- component references;
- spacing tokens;
- analytics CTA mapping.

---

# PART LIII — PRODUCT-SPECIFIC UX RULES FROZEN

1. No Tinder-style red/green swipe UI as core interaction.
2. No public premium-status badge.
3. Verification never implies "safe."
4. Dating uses contextual accent, not separate visual product.
5. Safety actions stay easy to find.
6. Exact location never visually exposed.
7. Decline is visually neutral.
8. Accept is primary.
9. Block/delete are destructive.
10. Message push previews default to privacy-first.
11. Profile cards prioritize relevance and trust.
12. Shared interests are visually emphasized.
13. Event attendance never visually implies romantic availability.
14. Premium UI communicates utility, not status.
15. No dark patterns in subscription or account deletion.

---

# PART LIV — DARK PATTERN PROHIBITIONS

Do not use:

- fake countdowns;
- hidden unsubscribe;
- misleading button contrast;
- preselected paid plans without clarity;
- confusing cancellation language;
- shame copy;
- deceptive "last chance" prompts;
- hard-to-find delete account.

---

# PART LV — SUBSCRIPTION UX RULE

The purchase CTA may be visually primary.

But:

- price;
- billing period;
- renewal behavior;
- cancellation

must be clearly understandable.

---

# PART LVI — ACCOUNT DELETION UX

Delete Account must be discoverable under Account Settings.

Do not bury it under support.

Confirmation may be strong, but cancellation path must remain clear.

---

# PART LVII — SAFETY UX PRIORITY

If visual beauty conflicts with:

- legibility;
- reporting access;
- consent;
- error clarity;
- safety

safety wins.

---

# PART LVIII — CLAUDE CODE DESIGN RULES

Claude Code must not:

- invent new colors;
- create arbitrary spacing;
- use hard-coded HEX in feature components;
- create duplicate buttons;
- mix icon libraries;
- create custom one-off cards without reviewing existing components;
- alter bottom navigation;
- make profile cards swipe-only;
- hide safety actions;
- use premium gold/crown social-status patterns;
- bypass semantic theme tokens;
- ignore dark mode;
- ignore accessibility.

Every new component must answer:

1. Does an existing component already solve this?
2. What design tokens does it use?
3. What states exist?
4. What accessibility behavior applies?
5. Is it reusable or feature-specific?
6. Does it support light/dark mode?
7. Does it require visual regression tests?

---

# PART LIX — DEFINITION OF DESIGN COMPLETE

A component or screen is design-complete only when:

1. Purpose defined.
2. Hierarchy clear.
3. Components identified.
4. Tokens used.
5. Interaction states defined.
6. Loading/error/empty states defined.
7. Accessibility reviewed.
8. Dark mode considered.
9. Responsive behavior defined.
10. Design-to-code mapping exists.
11. UX copy approved.
12. QA acceptance criteria documented.

---

# PART LX — FINAL DESIGN POSITION

Project Connect should visually communicate:

> **This is a place to meet real people intentionally and safely.**

The visual hierarchy should reinforce the product model:

```text
Person
↓
Shared Context
↓
Intent
↓
Trust
↓
Action
```

Not:

```text
Photo
↓
Swipe
↓
Gamification
```

The product should feel polished enough to command a paid subscription, warm enough to support friendship/community, and disciplined enough to earn trust in dating and offline meetings.

The design system should remain:

> **simple enough to scale, expressive enough to feel human, and strict enough that every feature still looks like Project Connect.**

---

# NEXT ARTIFACT

The next artifact should be:

## **V1 Technical / System Architecture Specification**

This is the point where we finally choose and justify:

- mobile framework;
- backend architecture;
- API style;
- database;
- realtime messaging;
- authentication;
- phone OTP;
- storage/CDN;
- push notifications;
- verification provider abstraction;
- subscription architecture;
- feature flags;
- analytics stack;
- trust & safety tooling;
- admin architecture;
- cloud infrastructure;
- environments;
- secrets;
- observability;
- cache;
- queues;
- CI/CD;
- disaster recovery;
- scalability;
- cost controls;
- security boundaries;
- deployment topology.

It should also produce the first full system architecture diagram and the exact V1 technology stack we will subsequently freeze through Architecture Decision Records.