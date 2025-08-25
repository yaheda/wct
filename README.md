# Website Change Alert

A modern SaaS landing page for an AI-driven website change monitoring service, built with Next.js 15, TypeScript, Tailwind CSS, and ShadCN UI components.

## Features

- **Responsive Design**: Fully fluid and responsive layout that works on all devices
- **Modern UI**: Built with ShadCN UI components for a polished, professional look
- **Performance**: Optimized with Next.js 15 and Turbopack for fast development and builds
- **TypeScript**: Full type safety throughout the application

## Components

### Navbar
- Fixed position with backdrop blur effect
- Logo on the left: "Website Change Alert"
- Navigation links in the center: Features, Pricing, About
- CTA buttons on the right: Login (secondary) and Join up (primary)

### Hero Section
- Full viewport height (100vh)
- Large headline: "Simple Website Change Alert, Finally"
- Descriptive subtitle with value proposition
- Primary CTA button: "Join waiting list"
- Interactive background placeholder for future enhancements

## Technical Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **UI Components**: ShadCN UI
- **Icons**: Lucide React
- **Fonts**: Geist Sans and Geist Mono
- **Build Tool**: Turbopack

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

- **Build**: `npm run build`
- **Start**: `npm start`
- **Lint**: `npm run lint`

## Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout with metadata
│   ├── page.tsx        # Landing page
│   └── globals.css     # Global styles
├── components/
│   ├── ui/             # ShadCN UI components
│   │   ├── button.tsx
│   │   └── navigation-menu.tsx
│   ├── Navbar.tsx      # Navigation component
│   └── Hero.tsx        # Hero section component
└── lib/
    └── utils.ts        # Utility functions
```

## Future Enhancements

The landing page includes a designated area for an interactive background element that can be implemented later to enhance the user experience.
