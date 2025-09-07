# ESLint Configuration

This project uses ESLint for code quality and consistency. The configuration is optimized for React Native with TypeScript.

## Features

- **TypeScript Support**: Full TypeScript linting with recommended rules
- **React Native**: Specific rules for React Native development
- **Accessibility**: JSX accessibility rules for better UX
- **Import Organization**: Automatic import sorting and validation
- **Code Quality**: Modern JavaScript/TypeScript best practices

## Usage

### Lint your code

```bash
npm run lint
```

### Auto-fix issues

```bash
npm run lint:fix
```

### Strict linting (CI/CD)

```bash
npm run lint:check
```

## Configuration Files

- `.eslintrc.js` - Main ESLint configuration
- `.eslintignore` - Files and directories to ignore

## Key Rules

### TypeScript

- Unused variables are errors (except those prefixed with `_`)
- Prefer optional chaining and nullish coalescing
- Explicit `any` types show warnings

### React Native

- No unused styles
- Platform-specific component splitting
- Inline styles show warnings
- Color literals show warnings

### Imports

- Automatic import sorting (alphabetical, grouped)
- No circular dependencies
- No unresolved imports

### Code Quality

- Prefer const over let/var
- Use template literals over string concatenation
- Arrow functions preferred for callbacks
- No console.log in production code (warnings)

## IDE Integration

Most editors support ESLint integration:

### VS Code

Install the ESLint extension for real-time linting.

### WebStorm/IntelliJ

ESLint is built-in and will automatically detect the configuration.

## Customization

To modify rules, edit `.eslintrc.js`. Common customizations:

```javascript
rules: {
  // Disable a rule
  'no-console': 'off',

  // Change severity
  '@typescript-eslint/no-explicit-any': 'error',

  // Add custom rules
  'prefer-const': 'error',
}
```

## Pre-commit Hooks

Consider adding ESLint to your pre-commit hooks:

```bash
npm install --save-dev husky lint-staged
```

Then configure in `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "git add"]
  }
}
```
