# Klein & Stone Bio Labs

## Overview
Klein & Stone Bio Labs is a health optimization platform that analyzes blood test results and generates personalized 90-day optimization protocols including peptides, hormones, nutrition, and exercise recommendations based on evidence-based functional medicine logic.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui components
- **Backend**: Express.js API server
- **Database**: PostgreSQL (Drizzle ORM)
- **Auth**: Replit Auth (OpenID Connect)
- **AI**: OpenAI via Replit AI Integrations (GPT-5.2 vision for lab file parsing)
- **Routing**: wouter (client-side)

## Key Features
- User authentication via Replit Auth
- User profile setup (age, gender, goals, weight, height)
- Manual lab entry for 40+ biomarkers across 7 categories
- File upload for lab results (PDF/image) with AI-powered biomarker extraction
- Rule-based recommendation engine with z-score analysis
- 90-day optimization protocol generation (peptides, hormones, diet, exercise)
- 3 pre-seeded sample blood test profiles for demo/testing
- Safety disclaimers on all screens

## Project Structure
- `client/src/pages/` - Page components (landing, dashboard, profile-setup, lab-entry, program-view)
- `client/src/components/` - Shared components (header, safety-banner, theme-provider)
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database operations
- `server/recommender.ts` - Recommendation engine with hardcoded rules
- `server/lab-parser.ts` - OpenAI vision-based lab file parsing (converts PDFs to images via pdf-to-img)
- `server/seed.ts` - Sample data seeding (3 blood test profiles)
- `server/db.ts` - Database connection
- `shared/schema.ts` - Drizzle schema + TypeScript types
- `shared/models/auth.ts` - Auth-related schema

## API Routes
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Create/update profile
- `GET /api/labs` - Get all lab results
- `POST /api/labs` - Submit lab results (auto-generates program)
- `POST /api/labs/parse-file` - Upload lab file (multipart/form-data), returns extracted markers
- `POST /api/labs/load-sample` - Load a sample blood test profile
- `GET /api/labs/latest/statuses` - Get marker analysis for latest labs
- `GET /api/samples` - Get available sample blood test profiles
- `GET /api/programs` - Get all programs
- `GET /api/program/:labId` - Get program for specific lab result

## Sample Data (seeded on startup)
- **Low T Male (Age 38)**: Low testosterone, low IGF-1, high CRP, borderline HbA1c
- **High Stress Female (Age 45)**: High cortisol, very low IGF-1, high CRP, low thyroid
- **Metabolic Issues Male (Age 32)**: Normal hormones, high HbA1c, high cholesterol/triglycerides, low HDL

## Theme
- Dark mode default with teal/cyan primary color (168 80% 42%)
- Bio-tech aesthetic with gradient accents

## Recent Changes
- Rebranded from "BioSync Labs" to "Klein & Stone Bio Labs" with custom logo
- Fixed PDF upload: converts PDFs to PNG via pdf-to-img before sending to OpenAI vision
- Fixed OpenAI parameter: max_tokens → max_completion_tokens for GPT-5.2
- Added OpenAI integration for lab file parsing (GPT-5.2 vision model)
- Added drag-and-drop file upload on lab entry page
- Added 3 sample blood test profiles seeded on startup
- Added "Load & Analyze" sample data feature on dashboard
- Fixed numeric validation with z.preprocess for lab markers
