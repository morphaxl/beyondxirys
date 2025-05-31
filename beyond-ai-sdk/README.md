# Beyond AI SDK

TypeScript SDK for Beyond AI allowing developers to implement passwordless authentication, onchain payments, and AI inference requests.

## 🚀 Features

- ✅ **Email OTP Authentication** - Passwordless login with email verification
- ✅ **Beyond Wallet Integration** - Smart wallet address retrieval
- ✅ **Credits Management** - Balance checking and credit purchasing
- ✅ **Chat Completions API** - OpenAI-compatible AI chat interface
- ✅ **Storage Management** - Secure token and user data handling
- ✅ **TypeScript Support** - Full type definitions included
- ✅ **Cross-Platform** - Works in Node.js and browser environments

## Installation

```bash
npm install @Beyond-Network-AI/beyond-ai
```

## Quick Start

```typescript
import { beyond, CHAT_MODELS } from '@Beyond-Network-AI/beyond-ai';

// Initialize the SDK
beyond.initialize({
  apiUrl: 'https://api.beyondnetwork.xyz', // or https://dev-api.beyondnetwork.xyz for development
  debug: false
});

// 1. Authentication
await beyond.auth.email.requestOtp('user@example.com');
const result = await beyond.auth.email.verifyOtp('user@example.com', '123456');
console.log('User:', result.userDetails);

// 2. Beyond Wallet
const beyondWallet = await beyond.auth.getBeyondWallet();
console.log('Smart Wallet Address:', beyondWallet.Address);

// 3. Credits Management
const creditBalance = await beyond.credits.getBalance();
console.log('Monthly Limit:', creditBalance.monthlyLimit);

const purchase = await beyond.credits.purchaseCredits({ amount: 1.0 });
console.log('Transaction ID:', purchase.transactionId);

// 4. Chat Completions
const response = await beyond.chat.chat('Hello, how are you?');
console.log('AI Response:', response);

const completion = await beyond.chat.createCompletion({
  model: CHAT_MODELS.LLAMA_8B,
  messages: [{ role: 'user', content: 'Write a haiku about coding' }],
  temperature: 0.7,
  max_tokens: 100
});
console.log('Completion:', completion.content);

// 5. Session Management
const isAuthenticated = beyond.auth.isAuthenticated();
await beyond.auth.email.signOut();
```

## GitHub Registry Setup

The SDK packages are hosted in the GitHub npm registry. Configure your local
`.npmrc` with the Beyond AI scope before installing dependencies:

```bash
echo "@Beyond-Network-AI:registry=https://npm.pkg.github.com" > .npmrc
npm login --registry=https://npm.pkg.github.com --scope=@Beyond-Network-AI
```

The `.npmrc` file is ignored by git. Copy this file into `e2e-tests/` when
running the end-to-end tests.

## 📖 API Reference

### 🔐 Authentication API

#### `beyond.auth.email.requestOtp(email: string)`
Request an OTP to be sent to the provided email address.

**Parameters:**
- `email` (string): Valid email address

**Returns:** Promise resolving to `{ message: string }`

**Example:**
```typescript
const result = await beyond.auth.email.requestOtp('user@example.com');
console.log(result.message); // "OTP sent"
```

#### `beyond.auth.email.verifyOtp(email: string, otp: string)`
Verify the OTP and authenticate the user.

**Parameters:**
- `email` (string): Email address used for OTP request
- `otp` (string): 6-digit OTP code from email

**Returns:** Promise resolving to `AuthResponse` containing:
- `userDetails`: User information object
- `tokens`: Access and refresh tokens

**Example:**
```typescript
const authResult = await beyond.auth.email.verifyOtp('user@example.com', '123456');
console.log('User Details:', authResult.userDetails);
console.log('Email:', authResult.userDetails.email);
console.log('Username:', authResult.userDetails.username);
```

#### `beyond.auth.email.signOut()`
Sign out the current user and clear stored data.

**Returns:** Promise resolving to void

#### `beyond.auth.isAuthenticated()`
Check if a user is currently authenticated.

**Returns:** Boolean indicating authentication status

#### `beyond.auth.getCurrentUser()`
Get the current authenticated user's details.

**Returns:** User object or null if not authenticated

### 💰 Beyond Wallet API

#### `beyond.auth.getBeyondWallet()`
Fetch Beyond wallet details for the authenticated user.

**Returns:** Promise resolving to `BeyondWallet` object containing:
- `Address`: The user's smart wallet address (string)

**Example:**
```typescript
const beyondWallet = await beyond.auth.getBeyondWallet();
console.log('Smart Wallet Address:', beyondWallet.Address);

// User details are automatically updated
const user = beyond.auth.getCurrentUser();
console.log('User Smart Wallet:', user.smartWalletAddress);
```

**Note:** User must be authenticated before calling this method. This method automatically updates the user details with the smart wallet information.

### 💳 Credits API

#### `beyond.credits.getBalance()`
Fetch the current user's credit balance and usage information.

**Returns:** Promise resolving to `CreditBalance` object containing:
- `monthlyLimit`: Monthly credit limit (string)
- `monthlyCurrentUsage`: Current monthly usage (string)
- `totalCreditsUsed`: Total credits used across all time (string)
- `totalCreditsPurchased`: Total credits purchased (string)

**Example:**
```typescript
const creditBalance = await beyond.credits.getBalance();
console.log('Credit Balance Information:');
console.log(`Monthly Limit: ${creditBalance.monthlyLimit}`);
console.log(`Monthly Current Usage: ${creditBalance.monthlyCurrentUsage}`);
console.log(`Total Credits Used: ${creditBalance.totalCreditsUsed}`);
console.log(`Total Credits Purchased: ${creditBalance.totalCreditsPurchased}`);

// Calculate remaining monthly credits
const remaining = parseFloat(creditBalance.monthlyLimit) - parseFloat(creditBalance.monthlyCurrentUsage);
console.log(`Remaining Monthly Credits: ${remaining.toFixed(8)}`);
```

#### `beyond.credits.purchaseCredits(params: CreditPurchaseParams)`
Purchase credits using the specified amount.

**Parameters:**
- `params.amount` (number): Dollar amount to spend on credits

**Returns:** Promise resolving to `CreditPurchaseResult` object containing:
- `success`: Boolean indicating if purchase was successful
- `transactionId`: Unique transaction identifier (string)
- `credits`: Number of credits received (number)
- `usdcAmount`: USDC amount charged (string)
- `tokenType`: Token type used for payment (string)

**Example:**
```typescript
const purchaseResult = await beyond.credits.purchaseCredits({ amount: 1.0 });
console.log('Purchase Result:');
console.log(`Success: ${purchaseResult.success}`);
console.log(`Transaction ID: ${purchaseResult.transactionId}`);
console.log(`Credits Received: ${purchaseResult.credits}`);
console.log(`USDC Amount: ${purchaseResult.usdcAmount}`);
console.log(`Token Type: ${purchaseResult.tokenType}`);
```

**Note:** User must be authenticated and have an active session key for purchases.

### 💬 Chat Completions API

#### `beyond.chat.chat(message: string, model?: ChatModel)`
Create a simple chat completion with a single message.

**Parameters:**
- `message` (string): The user message
- `model` (ChatModel, optional): AI model to use (defaults to LLAMA_8B)

**Returns:** Promise resolving to the assistant's response as a string

**Example:**
```typescript
// Simple chat with default model
const response = await beyond.chat.chat('What is the capital of France?');
console.log(response); // "Paris"

// Chat with specific model
const response = await beyond.chat.chat(
  'Explain quantum computing briefly',
  CHAT_MODELS.LLAMA_70B
);
console.log(response);
```

#### `beyond.chat.createCompletion(params: ChatCompletionParams)`
Create a chat completion with full parameter control.

**Parameters:**
- `params.model` (ChatModel): AI model to use
- `params.messages` (ChatMessage[]): Array of conversation messages
- `params.temperature?` (number): Creativity level (0-1, default: 0.7)
- `params.max_tokens?` (number): Maximum tokens to generate
- `params.top_p?` (number): Nucleus sampling parameter (0-1)
- `params.stream?` (boolean): Whether to stream response (default: true)
- `params.frequency_penalty?` (number): Repetition control (-2 to 2)
- `params.presence_penalty?` (number): Topic diversity (-2 to 2)
- `params.tool_choice?` (string): Tool selection mode

**Returns:** Promise resolving to either:
- `ChatCompletionStreamResponse` (when stream: true or default)
- `ChatCompletionResponse` (when stream: false)

**Streaming Response (`ChatCompletionStreamResponse`):**
```typescript
{
  messageId: string;
  content: string;
  finishReason?: string;
  usage?: ChatUsage;
  chunks: StreamChunk[];
}
```

**Non-Streaming Response (`ChatCompletionResponse`):**
```typescript
{
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
  usage: ChatUsage;
}
```

**Example:**
```typescript
// Advanced chat with parameters
const completion = await beyond.chat.createCompletion({
  model: CHAT_MODELS.LLAMA_8B,
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Write a haiku about programming' }
  ],
  temperature: 0.9,
  max_tokens: 50,
  stream: true
});

console.log('Message ID:', completion.messageId);
console.log('Content:', completion.content);
console.log('Usage:', completion.usage);

// Non-streaming format (OpenAI-compatible)
const nonStreamCompletion = await beyond.chat.createCompletion({
  model: CHAT_MODELS.LLAMA_70B,
  messages: [{ role: 'user', content: 'What is AI?' }],
  temperature: 0.3,
  stream: false
});

console.log('Response:', nonStreamCompletion.choices[0].message.content);
console.log('Finish Reason:', nonStreamCompletion.choices[0].finishReason);
```

**Available Models:**
```typescript
CHAT_MODELS.LLAMA_8B   // meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo
CHAT_MODELS.LLAMA_70B  // meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo
```

**Message Roles:**
- `user`: User messages
- `assistant`: AI assistant responses
- `system`: System instructions for behavior control

### 💾 Storage API

The SDK provides direct access to storage utilities:

```typescript
// Token management
beyond.storage.getAccessToken()
beyond.storage.getRefreshToken()
beyond.storage.saveTokens(accessToken, refreshToken)
beyond.storage.clearTokens()

// User data
beyond.storage.getUser()
beyond.storage.saveUser(userData)
beyond.storage.clearUser()

// Authentication check
beyond.storage.isAuthenticated()

// Clear all data
beyond.storage.clearAll()
```

## ⚙️ Configuration

### Initialization Options

```typescript
beyond.initialize({
  apiUrl: string,           // Required: API base URL
  storagePrefix?: string,   // Optional: Storage key prefix (default: 'beyond_')
  debug?: boolean          // Optional: Enable debug logging (default: false)
});
```

### Environment URLs

- **Development**: `https://dev-api.beyondnetwork.xyz`
- **Production**: `https://api.beyondnetwork.xyz`

### Chat API Endpoints

- **Development**: `https://aidev.beyondnetwork.xyz`
- **Production**: `https://ai.beyondnetwork.xyz`

## 🔧 Development

### Building the SDK

```bash
npm run build
```

### Running Tests

```bash
# Unit tests
npm test
npm run test:dev  # Test against dev environment
npm run test:prod # Test against prod environment
```

### End-to-End Testing

The SDK includes comprehensive e2e tests that test the published npm package:

```bash
# Setup e2e tests
npm run e2e:setup

# Test latest version
npm run e2e:dev   # Test against dev API
npm run e2e:prod  # Test against prod API

# Test with local build
npm run e2e:dev:local   # Test local build against dev API
npm run e2e:prod:local  # Test local build against prod API

# Test specific versions
npm run testsdk:dev:0.2.1   # Test v0.2.1 against dev API
npm run testsdk:prod:0.2.1  # Test v0.2.1 against prod API

# Clean up test artifacts
npm run e2e:clean
```

The e2e tests verify:
- SDK import and initialization
- Authentication flow (OTP request/verify)
- Beyond Wallet functionality
- Credits balance and purchasing
- Chat completions (streaming and non-streaming)
- Storage functionality
- Sign out process

See `e2e-tests/README.md` for detailed information about the e2e testing framework.

## 📚 Examples

The `examples/` directory contains comprehensive examples demonstrating all SDK features:

```bash
# View all examples structure
node examples/comprehensive-sdk-examples.js

# Interactive testing with real authentication
node examples/test-comprehensive-examples.js

# Individual examples
node examples/complete-flow-example.js
node examples/chat-api-examples.js
```

See `examples/README.md` for detailed examples and usage patterns.

## 🔍 TypeScript Support

The SDK is written in TypeScript and includes full type definitions. All interfaces and types are exported:

```typescript
import { 
  beyond, 
  CHAT_MODELS,
  Auth, 
  Credits,
  Chat,
  Config,
  
  // Authentication types
  RequestOtpParams,
  VerifyOtpParams,
  AuthResponse,
  UserDetails,
  TokenResponse,
  BeyondWallet,
  BeyondWalletResponse,
  
  // Credits types
  CreditBalance,
  CreditBalanceResponse,
  CreditPurchaseParams,
  CreditPurchaseResult,
  CreditPurchaseResponse,
  
  // Chat types
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatCompletionStreamResponse,
  ChatMessage,
  ChatUsage,
  ChatModel,
  StreamChunk,
  
  // Core types
  ApiResponse,
  BeyondAuthOptions
} from '@Beyond-Network-AI/beyond-ai';
```

## 🌐 Browser Support

The SDK works in both Node.js and browser environments. For Node.js, you'll need to provide a localStorage implementation:

```javascript
// Node.js setup
const { LocalStorage } = require('node-localstorage');
global.localStorage = new LocalStorage('./scratch');

// Then use the SDK normally
const { beyond } = require('@Beyond-Network-AI/beyond-ai');
```

## 🛠️ Error Handling

The SDK provides comprehensive error handling:

```typescript
try {
  await beyond.auth.email.requestOtp('invalid-email');
} catch (error) {
  console.error('OTP request failed:', error.message);
}

try {
  const completion = await beyond.chat.createCompletion({
    model: CHAT_MODELS.LLAMA_8B,
    messages: [{ role: 'user', content: 'Hello' }]
  });
} catch (error) {
  if (error.message.includes('authenticated')) {
    console.error('Please login first');
  } else {
    console.error('Chat completion failed:', error.message);
  }
}
```

## 📊 Usage Patterns

### Complete Authentication Flow
```typescript
// 1. Initialize
beyond.initialize({ apiUrl: 'https://api.beyondnetwork.xyz' });

// 2. Request OTP
await beyond.auth.email.requestOtp('user@example.com');

// 3. Verify OTP
const auth = await beyond.auth.email.verifyOtp('user@example.com', '123456');

// 4. Get wallet info
const wallet = await beyond.auth.getBeyondWallet();

// 5. Check credits
const balance = await beyond.credits.getBalance();

// 6. Use AI chat
const response = await beyond.chat.chat('Hello!');

// 7. Sign out
await beyond.auth.email.signOut();
```

### Chat Conversation
```typescript
const conversation = [
  { role: 'system', content: 'You are a helpful coding assistant.' },
  { role: 'user', content: 'How do I create a React component?' }
];

const response = await beyond.chat.createCompletion({
  model: CHAT_MODELS.LLAMA_8B,
  messages: conversation,
  temperature: 0.7
});

// Add assistant response to conversation
conversation.push({
  role: 'assistant',
  content: response.content
});

// Continue conversation
conversation.push({
  role: 'user',
  content: 'Can you show me an example?'
});

const followUp = await beyond.chat.createCompletion({
  model: CHAT_MODELS.LLAMA_8B,
  messages: conversation,
  temperature: 0.7
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Run e2e tests: `npm run e2e:dev`
6. Submit a pull request

## 📄 License

MIT
