import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { documentService } from './services/documentService.js';
import { irysService } from './services/irysService.js';

// Load environment variables
dotenv.config();

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_DEV_URL,
    'http://localhost:5001',
    `https://${process.env.REPLIT_DEV_DOMAIN}`,
    `https://${process.env.REPLIT_DEV_DOMAIN}:5001`,
    'https://beyond-gyan.replit.app',
    'https://gyan.beyondnetwork.xyz',
    /^https:\/\/.*\.replit\.dev$/,
    /^https:\/\/.*\.replit\.dev:\d+$/,
    /^https:\/\/.*\.replit\.app$/,
    /^https:\/\/.*\.picard\.replit\.dev$/,
    /^https:\/\/.*\.picard\.replit\.dev:\d+$/
  ].filter(Boolean), // Remove any undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'x-user-info'],
  optionsSuccessStatus: 200 // For legacy browser support
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build
const frontendPath = path.join(__dirname, '..', 'dist');
app.use(express.static(frontendPath));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// User context middleware - extract user info from headers
app.use((req, res, next) => {
  // Extract user info from headers (sent by frontend)
  const userInfoHeader = req.headers['x-user-info'];
  if (userInfoHeader) {
    try {
      req.userInfo = JSON.parse(userInfoHeader);
      console.log('👤 User context:', req.userInfo.email);
    } catch (error) {
      console.warn('⚠️ Invalid user info header:', error.message);
      req.userInfo = null;
    }
  } else {
    req.userInfo = null;
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Document Knowledge Base API'
  });
});

// ==================== DOCUMENT ROUTES ====================

/**
 * Add a new document by URL
 * POST /api/documents/add
 * Body: { url: string }
 * Headers: { x-user-info: JSON string with user details }
 */
app.post('/api/documents/add', async (req, res) => {
  try {
    const { url } = req.body;
    const userInfo = req.userInfo;
    
    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required',
        message: 'Please provide a valid URL to scrape'
      });
    }

    console.log('📋 Processing new document request:', url);
    console.log('👤 User:', userInfo ? userInfo.email : 'No user context');
    
    const document = await documentService.addDocument(url, userInfo);
    
    res.status(201).json({
      success: true,
      message: 'Document added successfully',
      document
    });
  } catch (error) {
    console.error('❌ Error adding document:', error.message);
    res.status(500).json({
      error: 'Failed to add document',
      message: error.message
    });
  }
});

/**
 * Get all documents for the authenticated user
 * GET /api/documents
 * Headers: { x-user-info: JSON string with user details }
 */
app.get('/api/documents', async (req, res) => {
  try {
    const userInfo = req.userInfo;
    console.log('📚 Fetching documents for user:', userInfo ? userInfo.email : 'No user context');
    
    const documents = await documentService.getAllDocuments(userInfo);
    const stats = documentService.getStatistics();
    
    res.json({
      success: true,
      documents,
      statistics: stats
    });
  } catch (error) {
    console.error('❌ Error fetching documents:', error.message);
    res.status(500).json({
      error: 'Failed to fetch documents',
      message: error.message
    });
  }
});

/**
 * Get a specific document by ID
 * GET /api/documents/:id
 */
app.get('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📄 Fetching document:', id);
    
    const document = await documentService.getDocument(id);
    
    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('❌ Error fetching document:', error.message);
    res.status(404).json({
      error: 'Document not found',
      message: error.message
    });
  }
});

/**
 * Search documents
 * GET /api/documents/search?q=query
 */
app.get('/api/documents/search', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        error: 'Search query is required',
        message: 'Please provide a search query'
      });
    }

    console.log('🔍 Searching documents for:', query);
    
    const results = await documentService.searchDocuments(query);
    
    res.json({
      success: true,
      query,
      results,
      count: results.length
    });
  } catch (error) {
    console.error('❌ Error searching documents:', error.message);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

/**
 * Load user documents from Irys (refresh from permanent storage)
 * POST /api/documents/load
 * Headers: { x-user-info: JSON string with user details }
 */
app.post('/api/documents/load', async (req, res) => {
  try {
    const userInfo = req.userInfo;
    
    if (!userInfo) {
      return res.status(400).json({
        error: 'User authentication required',
        message: 'Please provide user information to load documents'
      });
    }

    console.log('🔄 Loading user documents from Irys for:', userInfo.email);
    
    const documents = await documentService.loadUserDocuments(userInfo);
    const stats = documentService.getStatistics();
    
    res.json({
      success: true,
      message: `Loaded ${documents.length} documents from Irys`,
      documents,
      statistics: stats,
      loadedFromIrys: true
    });
  } catch (error) {
    console.error('❌ Error loading user documents:', error.message);
    res.status(500).json({
      error: 'Failed to load user documents',
      message: error.message
    });
  }
});

/**
 * Delete a document
 * DELETE /api/documents/:id
 */
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting document:', id);
    
    const result = await documentService.removeDocument(id);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('❌ Error deleting document:', error.message);
    res.status(404).json({
      error: 'Failed to delete document',
      message: error.message
    });
  }
});

// ==================== CHAT ROUTES ====================

/**
 * Enhanced chat with document context
 * POST /api/chat/message
 * Body: { message: string, includeDocuments?: boolean }
 * Headers: { x-user-info: JSON string with user details }
 */
app.post('/api/chat/message', async (req, res) => {
  try {
    const { message, includeDocuments = true, conversationHistory = [] } = req.body;
    const userInfo = req.userInfo;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        message: 'Please provide a message'
      });
    }

    console.log('🤖 Processing chat message:', message);
    console.log('👤 User:', userInfo ? userInfo.email : 'No user context');
    
    let documentContext = [];
    let systemPrompt = `You are Beyond Gyan, an intelligent Smart Bookmark Assistant. Your role is to quickly help users find and rediscover their saved bookmarks.

CRITICAL CONTEXT AWARENESS:
- ALWAYS maintain conversation context - remember what you just discussed with the user
- When users say "it", "that", "the link", "the article" etc., they are referring to the SPECIFIC bookmark that was most recently discussed
- NEVER assume "it" means "all bookmarks" - it always refers to a single, specific bookmark from the recent conversation
- Pay attention to the conversation flow and identify the exact bookmark being referenced

IMPORTANT BEHAVIOR:
- When users ask to "find a link about X" or "looking for that bookmark about Y", immediately identify and show the relevant bookmark(s)
- When users ask "give me the link to it" or "can you give me the link", immediately provide the bookmark card for what was just discussed
- Be direct and concise - don't be verbose when users want to find something specific
- Use natural, conversational language
- When showing bookmarks, format them clearly with title, summary, and link

RESPONSE PATTERNS:
- For "find/looking for" queries: Show the bookmark directly with minimal explanation
- For "what was that" queries: Identify the bookmark and provide a brief description
- For "give me the link" or "link to it" queries: Immediately show the bookmark card for the recently discussed item
- For "summarize it/this/that" queries: Summarize ONLY the specific bookmark that was just discussed, not all bookmarks
- For "tell me about it" queries: Provide information about the specific bookmark being referenced
- For general questions: Reference relevant bookmarks naturally in your response

BOOKMARK FORMATTING:
When referencing bookmarks, use this format:
**[Bookmark Title]**
Summary: [Brief summary]
Link: [URL]
---

PERSONALITY:
- Direct and helpful - like a smart assistant who immediately knows what you're looking for
- Maintain conversation context - remember what we just talked about
- Minimal chatter when users want specific bookmarks
- Friendly but efficient`;
    
    if (includeDocuments) {
      // Get user-specific document content for comprehensive context
      console.log('📚 Retrieving user-specific document content for AI context...');
      const allDocuments = await documentService.getAllDocumentContent(userInfo);
      
      if (allDocuments.length > 0) {
        documentContext = allDocuments.map(doc => ({
          title: doc.title,
          url: doc.url,
          summary: doc.summary,
          content: doc.content, // Full content, not truncated
          addedAt: doc.addedAt
        }));
        
        console.log(`📚 Providing AI with ${documentContext.length} user documents`);
        console.log('📊 Total content size:', documentContext.reduce((sum, doc) => sum + doc.content.length, 0), 'characters');
        
        // Enhanced system prompt with user-specific bookmark context
        systemPrompt += `

IMPORTANT: You currently have access to ${documentContext.length} smart bookmarks in ${userInfo ? userInfo.email + "'s" : "the user's"} personal bookmark collection:

${documentContext.map((doc, index) => `
${index + 1}. **"${doc.title}"**
   - Original URL: ${doc.url}
   - Saved: ${new Date(doc.addedAt).toLocaleDateString()}
   - Summary: ${doc.summary}
   - Full Content: ${doc.content}
   
---`).join('\n')}

RESPONSE FORMAT FOR BOOKMARK QUERIES:
When users ask to "find", "looking for", or want a specific bookmark, respond like this:

Found it! Here's your bookmark about [topic]:

**[Exact Bookmark Title]**
Summary: [Brief summary]
Link: ${documentContext.length > 0 ? documentContext[0].url : 'https://example.com'}
---

[Optional brief comment about the bookmark]

IMPORTANT: Always format bookmark responses exactly like the example above, using the exact title, summary, and URL from the bookmark data.`;
        } else {
          const userContext = userInfo ? ` for ${userInfo.email}` : '';
          systemPrompt += `\n\nNote: No bookmarks have been saved${userContext} yet. Encourage them to save their first bookmark using the sidebar - any interesting article, blog post, or webpage they want to remember later!`;
        }
      }

      // Log conversation history for debugging (conversation now handled by Beyond AI directly)
      if (conversationHistory && conversationHistory.length > 0) {
        console.log('📝 Conversation history received:', conversationHistory.length, 'messages');
        console.log('📝 Conversation history details:', JSON.stringify(conversationHistory, null, 2));
      }

    // Prepare the enhanced response with system context
    const enhancedResponse = {
      success: true,
      message: message,
      response: systemPrompt,
      documentContext,
      systemPrompt,
      documentsUsed: documentContext.length,
      userContext: userInfo ? userInfo.email : null,
      timestamp: new Date().toISOString()
    };

    res.json(enhancedResponse);
  } catch (error) {
    console.error('❌ Error processing chat message:', error.message);
    res.status(500).json({
      error: 'Chat processing failed',
      message: error.message
    });
  }
});

/**
 * Get document context for a query
 * GET /api/chat/context?q=query
 */
app.get('/api/chat/context', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query is required',
        message: 'Please provide a query'
      });
    }

    console.log('🤖 Getting document context for:', query);
    
    const context = await documentService.getRelevantDocuments(query, 10);
    
    res.json({
      success: true,
      query,
      context,
      count: context.length
    });
  } catch (error) {
    console.error('❌ Error getting document context:', error.message);
    res.status(500).json({
      error: 'Failed to get context',
      message: error.message
    });
  }
});

// ==================== IRYS SERVICE ROUTES ====================

/**
 * Check Irys service wallet balance
 * GET /api/irys/balance
 */
app.get('/api/irys/balance', async (req, res) => {
  try {
    console.log('💰 Checking Irys service wallet balance...');
    
    const balanceInfo = await irysService.checkBalance();
    
    res.json({
      success: true,
      balance: balanceInfo
    });
  } catch (error) {
    console.error('❌ Error checking balance:', error.message);
    res.status(500).json({
      error: 'Failed to check balance',
      message: error.message
    });
  }
});

/**
 * Get Irys service wallet info
 * GET /api/irys/wallet
 */
app.get('/api/irys/wallet', async (req, res) => {
  try {
    console.log('🔍 Getting Irys service wallet info...');
    
    const walletInfo = await irysService.getWalletInfo();
    
    res.json({
      success: true,
      wallet: walletInfo
    });
  } catch (error) {
    console.error('❌ Error getting wallet info:', error.message);
    res.status(500).json({
      error: 'Failed to get wallet info',
      message: error.message
    });
  }
});

/**
 * Fund Irys service wallet (devnet - free tokens)
 * POST /api/irys/fund
 * Body: { amount?: number }
 */
app.post('/api/irys/fund', async (req, res) => {
  try {
    const { amount = 0.01 } = req.body;
    
    console.log('💸 Funding Irys service wallet with', amount, 'ETH...');
    
    const fundResult = await irysService.fundWallet(amount);
    
    res.json({
      success: true,
      message: 'Wallet funded successfully',
      funding: fundResult
    });
  } catch (error) {
    console.error('❌ Error funding wallet:', error.message);
    res.status(500).json({
      error: 'Failed to fund wallet',
      message: error.message
    });
  }
});

/**
 * Get service status
 * GET /api/irys/status
 */
app.get('/api/irys/status', async (req, res) => {
  try {
    console.log('🔍 Checking Irys service status...');
    
    const walletInfo = await irysService.getWalletInfo();
    const stats = documentService.getStatistics();
    
    res.json({
      success: true,
      status: 'operational',
      irys: {
        network: 'devnet',
        wallet: walletInfo.address,
        balance: walletInfo.balance
      },
      documents: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error checking service status:', error.message);
    res.status(500).json({
      error: 'Service status check failed',
      message: error.message
    });
  }
});

// ==================== ERROR HANDLING ====================

// Catch-all handler for React SPA (must be after API routes)
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({
      error: 'Endpoint not found',
      message: `The endpoint ${req.method} ${req.originalUrl} does not exist`
    });
  }
  
  // Serve React app for all other routes
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The API endpoint ${req.method} ${req.originalUrl} does not exist`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('💥 Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// ==================== SERVER STARTUP ====================

async function startServer() {
  try {
    console.log('🚀 Starting Document Knowledge Base API...');
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    
    // Initialize Irys service
    console.log('🔧 Initializing Irys service...');
    await irysService.initialize();
    
    // Start server
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
      console.log('✅ Server started successfully!');
      console.log(`🌐 API running on http://${HOST}:${PORT}`);
      console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
      console.log(`📚 Documents API: http://${HOST}:${PORT}/api/documents`);
      console.log(`🤖 Chat API: http://${HOST}:${PORT}/api/chat/message`);
      console.log(`💰 Irys API: http://${HOST}:${PORT}/api/irys/status`);
      console.log('');
      console.log('🎉 Document Knowledge Base is ready!');
      console.log('📋 Add documents by URL and chat with your knowledge base');
      console.log('👤 Now with user-specific document storage!');
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();