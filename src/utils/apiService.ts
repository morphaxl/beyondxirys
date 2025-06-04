// API URL configuration
const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    const currentDomain = window.location.hostname;

    // Deployed on Replit - backend serves frontend from same server with /api prefix
    if (currentDomain.includes('replit.app') || currentDomain.includes('beyondnetwork.xyz')) {
      return `${window.location.origin}/api`;
    }

    // Development environment - frontend on 5001, backend on 3001
    if (currentDomain.includes('replit.dev')) {
      // Extract base domain without port
      const baseDomain = currentDomain.split(':')[0];
      const baseUrl = `${window.location.protocol}//${baseDomain}:3001/api`;
      return baseUrl;
    }
  }

  // Development fallback
  return 'http://localhost:3001/api';
})();

export interface Document {
  id: string;
  title: string;
  url: string;
  summary: string;
  irysId: string;
  irysUrl: string;
  addedAt: string;
  contentLength: number;
  wordCount: number;
  metadata: {
    domain: string;
    description: string;
    author: string;
    publishDate: string;
    tags: string[];
    language: string;
  };
}

export interface DocumentStats {
  totalDocuments: number;
  totalWords: number;
  totalCharacters: number;
  domains: string[];
  averageWordsPerDocument: number;
}

export interface IrysStatus {
  status: string;
  irys: {
    network: string;
    wallet: string;
    balance: string;
  };
  documents: DocumentStats;
  timestamp: string;
}

class ApiService {
  private userEmail: string = '';

  setUserEmail(email: string) {
    this.userEmail = email;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ==================== DOCUMENT OPERATIONS ====================

  /**
   * Add a new document by URL
   */
  async addDocument(url: string): Promise<Document> {
    if (!this.userEmail) {
      throw new Error('User email not set');
    }

    const response = await this.makeRequest<{ success: boolean; document: Document }>('/documents/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, userEmail: this.userEmail }),
    });

    if (!response.success) {
      throw new Error('Failed to add document');
    }

    return response.document;
  }

  /**
   * Get all documents for the current user
   */
  async getAllDocuments(): Promise<{
    documents: Document[];
    statistics: DocumentStats;
  }> {
    if (!this.userEmail) {
      throw new Error('User email not set');
    }

    try {
      const response = await this.makeRequest<{
        success: boolean;
        documents: Document[];
        statistics: DocumentStats;
      }>('/documents');

      if (!response.success) {
        throw new Error('Failed to fetch documents');
      }

      // Ensure we always return arrays and proper structure
      const documents = Array.isArray(response.documents) ? response.documents : [];
      const statistics = response.statistics || {
        totalDocuments: 0,
        totalWords: 0,
        totalCharacters: 0,
        domains: [],
        averageWordsPerDocument: 0
      };

      console.log(`📚 API Service: Retrieved ${documents.length} documents for user`);

      return { documents, statistics };
    } catch (error: any) {
      console.warn('⚠️ Failed to fetch documents from backend:', error.message);

      // Return empty but valid structure on error
      return {
        documents: [],
        statistics: {
          totalDocuments: 0,
          totalWords: 0,
          totalCharacters: 0,
          domains: [],
          averageWordsPerDocument: 0
        }
      };
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(id: string): Promise<Document> {
    if (!this.userEmail) {
      throw new Error('User email not set');
    }

    const response = await this.makeRequest<{ success: boolean; document: Document }>(`/documents/${id}?userEmail=${encodeURIComponent(this.userEmail)}`);

    if (!response.success) {
      throw new Error('Document not found');
    }

    return response.document;
  }

  /**
   * Search documents
   */
  async searchDocuments(query: string): Promise<Document[]> {
    if (!this.userEmail) {
      throw new Error('User email not set');
    }

    const response = await this.makeRequest<{ 
      success: boolean; 
      results: Document[]; 
      count: number;
    }>(`/documents/search?q=${encodeURIComponent(query)}&userEmail=${encodeURIComponent(this.userEmail)}`);

    if (!response.success) {
      throw new Error('Search failed');
    }

    return response.results;
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<void> {
    if (!this.userEmail) {
      throw new Error('User email not set');
    }

    const response = await this.makeRequest<{ success: boolean }>(`/documents/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ userEmail: this.userEmail }),
    });

    if (!response.success) {
      throw new Error('Failed to delete document');
    }
  }

  // ==================== CHAT OPERATIONS ====================

  /**
   * Send a chat message with document context
   */
  async sendChatMessage(message: string, includeDocuments = true): Promise<{
    response: string;
    systemPrompt: string;
    documentContext: Array<{
      title: string;
      url: string;
      summary: string;
      content: string;
      addedAt: string;
    }>;
    documentsUsed: number;
  }> {
    const response = await this.makeRequest<{
      success: boolean;
      response: string;
      systemPrompt: string;
      documentContext: any[];
      documentsUsed: number;
    }>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, includeDocuments, userEmail: this.userEmail }),
    });

    if (!response.success) {
      throw new Error('Chat request failed');
    }

    return {
      response: response.response,
      systemPrompt: response.systemPrompt,
      documentContext: response.documentContext,
      documentsUsed: response.documentsUsed
    };
  }

  /**
   * Get document context for a query
   */
  async getDocumentContext(query: string): Promise<Array<{
    title: string;
    url: string;
    summary: string;
    content: string;
    relevanceScore: number;
  }>> {
    const response = await this.makeRequest<{
      success: boolean;
      context: any[];
    }>(`/chat/context?q=${encodeURIComponent(query)}`);

    if (!response.success) {
      throw new Error('Failed to get document context');
    }

    return response.context;
  }

  // ==================== IRYS SERVICE OPERATIONS ====================

  /**
   * Check Irys service status
   */
  async getIrysStatus(): Promise<IrysStatus> {
    const response = await this.makeRequest<{ success: boolean } & IrysStatus>('/irys/status');

    if (!response.success) {
      throw new Error('Failed to get Irys status');
    }

    return {
      status: response.status,
      irys: response.irys,
      documents: response.documents,
      timestamp: response.timestamp
    };
  }

  /**
   * Check Irys service wallet balance
   */
  async getIrysBalance(): Promise<{
    balance: string;
    token: string;
    network: string;
    address: string;
  }> {
    const response = await this.makeRequest<{
      success: boolean;
      balance: {
        balance: string;
        token: string;
        network: string;
        address: string;
      };
    }>('/irys/balance');

    if (!response.success) {
      throw new Error('Failed to check balance');
    }

    return response.balance;
  }

  /**
   * Get Irys service wallet info
   */
  async getIrysWallet(): Promise<{
    address: string;
    providedAddress: string;
    network: string;
    token: string;
    balance: string;
    purpose: string;
  }> {
    const response = await this.makeRequest<{
      success: boolean;
      wallet: {
        address: string;
        providedAddress: string;
        network: string;
        token: string;
        balance: string;
        purpose: string;
      };
    }>('/irys/wallet');

    if (!response.success) {
      throw new Error('Failed to get wallet info');
    }

    return response.wallet;
  }

  /**
   * Fund Irys service wallet (devnet - free tokens)
   */
  async fundIrysWallet(amount = 0.01): Promise<{
    amount: string;
    token: string;
    transaction: any;
  }> {
    const response = await this.makeRequest<{
      success: boolean;
      funding: {
        amount: string;
        token: string;
        transaction: any;
      };
    }>('/irys/fund', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });

    if (!response.success) {
      throw new Error('Failed to fund wallet');
    }

    return response.funding;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if backend API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Health endpoint is at root level, not under /api
      const baseOrigin = API_BASE_URL.replace('/api', '');
      const healthUrl = `${baseOrigin}/health`;
      const response = await fetch(healthUrl, {
        method: 'GET'
      });
      return response.ok;
    } catch (error) {
      console.warn('Backend health check failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();