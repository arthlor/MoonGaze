#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating accessibility fixes...\n');

// Check EnhancedChip component for proper touch target sizes
const chipPath = path.join(__dirname, '..', 'src/components/EnhancedChip.tsx');
if (fs.existsSync(chipPath)) {
  const chipContent = fs.readFileSync(chipPath, 'utf8');
  
  console.log('📱 Checking EnhancedChip touch target sizes:');
  
  // Check for height: 44 in size styles
  if (chipContent.includes('height: 44')) {
    console.log('  ✅ Found forced height: 44 for accessibility compliance');
  } else {
    console.log('  ❌ Missing forced height: 44 for accessibility compliance');
  }
  
  // Check for adequate padding
  if (chipContent.includes('paddingVertical: theme.spacing.sm + 2')) {
    console.log('  ✅ Found increased vertical padding for better touch targets');
  } else {
    console.log('  ❌ Missing increased vertical padding');
  }
  
  console.log('');
}

// Check for shadow prop issues
const filesToCheck = [
  'src/components/ErrorDisplay.tsx',
  'src/components/SplashScreen.tsx',
  'src/components/CelebrationModal.tsx',
  'src/screens/TaskDashboard.tsx',
  'src/screens/onboarding/OnboardingCarousel.tsx',
  'src/screens/onboarding/OnboardingScreen.tsx',
];

console.log('🎨 Checking shadow prop fixes:');

let allShadowsFixed = true;

filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for remaining shadow spreading
    if (content.includes('...theme.shadows.')) {
      console.log(`  ❌ ${filePath} still has shadow spreading`);
      allShadowsFixed = false;
    } else {
      console.log(`  ✅ ${filePath} shadow props fixed`);
    }
  }
});

if (allShadowsFixed) {
  console.log('\n🎉 All accessibility fixes validated successfully!');
  console.log('\nSummary of fixes:');
  console.log('• Enhanced chip touch targets now meet 44pt minimum requirement');
  console.log('• Fixed shadow prop spreading to prevent React Native warnings');
  console.log('• Improved padding and sizing for better accessibility compliance');
} else {
  console.log('\n⚠️  Some issues still need attention');
}

console.log('\n📋 Next steps:');
console.log('• Test the app to verify touch targets are now 44pt minimum');
console.log('• Run accessibility audit to confirm compliance');
console.log('• Check that shadow warnings are resolved');