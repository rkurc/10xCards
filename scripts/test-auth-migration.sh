#!/bin/bash

# This script tests the migrated files and updates them if they're working correctly

echo "Testing the migrated files..."

# First, rename the migrated BaseLayout
echo "Testing BaseLayout.new.astro..."
cp src/layouts/BaseLayout.astro src/layouts/BaseLayout.backup.astro
mv src/layouts/BaseLayout.new.astro src/layouts/BaseLayout.astro

# Now test if the build works
echo "Running build check..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ BaseLayout.astro migration successful"
  # Remove backup
  rm src/layouts/BaseLayout.backup.astro
else
  echo "❌ BaseLayout.astro migration failed, reverting to backup"
  mv src/layouts/BaseLayout.backup.astro src/layouts/BaseLayout.astro
fi

# Now test the migrated test file
echo "Testing DashboardContent.test.new.tsx..."
cp src/components/dashboard/DashboardContent.test.tsx src/components/dashboard/DashboardContent.test.backup.tsx
mv src/components/dashboard/DashboardContent.test.new.tsx src/components/dashboard/DashboardContent.test.tsx

echo "Running tests..."
npm run test -- src/components/dashboard/DashboardContent.test.tsx

if [ $? -eq 0 ]; then
  echo "✅ DashboardContent.test.tsx migration successful"
  # Remove backup
  rm src/components/dashboard/DashboardContent.test.backup.tsx
else
  echo "❌ DashboardContent.test.tsx migration failed, reverting to backup"
  mv src/components/dashboard/DashboardContent.test.backup.tsx src/components/dashboard/DashboardContent.test.tsx
fi

echo "Migration testing completed."
