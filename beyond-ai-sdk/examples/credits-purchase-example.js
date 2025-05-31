const { beyond } = require('@Beyond-Network-AI/beyond-ai');

async function creditsPurchaseExample() {
  try {
    console.log('💳 Beyond AI SDK Credits Purchase Example\n');

    // Initialize the SDK
    beyond.initialize({
      apiUrl: 'https://dev-api.beyondnetwork.xyz',
      debug: true
    });

    // Check if user is already authenticated
    if (!beyond.auth.isAuthenticated()) {
      console.log('❌ User not authenticated. Please login first.');
      
      // Example login flow (you would need to provide actual email and OTP)
      // const email = 'your-email@example.com';
      // await beyond.auth.email.requestOtp(email);
      // const otp = '123456'; // Get this from email
      // await beyond.auth.email.verifyOtp(email, otp);
      
      return;
    }

    console.log('✅ User authenticated. Proceeding with credits operations...');

    // Get current credit balance
    console.log('\n💰 Fetching current credit balance...');
    try {
      const balance = await beyond.credits.getBalance();
      console.log('📋 Current Credit Balance:');
      console.log(`   - Monthly Limit: ${balance.monthlyLimit}`);
      console.log(`   - Monthly Usage: ${balance.monthlyCurrentUsage}`);
      console.log(`   - Total Used: ${balance.totalCreditsUsed}`);
      console.log(`   - Total Purchased: ${balance.totalCreditsPurchased}`);
    } catch (error) {
      console.error('❌ Failed to fetch balance:', error.message);
    }

    // Purchase credits
    console.log('\n💳 Purchasing credits...');
    try {
      const purchaseResult = await beyond.credits.purchaseCredits({ amount: 1 });
      
      console.log('✅ Credits purchased successfully!');
      console.log('📋 Purchase Details:');
      console.log(`   - Success: ${purchaseResult.success}`);
      console.log(`   - Transaction ID: ${purchaseResult.transactionId}`);
      console.log(`   - Credits Received: ${purchaseResult.credits}`);
      console.log(`   - USDC Amount: ${purchaseResult.usdcAmount}`);
      console.log(`   - Token Type: ${purchaseResult.tokenType}`);
      
      // Get updated balance
      console.log('\n💰 Fetching updated credit balance...');
      const updatedBalance = await beyond.credits.getBalance();
      console.log('📋 Updated Credit Balance:');
      console.log(`   - Monthly Limit: ${updatedBalance.monthlyLimit}`);
      console.log(`   - Monthly Usage: ${updatedBalance.monthlyCurrentUsage}`);
      console.log(`   - Total Used: ${updatedBalance.totalCreditsUsed}`);
      console.log(`   - Total Purchased: ${updatedBalance.totalCreditsPurchased}`);
      
    } catch (error) {
      console.error('❌ Failed to purchase credits:', error.message);
      
      if (error.message.includes('Session key is not active')) {
        console.log('💡 Tip: You may need to activate your session key before making purchases.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
creditsPurchaseExample(); 