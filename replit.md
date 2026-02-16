# BioSync Labs

## Overview
BioSync Labs is a health optimization platform that analyzes blood test results and generates personalized 90-day optimization protocols including peptides, hormones, nutrition, and exercise recommendations based on evidence-based functional medicine logic.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components
- **Backend**: Express.js API server
- **Database**: PostgreSQL (Drizzle ORM)
- **Auth**: Replit Auth (OpenID Connect)
- **Routing**: wouter (client-side)

## Key Features
- User authentication via Replit Auth
- User profile setup (age, gender, goals, weight, height)
- Manual lab entry for 40+ biomarkers across 7 categories
- Rule-based recommendation engine with z-score analysis
- 90-day optimization protocol generation (peptides, hormones, diet, exercise)
- Safety disclaimers on all screens

## Project Structure
- `client/src/pages/` - Page components (landing, dashboard, profile-setup, lab-entry, program-view)
- `client/src/components/` - Shared components (header, safety-banner, theme-provider)
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database operations
- `server/recommender.ts` - Recommendation engine with hardcoded rules
- `server/db.ts` - Database connection
- `shared/schema.ts` - Drizzle schema + TypeScript types
- `shared/models/auth.ts` - Auth-related schema

## API Routes
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Create/update profile
- `GET /api/labs` - Get all lab results
- `POST /api/labs` - Submit lab results (auto-generates program)
- `GET /api/labs/latest/statuses` - Get marker analysis for latest labs
- `GET /api/programs` - Get all programs
- `GET /api/program/:labId` - Get program for specific lab result

## Theme
- Dark mode default with teal/cyan primary color (168 80% 42%)
- Bio-tech aesthetic with gradient accents
