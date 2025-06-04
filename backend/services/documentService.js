import { scraperService } from './scraperService.js';
import { irysService } from './irysService.js';

class DocumentService {
  constructor() {
    this.documents = new Map(); // In-memory cache for quick access
  }

  /**
   * Add a document by URL - complete pipeline from scraping to Irys storage
   * Now includes user association for persistent storage
   */
  async addDocument(url, userInfo = null) {
    try {
      console.log('📋 Starting document processing pipeline for:', url);
      console.log('👤 User:', userInfo ? `${userInfo.email} (${userInfo.id})` : 'No user info');
      
      // Step 1: Validate URL
      if (!scraperService.isValidUrl(url)) {
        throw new Error('Invalid URL provided');
      }

      // Step 2: Scrape content
      console.log('🔍 Step 1: Scraping content...');
      const scrapedData = await scraperService.scrapeUrl(url);
      
      // Step 3: Prepare document for storage
      console.log('📦 Step 2: Preparing document for storage...');
      const document = {
        id: this.generateDocumentId(),
        ...scrapedData,
        addedAt: new Date().toISOString(),
        status: 'processing',
        userInfo: userInfo // Include user information
      };

      // Step 4: Upload to Irys with user information
      console.log('🌐 Step 3: Uploading to Irys with user association...');
      const irysResult = await irysService.uploadDocument(document, userInfo);
      
      // Step 5: Update document with Irys information
      document.irysId = irysResult.id;
      document.irysUrl = irysResult.url;
      document.irysReceipt = irysResult.receipt;
      document.irysTagsUsed = irysResult.tags;
      document.status = 'stored';
      document.storedAt = irysResult.timestamp;

      // Step 6: Cache the document (with user context)
      const cacheKey = userInfo ? `${userInfo.id}_${document.id}` : document.id;
      this.documents.set(cacheKey, document);

      console.log('✅ Document processing completed successfully!');
      console.log('🆔 Document ID:', document.id);
      console.log('🌐 Irys URL:', document.irysUrl);
      console.log('👤 Associated with user:', userInfo ? userInfo.email : 'No user');

      return {
        id: document.id,
        title: document.title,
        url: document.url,
        summary: document.summary,
        irysId: document.irysId,
        irysUrl: document.irysUrl,
        addedAt: document.addedAt,
        contentLength: document.contentLength,
        wordCount: document.wordCount,
        metadata: document.metadata,
        userInfo: userInfo
      };
    } catch (error) {
      console.error('❌ Failed to add document:', error.message);
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  /**
   * Load user documents from Irys on login
   * This ensures users see their documents when they log back in
   */
  async loadUserDocuments(userInfo) {
    try {
      console.log('📚 Loading user documents from Irys...');
      console.log('👤 User:', `${userInfo.email} (${userInfo.id})`);

      // Query user documents from Irys
      const irysDocuments = await irysService.getUserDocuments(userInfo.id, userInfo.email);
      
      // Clear existing cache for this user and reload
      const userCacheKeys = Array.from(this.documents.keys()).filter(key => key.startsWith(`${userInfo.id}_`));
      userCacheKeys.forEach(key => this.documents.delete(key));

      // Cache the loaded documents
      irysDocuments.forEach(doc => {
        const cacheKey = `${userInfo.id}_${doc.id}`;
        this.documents.set(cacheKey, doc);
      });

      console.log(`✅ Loaded ${irysDocuments.length} documents for user ${userInfo.email}`);
      return irysDocuments;

    } catch (error) {
      console.error('❌ Failed to load user documents:', error.message);
      // Don't throw error - just return empty array so app continues to work
      console.log('📝 Returning empty document list - user can add new documents');
      return [];
    }
  }

  /**
   * Get all documents for a specific user (from cache and potentially from Irys)
   */
  async getAllDocuments(userInfo = null) {
    try {
      console.log('📚 Retrieving all documents...');
      
      let documents = [];
      
      if (userInfo) {
        console.log('👤 Filtering documents for user:', userInfo.email);
        
        // Get documents from cache for this user
        const userCacheKeys = Array.from(this.documents.keys()).filter(key => key.startsWith(`${userInfo.id}_`));
        documents = userCacheKeys.map(key => this.documents.get(key));
        
        // If no documents in cache, try to load from Irys
        if (documents.length === 0) {
          console.log('📥 No cached documents, loading from Irys...');
          documents = await this.loadUserDocuments(userInfo);
        }
      } else {
        // No user info - return all cached documents (fallback for backward compatibility)
        console.log('⚠️ No user info provided - returning all cached documents');
        documents = Array.from(this.documents.values());
      }

      // Format documents for response
      const formattedDocuments = documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        url: doc.url,
        summary: doc.summary,
        irysId: doc.irysId,
        irysUrl: doc.irysUrl,
        addedAt: doc.addedAt,
        contentLength: doc.contentLength,
        wordCount: doc.wordCount,
        metadata: doc.metadata,
        status: doc.status
      }));

      console.log(`✅ Retrieved ${formattedDocuments.length} documents`);
      return formattedDocuments;
    } catch (error) {
      console.error('❌ Failed to get documents:', error.message);
      throw error;
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId) {
    try {
      console.log('📄 Retrieving document:', documentId);
      
      // Check cache first
      if (this.documents.has(documentId)) {
        console.log('✅ Document found in cache');
        return this.documents.get(documentId);
      }

      // If not in cache, could implement Irys retrieval here
      throw new Error('Document not found');
    } catch (error) {
      console.error('❌ Failed to get document:', error.message);
      throw error;
    }
  }

  /**
   * Get document content for AI context
   */
  async getDocumentContent(documentId) {
    try {
      const document = await this.getDocument(documentId);
      return {
        id: document.id,
        title: document.title,
        url: document.url,
        content: document.content,
        summary: document.summary,
        metadata: document.metadata
      };
    } catch (error) {
      console.error('❌ Failed to get document content:', error.message);
      throw error;
    }
  }

  /**
   * Search documents by query (simple text search)
   */
  async searchDocuments(query) {
    try {
      console.log('🔍 Searching documents for:', query);
      
      const searchTerm = query.toLowerCase();
      const results = [];

      for (const document of this.documents.values()) {
        const score = this.calculateRelevanceScore(document, searchTerm);
        if (score > 0) {
          results.push({
            ...document,
            relevanceScore: score
          });
        }
      }

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      console.log('✅ Found', results.length, 'relevant documents');
      return results.slice(0, 10); // Return top 10 results
    } catch (error) {
      console.error('❌ Failed to search documents:', error.message);
      throw error;
    }
  }

  /**
   * Get documents for AI context based on a query
   */
  async getRelevantDocuments(query, limit = 5) {
    try {
      console.log('🤖 Getting relevant documents for AI context:', query);
      
      const searchResults = await this.searchDocuments(query);
      const relevantDocs = searchResults.slice(0, limit).map(doc => ({
        title: doc.title,
        url: doc.url,
        summary: doc.summary,
        content: doc.content.substring(0, 2000), // Limit content for context
        relevanceScore: doc.relevanceScore
      }));

      console.log('✅ Returning', relevantDocs.length, 'relevant documents for AI');
      return relevantDocs;
    } catch (error) {
      console.error('❌ Failed to get relevant documents:', error.message);
      return [];
    }
  }

  /**
   * Remove a document
   */
  async removeDocument(documentId) {
    try {
      console.log('🗑️ Removing document:', documentId);
      
      if (!this.documents.has(documentId)) {
        throw new Error('Document not found');
      }

      this.documents.delete(documentId);
      console.log('✅ Document removed successfully');
      
      return { success: true, message: 'Document removed' };
    } catch (error) {
      console.error('❌ Failed to remove document:', error.message);
      throw error;
    }
  }

  /**
   * Get document statistics
   */
  getStatistics() {
    const docs = Array.from(this.documents.values());
    
    return {
      totalDocuments: docs.length,
      totalWords: docs.reduce((sum, doc) => sum + (doc.wordCount || 0), 0),
      totalCharacters: docs.reduce((sum, doc) => sum + (doc.contentLength || 0), 0),
      domains: [...new Set(docs.map(doc => doc.metadata?.domain).filter(Boolean))],
      averageWordsPerDocument: docs.length > 0 ? Math.round(docs.reduce((sum, doc) => sum + (doc.wordCount || 0), 0) / docs.length) : 0
    };
  }

  /**
   * Calculate relevance score for search
   */
  calculateRelevanceScore(document, searchTerm) {
    let score = 0;
    
    // Title match (highest weight)
    if (document.title.toLowerCase().includes(searchTerm)) {
      score += 10;
    }

    // Summary match
    if (document.summary.toLowerCase().includes(searchTerm)) {
      score += 5;
    }

    // Content match
    if (document.content.toLowerCase().includes(searchTerm)) {
      score += 2;
    }

    // URL/domain match
    if (document.url.toLowerCase().includes(searchTerm)) {
      score += 3;
    }

    // Metadata tags match
    if (document.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) {
      score += 4;
    }

    return score;
  }

  /**
   * Generate unique document ID
   */
  generateDocumentId() {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all document content for AI context (user-specific)
   */
  async getAllDocumentContent(userInfo = null) {
    try {
      console.log('📖 Getting all document content for AI context...');
      
      let documents = [];
      
      if (userInfo) {
        // Get user-specific documents
        const userCacheKeys = Array.from(this.documents.keys()).filter(key => key.startsWith(`${userInfo.id}_`));
        documents = userCacheKeys.map(key => this.documents.get(key));
        
        // If no documents in cache, try to load from Irys
        if (documents.length === 0) {
          documents = await this.loadUserDocuments(userInfo);
        }
      } else {
        // Fallback - get all documents
        documents = Array.from(this.documents.values());
      }

      console.log(`📊 Providing ${documents.length} documents for AI context`);
      return documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        url: doc.url,
        summary: doc.summary,
        content: doc.content,
        addedAt: doc.addedAt,
        metadata: doc.metadata
      }));
    } catch (error) {
      console.error('❌ Failed to get document content:', error.message);
      return []; // Return empty array so AI can still function
    }
  }
}

export const documentService = new DocumentService(); 