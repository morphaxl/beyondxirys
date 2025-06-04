import { scraperService } from './scraperService.js';
import { irysService } from './irysService.js';

class DocumentService {
  constructor() {
    this.userDocuments = new Map(); // Map of userId -> Map of documents
  }

  /**
   * Get user's document map, creating if it doesn't exist
   */
  getUserDocuments(userId) {
    if (!this.userDocuments.has(userId)) {
      this.userDocuments.set(userId, new Map());
    }
    return this.userDocuments.get(userId);
  }

  /**
   * Add a document by URL - complete pipeline from scraping to Irys storage
   */
  async addDocument(url, userId) {
    try {
      console.log('📋 Starting document processing pipeline for:', url);

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
        status: 'processing'
      };

      // Step 4: Upload to Irys
      console.log('🌐 Step 3: Uploading to Irys...');
      const irysResult = await irysService.uploadDocument(document, userId);

      // Step 5: Update document with Irys information
      document.irysId = irysResult.id;
      document.irysUrl = irysResult.url;
      document.irysReceipt = irysResult.receipt;
      document.status = 'stored';
      document.storedAt = irysResult.timestamp;

      // Step 6: Cache the document for the specific user
      const userDocs = this.getUserDocuments(userId);
      userDocs.set(document.id, document);

      console.log('✅ Document processing completed successfully!');
      console.log('🆔 Document ID:', document.id);
      console.log('🌐 Irys URL:', document.irysUrl);

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
        metadata: document.metadata
      };
    } catch (error) {
      console.error('❌ Failed to add document:', error.message);
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  /**
   * Get all documents (from cache and potentially from Irys)
   */
  async getAllDocuments(userEmail) {
    try {
      console.log(`📚 Getting all documents for user: ${userEmail}`);

      const userDocsMap = this.userDocuments.get(userEmail) || new Map();
      
      // Convert Map values to array
      const documents = Array.from(userDocsMap.values());

      // Ensure all documents have proper structure with id field
      const validDocuments = documents.map(doc => ({
        id: doc.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: doc.title || 'Untitled Document',
        url: doc.url || '',
        summary: doc.summary || '',
        irysId: doc.irysId || '',
        irysUrl: doc.irysUrl || '',
        addedAt: doc.addedAt || new Date().toISOString(),
        contentLength: doc.contentLength || 0,
        wordCount: doc.wordCount || 0,
        metadata: {
          domain: doc.metadata?.domain || '',
          description: doc.metadata?.description || '',
          author: doc.metadata?.author || '',
          publishDate: doc.metadata?.publishDate || '',
          tags: doc.metadata?.tags || [],
          language: doc.metadata?.language || 'en'
        }
      }));

      const statistics = {
        totalDocuments: validDocuments.length,
        totalWords: validDocuments.reduce((sum, doc) => sum + (doc.wordCount || 0), 0),
        totalCharacters: validDocuments.reduce((sum, doc) => sum + (doc.contentLength || 0), 0),
        domains: [...new Set(validDocuments.map(doc => doc.metadata?.domain).filter(Boolean))],
        averageWordsPerDocument: validDocuments.length > 0 
          ? Math.round(validDocuments.reduce((sum, doc) => sum + (doc.wordCount || 0), 0) / validDocuments.length)
          : 0
      };

      console.log(`✅ Found ${validDocuments.length} documents for user`);
      return { documents: validDocuments, statistics };
    } catch (error) {
      console.error('❌ Error getting documents:', error);
      throw error;
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId, userId) {
    try {
      console.log('📄 Retrieving document:', documentId, 'for user:', userId);

      // Check user's documents first
      const userDocs = this.getUserDocuments(userId);
      if (userDocs.has(documentId)) {
        console.log('✅ Document found in user cache');
        return userDocs.get(documentId);
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
  async searchDocuments(query, userId) {
    try {
      console.log('🔍 Searching documents for:', query, 'user:', userId);

      const searchTerm = query.toLowerCase();
      const results = [];
      const userDocs = this.getUserDocuments(userId);

      for (const document of userDocs.values()) {
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
  async getRelevantDocuments(query, userId, limit = 5) {
    try {
      console.log('🤖 Getting relevant documents for AI context:', query, 'user:', userId);

      const searchResults = await this.searchDocuments(query, userId);
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
  async removeDocument(documentId, userId) {
    try {
      console.log('🗑️ Removing document:', documentId, 'for user:', userId);

      const userDocs = this.getUserDocuments(userId);
      if (!userDocs.has(documentId)) {
        throw new Error('Document not found');
      }

      userDocs.delete(documentId);
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
  getStatistics(userId) {
    const userDocs = this.getUserDocuments(userId);
    const docs = Array.from(userDocs.values());

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
   * Get all document content for AI training/context
   */
  async getAllDocumentContent(userId) {
    try {
      const userDocs = this.getUserDocuments(userId);
      const documents = Array.from(userDocs.values());
      return documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        url: doc.url,
        content: doc.content,
        summary: doc.summary,
        addedAt: doc.addedAt
      }));
    } catch (error) {
      console.error('❌ Failed to get all document content:', error.message);
      throw error;
    }
  }
}

export const documentService = new DocumentService();