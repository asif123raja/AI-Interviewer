# AI Interview System - Full Architecture Guide

Welcome to the AI Interview System. This project is structured as a robust, industry-level microservices architecture designed to handle CPU-intensive Machine Learning tasks without blocking the main public-facing web or mobile APIs.

## 🏗 System Overview

The project is split into 4 distinct applications/services:

### 1. `api-gateway` (NestJS)
The core backend server. It handles standard user authentication, subscriptions, billing, and database transactions.
* **Why NestJS?** Strongly typed, highly scalable, and excellent for enterprise-level applications.
* **Role:** Enforces the limits (5 free voice interviews, 20 paid video interviews). Takes video upload URLs and pushes Jobs to the Redis Queue.
* **Key Files:**
    * `src/usage/usage.service.ts`: Contains the exact business logic for decrementing or verifying limits.
    * `src/auth/firebase-auth.guard.ts`: The middleware that intercepts Next.js/Flutter requests and verifies the Firebase JWT token securely.
    * `src/queue/queue.service.ts`: Sends the `videoUrl` and `userId` payload to the Redis Queue.
    * `prisma/schema.prisma`: The PostgreSQL Database Schema tracking Users, Device limits, Subscriptions, and Analytics.

### 2. `ml-service` (Python FastAPI)
The background machine learning worker.
* **Why FastAPI?** Native Python support, incredibly fast, easily integrates with PyTorch, OpenCV, and Deepgram SDKs.
* **Role:** Listens for webhook triggers or Redis jobs. Downloads the video, extracts audio text, maps facial expressions using OpenCV, and generates LLM feedback.
* **Key Files:**
    * `main.py`: The API router exposing the `/api/process-video` endpoint. Runs the ML pipeline in the background.
    * `worker.py`: The Heavy-Lifter. Contains logic for OpenCV frame extraction, Qdrant Vector DB uploads, and Deepgram Speech-to-Text.

### 3. `mobile-app` (Flutter)
The high-performance native mobile client.
* **Why Flutter?** Cross-platform native speeds (iOS + Android) with a single codebase. Beautiful UI capabilities.
* **Role:** Allows users to record themselves via mobile camera. Integrates RevenueCat for App Store / Play Store subscriptions.
* **Key Files:**
    * `lib/main.dart`: The UI entrypoint and navigation structure.
    * `lib/services/api_service.dart`: The crucial HTTP bridge. It extracts unique iOS/Android Device IDs to bypass login on the Free tier, and extracts Firebase JWTs for the Paid tier.

### 4. `web-client` (Next.js)
The frontend web application & dashboard.
* **Why Next.js?** Best-in-class React framework. SSR (Server-Side Rendering) for fast dashboard loads and high SEO.
* **Role:** The main portal for users to review their interview feedback, track their anxiety/confidence scores chronologically, and manage their subscription profiles using Stripe.
* **Key Files (See `web-client/README.md`)**

## 🧠 Dynamic Knowledge Engine (Custom Domains)
This system is dynamically adaptable and not locked to one specific type of interview.

- **Pre-set Domains & Subtopics**: Users can select predefined broad categories (e.g. `Engineering`, `Medical`, `UPSC`) and pinpoint their focus using subtopics (e.g. `ReactJS`, `Cardiology`, `CSAT`).
- **Custom Interviews**: If a domain is missing, users can bypass the presets by pasting a custom job description or prompt into the `customPrompt` payload. 
- **LLM Injection**: This contextual metadata flows directly from the Flutter App ➔ NestJS API ➔ Redis Queue ➔ Python FastAPI worker, where it is injected into the core LLM System Prompt to ensure the behavioral and technical feedback maps perfectly to the requested domain.

---

## 🚀 Data Flow Lifecycle
1. User clicks "Start Interview" on Mobile/Web.
2. App pings `api-gateway/interview/start-video`.
3. `api-gateway` checks DB. If `videoCount < 20`, allows. If over, returns `HTTP 429`.
4. User records video. App uploads video directly to Cloud Storage (AWS S3) to save bandwidth.
5. App passes the S3 URL to `api-gateway/interview/process-video`.
6. `api-gateway` puts the URL into Redis Queue and instantly returns `{ status: "processing" }` to the UI.
7. `ml-service` picks up the job, extracts frames, vectors, and analyzes audio.
8. `ml-service` saves Vectors in Qdrant and the human-readable JSON Report back to PostgreSQL.
9. Web Client Dashboard fetches PostgreSQL to display the final 10/10 AI Report to the user.

# 1. Navigate to the mobile app folder
cd "c:\Users\asifu\Documents\AI Deploy\ai-interview-system\mobile-app"
# 2. Fetch the newly added dependencies
flutter pub get
# 3. View available devices (Emulators, Windows Desktop, Chrome, etc.)
flutter devices
# 4. Run the app 
flutter run

---

## 🐳 Running with Docker (Containerization)

This repository is fully containerized. You can run all services (API Gateway, ML Service, Web Client, and Flutter Web App) together as a single unit using Docker Compose.

1. Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed and running on your system.
2. Open your terminal in the root of this repository.
3. Build and start all containers in the background:
   ```bash
   docker-compose up --build -d
   ```
4. Access the services:
   - **Web Dashboard (Next.js)**: [http://localhost:3001](http://localhost:3001)
   - **Mobile Web App (Flutter)**: [http://localhost:8080](http://localhost:8080)
   - **API Gateway (NestJS)**: [http://localhost:3000](http://localhost:3000)
   - **ML Service (FastAPI)**: [http://localhost:8000/docs](http://localhost:8000/docs)

To stop the containers and remove the network, run:
```bash
docker-compose down
```

## ⬆️ Uploading the Repository to GitHub (Single Unit)

To upload this entire architecture (all 4 sub-projects + Docker configuration) as a single "monorepo" unit to your GitHub account:

1. Initialize a new Git repository in the root directory:
   ```bash
   git init
   ```
2. Create a massive `.gitignore` in the root folder to avoid uploading heavy/dynamic dependencies:
   ```bash
   echo "node_modules/" >> .gitignore
   echo "dist/" >> .gitignore
   echo "__pycache__/" >> .gitignore
   echo "venv/" >> .gitignore
   echo ".env" >> .gitignore
   echo ".env.local" >> .gitignore
   echo ".next/" >> .gitignore
   echo "build/" >> .gitignore
   echo ".dart_tool/" >> .gitignore
   ```
3. Add all properly ignored files to the Git staging area:
   ```bash
   git add .
   ```
4. Commit the new containerized architecture:
   ```bash
   git commit -m "feat: Containerized ai-interview-system with Docker Compose"
   ```
5. Go to [GitHub.com](https://github.com/new) and click **New Repository**. Create an empty repository (do NOT initialize it with a README, .gitignore, or license).
6. Once the repo is created, link your local codebase to the GitHub repository (replace `<YOUR_USERNAME>` and `<REPO_NAME>` with your specific details):
   ```bash
   git remote add origin https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git
   git branch -M main
   ```
7. Finally, push the code up:
   ```bash
   git push -u origin main
   ```
