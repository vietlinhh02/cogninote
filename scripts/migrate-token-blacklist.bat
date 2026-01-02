@echo off
echo Running Prisma migration for Token Blacklist...
echo.

echo Generating Prisma Client...
call npx prisma generate

echo.
echo Creating migration...
call npx prisma migrate dev --name add_token_blacklist

echo.
echo Migration completed!
echo.
echo Next steps:
echo 1. Test logout-all endpoint
echo 2. Verify old access tokens are rejected
echo 3. Check docs/TOKEN-BLACKLIST-SOLUTION.md for details
