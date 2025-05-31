const { beyond } = require('../dist');

async function demonstrateCreditsAPI() {
  try {
    // Initialize the SDK
    beyond.initialize({
      apiUrl: 'https://dev-api.beyondnetwork.xyz',
      debug: true
    });

    // Note: User must be authenticated first
    // This example assumes the user is already logged in
    if (!beyond.auth.isAuthenticated()) {
      console.log('User must be authenticated to fetch credit balance');
      console.log('Please run the authentication example first');
      return;
    }

    console.log('Fetching credit balance...');
    
    // Get credit balance
    const creditBalance = await beyond.credits.getBalance();
    
    console.log('Credit Balance Information:');
    console.log('========================');
    console.log(`Monthly Limit: ${creditBalance.monthlyLimit}`);
    console.log(`Monthly Current Usage: ${creditBalance.monthlyCurrentUsage}`);
    console.log(`Total Credits Used: ${creditBalance.totalCreditsUsed}`);
    console.log(`Total Credits Purchased: ${creditBalance.totalCreditsPurchased}`);
    
    // Calculate remaining monthly credits
    const remaining = parseFloat(creditBalance.monthlyLimit) - parseFloat(creditBalance.monthlyCurrentUsage);
    console.log(`Remaining Monthly Credits: ${remaining.toFixed(8)}`);
    
  } catch (error) {
    console.error('Error fetching credit balance:', error.message);
  }
}

// Run the example
demonstrateCreditsAPI(); 