---
paths:
  - "apps/mobile/**"
  - "packages/ui/**"
  - "packages/design-tokens/**"
---

# Mobile Rules

- React Native + Expo + Expo Router.
- TanStack Query owns server state; Zustand is limited local/transient state.
- Use centralized/generated API client.
- Credentials use SecureStore.
- `packages/ui` consumes `packages/design-tokens`.
- Use semantic design tokens; do not create a second token system.
- Accessibility/loading/empty/error/unavailable states are required.
- Client eligibility/authorization is never final authority.
