# E2E Tests - Team Setup Guide

## For New Team Members

If you're setting up the e2e tests for the first time, follow these steps:

### 1. Prerequisites
- Access to the Beyond AI GitHub npm registry
- Valid GitHub personal access token with `read:packages` scope

### 2. Quick Setup (Recommended)
From the root directory, run:
```bash
npm run e2e:setup
```

This automatically:
- Copies the `.npmrc` file from root to `e2e-tests/`
- Installs all e2e test dependencies
- Sets up the testing environment

### 3. Manual Setup (Alternative)
If you prefer manual setup:

```bash
# Copy npmrc configuration
cp ../.npmrc .

# Install dependencies
npm install
```

### 4. Verify Setup
Test that everything works:
```bash
npm run test:dev
```

## Important Notes

- **Never commit `.npmrc`**: This file contains sensitive authentication tokens and is gitignored
- **Copy from root**: Always copy `.npmrc` from the root directory, don't create your own
- **Team sharing**: The e2e test files themselves are shared in the repository, only the `.npmrc` and generated artifacts are ignored

## Troubleshooting

### "Cannot find module '@Beyond-Network-AI/beyond-ai'"
- Make sure `.npmrc` is copied correctly
- Verify your GitHub token has `read:packages` scope
- Check that you have access to the Beyond AI organization

### "Registry access denied"
- Ensure your GitHub token is valid and not expired
- Verify the token has the correct permissions
- Try logging in manually: `npm login --registry=https://npm.pkg.github.com --scope=@Beyond-Network-AI`

### "Module not found" errors during tests
- The SDK version might not be published yet
- Try installing a specific known version: `npm install @Beyond-Network-AI/beyond-ai@0.1.4`

## Getting Help

If you encounter issues:
1. Check the main `TESTING.md` guide
2. Verify your GitHub registry access
3. Ask a team member to verify the setup steps
4. Check that the SDK version you're testing is actually published 