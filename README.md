# Beyond AI Chat Interface with Irys Document Storage

A powerful React-based chat interface that combines Beyond AI's conversational capabilities with Irys permanent storage for building a personal knowledge base.

## 🚀 New Features

### 📚 **Document Storage & Knowledge Base**
- **Web Scraping**: Paste any article/blog URL to automatically extract content
- **Permanent Storage**: Documents stored permanently on Irys with cryptographic proofs
- **AI Integration**: Chat with your stored documents for summaries, analysis, and insights
- **Permanent Links**: Every document gets a permanent Irys link that never expires

### 🎯 **Enhanced AI Capabilities**
- **Context-Aware Responses**: AI has access to all your stored documents
- **Document Citations**: AI references specific sources in responses
- **Multi-Document Analysis**: Compare and analyze across your knowledge base
- **Smart Summarization**: Generate newsletters, summaries, and insights

## 🛠️ Core Features

- **📧 Passwordless Authentication**: Email-based OTP login system
- **🤖 AI Chat**: Real-time conversations with Llama 8B model
- **💳 Credits Dashboard**: View credit balance and usage
- **📱 Responsive Design**: Works on desktop and mobile
- **⚡ Real-time Processing**: Instant scraping and storage
- **🔒 Permanent Storage**: Immutable document storage on Irys

## 🏗️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Beyond AI SDK** for authentication, AI chat, and credits
- **Irys Network** for permanent document storage
- **Ethers.js** for blockchain integration
- **CSS3** with modern styling and animations
- **Node.js polyfills** for browser compatibility

## 📦 Installation

1. **Clone and navigate to the project:**
   ```bash
   cd /path/to/beyondIrys
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the Beyond AI SDK (if needed):**
   ```bash
   cd beyond-ai-sdk
   npm install
   npm run build
   cd ..
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser to the URL shown in the terminal (usually http://localhost:5173)**

## 🎯 How to Use

### **Step 1: Authentication**
1. Enter your email address
2. Check email for 6-digit OTP code
3. Verify and sign in

### **Step 2: Build Your Knowledge Base**
1. **Add Documents**: Paste article/blog URLs in the right sidebar
2. **Auto-Processing**: System scrapes → extracts → stores on Irys
3. **Get Permanent Links**: Each document gets an immutable Irys link
4. **Track Library**: View all stored documents with summaries

### **Step 3: Enhanced AI Chat**
1. **Ask Questions**: Chat about your stored documents
2. **Generate Content**: "Create a newsletter from this week's articles"
3. **Get Summaries**: "Summarize the key points from these papers"
4. **Compare Sources**: "What are the different viewpoints on topic X?"

### **Step 4: Permanent Access**
- **Irys Links**: Access stored documents forever via permanent links
- **Blockchain Proof**: Every document has cryptographic verification
- **No Expiration**: Content stored permanently, never deleted

## 🌟 **Use Cases Enabled**

### **📰 Content Creation**
```
"Create a newsletter based on the 5 articles I stored this week"
"Write a blog post comparing these research papers"
"Generate social media posts from this content"
```

### **📊 Research & Analysis**
```
"What are the main themes across all my stored documents?"
"Compare the arguments in articles A, B, and C"
"Summarize the latest trends from my industry reading"
```

### **🎓 Knowledge Management**
```
"Create study notes from these academic papers"
"Build a knowledge map of the topics I've saved"
"Generate quiz questions from this content"
```

### **💼 Business Intelligence**
```
"Analyze competitor insights from these articles"
"Create market research summary from stored reports"
"Generate trend analysis from industry news"
```

## 🔧 Project Structure

```
src/
├── components/
│   ├── AuthForm.tsx          # Email OTP authentication
│   ├── ChatInterface.tsx     # Enhanced chat with document context
│   ├── CreditsDisplay.tsx    # Credit balance display
│   ├── DocumentSidebar.tsx   # Document management interface
│   └── MessageBubble.tsx     # Message components
├── utils/
│   ├── irysManager.ts        # Irys integration & storage
│   └── webScraper.ts         # Content extraction from URLs
├── App.tsx                   # Main application logic
└── App.css                   # Complete styling

beyond-ai-sdk/                # Local Beyond AI SDK
├── src/                      # SDK source code
├── dist/                     # Built SDK files
└── package.json              # SDK configuration
```

## 🎨 **UI Layout**

```
┌─────────────────┬─────────────────────┐
│   Chat Messages │   Document Manager  │
│                 │                     │  
│  💬 User: Hi    │  📎 Add URL         │
│  🤖 AI: Hello!  │  ┌─────────────────┐ │
│                 │  │ Paste link here │ │
│  💬 User: Sum-  │  └─────────────────┘ │
│  marize docs    │                     │
│  🤖 AI: Based   │  📚 Your Library    │
│  on your 3      │  • Article 1 ✅     │
│  stored docs... │    🔗 Source        │
│                 │    🌐 Irys Link     │
│  [Type here...] │  • Blog Post 2 ✅   │
└─────────────────┴─────────────────────┘
```

## 🔑 **Technical Integration**

### **Beyond AI SDK Integration**
- `beyond.auth.email.*` - Authentication flow
- `beyond.chat.chat()` - Enhanced AI with document context
- `beyond.credits.getBalance()` - Credit management

### **Irys Network Integration**
- **Storage**: Permanent document storage with metadata
- **Retrieval**: Access via transaction IDs and gateway URLs
- **Proof**: Cryptographic verification and timestamps
- **Payment**: Automated using provided testnet wallet

### **Web Scraping**
- **CORS Handling**: Uses proxy for cross-origin requests
- **Content Extraction**: Smart parsing of articles and blogs
- **Metadata**: Automatic title and summary generation

## 🌟 **Key Benefits**

### **🔒 Permanent & Verifiable**
- Documents stored forever on Irys network
- Cryptographic proofs with timestamps
- Immutable audit trail of your knowledge base

### **🤖 AI-Powered Insights**
- Context-aware responses using your documents
- Multi-document analysis and comparison
- Automated content generation and summarization

### **🔗 Universal Access**
- Permanent links that work forever
- Blockchain-backed availability
- Cross-platform access via web gateway

### **📈 Scalable Knowledge**
- Build unlimited document libraries
- Organized with metadata and summaries
- Search and discover across your content

## 🚀 **Development**

- **Start dev server**: `npm run dev`
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`

## 🎊 **Ready to Use!**

Your enhanced AI chat interface with permanent document storage is ready! 

1. **Authenticate** with your Beyond AI credentials
2. **Add documents** by pasting URLs in the sidebar  
3. **Chat with your knowledge base** for insights and summaries
4. **Access permanent links** to your stored content anytime

**Example workflow:**
```
1. Paste: https://example.com/ai-trends-2024
2. ✅ Document stored on Irys: https://gateway.irys.xyz/abc123...
3. Chat: "What are the key AI trends mentioned in that article?"
4. 🤖 AI: "Based on your stored document 'AI Trends 2024', the key trends are..."
```

The future of AI-powered knowledge management is here! 🚀
