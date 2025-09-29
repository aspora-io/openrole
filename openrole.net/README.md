# OpenRole.net

A transparent job platform where every role is open about salary, culture, and hiring practices.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Hono on Bun, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Infrastructure**: Vercel, Railway/Fly.io, Neon DB

## Project Structure

```
openrole.net/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # Hono API backend
├── packages/
│   ├── database/     # Shared database schema and client
│   ├── shared/       # Shared types and utilities
│   └── ui/           # Shared UI components
└── turbo.json        # Turborepo configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- Bun 1.0+
- PostgreSQL (or Neon account)
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/openrole.net
cd openrole.net

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Push database schema
pnpm db:push

# Start development servers
pnpm dev
```

### Environment Variables

Create `.env.local` files in both `apps/web` and `apps/api`:

```env
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# apps/api/.env.local
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
```

## Development

```bash
# Run all apps in development
pnpm dev

# Run specific app
pnpm dev --filter=@openrole/web

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

## Key Features

- **Mandatory Salary Transparency**: All job posts must include salary ranges
- **Fair Application Process**: Track application status and provide feedback
- **Company Verification**: Verified employer badges
- **Modern Tech Stack**: Built with performance and developer experience in mind
- **Accessibility First**: WCAG 2.1 AA compliant

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.