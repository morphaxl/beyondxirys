const { beyond } = require('@Beyond-Network-AI/beyond-ai');

async function completeFlowExample() {
  try {
    console.log('🚀 Beyond AI SDK Complete Flow Example\n');

    // Initialize the SDK
    beyond.initialize({
      apiUrl: 'https://dev-api.beyondnetwork.xyz',
      debug: true
    });
    console.log('✅ SDK initialized successfully');

    // Check if user is already authenticated
    if (beyond.auth.isAuthenticated()) {
      console.log('✅ User already authenticated');
      
      // Get current user details
      const user = beyond.auth.getCurrentUser();
      console.log('📋 Current User:', user.email);
      
      // Get Beyond wallet details
      const beyondWallet = await beyond.auth.getBeyondWallet();
      console.log('📋 Beyond Wallet Address:', beyondWallet.Address);
      
      return;
    }

    console.log('ℹ️  User not authenticated. Starting login flow...');

    // Example email - replace with actual email
    const email = 'your-email@example.com';
    
    // Step 1: Request OTP
    console.log(`📧 Requesting OTP for: ${email}`);
    const otpResult = await beyond.auth.email.requestOtp(email);
    console.log('✅ OTP sent:', otpResult.message);

    // Step 2: Verify OTP (you would get this from email)
    const otp = '123456'; // Replace with actual OTP from email
    console.log(`🔐 Verifying OTP: ${otp}`);
    
    const authResult = await beyond.auth.email.verifyOtp(email, otp);
    console.log('✅ Login successful!');
    console.log('📋 User Details:');
    console.log(`   - Email: ${authResult.userDetails.email}`);
    console.log(`   - Username: ${authResult.userDetails.username}`);
    console.log(`   - ETH Address: ${authResult.userDetails.ethAddress || 'Not set'}`);
    console.log(`   - SOL Address: ${authResult.userDetails.solAddress || 'Not set'}`);

    // Step 3: Get Beyond Wallet details
    console.log('\n💰 Fetching Beyond Wallet details...');
    const beyondWallet = await beyond.auth.getBeyondWallet();
    console.log('✅ Beyond Wallet details fetched!');
    console.log(`📋 Smart Wallet Address: ${beyondWallet.Address}`);

    // Step 4: Verify user details were updated
    const updatedUser = beyond.auth.getCurrentUser();
    console.log('\n📋 Updated User Details:');
    console.log(`   - Email: ${updatedUser.email}`);
    console.log(`   - Username: ${updatedUser.username}`);
    console.log(`   - Smart Wallet Address: ${updatedUser.smartWalletAddress}`);

    if (updatedUser.smartWalletAddress === beyondWallet.Address) {
      console.log('✅ User details successfully updated with wallet info');
    }

    // Step 5: Sign out (optional)
    console.log('\n🚪 Signing out...');
    await beyond.auth.email.signOut();
    console.log('✅ Successfully signed out');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
completeFlowExample(); 