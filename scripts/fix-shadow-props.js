#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need shadow prop fixes
const filesToFix = [
  'src/components/ErrorDisplay.tsx',
  'src/components/ConfirmationDialog.tsx',
  'src/components/SplashScreen.tsx',
  'src/components/CelebrationModal.tsx',
  'src/screens/TaskDashboard.tsx',
  'src/screens/onboarding/OnboardingCarousel.tsx',
  'src/screens/onboarding/OnboardingScreen.tsx',
];

// Function to replace shadow spreading with explicit properties
function fixShadowSpreading(content) {
  // Replace ...theme.shadows.{size} with explicit shadow properties
  const shadowSizes = ['none', 'sm', 'md', 'lg', 'xl'];

  let fixedContent = content;

  shadowSizes.forEach((size) => {
    const spreadPattern = new RegExp(`\\.\\.\\.theme\\.shadows\\.${size}`, 'g');
    const replacement = `shadowColor: theme.shadows.${size}.shadowColor,
    shadowOffset: theme.shadows.${size}.shadowOffset,
    shadowOpacity: theme.shadows.${size}.shadowOpacity,
    shadowRadius: theme.shadows.${size}.shadowRadius,
    elevation: theme.shadows.${size}.elevation`;

    fixedContent = fixedContent.replace(spreadPattern, replacement);
  });

  return fixedContent;
}

// Process each file
filesToFix.forEach((filePath) => {
  const fullPath = path.join(__dirname, '..', filePath);

  if (fs.existsSync(fullPath)) {
    console.log(`Fixing shadow props in ${filePath}...`);

    const content = fs.readFileSync(fullPath, 'utf8');
    const fixedContent = fixShadowSpreading(content);

    if (content !== fixedContent) {
      fs.writeFileSync(fullPath, fixedContent, 'utf8');
      console.log(`✅ Fixed shadow props in ${filePath}`);
    } else {
      console.log(`ℹ️  No shadow props to fix in ${filePath}`);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('Shadow prop fixes completed!');
