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
   * Upload document to Irys with rich metadata tags
   * Following Irys docs pattern for tagging and metadata
   */
  async uploadDocument(documentData, userId) {
    try {
      const uploader = await this.getUploader();

      // Prepare document with metadata
      const document = {
        ...documentData,
        uploadedAt: new Date().toISOString(),
        serviceWallet: process.env.WALLET_ADDRESS,
        network: 'irys-devnet',
        version: '1.0',
        userId: userId // Add user association
      };

      // Rich metadata tags for better discoverability
      const tags = [
        { name: "Content-Type", value: "application/json" },
        { name: "App-Name", value: "DocumentKnowledgeBase" },
        { name: "Document-Type", value: "scraped-content" },
        { name: "Source-URL", value: documentData.url },
        { name: "Title", value: documentData.title },
        { name: "Domain", value: new URL(documentData.url).hostname },
        { name: "Added-Date", value: new Date().toISOString() },
        { name: "Service-Wallet", value: process.env.WALLET_ADDRESS },
        { name: "Network", value: "irys-devnet" },
        { name: "Retention", value: "60-days" },
        { name: "User-ID", value: userId } // Add user ID tag for filtering
      ];

      console.log('📤 Uploading document to Irys devnet...');
      console.log('📄 Title:', documentData.title);
      console.log('🔗 URL:', documentData.url);
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
        receipt
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