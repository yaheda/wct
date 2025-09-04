# Project Overview

This is a Next.js 15 project for a "Website Change Alert" SaaS application. It uses TypeScript, Tailwind CSS, and ShadCN UI components. The application is designed to monitor websites for changes and notify users.

## Key Technologies

*   **Framework:** Next.js 15 with App Router
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS v4
*   **UI Components:** ShadCN UI
*   **Authentication:** Clerk
*   **Database:** PostgreSQL with Prisma
*   **Testing:** Playwright
*   **Build Tool:** Turbopack

## Project Structure

The project follows a standard Next.js App Router structure.

*   `src/app`: Contains the application's pages and layouts.
*   `src/components`: Contains reusable React components.
*   `src/lib`: Contains utility functions and services.
*   `prisma`: Contains the database schema and migrations.
*   `public`: Contains static assets.

## Building and Running

### Prerequisites

*   Node.js
*   npm

### Installation

1.  Install dependencies:
    ```bash
    npm install
    ```

### Development

1.  Run the development server:
    ```bash
    npm run dev
    ```
2.  Open [http://localhost:3005](http://localhost:3005) in your browser.

### Building

To create a production build, run:

```bash
npm run build
```

### Testing

To run the tests, use:

```bash
npx playwright test
```

## Development Conventions

*   **Coding Style:** The project uses ESLint to enforce a consistent coding style.
*   **Testing:** The project uses Playwright for end-to-end testing.
*   **Database:** The project uses Prisma for database management. Migrations are located in the `prisma/migrations` directory.
