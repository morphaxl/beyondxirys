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
   * Now includes filtering out deleted documents
   */
  async loadUserDocuments(userInfo) {
    try {
      console.log('📚 Loading user documents from Irys...');
      console.log('👤 User:', `${userInfo.email} (${userInfo.id})`);

      // Query user documents from Irys
      const irysDocuments = await irysService.getUserDocuments(userInfo.id, userInfo.email);
      
      // Load deletion records to filter out deleted documents
      const deletedDocumentIds = await this.loadUserDeletionRecords(userInfo);
      
      // Filter out deleted documents
      const activeDocuments = irysDocuments.filter(doc => !deletedDocumentIds.includes(doc.id));
      
      console.log(`📊 Total documents from Irys: ${irysDocuments.length}`);
      console.log(`🗑️ Deleted documents to filter out: ${deletedDocumentIds.length}`);
      console.log(`✅ Active documents after filtering: ${activeDocuments.length}`);
      
      // Clear existing cache for this user and reload
      const userCacheKeys = Array.from(this.documents.keys()).filter(key => key.startsWith(`${userInfo.id}_`));
      userCacheKeys.forEach(key => this.documents.delete(key));

      // Cache the loaded active documents
      activeDocuments.forEach(doc => {
        const cacheKey = `${userInfo.id}_${doc.id}`;
        this.documents.set(cacheKey, doc);
      });

      console.log(`✅ Loaded ${activeDocuments.length} active documents for user ${userInfo.email}`);
      return activeDocuments;

    } catch (error) {
      console.error('❌ Failed to load user documents:', error.message);
      // Don't throw error - just return empty array so app continues to work
      console.log('📝 Returning empty document list - user can add new documents');
      return [];
    }
  }

  /**
   * Get all documents for a specific user (from cache and potentially from Irys)
   * Now includes filtering out deleted documents
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
        
        // If no documents in cache, try to load from Irys (this will automatically filter deleted ones)
        if (documents.length === 0) {
          console.log('📥 No cached documents, loading from Irys...');
          documents = await this.loadUserDocuments(userInfo);
        } else {
          // We have cached documents, but we should still filter out any that have been deleted
          console.log('🔍 Checking for deleted documents to filter from cache...');
          const deletedDocumentIds = await this.loadUserDeletionRecords(userInfo);
          
          if (deletedDocumentIds.length > 0) {
            const beforeCount = documents.length;
            documents = documents.filter(doc => !deletedDocumentIds.includes(doc.id));
            const afterCount = documents.length;
            
            if (beforeCount !== afterCount) {
              console.log(`🗑️ Filtered out ${beforeCount - afterCount} deleted documents from cache`);
              
              // Update cache to remove deleted documents
              deletedDocumentIds.forEach(deletedId => {
                const cacheKey = `${userInfo.id}_${deletedId}`;
                if (this.documents.has(cacheKey)) {
                  this.documents.delete(cacheKey);
                  console.log('🧹 Cleaned up cached deleted document:', cacheKey);
                }
              });
            }
          }
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

      console.log(`✅ Retrieved ${formattedDocuments.length} active documents`);
      return formattedDocuments;
    } catch (error) {
      console.error('❌ Failed to get documents:', error.message);
      throw error;
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId, userInfo = null) {
    try {
      console.log('📄 Retrieving document:', documentId);
      console.log('👤 User context:', userInfo ? userInfo.email : 'No user context');
      
      // Try to find the document with user-specific cache key first
      let cacheKey = documentId;
      let found = false;
      
      if (userInfo) {
        // Try user-specific cache key first
        const userCacheKey = `${userInfo.id}_${documentId}`;
        if (this.documents.has(userCacheKey)) {
          cacheKey = userCacheKey;
          found = true;
          console.log('📍 Found document with user-specific key:', userCacheKey);
        }
      }
      
      // Fallback: try direct document ID (for backward compatibility)
      if (!found && this.documents.has(documentId)) {
        cacheKey = documentId;
        found = true;
        console.log('📍 Found document with direct key:', documentId);
      }
      
      // If still not found, search through all user documents
      if (!found && userInfo) {
        const userKeys = Array.from(this.documents.keys()).filter(key => key.startsWith(`${userInfo.id}_`));
        for (const key of userKeys) {
          const doc = this.documents.get(key);
          if (doc && doc.id === documentId) {
            cacheKey = key;
            found = true;
            console.log('📍 Found document by searching user documents:', key);
            break;
          }
        }
      }
      
      if (found) {
        console.log('✅ Document found in cache');
        return this.documents.get(cacheKey);
      }

      // If not in cache, could implement Irys retrieval here
      console.log('❌ Document not found. Available keys:', Array.from(this.documents.keys()));
      throw new Error('Document not found');
    } catch (error) {
      console.error('❌ Failed to get document:', error.message);
      throw error;
    }
  }

  /**
   * Get document content for AI context
   */
  async getDocumentContent(documentId, userInfo = null) {
    try {
      const document = await this.getDocument(documentId, userInfo);
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
   * Remove a document (uploads deletion record to Irys for persistence)
   */
  async removeDocument(documentId, userInfo = null) {
    try {
      console.log('🗑️ Removing document:', documentId);
      console.log('👤 User context:', userInfo ? userInfo.email : 'No user context');
      
      if (!userInfo) {
        throw new Error('User authentication required for document deletion');
      }
      
      // Try to find the document with user-specific cache key first
      let cacheKey = documentId;
      let found = false;
      
      // Try user-specific cache key first
      const userCacheKey = `${userInfo.id}_${documentId}`;
      if (this.documents.has(userCacheKey)) {
        cacheKey = userCacheKey;
        found = true;
        console.log('📍 Found document with user-specific key:', userCacheKey);
      }
      
      // Fallback: try direct document ID (for backward compatibility)
      if (!found && this.documents.has(documentId)) {
        cacheKey = documentId;
        found = true;
        console.log('📍 Found document with direct key:', documentId);
      }
      
      // If still not found, search through all user documents
      if (!found) {
        const userKeys = Array.from(this.documents.keys()).filter(key => key.startsWith(`${userInfo.id}_`));
        for (const key of userKeys) {
          const doc = this.documents.get(key);
          if (doc && doc.id === documentId) {
            cacheKey = key;
            found = true;
            console.log('📍 Found document by searching user documents:', key);
            break;
          }
        }
      }
      
      if (!found) {
        console.log('❌ Document not found. Available keys:', Array.from(this.documents.keys()));
        throw new Error('Document not found');
      }

      // Step 1: Upload deletion record to Irys for permanent tracking
      console.log('📝 Uploading deletion record to Irys...');
      await this.uploadDeletionRecord(documentId, userInfo);
      
      // Step 2: Remove from local cache
      this.documents.delete(cacheKey);
      console.log('✅ Document removed from cache:', cacheKey);
      
      console.log('🎉 Document deletion completed successfully (persisted to Irys)');
      return { success: true, message: 'Bookmark deleted successfully' };
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
   * Now includes filtering out deleted documents
   */
  async getAllDocumentContent(userInfo = null) {
    try {
      console.log('📖 Getting all document content for AI context...');
      
      let documents = [];
      
      if (userInfo) {
        // Get user-specific documents
        const userCacheKeys = Array.from(this.documents.keys()).filter(key => key.startsWith(`${userInfo.id}_`));
        documents = userCacheKeys.map(key => this.documents.get(key));
        
        // If no documents in cache, try to load from Irys (this will automatically filter deleted ones)
        if (documents.length === 0) {
          documents = await this.loadUserDocuments(userInfo);
        } else {
          // Filter out deleted documents from cached content
          console.log('🔍 Filtering deleted documents from AI context...');
          const deletedDocumentIds = await this.loadUserDeletionRecords(userInfo);
          
          if (deletedDocumentIds.length > 0) {
            const beforeCount = documents.length;
            documents = documents.filter(doc => !deletedDocumentIds.includes(doc.id));
            const afterCount = documents.length;
            
            if (beforeCount !== afterCount) {
              console.log(`🗑️ Filtered out ${beforeCount - afterCount} deleted documents from AI context`);
            }
          }
        }
      } else {
        // Fallback - get all documents
        documents = Array.from(this.documents.values());
      }

      console.log(`📊 Providing ${documents.length} active documents for AI context`);
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

  /**
   * Upload a deletion record to Irys to track deleted documents
   * This ensures deletions persist across server restarts
   */
  async uploadDeletionRecord(documentId, userInfo) {
    try {
      console.log('📝 Creating deletion record for document:', documentId);
      
      const deletionRecord = {
        type: 'DOCUMENT_DELETION',
        deletedDocumentId: documentId,
        deletedAt: new Date().toISOString(),
        deletedBy: {
          userId: userInfo.id,
          email: userInfo.email
        },
        version: '1.0'
      };

      // Upload deletion record to Irys with specific tags
      const irysResult = await irysService.uploadDeletionRecord(deletionRecord, userInfo);
      
      console.log('✅ Deletion record uploaded to Irys:', irysResult.id);
      return irysResult;
    } catch (error) {
      console.error('❌ Failed to upload deletion record:', error.message);
      throw error;
    }
  }

  /**
   * Load deletion records for a user from Irys
   */
  async loadUserDeletionRecords(userInfo) {
    try {
      console.log('🗑️ Loading deletion records for user:', userInfo.email);
      
      const deletionRecords = await irysService.getUserDeletionRecords(userInfo.id, userInfo.email);
      
      // Extract deleted document IDs
      const deletedDocumentIds = deletionRecords.map(record => record.deletedDocumentId);
      
      console.log(`📊 Found ${deletedDocumentIds.length} deleted documents for user`);
      return deletedDocumentIds;
    } catch (error) {
      console.error('❌ Failed to load deletion records:', error.message);
      return []; // Return empty array so app continues to work
    }
  }
}

export const documentService = new DocumentService(); 