# Grind OS

A minimalist, high-performance personal momentum dashboard designed for structured daily and weekly progress tracking across professional and academic milestones.

---

## Overview

Grind OS provides an offline-first, distraction-free environment for monitoring core productivity pillars. Built with vanilla web standards and zero compilation dependencies, the application features a high-contrast monochrome design system with native Light and Dark theme support, local-first persistence, and real-time synchronization with Supabase PostgreSQL.

---

## Core Tracking Modules

The application provides dedicated tracking modules configured with daily or weekly evaluation cadences:

| Module | Cadence | Key Metrics & Data Model |
| :--- | :--- | :--- |
| **Job Applications** | Daily | Company, role, application date, recruitment pipeline status, offer probability score (0–100%), and interview notes. |
| **German Learning** | Daily | Daily retention log, vocabulary/grammar focus, next session objectives, and consecutive daily streak counter. |
| **Coding Upskill** | Daily | Dedicated study logs, core topic tags, invested hours counter, and reference links to repositories or solution write-ups. |
| **Custom Tracks** | Flexible | Modular track customization (enable or disable any track with one click) with per-user preference persistence. |

---

## Architecture and Design System

### Design Philosophy
- **High-Contrast Monochrome Aesthetic**: Inspired by clean, utilitarian typography and sharp tactile borders.
- **Dual-Theme Engine**:
  - **Light Mode**: Crisp white surfaces (`#ffffff`) paired with distinct black outlines (`#000000`).
  - **Dark Mode**: Blackish-grey slate background (`#121316`) paired with harmonized off-white outlines (`#d5d9e0`) to eliminate eye strain while preserving crisp visual hierarchy.
  - Instant theme toggle in the navigation header with automatic preference persistence in `localStorage`.
- **Zero Build Step**: Native ES module architecture utilizing vanilla JavaScript, HTML5 semantic elements, and CSS custom properties.

### Data Architecture
- **Offline-First Storage**: All state is managed locally via `localStorage` with isolated namespaces per user profile.
- **Cloud Database Synchronization**: Direct integration with Supabase (PostgreSQL) using the Supabase JavaScript client.
- **Export & Portability**: Complete 1-click JSON backup export and schema validation on restore.

---

## Quick Start

### Option 1: Direct File Access
Open `index.html` directly in any modern web browser. All local tracking functionality is active out of the box.

### Option 2: Local HTTP Server
Run a local static file server using Python or Node.js:

```bash
# Using Python
python server.py
# Server will listen on http://localhost:4242

# Or using Node.js
npx serve .
```

---

## Supabase Cloud Sync Setup

To synchronize logs across multiple devices (desktop, tablet, mobile):

1. **Create a Supabase Project**:
   Sign in to [supabase.com](https://supabase.com) and create a new project.

2. **Execute Database Schema**:
   Navigate to the **SQL Editor** in your Supabase dashboard, open [`schema.sql`](./schema.sql), and run the script to initialize tables, row-level security (RLS), and indexing.

3. **Retrieve Credentials**:
   Under **Project Settings** > **API**, locate:
   - **Project URL** (`https://<project-ref>.supabase.co`)
   - **Project API Keys** (`anon` public key)

4. **Connect Application**:
   Click **Cloud Sync** in the top navigation header of Grind OS, input your credentials, and select **Connect & Sync**.

---

## Deployment

Grind OS can be hosted statically on any CDN or hosting provider at zero cost:

### Vercel
1. Push the repository to GitHub or GitLab.
2. Import the repository in [vercel.com](https://vercel.com).
3. Leave build settings default (Static Site) and click **Deploy**.

### Netlify
1. Connect your repository via [netlify.com](https://netlify.com) or drag-and-drop the project directory into Netlify Drop.
2. Publish with no additional configuration required.

### GitHub Pages
1. In repository settings, navigate to **Pages**.
2. Select the `main` branch as the build source and save.

---

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `1` | Switch to Dashboard |
| `2` | Switch to Job Applications |
| `3` | Switch to German Learning |
| `4` | Switch to Coding Upskill |
| `Escape` | Close active modal dialog |

---

## Project Structure

```text
grind-os/
├── index.html                 # Primary application markup and modal templates
├── styles.css                 # Design system tokens, light/dark themes, responsive layouts
├── schema.sql                 # Supabase PostgreSQL schema and security policies
├── server.py                  # Local Python server for static development (zero dependencies)
└── src/
    ├── orchestrator.js        # Event bus, navigation coordinator, and bootstrap logic
    ├── core/
    │   └── store.js           # State store, Supabase client wrapper, storage operations
    └── tabs/
        ├── dashboard.js       # Main status calculation and momentum overview
        ├── jobs.js            # Job application pipeline and probability index
        ├── german.js          # Language retention logs and daily streaks
        ├── coding.js          # Technical upskilling and repository
```

---

## License

MIT License. Designed and maintained for personal productivity and performance tracking.
