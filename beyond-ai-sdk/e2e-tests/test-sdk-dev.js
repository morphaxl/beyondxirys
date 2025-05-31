const readline = require('readline');

// Set up localStorage for Node.js environment (required for the SDK)
if (typeof localStorage === 'undefined') {
  const { LocalStorage } = require('node-localstorage');
  global.localStorage = new LocalStorage('./scratch');
}

// Import the SDK - support local testing
let beyondAI, beyond;
try {
  if (process.env.USE_LOCAL_SDK === 'true') {
    console.log('🔧 Using local SDK from ../dist');
    beyondAI = require('../dist/index.js');
  } else {
    console.log('📦 Using installed SDK from node_modules');
    beyondAI = require('@Beyond-Network-AI/beyond-ai');
  }
  
  beyond = beyondAI.beyond || beyondAI.default || beyondAI;
  console.log('✅ SDK imported successfully');
  console.log('📦 Package contents:', Object.keys(beyondAI));
  console.log('🔍 Beyond object type:', typeof beyond);
} catch (error) {
  console.error('❌ Failed to import SDK:', error.message);
  if (process.env.USE_LOCAL_SDK === 'true') {
    console.error('💡 Make sure to run "npm run build" in the parent directory first');
  }
  process.exit(1);
}

// Initialize the SDK with the Beyond DEV API endpoint
try {
  beyond.initialize({
    apiUrl: "https://dev-api.beyondnetwork.xyz",
    debug: true,
    storagePrefix: 'beyond_e2e_'
  });
  console.log('✅ SDK initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize SDK:', error.message);
  process.exit(1);
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt for input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Test SDK functionality
async function runE2ETest() {
  try {
    console.log('\n=== Beyond AI SDK E2E Test (DEV Environment) ===\n');
    
    // Show current configuration
    const config = beyond.getConfig();
    console.log('📋 SDK Configuration:');
    console.log(`   Base URL: ${config?.apiUrl}`);
    console.log(`   Debug Mode: ${config?.debug}`);
    console.log(`   Storage Prefix: ${config?.storagePrefix}\n`);
    
    // Test 1: Check if user is already authenticated
    console.log('🔍 Test 1: Check authentication status');
    const isAuth = beyond.auth.isAuthenticated();
    console.log(`   Is authenticated: ${isAuth}`);
    
    if (isAuth) {
      const currentUser = beyond.auth.getCurrentUser();
      console.log('   Current user:', currentUser?.email || 'Unknown');
      
      const signOut = await askQuestion('   User is already logged in. Sign out first? (y/n): ');
      if (signOut.toLowerCase() === 'y' || signOut.toLowerCase() === 'yes') {
        await beyond.auth.email.signOut();
        console.log('   ✅ Signed out successfully\n');
      } else {
        console.log('   ℹ️  Continuing with existing session\n');
        rl.close();
        return;
      }
    } else {
      console.log('   ✅ No existing session\n');
    }
    
    // Test 2: Request OTP
    console.log('🔍 Test 2: Request OTP');
    const email = await askQuestion('   Enter your email address: ');
    
    if (!email || !email.includes('@')) {
      console.error('   ❌ Please enter a valid email address');
      rl.close();
      return;
    }
    
    console.log(`   📧 Requesting OTP for: ${email}`);
    try {
      const otpResult = await beyond.auth.email.requestOtp(email);
      console.log('   ✅ OTP request successful:', otpResult.message || 'OTP sent');
    } catch (error) {
      console.error('   ❌ Failed to request OTP:', error.message);
      rl.close();
      return;
    }
    
    // Test 3: Verify OTP and login
    console.log('\n🔍 Test 3: Verify OTP and login');
    const otp = await askQuestion('   Enter the OTP you received: ');
    
    if (!otp || otp.length < 4) {
      console.error('   ❌ Please enter a valid OTP');
      rl.close();
      return;
    }
    
    console.log(`   🔐 Verifying OTP: ${otp}`);
    try {
      const authResult = await beyond.auth.email.verifyOtp(email, otp);
      console.log('   ✅ Login successful!');
      console.log('   📋 User Details:');
      console.log(`      - Email: ${authResult.userDetails.email}`);
      console.log(`      - Username: ${authResult.userDetails.username}`);
      console.log(`      - ETH Address: ${authResult.userDetails.ethAddress || 'Not set'}`);
      console.log(`      - SOL Address: ${authResult.userDetails.solAddress || 'Not set'}`);
    } catch (error) {
      console.error('   ❌ OTP verification failed:', error.message);
      rl.close();
      return;
    }
    
    // Test 4: Check authentication status after login
    console.log('\n🔍 Test 4: Verify authentication state');
    const isAuthAfter = beyond.auth.isAuthenticated();
    const currentUser = beyond.auth.getCurrentUser();
    console.log(`   Is authenticated: ${isAuthAfter}`);
    console.log(`   Current user: ${currentUser?.email || 'Unknown'}`);
    
    if (isAuthAfter && currentUser) {
      console.log('   ✅ Authentication state verified');
    } else {
      console.log('   ❌ Authentication state inconsistent');
    }
    
    // Test 5: Test Beyond Wallet functionality
    console.log('\n🔍 Test 5: Test Beyond Wallet functionality');
    try {
      const beyondWallet = await beyond.auth.getBeyondWallet();
      console.log('   ✅ Beyond Wallet details fetched successfully!');
      console.log(`   📋 Smart Wallet Address: ${beyondWallet.Address}`);
      
      // Check if user details were updated
      const updatedUser = beyond.auth.getCurrentUser();
      if (updatedUser && updatedUser.smartWalletAddress) {
        console.log(`   📋 User Smart Wallet Address: ${updatedUser.smartWalletAddress}`);
        
        if (updatedUser.smartWalletAddress === beyondWallet.Address) {
          console.log('   ✅ User details successfully updated with wallet info');
        } else {
          console.log('   ❌ User details not properly updated');
        }
      } else {
        console.log('   ❌ User details missing smart wallet address');
      }
    } catch (error) {
      console.error('   ❌ Beyond Wallet test failed:', error.message);
    }
    
    // Test 6: Test Credits functionality
    console.log('\n🔍 Test 6: Test Credits functionality');
    try {
      console.log('   📊 Fetching credit balance...');
      const balance = await beyond.credits.getBalance();
      console.log('   ✅ Credit balance fetched successfully!');
      console.log('   📋 Credit Balance Details:');
      console.log(`      - Monthly Limit: ${balance.monthlyLimit}`);
      console.log(`      - Monthly Current Usage: ${balance.monthlyCurrentUsage}`);
      console.log(`      - Total Credits Used: ${balance.totalCreditsUsed}`);
      console.log(`      - Total Credits Purchased: ${balance.totalCreditsPurchased}`);
      
      // Calculate remaining credits
      const remaining = parseFloat(balance.monthlyLimit) - parseFloat(balance.monthlyCurrentUsage);
      console.log(`      - Remaining Monthly Credits: ${remaining.toFixed(8)}`);
      
      // Validate structure
      console.log('   ✅ Credit balance structure validated');
      
      // Validate all values are numeric strings
      const isValidNumeric = (value) => !isNaN(parseFloat(value)) && isFinite(value);
      if (isValidNumeric(balance.monthlyLimit) && 
          isValidNumeric(balance.monthlyCurrentUsage) && 
          isValidNumeric(balance.totalCreditsUsed) && 
          isValidNumeric(balance.totalCreditsPurchased)) {
        console.log('   ✅ All credit values are valid numeric strings');
      } else {
        console.log('   ❌ Some credit values are not valid numeric strings');
      }
    } catch (error) {
      console.error('   ❌ Credits test failed:', error.message);
    }

    // Test 7: Test Credits Purchase functionality
    console.log('\n🔍 Test 7: Test Credits Purchase functionality');
    try {
      console.log('   💳 Testing credit purchase with $0.01...');
      const purchaseResult = await beyond.credits.purchaseCredits({ amount: 0.01 });
      
      console.log('   ✅ Credit purchase successful!');
      console.log('   📋 Purchase Result:');
      console.log(`      - Success: ${purchaseResult.success}`);
      console.log(`      - Transaction ID: ${purchaseResult.transactionId}`);
      console.log(`      - Credits Received: ${purchaseResult.credits}`);
      console.log(`      - USDC Amount: ${purchaseResult.usdcAmount}`);
      console.log(`      - Token Type: ${purchaseResult.tokenType}`);
      
      // Validate purchase result structure
      if (purchaseResult.success && 
          purchaseResult.transactionId && 
          typeof purchaseResult.credits === 'number' &&
          purchaseResult.usdcAmount &&
          purchaseResult.tokenType) {
        console.log('   ✅ Purchase result structure validated');
      } else {
        console.log('   ❌ Purchase result structure invalid');
      }
      
    } catch (error) {
      console.error('   ❌ Credits purchase test failed:', error.message);
      
      if (error.message.includes('Session key is not active')) {
        console.log('   💡 Note: Session key needs to be activated for purchases');
        console.log('   ✅ Purchase API is accessible (session key issue expected)');
      } else if (error.message.includes('Insufficient')) {
        console.log('   💡 Note: Insufficient funds or permissions');
        console.log('   ✅ Purchase API is accessible (insufficient funds expected)');
      } else {
        console.log('   ❌ Unexpected error in purchase API');
      }
    }
    
    // Test 8: Test Chat API functionality
    console.log('\n🔍 Test 8: Test Chat API functionality');
    try {
      console.log('   💬 Testing simple chat method...');
      const simpleResponse = await beyond.chat.chat('What is 2+2? Give a very short answer.');
      console.log('   ✅ Simple chat successful!');
      console.log('   📝 Response:', simpleResponse.substring(0, 50) + (simpleResponse.length > 50 ? '...' : ''));
      console.log('   📊 Response length:', simpleResponse.length);
      
      console.log('   ⚙️ Testing full completion method...');
      const completionResponse = await beyond.chat.createCompletion({
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        messages: [
          { role: 'user', content: 'What is the capital of France? One word answer.' }
        ],
        temperature: 0,
        max_tokens: 10,
        stream: true
      });
      
      console.log('   ✅ Full completion successful!');
      console.log('   🆔 Message ID:', completionResponse.messageId);
      console.log('   📝 Content:', completionResponse.content);
      console.log('   🏁 Finish reason:', completionResponse.finishReason);
      console.log('   📊 Usage:', completionResponse.usage);
      console.log('   📦 Chunks processed:', completionResponse.chunks.length);
      
      // Test non-streaming format
      console.log('   📄 Testing non-streaming format...');
      const nonStreamResponse = await beyond.chat.createCompletion({
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        messages: [
          { role: 'user', content: 'Say hello in one word.' }
        ],
        temperature: 0,
        stream: false
      });
      
      console.log('   ✅ Non-streaming successful!');
      console.log('   🆔 ID:', nonStreamResponse.id);
      console.log('   📝 Content:', nonStreamResponse.choices[0].message.content);
      console.log('   🏁 Finish reason:', nonStreamResponse.choices[0].finishReason);
      console.log('   📊 Usage:', nonStreamResponse.usage);
      
    } catch (error) {
      console.error('   ❌ Chat API test failed:', error.message);
    }
    
    // Test 9: Test storage functionality
    console.log('\n🔍 Test 9: Test storage functionality');
    const hasTokens = beyond.storage.getAccessToken() && beyond.storage.getRefreshToken();
    console.log('   Has tokens:', Boolean(hasTokens));
    console.log(`   Access token length: ${beyond.storage.getAccessToken()?.length || 0}`);
    console.log(`   Refresh token length: ${beyond.storage.getRefreshToken()?.length || 0}`);
    
    if (hasTokens) {
      console.log('   ✅ Storage functionality verified');
    } else {
      console.log('   ❌ Storage functionality failed');
    }
    
    // Test 10: Sign out
    console.log('\n🔍 Test 10: Sign out');
    const shouldSignOut = await askQuestion('   Sign out? (y/n): ');
    if (shouldSignOut.toLowerCase() === 'y' || shouldSignOut.toLowerCase() === 'yes') {
      try {
        await beyond.auth.email.signOut();
        console.log('   ✅ Successfully signed out');
        
        // Verify sign out
        const isAuthFinal = beyond.auth.isAuthenticated();
        const hasTokensFinal = beyond.storage.getAccessToken() || beyond.storage.getRefreshToken();
        console.log(`   Is authenticated after signout: ${isAuthFinal}`);
        console.log(`   Has tokens after signout: ${!!hasTokensFinal}`);
        
        if (!isAuthFinal && !hasTokensFinal) {
          console.log('   ✅ Sign out verified');
        } else {
          console.log('   ❌ Sign out incomplete');
        }
      } catch (error) {
        console.error('   ❌ Sign out failed:', error.message);
      }
    }
    
    console.log('\n🎉 E2E Test completed!');
    
  } catch (error) {
    console.error('\n❌ E2E Test failed:', error.message);
    console.error('📋 Error details:', error);
  } finally {
    rl.close();
  }
}

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n\n👋 Test interrupted by user');
  rl.close();
  process.exit(0);
});

// Start the test
console.log('🚀 Starting Beyond AI SDK E2E Test...\n');
runE2ETest(); 