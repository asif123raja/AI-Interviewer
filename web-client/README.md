# Web Dashboard Architecture (Next.js)

This directory contains the user-facing web dashboard.

## Core Libraries Used
- **`next/app` (App Router)**: Fast Server-Side Rendering (SSR) for the Analytics grids and Interview feedback metrics.
- **`tailwindcss`**: Modern, highly maintainable utility styling for the beautiful UI components.
- **`firebase/auth`**: Web SDK for verifying Users alongside the NestJS Backend.
- **`stripe` (Checkout)**: The React Stripe SDK for processing credit cards on the Web Dashboard (instead of RevenueCat which handles App Stores).

## Folder Structure
```text
src/
├── app/
│   ├── layout.tsx          # Global Shell, Navbars, Themes
│   ├── page.tsx            # Landing Page (Hero, Core Features)
│   ├── dashboard/          # Protected Route (Requires Firebase Login)
│   │   ├── loading.tsx     # SSR Skeletons
│   │   ├── page.tsx        # Overall historical charts (Confidence vs Anxiety trends)
│   ├── practice/           # Video/Voice Recording Web Component
│   │   ├── page.tsx        # The WebCam interface (uses MediaDevices API)
│   ├── report/[id]/        # Individual Analysis Route
│   │   ├── page.tsx        # Renders the detailed JSON breakdown from the AI
└── components/             # Tailwind Buttons, Navbar, Modals
```
