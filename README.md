# Mission CRM

Centralized system for mission organization relationship management.

## Setup Instructions

### 1. Database Setup (Supabase)

1.  Create a new project on [Supabase](https://supabase.com/).
2.  Run the initial migration SQL located in `supabase/migrations/20250627000000_initial_schema.sql` in the Supabase SQL Editor.
3.  Configure Authentication:
    *   Enable Email/Password provider.
    *   Set up a redirect URL (e.g., `http://localhost:3000/auth/callback`).

### 2. Environment Variables

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Installation

```bash
npm install
```

### 4. Development

```bash
npm run dev
```

## Features Implemented (Phase 2)

*   **Database Schema:** Comprehensive multi-tenant schema with tables for donors, churches, projects, tasks, and interaction logs.
*   **Supabase Integration:** Client and server-side helpers for data fetching and authentication.
*   **Real Data for Donors:** The donors list and detail views are now connected to Supabase.
*   **Donor CRUD:** Ability to add new donors and log interactions (which automatically creates tasks).
*   **Authentication Foundation:** Login page and protected route logic.

## Remaining Mock Data

The following pages are still using mock data and will be connected in future phases:
*   Dashboard stats
*   Churches list and details
*   Projects
*   Tasks (Global list)
*   Inventory
*   Budget
