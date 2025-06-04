import { Uploader } from "@irys/upload";
import { Ethereum } from "@irys/upload-ethereum";
import dotenv from 'dotenv';

dotenv.config();

class IrysService {
  constructor() {
    this.uploader = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Irys uploader following the official documentation pattern
   * Uses server-side SDK with service wallet for devnet (free uploads)
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Irys service wallet for devnet...');
      console.log('📍 Service wallet:', process.env.WALLET_ADDRESS);
      
      // Following Irys docs: https://docs.irys.xyz/build/d/networks
      // For devnet, we need to use .withRpc() and .devnet()
      this.uploader = await Uploader(Ethereum)
        .withWallet(process.env.PRIVATE_KEY)
        .withRpc(process.env.RPC_URL)
        .devnet(); // FREE uploads with 60-day retention
      
      // Wait for the uploader to be ready
      console.log('⏳ Waiting for Irys uploader to be ready...');
      await this.uploader.ready();
      
      this.isInitialized = true;
      
      console.log('✅ Irys service initialized successfully');
      
      // Try to access address safely
      try {
        console.log('🔗 Uploader address:', this.uploader.address);
      } catch (addressError) {
        console.log('⚠️ Address not immediately available, will be set after first operation');
      }
      
      console.log('💰 Token:', this.uploader.token);
      console.log('🌐 Network: Devnet (FREE uploads, 60-day retention)');
      
      return this.uploader;
    } catch (error) {
      console.error('❌ Failed to initialize Irys service:', error);
      throw new Error(`Irys initialization failed: ${error.message}`);
    }
  }

  /**
   * Get initialized uploader instance
   */
  async getUploader() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.uploader;
  }

  /**
   * Upload document to Irys with rich metadata tags including user identification
   * Following Irys docs pattern for tagging and metadata
   */
  async uploadDocument(documentData, userInfo = null) {
    try {
      const uploader = await this.getUploader();
      
      // Prepare document with metadata
      const document = {
        ...documentData,
        uploadedAt: new Date().toISOString(),
        serviceWallet: process.env.WALLET_ADDRESS,
        network: 'irys-devnet',
        version: '1.0',
        userInfo: userInfo // Include user information in the document
      };

      // Rich metadata tags for better discoverability and user association
      const tags = [
        { name: "Content-Type", value: "application/json" },
        { name: "App-Name", value: "DocumentKnowledgeBase" },
        { name: "Document-Type", value: "scraped-content" },
        { name: "Source-URL", value: String(documentData.url) },
        { name: "Title", value: String(documentData.title) },
        { name: "Domain", value: String(new URL(documentData.url).hostname) },
        { name: "Added-Date", value: new Date().toISOString() },
        { name: "Service-Wallet", value: String(process.env.WALLET_ADDRESS) },
        { name: "Network", value: "irys-devnet" },
        { name: "Retention", value: "60-days" }
      ];

      // Add user-specific tags if user info is provided
      if (userInfo) {
        console.log('🔍 Debug - User info received:', JSON.stringify(userInfo, null, 2));
        
        // Use email as user ID if no ID is provided
        const userId = userInfo.id || userInfo.email;
        
        // Only add tags with valid string values
        if (userId) {
          tags.push({ name: "User-ID", value: String(userId) });
        }
        if (userInfo.email) {
          tags.push({ name: "User-Email", value: String(userInfo.email) });
        }
        if (userInfo.username || userInfo.email) {
          tags.push({ name: "User-Username", value: String(userInfo.username || userInfo.email) });
        }
        
        // Add smart wallet address if available
        if (userInfo.smartWalletAddress) {
          tags.push({ name: "User-Wallet", value: String(userInfo.smartWalletAddress) });
        }
        
        console.log('🏷️ Final tags for upload:', tags.map(t => `${t.name}: ${t.value}`));
      }

      console.log('📤 Uploading document to Irys devnet...');
      console.log('📄 Title:', documentData.title);
      console.log('🔗 URL:', documentData.url);
      console.log('👤 User:', userInfo ? `${userInfo.email} (${userInfo.id})` : 'No user info');
      console.log('📊 Size:', JSON.stringify(document).length, 'bytes');

      // Upload to Irys
      const receipt = await uploader.upload(JSON.stringify(document), { tags });
      
      console.log('✅ Document uploaded successfully!');
      console.log('🆔 Irys ID:', receipt.id);
      console.log('🌐 Gateway URL:', `https://gateway.irys.xyz/${receipt.id}`);

      return {
        id: receipt.id,
        url: `https://gateway.irys.xyz/${receipt.id}`,
        timestamp: new Date(),
        receipt,
        tags // Return tags for reference
      };
    } catch (error) {
      console.error('❌ Failed to upload document to Irys:', error);
      throw new Error(`Document upload failed: ${error.message}`);
    }
  }

  /**
   * Retrieve document from Irys by ID
   */
  async retrieveDocument(irysId) {
    try {
      const url = `https://gateway.irys.xyz/${irysId}`;
      console.log('📥 Retrieving document from Irys:', irysId);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to retrieve document: ${response.statusText}`);
      }
      
      const document = await response.json();
      console.log('✅ Document retrieved successfully');
      
      return document;
    } catch (error) {
      console.error('❌ Failed to retrieve document:', error);
      throw error;
    }
  }

  /**
   * Query documents by user from Irys using GraphQL
   * This allows users to see their documents when they log in
   */
  async getUserDocuments(userId, userEmail) {
    try {
      console.log('🔍 Querying user documents from Irys...');
      console.log('👤 User ID:', userId);
      console.log('📧 Email:', userEmail);

      // Use email as user ID if no ID is provided
      const effectiveUserId = userId || userEmail;
      
      if (!effectiveUserId) {
        console.log('⚠️ No user ID or email provided, cannot query documents');
        return [];
      }

      // Irys GraphQL endpoint for querying transactions
      const graphqlEndpoint = 'https://devnet.irys.xyz/graphql';
      
      // GraphQL query to find documents by user
      const query = `
        query GetUserDocuments($userId: String!) {
          transactions(
            tags: [
              { name: "App-Name", values: ["DocumentKnowledgeBase"] },
              { name: "Document-Type", values: ["scraped-content"] },
              { name: "User-ID", values: [$userId] }
            ]
            first: 100
            order: DESC
          ) {
            edges {
              node {
                id
                tags {
                  name
                  value
                }
                timestamp
              }
            }
          }
        }
      `;

      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { userId: effectiveUserId }
        })
      });

      if (!response.ok) {
        throw new Error(`GraphQL query failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      const transactions = result.data?.transactions?.edges || [];
      console.log(`📊 Found ${transactions.length} documents for user`);

      // Retrieve full document data for each transaction
      const documents = [];
      for (const edge of transactions) {
        try {
          const txId = edge.node.id;
          const tags = edge.node.tags;
          
          // Extract metadata from tags
          const getTagValue = (tagName) => {
            const tag = tags.find(t => t.name === tagName);
            return tag ? tag.value : null;
          };

          // Retrieve full document content
          const fullDocument = await this.retrieveDocument(txId);
          
          // Create document object with metadata
          const document = {
            id: fullDocument.id || txId,
            title: getTagValue('Title') || fullDocument.title,
            url: getTagValue('Source-URL') || fullDocument.url,
            summary: fullDocument.summary,
            content: fullDocument.content,
            irysId: txId,
            irysUrl: `https://gateway.irys.xyz/${txId}`,
            addedAt: getTagValue('Added-Date') || edge.node.timestamp,
            contentLength: fullDocument.contentLength,
            wordCount: fullDocument.wordCount,
            metadata: fullDocument.metadata || {
              domain: getTagValue('Domain'),
              description: fullDocument.description,
              author: fullDocument.author,
              publishDate: fullDocument.publishDate,
              tags: fullDocument.tags || [],
              language: fullDocument.language
            },
            userInfo: fullDocument.userInfo
          };

          documents.push(document);
        } catch (docError) {
          console.warn(`⚠️ Failed to retrieve document ${edge.node.id}:`, docError.message);
          // Continue with other documents
        }
      }

      console.log(`✅ Successfully retrieved ${documents.length} documents for user`);
      return documents;

    } catch (error) {
      console.error('❌ Failed to query user documents:', error);
      throw new Error(`Failed to query user documents: ${error.message}`);
    }
  }

  /**
   * Check service wallet balance on Irys
   */
  async checkBalance() {
    try {
      const uploader = await this.getUploader();
      const balance = await uploader.getLoadedBalance();
      const balanceInEth = uploader.utils.fromAtomic(balance);
      
      console.log('💰 Service wallet Irys balance:', balanceInEth, 'ETH (FREE DEVNET TOKENS)');
      
      return {
        balance: balanceInEth,
        token: uploader.token,
        network: 'devnet',
        address: uploader.address
      };
    } catch (error) {
      console.error('❌ Failed to check balance:', error);
      throw error;
    }
  }

  /**
   * Fund service wallet (for devnet, this gets free tokens)
   */
  async fundWallet(amount = 0.01) {
    try {
      const uploader = await this.getUploader();
      
      console.log(`💸 Funding service wallet with ${amount} ETH (FREE DEVNET TOKENS)...`);
      
      const fundTx = await uploader.fund(uploader.utils.toAtomic(amount));
      
      console.log('✅ Wallet funded successfully!');
      console.log('💰 Amount:', uploader.utils.fromAtomic(fundTx.quantity), uploader.token);
      
      return {
        amount: uploader.utils.fromAtomic(fundTx.quantity),
        token: uploader.token,
        transaction: fundTx
      };
    } catch (error) {
      console.error('❌ Failed to fund wallet:', error);
      throw error;
    }
  }

  /**
   * Get service wallet info
   */
  async getWalletInfo() {
    try {
      const uploader = await this.getUploader();
      const balance = await this.checkBalance();
      
      return {
        address: uploader.address,
        providedAddress: process.env.WALLET_ADDRESS,
        network: 'Irys Devnet',
        token: uploader.token,
        balance: balance.balance,
        purpose: 'Service wallet for document knowledge base'
      };
    } catch (error) {
      console.error('❌ Failed to get wallet info:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const irysService = new IrysService(); 