# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (uses Turbopack for fast builds)
- **Build**: `npm run build` (production build with Turbopack)
- **Start**: `npm start` (starts production server)
- **Lint**: `npm run lint` (ESLint with Next.js presets)

## Project Architecture

This is a Next.js 15 application for "Website Change Alert" - a SaaS landing page for website change monitoring service.

### Tech Stack
- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS v4 with custom color scheme
- **UI Components**: ShadCN UI with "new-york" style
- **Build Tool**: Turbopack (for both dev and build)
- **Fonts**: Geist Sans and Geist Mono

### Code Architecture

**Component Structure**:
- Uses component-based architecture with TypeScript
- Components are organized in `src/components/` with UI components in `ui/` subdirectory
- All components use proper TypeScript interfaces and export patterns
- Follows ShadCN UI conventions with `cn()` utility for class merging

**Styling Approach**:
- Custom CSS variables defined in `globals.css` for both light and dark themes
- Uses Tailwind's semantic color tokens (`primary`, `secondary`, `muted-foreground`, etc.)
- Theme switching handled via CSS variables and `.dark` class
- Custom animations imported via `tw-animate-css`

**Path Aliases**:
- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/` → `src/`

**Key Files**:
- `src/app/layout.tsx`: Root layout with metadata and font configuration
- `src/app/page.tsx`: Main landing page composition
- `src/lib/utils.ts`: Contains `cn()` utility for class merging
- `components.json`: ShadCN UI configuration

### Development Patterns

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