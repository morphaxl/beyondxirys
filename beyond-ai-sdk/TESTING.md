# Beyond AI SDK - Testing Guide

This document outlines the comprehensive testing strategy for the Beyond AI SDK, including unit tests, integration tests, and end-to-end tests.

## Testing Strategy Overview

The SDK uses a multi-layered testing approach:

1. **Unit Tests** - Test individual components and functions
2. **Integration Tests** - Test SDK functionality against live APIs
3. **End-to-End Tests** - Test the published npm package as end users would consume it

## Unit Tests

### Location
- `src/__tests__/` - Unit test files
- Uses Jest testing framework

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run tests with specific environment
npm run test:dev   # Uses dev API endpoints
npm run test:prod  # Uses prod API endpoints
```

### Configuration
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Test setup and globals
- `set-test-env.js` - Environment configuration script

## End-to-End Tests

### Location
- `e2e-tests/` - Complete e2e testing suite

### Purpose
E2E tests verify that the SDK works correctly when installed via npm, simulating real-world usage scenarios.

### Test Coverage
Each e2e test covers:
1. SDK import and initialization
2. Authentication status checking
3. OTP request functionality
4. OTP verification and login
5. Authentication state verification
6. Storage functionality
7. Sign out process

### Running E2E Tests

#### Setup
```bash
# Install e2e test dependencies (automatically copies .npmrc)
npm run e2e:setup
```

**Note**: The setup script automatically copies the `.npmrc` file from the root directory to `e2e-tests/` for GitHub registry access. This file contains authentication tokens and is gitignored for security.

#### Quick Tests
```bash
# Test latest version against dev environment
npm run e2e:dev

# Test latest version against prod environment
npm run e2e:prod

# Install latest and test dev
npm run e2e:latest
```

#### Version-Specific Tests
```bash
# Test specific version against dev
npm run testsdk:dev:0.1.4

# Test specific version against prod
npm run testsdk:prod:0.1.4
```

#### Manual Version Testing
```bash
cd e2e-tests
npm install @Beyond-Network-AI/beyond-ai@0.1.5
npm run test:dev
```

#### Cleanup
```bash
# Remove test artifacts
npm run e2e:clean
```

### Test Environments

#### Development Environment
- API URL: `https://dev-api.beyondnetwork.xyz`
- Debug mode: Enabled
- Storage prefix: `beyond_e2e_`

#### Production Environment
- API URL: `https://api.beyondnetwork.xyz`
- Debug mode: Disabled
- Storage prefix: `beyond_e2e_prod_`

## Test Scripts Reference

### Root Package Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run unit tests |
| `npm run test:dev` | Run unit tests against dev API |
| `npm run test:prod` | Run unit tests against prod API |
| `npm run e2e:setup` | Setup e2e test environment |
| `npm run e2e:clean` | Clean e2e test artifacts |
| `npm run e2e:dev` | Run e2e tests against dev API |
| `npm run e2e:prod` | Run e2e tests against prod API |
| `npm run e2e:latest` | Install latest SDK and test dev |
| `npm run testsdk:dev:0.1.4` | Test v0.1.4 against dev API |
| `npm run testsdk:prod:0.1.4` | Test v0.1.4 against prod API |

### E2E Package Scripts

| Script | Description |
|--------|-------------|
| `npm run test:dev` | Test against dev environment |
| `npm run test:prod` | Test against prod environment |
| `npm run test:latest` | Install latest and test dev |
| `npm run clean` | Remove artifacts |

## Interactive Testing

E2E tests are interactive and will prompt for:
- Email address for OTP testing
- OTP code received via email
- Confirmation for sign out

## Expected Test Output

### Successful E2E Test
```
✅ SDK imported successfully
📦 Package contents: [ 'beyond', 'default', 'Config', 'Auth' ]
✅ SDK initialized successfully
🔍 Test 1: Check authentication status
   ✅ No existing session
🔍 Test 2: Request OTP
   ✅ OTP request successful
🔍 Test 3: Verify OTP and login
   ✅ Login successful!
🔍 Test 4: Verify authentication state
   ✅ Authentication state verified
🔍 Test 5: Test storage functionality
   ✅ Storage functionality verified
🔍 Test 6: Sign out
   ✅ Successfully signed out
   ✅ Sign out verified
🎉 E2E Test completed!
```

## Troubleshooting

### Common Issues

#### Module Not Found Errors
- Ensure the SDK version is published and accessible
- Check `.npmrc` configuration for GitHub registry access
- Verify authentication tokens

#### API Connection Errors
- Check network connectivity
- Verify API endpoint URLs
- Ensure API services are running

#### OTP Testing Issues
- Verify email delivery (check spam folder)
- Ensure correct OTP entry
- Check API rate limits

#### Authentication Errors
- Verify API credentials
- Check user permissions
- Ensure proper environment configuration

### Debug Mode

For development testing, debug mode shows:
- Detailed API request/response logs
- SDK configuration details
- Storage operations
- Error stack traces

## Continuous Integration

### Pre-commit Checks
Before committing code, run:
```bash
npm test                    # Unit tests
npm run e2e:dev            # E2E tests
npm run build              # Build verification
```

### Release Testing
Before releasing a new version:
```bash
npm run build              # Build the SDK
npm run e2e:setup          # Setup e2e environment
npm run e2e:dev            # Test dev environment
npm run e2e:prod           # Test prod environment
```

### Version Verification
After publishing a new version:
```bash
npm run testsdk:dev:X.Y.Z  # Test specific version
npm run testsdk:prod:X.Y.Z # Test against production
```

## Test Data Management

### Storage Isolation
- Unit tests use mocked storage
- E2E tests use isolated storage prefixes
- Different prefixes for dev/prod environments

### Cleanup
- E2E tests clean up after themselves
- Storage artifacts are gitignored
- `npm run e2e:clean` removes all test data

## Best Practices

1. **Always test both environments** - Dev and production APIs may behave differently
2. **Test version compatibility** - Verify new versions work with existing integrations
3. **Use real email addresses** - OTP testing requires actual email delivery
4. **Clean up after testing** - Remove test artifacts to avoid conflicts
5. **Document test scenarios** - Keep track of tested use cases
6. **Automate where possible** - Use scripts for repetitive testing tasks

## Adding New Tests

### Unit Tests
1. Create test file in `src/__tests__/`
2. Follow existing naming convention
3. Use Jest testing patterns
4. Mock external dependencies

### E2E Tests
1. Modify existing test files in `e2e-tests/`
2. Add new test scenarios to the test flow
3. Ensure proper cleanup
4. Update documentation

## Reporting Issues

When reporting test failures, include:
- Test type (unit/e2e)
- Environment (dev/prod)
- SDK version
- Error messages
- Steps to reproduce
- Expected vs actual behavior 