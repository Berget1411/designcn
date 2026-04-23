# designcn

An AI-powered design platform built as a full-stack monorepo with Next.js, Mastra agents, and shadcn/ui.

## Features

- **Next.js** - React framework with Turbopack for fast development
- **React** - UI library (v19)
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives in `packages/ui`
- **Mastra** - AI agent framework powering the API
- **tRPC** - End-to-end type-safe APIs
- **Drizzle** - TypeScript-first ORM
- **Better Auth** - Authentication
- **AI SDK** - OpenAI integration for AI features
- **Turborepo** - Optimized monorepo build system
- **Bun** - Fast JavaScript runtime and package manager
- **Husky** - Git hooks for code quality
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)

## Getting Started

Install dependencies:

```bash
bun install
```

Run the development server:

```bash
bun run dev
```

## Project Structure

```
designcn/
├── apps/
│   ├── web/           # Next.js web application
│   ├── api/           # Mastra AI agent API (Cloudflare Workers)
│   └── studio/        # Mastra Studio dashboard
├── packages/
│   ├── ui/            # Shared shadcn/ui components (@workspace/ui)
│   ├── auth/          # Authentication configuration
│   ├── db/            # Database schema & queries (Drizzle ORM)
│   ├── forms/         # Shared form utilities
│   └── typescript-config/ # Shared TypeScript config
```

## UI Components

React apps share shadcn/ui primitives through `packages/ui`.

### Add shared components

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This places UI components in `packages/ui/src/components`.

### Import components

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Git Hooks and Formatting

- Initialize hooks: `bun run prepare`
- Format and lint: `bun run check`

## Available Scripts

- `bun run dev` - Start all apps in development mode
- `bun run build` - Build all apps
- `bun run typecheck` - Check TypeScript types across all apps
- `bun run check` - Run Oxlint and Oxfmt

## Contributing

This project is open source under the [MIT License](LICENSE). While contributions are welcome in spirit, **we are not currently accepting pull requests or external changes**. Feel free to fork and adapt for your own use.

## License

[MIT](LICENSE)
