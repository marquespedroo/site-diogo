# ImobiTools

Professional real estate tools for Brazilian agents.

## Project Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development URLs

- Dashboard: http://localhost:3000/dashboard.html

## Project Structure

```
site-diogo/
├── public/                  # Static HTML pages
│   ├── dashboard.html      # Dashboard (Pixel-perfect from Figma)
│   └── index.html          # Landing page (to be created)
├── src/                     # Source code
│   ├── lib/                # Core libraries
│   ├── domain/             # Business logic (SOLID architecture)
│   ├── api/                # API endpoints (future)
│   ├── styles.css          # TailwindCSS styles
│   └── main.js             # Main JavaScript entry point
├── database/               # Database migrations & seeds
├── docs/                   # Documentation
└── implementation/         # PRDs and architecture docs
```

## Technology Stack

- **Frontend**: Static HTML + Progressive Enhancement (Vanilla JS/ES6+)
- **Styling**: TailwindCSS 3.x
- **Build Tool**: Vite
- **Backend** (future): Vercel Edge Functions
- **Database** (future): Supabase PostgreSQL

## Design System

### Colors (from Figma)

- **Army**: `#395917`
- **Soft Green**: `#E6EFEA` (100), `#A4C8AE` (200)
- **Dark Green**: `#617C6C` (200), `#4C6C5A` (300)
- **Grey**: `#596269` (200), `#45515C` (300)
- **Purple**: `#E3E4EA` (100), `#B8BED5` (200), `#595D75` (300)
- **Beige**: `#E5D6B8` (200), `#A39170` (300)
- **Background**: `#EAE9E3`

## Current Status

✅ Project structure created
✅ TailwindCSS configured
✅ Dashboard UI implemented (pixel-perfect from Figma)
✅ Dependencies installed

## Next Steps

1. Create landing page (index.html)
2. Implement calculator tool
3. Implement market study tool
4. Set up Supabase connection
5. Create API endpoints
6. Add authentication

## Documentation

See `/implementation/` folder for:
- 00-ARCHITECTURE.md - System architecture
- 01-CALCULATOR-PRD.md - Calculator feature
- 02-MARKET-STUDY-PRD.md - Market study feature
- 03-PROJECTS-TABLE-PRD.md - Projects table feature
- 04-PAYMENT-INTEGRATION-PRD.md - Payment integration
- 05-CODE-STANDARDS.md - Code standards and best practices
