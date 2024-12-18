Solana Memecoin Monitor
======================

A real-time price monitoring and alert system for Solana memecoins.

Prerequisites
------------
• Node.js (v16+)
• Yarn
• SQLite

Quick Start
----------
1. Clone and install:
   git clone https://github.com/yourusername/solana-memecoin-monitor.git
   cd solana-memecoin-monitor
   yarn install

2. Set up environment:
   Create a .env file with:
   PORT=3000
   BIRDEYE_API_KEY=your_api_key_here
   DATABASE_URL="file:./dev.db"

3. Initialize database:
   yarn prisma generate
   yarn prisma migrate dev

4. Start server:
   yarn dev

Available Services
----------------
• API: http://localhost:3000
• Swagger Docs: http://localhost:3000/api-docs
• WebSocket Updates: ws://localhost:3000

Database Management
-----------------
• View/Edit database: yarn prisma studio
  Opens Prisma Studio at http://localhost:5555
• Reset database: yarn prisma migrate reset
• Update schema: yarn prisma migrate dev

Development Commands
------------------
• Start dev server: yarn dev
• Run tests: yarn test
• View API docs: Visit http://localhost:3000/api-docs
