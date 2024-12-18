# Solana Memecoin Monitor

A real-time price monitoring and alert system for Solana memecoins.

## Prerequisites

- Node.js (v16+)
- Yarn
- SQLite

## Quick Start

1. Clone and install:
```bash
git clone https://github.com/yourusername/solana-memecoin-monitor.git
cd solana-memecoin-monitor
yarn install
```

2. Set up environment:
```bash
# Create .env file with:
PORT=3000
BIRDEYE_API_KEY=your_api_key_here
DATABASE_URL="file:./dev.db"
```

3. Initialize database:
```bash
yarn prisma generate
yarn prisma migrate dev
```

4. Start server:
```bash
yarn dev
```

## Available Services

- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api-docs
- WebSocket Updates: ws://localhost:3000

## Database Management

View/Edit database:
```bash
yarn prisma studio  # Opens Prisma Studio at http://localhost:5555
```

Reset database:
```bash
yarn prisma migrate reset
```

Update schema:
```bash
yarn prisma migrate dev
```

## Development Commands

Start dev server:
```bash
yarn dev
```

Run tests:
```bash
yarn test
```

View API docs: http://localhost:3000/api-docs
