#!/bin/bash

echo "🔄 Running Prisma migration for Token Blacklist..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Create and apply migration
echo "🗄️  Creating migration..."
npx prisma migrate dev --name add_token_blacklist

echo "✅ Migration completed!"
echo ""
echo "📝 Next steps:"
echo "1. Test logout-all endpoint"
echo "2. Verify old access tokens are rejected"
echo "3. Check docs/TOKEN-BLACKLIST-SOLUTION.md for details"
