import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { documentService } from './services/documentService.js';
import { irysService } from './services/irysService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_DEV_URL,
    `https://${process.env.REPLIT_DEV_DOMAIN}`,
    `https://${process.env.REPLIT_DEV_DOMAIN}:5001`,
    'https://beyond-gyan.replit.app',
    'https://gyan.beyondnetwork.xyz',
    /^https:\/\/.*\.replit\.dev$/,
    /^https:\/\/.*\.replit\.dev:\d+$/
  ].filter(Boolean), // Remove any undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app build directory in production
if (process.env.NODE_ENV === 'production') {
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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
 */
app.post('/api/documents/add', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required',
        message: 'Please provide a valid URL to scrape'
      });
    }

    console.log('📋 Processing new document request:', url);
    
    const document = await documentService.addDocument(url);
    
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
 * Get all documents
 * GET /api/documents
 */
app.get('/api/documents', async (req, res) => {
  try {
    console.log('📚 Fetching all documents...');
    
    const documents = await documentService.getAllDocuments();
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
 */
app.post('/api/chat/message', async (req, res) => {
  try {
    const { message, includeDocuments = true } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        message: 'Please provide a message'
      });
    }

    console.log('🤖 Processing chat message:', message);
    
    let documentContext = [];
    let systemPrompt = `You are a knowledgeable AI assistant with access to a permanent document storage system powered by Irys. Your role is to:

1. **Document Knowledge Base Assistant**: Help users understand, analyze, and extract insights from their stored documents
2. **Content Analyzer**: Provide summaries, explanations, and answer questions about document content
3. **Research Helper**: Connect information across multiple documents and provide comprehensive responses
4. **Information Organizer**: Help users organize and make sense of their collected knowledge

When responding:
- Reference specific documents when relevant and cite them by title
- Quote or paraphrase relevant content from the stored documents
- If asked about topics covered in the documents, provide detailed answers based on the actual content
- If asked about topics not covered in the documents, clearly state that and provide general knowledge
- Help users discover connections between different documents
- Suggest questions they might want to explore based on their document collection

You have access to permanently stored documents that users have added to build their knowledge base.`;
    
    if (includeDocuments) {
      // Get ALL document content for comprehensive context
      console.log('📚 Retrieving full document content for AI context...');
      const allDocuments = await documentService.getAllDocumentContent();
      
      if (allDocuments.length > 0) {
        documentContext = allDocuments.map(doc => ({
          title: doc.title,
          url: doc.url,
          summary: doc.summary,
          content: doc.content, // Full content, not truncated
          addedAt: doc.addedAt
        }));
        
        console.log('📚 Providing AI with', documentContext.length, 'documents');
        console.log('📊 Total content size:', documentContext.reduce((sum, doc) => sum + doc.content.length, 0), 'characters');
        
        // Enhanced system prompt with document context
        systemPrompt += `

IMPORTANT: You currently have access to ${documentContext.length} documents in the user's knowledge base:

${documentContext.map((doc, index) => `
${index + 1}. **"${doc.title}"**
   - Source: ${doc.url}
   - Added: ${new Date(doc.addedAt).toLocaleDateString()}
   - Summary: ${doc.summary}
   - Full Content: ${doc.content}
   
---`).join('\n')}

Use this content to provide accurate, detailed responses. Always cite which document(s) you're referencing.`;
      } else {
        systemPrompt += '\n\nNote: The user has not added any documents to their knowledge base yet. Encourage them to add documents using the sidebar to build their personal knowledge repository.';
      }
    }

    // Prepare the enhanced response with system context
    const enhancedResponse = {
      success: true,
      message: message,
      response: systemPrompt,
      documentContext,
      systemPrompt,
      documentsUsed: documentContext.length,
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

// Catch-all handler for React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', async (req, res) => {
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`
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