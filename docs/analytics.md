# Google Analytics 4 — 3D Box Studio

This document describes how GA4 is implemented on [3dboxstudio.com](https://3dboxstudio.com), every custom event, how to test, and how to build funnels in GA4 Admin.

## Architecture overview

| Layer | Location | Role |
|-------|----------|------|
| Enablement policy | `src/lib/analytics/policy.ts` | Single `GA_ENABLED` rule for loader + custom events |
| gtag loader | `src/components/GoogleAnalytics.tsx` | One controlled gtag.js init (`send_page_view: false`) |
| SPA pageviews | `src/components/AnalyticsPageView.tsx` | Explicit `page_view` + `page_context` per permitted navigation |
| Event API | `src/lib/analytics/core.ts` | `trackEvent(name, params)` + typed helpers |
| Attribution | `src/components/AttributionCapture.tsx` | First-touch UTM/referrer → httpOnly cookie (signup only) |
| Studio CTAs | `src/components/StudioLink.tsx` | `studio_cta_clicked` + session entry context for `studio_open` |

**There is a single GA implementation.** Do not add gtag snippets, GTM containers, or a second measurement ID.

### Who owns `page_view`?

| Event | Owner | When |
|-------|-------|------|
| `page_view` | `AnalyticsPageView` | Once per permitted client navigation (explicit `trackPageView`) |
| `page_context` | `AnalyticsPageView` | Same cycle as `page_view` |

gtag is initialized with **`send_page_view: false`**. The loader does **not** rely on GA4 Enhanced Measurement history tracking for SPA pageviews.

**GA4 Admin:** Disable **Page changes based on browser history events** in Enhanced Measurement for this stream (or accept possible duplicate pageviews from Enhanced Measurement if left enabled). The app sends explicit SPA pageviews; history-based auto tracking is redundant and can race on admin navigations.

### Initialization

```tsx
// app/layout.tsx
<GoogleAnalytics />   // gtag loader — only when GA_ENABLED and not on /admin
<AnalyticsPageView /> // explicit page_view + page_context
```

### Shared enablement policy (`GA_ENABLED`)

| Condition | gtag loads? | Events send? |
|-----------|-------------|--------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` empty | No | No |
| `NODE_ENV=development` and debug off | **No** | **No** |
| `NODE_ENV=production` | Yes (non-admin) | Yes (non-admin) |
| `NEXT_PUBLIC_ANALYTICS_DEBUG=true` | Yes (non-admin) | Yes (non-admin) |

**Localhost cannot pollute production GA** unless `NEXT_PUBLIC_ANALYTICS_DEBUG=true` with a real measurement ID.

### DebugView

When `NEXT_PUBLIC_ANALYTICS_DEBUG=true`:

- Console logs: `[Analytics] event_name { ... }`
- `GA_ENABLED` is true in development
- gtag config includes `{ debug_mode: true, send_page_view: false }`
- Events appear in GA4 **Admin → DebugView**

Debug mode is **off by default** and never enabled in production unless the env var is set.

---

## Admin exclusion

Admin routes (`/admin`, `/admin/*`) are excluded at three layers:

1. **Loader** — `GoogleAnalytics` does not mount on admin routes (no gtag on direct admin loads)
2. **Synchronous path guard** — `trackEvent()` reads `window.location.pathname` and returns immediately (no debug log, no send) on admin paths
3. **Route tracker** — `AnalyticsPageView` returns before emitting `page_view` / `page_context` on admin paths
4. **Defense in depth** — `window['ga-disable-G-XXXXXXXX'] = true` when pathname is admin (after gtag was loaded on a prior public page)

---

## Event deduplication

| Mechanism | Events protected |
|-----------|------------------|
| Route tracker (`routeTracking.ts`) + rAF cleanup | `page_view`, `page_context` |
| `sessionStorage` per design session | `design_started`, `design_customized` (per category) |
| `studioOpenTrackedRef` per `BoxDesigner` mount | `studio_open` |
| `templateInitRef` | Skips initial template dropdown render |

### `page_view` / `page_context` frequency

- Fire **once per actual client navigation** to a permitted URL
- **Re-fire** when returning to the same URL after navigating away (`/blog/x` → `/studio` → `/blog/x`)
- **Do not** double-fire from React Strict Mode (rAF + effect cleanup clears in-flight key)
- **Never** fire on `/admin` or `/admin/*`

### `studio_open` frequency

- Fire **once per Studio workspace entry** (`BoxDesigner` mount, auth resolved, session ready)
- **Re-fire** when leaving Studio and returning
- **Do not** fire during auth loading, on the auth gate, or on rerenders within the same mount

### `template_selected` parameters

Payload order ensures the **newly selected** template wins over stale React state:

```ts
{
  ...studioParams(ctx),           // user_status, etc.
  template_type: <selected id>, // always the new selection
  template_name: <selected id>,
  template_category: "box_preset",
  box_type: <selected id>,
}
```

---

## `design_completed` — not implemented

Removed: first cloud save fired immediately after `artwork_uploaded` via auto-save, duplicating `project_saved`.

**Core activation funnel:**

`session_start` → `studio_open` → `design_started` → `artwork_uploaded` → `design_customized` → `export_clicked` → `export_completed`

Use `project_saved` separately for cloud persistence.

---

## Key Events (GA4 Admin)

Mark **`export_completed`** only as the primary Key Event.

---

## Testing

```bash
npm run test          # vitest unit tests
NEXT_PUBLIC_ANALYTICS_DEBUG=true npm run dev  # DebugView QA
```

### Verification checklist

- [ ] No `gtag/js` on localhost without `NEXT_PUBLIC_ANALYTICS_DEBUG=true`
- [ ] Exactly one explicit `page_view` per permitted navigation
- [ ] No `page_view` or custom events on `/admin`
- [ ] `template_selected` records the newly selected template ID
- [ ] Returning to the same URL after leaving fires `page_view` again
- [ ] Re-entering Studio fires `studio_open` again

---

## Files

| File | Purpose |
|------|---------|
| `src/lib/analytics/policy.ts` | `GA_ENABLED`, path helpers |
| `src/lib/analytics/gtag.ts` | Controlled gtag init (`send_page_view: false`) |
| `src/lib/analytics/core.ts` | `trackEvent` + admin guard |
| `src/lib/analytics/pageview.ts` | Explicit `page_view` |
| `src/lib/analytics/routeTracking.ts` | Route dedupe state machine |
| `src/components/GoogleAnalytics.tsx` | gtag script loader |
| `src/components/AnalyticsPageView.tsx` | SPA `page_view` + `page_context` |
