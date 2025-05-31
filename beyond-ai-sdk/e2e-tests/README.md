# Beyond AI SDK - End-to-End Tests

This directory contains comprehensive end-to-end tests for the Beyond AI SDK that test the SDK as it would be consumed by end users via npm install.

## Test Structure

- `test-sdk-dev.js` - Tests against the development API environment
- `test-sdk-prod.js` - Tests against the production API environment
- `package.json` - Test dependencies and scripts

## Prerequisites

1. Make sure you have access to the Beyond AI GitHub npm registry
2. **Create `.npmrc`** in the repository root (if it doesn't exist):
   ```bash
   echo "@Beyond-Network-AI:registry=https://npm.pkg.github.com" > ../.npmrc
   npm login --registry=https://npm.pkg.github.com --scope=@Beyond-Network-AI
   ```
   This file stores your GitHub authentication token and is gitignored.
3. **Copy `.npmrc`** from the root directory to this folder:
   ```bash
   cp ../.npmrc .
   ```
4. Have a valid email address for testing OTP functionality

## Running Tests

### Quick Tests

```bash
# Test latest version against dev environment
npm run test:dev

# Test latest version against prod environment  
npm run test:prod

# Install latest version and test dev
npm run test:latest
```

### Testing Specific Versions

```bash
# Test a specific version (e.g., 0.1.4)
npm install @Beyond-Network-AI/beyond-ai@0.1.4
npm run test:dev

# Or use the helper (if implemented)
npm run test:specific --version=0.1.4
```

### Clean Up

```bash
# Remove all test artifacts
npm run clean
```

## Test Coverage

Each test covers:

1. **SDK Import** - Verifies the package can be imported correctly
2. **Initialization** - Tests SDK configuration and setup
3. **Authentication Status** - Checks initial auth state
4. **OTP Request** - Tests email OTP request functionality
5. **OTP Verification** - Tests login with OTP
6. **Authentication Verification** - Confirms login state
7. **Storage Functionality** - Tests token storage and retrieval
8. **Sign Out** - Tests logout and cleanup

## Test Environments

### Development Environment
- API URL: `https://dev-api.beyondnetwork.xyz`
- Debug mode: Enabled
- Storage prefix: `beyond_e2e_`

### Production Environment  
- API URL: `https://api.beyondnetwork.xyz`
- Debug mode: Disabled
- Storage prefix: `beyond_e2e_prod_`

## Interactive Testing

Both tests are interactive and will prompt for:
- Email address for OTP
- OTP code received via email
- Confirmation for sign out

## Expected Output

Successful test run should show:
```
✅ SDK imported successfully
✅ SDK initialized successfully
✅ OTP request successful
✅ Login successful!
✅ Authentication state verified
✅ Storage functionality verified
✅ Successfully signed out
✅ Sign out verified
🎉 E2E Test completed!
```

## Troubleshooting

### Common Issues

1. **Module not found errors** - Ensure the SDK version is published and accessible
2. **Registry access errors** - Make sure `.npmrc` is copied from root directory
3. **API connection errors** - Check network connectivity and API endpoints
4. **OTP failures** - Verify email delivery and correct OTP entry
5. **Authentication errors** - Check API credentials and user permissions

### Debug Mode

For development testing, debug mode is enabled and will show:
- Detailed API request/response logs
- SDK configuration details
- Storage operations

## Integration with Main Repository

These tests can be run from the main repository using the npm scripts defined in the root `package.json`. 