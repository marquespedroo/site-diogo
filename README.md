# ImobiTools - Professional Real Estate SaaS Platform

Enterprise-grade real estate tools for Brazilian agents, featuring payment flow calculators, market studies, and project management.

## 🚀 Features

- **Payment Flow Calculator**: Multi-stage construction payment planning with PRICE/SAC financing
- **Shareable Links**: Generate short URLs to share calculators with clients
- **Market Study Tools**: Property valuation via comparative market analysis
- **Projects Database**: Multi-agent real estate project tracking

## 🏗️ Architecture

- **Frontend**: Vanilla TypeScript + Vite
- **Backend**: Vercel Edge Functions + Supabase
- **Database**: PostgreSQL (Supabase)
- **Design Pattern**: Domain-Driven Design (DDD) with SOLID principles

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase account (free tier OK)
- Vercel account (optional, for deployment)

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd site-diogo
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Go to SQL Editor
4. Run `database/migrations/001_initial_schema.sql`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
site-diogo/
├── src/
│   ├── domain/              # Domain entities & business logic
│   │   └── calculator/
│   │       ├── entities/    # PaymentCalculator, Installment, etc.
│   │       ├── value-objects/ # Money, Percentage, etc.
│   │       └── repositories/ # Repository interfaces
│   ├── api/                 # API endpoints & types
│   │   └── types/           # Request/Response types
│   ├── lib/                 # Shared utilities
│   │   ├── errors/          # Custom error classes
│   │   └── validators/      # Zod validation schemas
│   ├── components/          # UI components
│   ├── styles/              # CSS/Design tokens
│   └── types/               # TypeScript type definitions
├── database/
│   └── migrations/          # SQL migration files
├── public/                  # Static assets
├── features-html/           # Legacy HTML calculators
└── implementation/          # Documentation & PRDs
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## 🏭 Build & Deploy

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## 🔒 Security

- Row-Level Security (RLS) enabled on all tables
- Input validation with Zod schemas
- HTTPS only in production
- Secure headers configured (CSP, HSTS, etc.)
- Rate limiting on API endpoints

## 📚 Documentation

- [Architecture Document](./implementation/00-ARCHITECTURE.md)
- [Calculator PRD](./implementation/01-CALCULATOR-PRD.md)
- [Design System](./DESIGN_SYSTEM.md)
- [Component Registry](./COMPONENT_REGISTRY.md)
- [Database Schema](./database/README.md)

## 🛠️ Development

### Code Standards

- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY**: Don't Repeat Yourself
- **OOP**: Object-Oriented Programming with TypeScript classes
- **Type Safety**: Strict TypeScript configuration

### Commit Convention

```
feat: Add new feature
fix: Bug fix
docs: Documentation update
refactor: Code refactoring
test: Add/update tests
chore: Build/config updates
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

Private - All Rights Reserved

## 👥 Team

ImobiTools Development Team

## 🐛 Support

For issues and questions, please open a GitHub issue.

## 🗺️ Roadmap

- [x] Payment flow calculator
- [x] Domain-Driven Design architecture
- [x] Database schema & migrations
- [ ] Supabase repository implementation
- [ ] API endpoints
- [ ] UI integration
- [ ] Authentication
- [ ] Agent branding customization
- [ ] PDF export
- [ ] Analytics dashboard
- [ ] Market study tools
- [ ] Projects database

---

Built with ❤️ using TypeScript, Vite, and Supabase
