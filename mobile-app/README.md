# Mobile Client Architecture (Flutter)

This directory contains the cross-platform mobile application.

## Core Libraries Used
- **`device_info_plus`**: Extracts `deviceId` (unique per physical phone) to securely track the 5 free voice attempts locally without requiring the user to create an account.
- **`firebase_auth`**: Handles User Login (Google, Apple, Email) for the Paid Tier.
- **`purchases_flutter` (RevenueCat)**: Handles native App Store and Google Play subscriptions easily.
- **`http`**: Talks to the NestJS REST API Gateway.

## Folder Structure
```text
lib/
├── main.dart               # The app entrypoint and Root Navigation
├── services/               # API and System Level classes
│   └── api_service.dart    # Manages JWT tokens, limits overrides, and backend HTTP calls
├── screens/                # UI Pages
│   ├── dashboard.dart      # Shows analytics and triggers interview modes
│   ├── recording.dart      # Camera/Mic capturing screen
│   └── report.dart         # Displays the final AI JSON review
└── models/                 # Dart Data classes (User, InterviewReport)
```
