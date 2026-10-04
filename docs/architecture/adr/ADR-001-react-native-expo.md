# ADR-001 — REACT NATIVE + EXPO

## Status
ACCEPTED

## Context

Project Connect requires:

- iOS;
- Android;
- rapid iteration;
- shared business logic;
- strong native capabilities;
- camera;
- notifications;
- deep linking;
- secure storage;
- app-store subscriptions;
- image upload;
- future realtime/video capability.

The initial engineering organization is expected to remain relatively small.

Maintaining two independent native teams would materially slow launch.

---

## Decision

Use:

```text
React Native
+
Expo
+
TypeScript
```

as the primary consumer mobile platform.

Use the latest stable production-compatible Expo SDK at project bootstrap.

---

## Rationale

This combination provides:

- one primary mobile codebase;
- native iOS/Android deployment;
- mature ecosystem;
- efficient OTA-compatible JavaScript updates;
- strong developer tooling;
- practical access to native SDKs;
- reduced staffing requirements;
- strong compatibility with Claude-assisted development.

---

## Alternatives Considered

### Native Swift + Kotlin

Advantages:

- maximum platform control;
- best access to bleeding-edge native APIs.

Rejected for V1 because:

- two implementations;
- duplicated QA;
- slower iteration;
- larger engineering cost.

---

### Flutter

Advantages:

- excellent cross-platform rendering;
- strong performance.

Rejected because:

- additional Dart skill requirement;
- React/TypeScript ecosystem aligns better with planned web/admin/backend stack;
- less shared language across product surface.

---

### PWA / Mobile Web

Rejected because Project Connect requires stronger support for:

- push;
- camera;
- secure storage;
- app-store billing;
- native UX;
- deep links.

---

## Consequences

Positive:

- shared mobile codebase;
- faster feature delivery;
- common TypeScript talent pool.

Negative:

- some advanced native features may require custom native modules;
- Expo SDK upgrade discipline is required.

---

## Risks

- dependency incompatibility;
- native module limitations;
- delayed support for newest OS capabilities.

---

## Mitigation

- stay current with Expo;
- avoid obscure native libraries;
- isolate provider integrations;
- use Expo development builds when custom native code is required.

---

## Reversal Conditions

Reconsider only if:

- essential product capability cannot be delivered reliably;
- severe performance limitation is proven;
- product requires deeply platform-specific behavior;
- native-team scale makes independent apps strategically superior.

---

## Implementation Rules

- no unmanaged ad-hoc native code;
- no dependency added without compatibility review;
- app features must use approved shared design system;
- business logic should remain outside UI components.

---

## Claude Code Constraints

Claude Code may not:

- eject from Expo casually;
- introduce Flutter/native app alternative;
- add unsupported native libraries without justification;
- duplicate iOS/Android business logic unnecessarily.
