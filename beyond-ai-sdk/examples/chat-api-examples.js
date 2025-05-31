// Demonstrates all features of the Chat Completions API

const { beyond, CHAT_MODELS } = require('@Beyond-Network-AI/beyond-ai');

async function chatExamples() {
  // Initialize the SDK
  beyond.initialize({
    apiUrl: 'https://dev-api.beyondnetwork.xyz', // or 'https://api.beyondnetwork.xyz' for production
    debug: true
  });

  // Note: You need to be authenticated first
  // await beyond.auth.email.requestOtp('your-email@example.com');
  // await beyond.auth.email.verifyOtp('your-email@example.com', 'your-otp');

  console.log('🚀 Beyond AI SDK - Chat API Examples\n');

  // Example 1: Simple Chat (Convenience Method)
  console.log('💬 Example 1: Simple Chat');
  try {
    const response = await beyond.chat.chat('What is the capital of France?');
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Example 2: Chat with Different Model
  console.log('\n🧠 Example 2: Using Larger Model (70B)');
  try {
    const response = await beyond.chat.chat(
      'Explain quantum computing in simple terms',
      CHAT_MODELS.LLAMA_70B
    );
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Example 3: Full Chat Completion with All Parameters
  console.log('\n⚙️ Example 3: Full Chat Completion with Parameters');
  try {
    const response = await beyond.chat.createCompletion({
      model: CHAT_MODELS.LLAMA_8B,
      messages: [
        { role: 'user', content: 'Write a haiku about programming' }
      ],
      temperature: 0.9,        // High creativity
      max_tokens: 50,          // Limit response length
      top_p: 0.95,            // Nucleus sampling
      tool_choice: 'auto',     // Tool selection
      stream: true             // Streaming (default)
    });

    console.log('Message ID:', response.messageId);
    console.log('Content:', response.content);
    console.log('Usage:', response.usage);
    console.log('Chunks processed:', response.chunks.length);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Example 4: Non-Streaming Response (Converted Format)
  console.log('\n📄 Example 4: Non-Streaming Response Format');
  try {
    const response = await beyond.chat.createCompletion({
      model: CHAT_MODELS.LLAMA_8B,
      messages: [
        { role: 'user', content: 'What is 2+2?' }
      ],
      temperature: 0,          // Deterministic
      stream: false            // Request non-streaming format
    });

    console.log('ID:', response.id);
    console.log('Content:', response.choices[0].message.content);
    console.log('Finish Reason:', response.choices[0].finishReason);
    console.log('Usage:', response.usage);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Example 5: Conversation with History
  console.log('\n💭 Example 5: Conversation with History');
  try {
    const response = await beyond.chat.createCompletion({
      model: CHAT_MODELS.LLAMA_8B,
      messages: [
        { role: 'user', content: 'My name is Alice' },
        { role: 'assistant', content: 'Nice to meet you, Alice!' },
        { role: 'user', content: 'What is my name?' }
      ],
      temperature: 0.3,
      max_tokens: 20
    });

    console.log('Response:', response.content);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Example 6: System Message for Behavior Control
  console.log('\n🎭 Example 6: System Message for Behavior Control');
  try {
    const response = await beyond.chat.createCompletion({
      model: CHAT_MODELS.LLAMA_8B,
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful assistant that always responds in a pirate accent.' 
        },
        { role: 'user', content: 'Tell me about the weather' }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    console.log('Pirate Response:', response.content);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Example 7: Temperature Comparison
  console.log('\n🌡️ Example 7: Temperature Comparison');
  
  const prompt = 'Give me a creative name for a coffee shop';
  
  // Low temperature (deterministic)
  try {
    const lowTemp = await beyond.chat.createCompletion({
      model: CHAT_MODELS.LLAMA_8B,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 30
    });
    console.log('Low Temperature (0.1):', lowTemp.content);
  } catch (error) {
    console.error('Low temp error:', error.message);
  }

  // High temperature (creative)
  try {
    const highTemp = await beyond.chat.createCompletion({
      model: CHAT_MODELS.LLAMA_8B,
      messages: [{ role: 'user', content: prompt }],
      temperature: 1.0,
      max_tokens: 30
    });
    console.log('High Temperature (1.0):', highTemp.content);
  } catch (error) {
    console.error('High temp error:', error.message);
  }

  console.log('\n🎉 Chat API Examples Complete!');
  console.log('\n📋 Available Models:');
  console.log('- CHAT_MODELS.LLAMA_8B:', CHAT_MODELS.LLAMA_8B);
  console.log('- CHAT_MODELS.LLAMA_70B:', CHAT_MODELS.LLAMA_70B);
  
  console.log('\n⚙️ Supported Parameters:');
  console.log('- model: Choose AI model');
  console.log('- messages: Conversation history');
  console.log('- temperature: Creativity (0-1)');
  console.log('- max_tokens: Response length limit');
  console.log('- top_p: Nucleus sampling (0-1)');
  console.log('- tool_choice: Tool selection mode');
  console.log('- stream: Response format (always streams from API)');
  console.log('- frequency_penalty: Repetition control (-2 to 2)');
  console.log('- presence_penalty: Topic diversity (-2 to 2)');
}

// Run examples if this file is executed directly
if (require.main === module) {
  chatExamples().catch(console.error);
}

module.exports = { chatExamples }; 