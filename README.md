# Website Change Alert

A modern SaaS application for AI-driven website change monitoring service, built with Next.js 15, TypeScript, Tailwind CSS, and ShadCN UI components.

## Features

- **Responsive Design**: Fully fluid and responsive layout that works on all devices
- **Modern UI**: Built with ShadCN UI components for a polished, professional look
- **Performance**: Optimized with Next.js 15 and Turbopack for fast development and builds
- **TypeScript**: Full type safety throughout the application
- **Authentication**: Integrated with Clerk for secure user authentication
- **Database**: Prisma ORM for type-safe database operations
- **Web Scraping**: Apify integration for website change detection
- **Email Notifications**: Resend for transactional emails
- **Analytics**: Vercel Analytics for user tracking and insights

## Components

### Navbar
- Fixed position with backdrop blur effect
- Logo on the left: "Website Change Alert"
- Navigation links in the center: Features, Pricing, About
- CTA buttons on the right: Login (secondary) and Join up (primary)
- Conditional rendering of development links in dev environment

### Hero Section
- Full viewport height (100vh)
- Large headline: "Simple Website Change Alert, Finally"
- Descriptive subtitle with value proposition
- Primary CTA button: "Join waiting list"
- Interactive background placeholder for future enhancements

## Technical Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with custom color scheme
- **UI Components**: ShadCN UI (new-york style)
- **Authentication**: Clerk
- **Database**: Prisma ORM
- **Web Scraping**: Apify Client
- **Email**: Resend
- **Analytics**: Vercel Analytics
- **Icons**: Lucide React
- **Fonts**: Geist Sans and Geist Mono
- **Build Tool**: Turbopack

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Configure Clerk authentication keys
   - Set up Prisma database connection
   - Add Apify API credentials
   - Configure Resend email API key

3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3005](http://localhost:3005) in your browser

## Development Commands

- **Development server**: `npm run dev` (uses Turbopack on port 3005)
- **Debug mode**: `npm run dev:debug` (development with Node.js inspector)
- **Build**: `npm run build` (production build with Prisma generate + Turbopack)
- **Start**: `npm start` (starts production server)
- **Lint**: `npm run lint` (ESLint with Next.js presets)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout with metadata and Vercel Analytics
│   ├── page.tsx             # Landing page composition
│   └── globals.css          # Global styles with theme variables
├── components/
│   ├── ui/                  # ShadCN UI components (button, navigation-menu, etc.)
│   ├── Navbar.tsx           # Navigation component with auth integration
│   ├── Hero.tsx             # Hero section component
│   └── Logo.tsx             # Logo component
└── lib/
    ├── utils.ts             # Utility functions (cn() for class merging)
    └── change-detector.ts   # Website change detection logic
```

## Path Aliases

- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/` → `src/`

## Development Patterns

**Component Development**:
- Use functional components with proper TypeScript typing
- Import UI components from `@/components/ui/`
- Use semantic color classes (e.g., `text-foreground`, `bg-background`)
- Follow existing naming conventions for consistency

**Styling Guidelines**:
- Use Tailwind utility classes with semantic color variables
- Prefer responsive design patterns (`sm:`, `md:`, `lg:` breakpoints)
- Maintain consistent spacing and typography scales
- Use backdrop blur and transparency for overlay effects

**File Organization**:
- Keep components in appropriate directories (`ui/` for reusable UI, root level for page-specific)
- Use TypeScript for all new files
- Follow Next.js App Router conventions for routing and layouts

## Configuration Files

- `components.json` - ShadCN UI configuration (new-york style)
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration with path aliases
- `prisma/schema.prisma` - Database schema definitions
