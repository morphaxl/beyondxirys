import React, { useState, useRef, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';
import MessageBubble from './MessageBubble';
import DocumentSidebar from './DocumentSidebar';
import type { Document } from '../utils/apiService';
import { getBeyondSdk } from '../utils/beyondSdk';
import { apiService } from '../utils/apiService';
import { PanelLeft } from 'lucide-react';
import './ChatInterface.css';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  documentContext?: any[];
}

interface ChatInterfaceProps {
  userEmail: string;
  onSignOut: () => void;
  documents: Document[];
  onDocumentAdded: (document: Document) => void;
  onDocumentDeleted: (documentId: string) => void;
  documentsLoading?: boolean;
  documentsError?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  userEmail, 
  onSignOut, 
  documents, 
  onDocumentAdded,
  onDocumentDeleted,
  documentsLoading = false,
  documentsError = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Gesture handling for sidebar
  const bind = useDrag(({ down, movement: [mx], direction: [dx], velocity: [vx] }) => {
    // A swipe is a motion that is fast and covers a significant distance.
    if (!down && dx > 0 && mx > 50 && vx > 0.5) {
      setSidebarOpen(true);
    }
  }, { axis: 'x' }); // Only track horizontal movement

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: '1',
      content: `🔖 **Welcome to Beyond Gyan - Your Smart Bookmark Assistant!**

I'm your intelligent bookmark companion that remembers everything you save, so you don't have to! Here's how I can help:

🔍 **Find Forgotten Bookmarks**: Ask me "What was that article about AI trends?" and I'll find it instantly

📚 **Bookmark Analysis**: I can read and understand the full content of every webpage you save

💡 **Smart Summaries**: Get quick summaries of any bookmark or group of related bookmarks

🎯 **Content Discovery**: Ask me to find bookmarks on specific topics or compare different articles

**Current Status**: ${documents.length > 0 ? `I'm tracking ${documents.length} smart bookmark(s) for you` : 'No bookmarks saved yet - use the sidebar to save your first webpage!'}

Try asking: "What bookmarks do I have about technology?" or "Summarize that article I saved about productivity" or "Find bookmarks related to AI"`,
      role: 'assistant',
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  }, [userEmail, documents.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateMessageId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: generateMessageId(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setLoading(true);

    try {
      // Prepare conversation history (exclude welcome message, include all previous messages)
      const previousMessages = updatedMessages
        .filter(msg => msg.id !== '1') // Exclude welcome message
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .slice(0, -1) // Exclude the current user message (last one in updatedMessages)
        .slice(-10) // Get last 10 messages for context
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Get enhanced context from backend API
      console.log('🤖 Getting enhanced document context from backend...');
      console.log('📝 Sending conversation history:', previousMessages.length, 'previous messages');
      console.log('📝 Conversation history content:', previousMessages);
      const contextData = await apiService.sendChatMessage(
        userMessage.content, 
        documents.length > 0,
        previousMessages
      );

      console.log('📚 Backend provided context for', contextData.documentsUsed, 'documents');
      console.log('📝 System prompt length:', contextData.systemPrompt.length, 'characters');

      // Get initialized Beyond SDK
      const beyond = await getBeyondSdk();

      // Import CHAT_MODELS from the SDK
      const { CHAT_MODELS } = await import('@Beyond-Network-AI/beyond-ai');

      // Create comprehensive prompt with system context + conversation history
      const chatMessages = [
        {
          role: 'system' as const,
          content: contextData.systemPrompt
        },
        // Include the previous conversation history
        ...previousMessages.map((msg: { role: 'user' | 'assistant'; content: string }) => ({
          role: msg.role,
          content: msg.content
        })),
        // Add the current user message
        {
          role: 'user' as const,
          content: userMessage.content
        }
      ];

      console.log('🚀 Sending to Beyond AI with full document context...');

      // Send to Beyond AI with enhanced context
      console.log('🚀 Sending to Beyond AI with', chatMessages.length, 'messages (system + history + current)');
      console.log('📋 Message structure:', chatMessages.map(m => `${m.role}: ${m.content.substring(0, 100)}...`));
      const response = await beyond.chat.createCompletion({
        model: CHAT_MODELS.LLAMA_8B,
        messages: chatMessages,
        temperature: 0.7,
        stream: true
      });

      let aiResponseContent = '';
      if ('content' in response) {
        aiResponseContent = response.content;
      } else {
        aiResponseContent = response.choices[0]?.message?.content || 'No response generated';
      }

      const aiMessage: Message = {
        id: generateMessageId(),
        content: aiResponseContent,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        documentContext: contextData.documentContext,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Log success
      console.log('✅ AI response generated using', contextData.documentsUsed, 'documents');

    } catch (err: any) {
      console.error('❌ Chat error:', err);
      const errorMessage: Message = {
        id: generateMessageId(),
        content: `Sorry, I encountered an error: ${err.message || 'Unknown error'}. Please ensure you're authenticated and try again.`,
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAdded = (document: Document) => {
    onDocumentAdded(document);

    // Add confirmation message
    const confirmationMessage: Message = {
      id: generateMessageId(),
      content: `✅ **Bookmark "${document.title}" saved successfully!**

🔖 **Smart bookmark created**: [View Original](${document.url}) | [Permanent Copy](${document.irysUrl})

🤖 **I've read and remembered this content** and can now:
- Help you find this bookmark when you need it
- Answer questions about what it contains
- Summarize its key points
- Compare it with your other bookmarks
- Include it in topic-based searches

Try asking me: "What's this bookmark about?" or "Find my bookmarks about this topic" or "Summarize this for me"`,
      role: 'assistant',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, confirmationMessage]);
  };

  const handleSignOut = async () => {
    try {
      // Get initialized Beyond SDK
      const beyond = await getBeyondSdk();
      await beyond.auth.email.signOut();
      onSignOut();
    } catch (err) {
      console.error('Sign out error:', err);
      onSignOut(); // Sign out anyway
    }
  };

  return (
    <div className="chat-layout">
      <DocumentSidebar 
        documents={documents}
        onDocumentAdded={handleDocumentAdded} 
        onDocumentDeleted={onDocumentDeleted}
        documentsLoading={documentsLoading}
        documentsError={documentsError}
        isOpen={isSidebarOpen}
        onSignOut={handleSignOut}
      />
      <div className="main-content" {...bind()}>
        <div 
          className={`content-overlay ${isSidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}
        ></div>
        <header className="chat-header">
          <div className="header-brand">
            <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!isSidebarOpen)}>
              <PanelLeft size={20} />
            </button>
            <img src="/logo.svg" alt="Beyond Gyan Logo" className="header-logo" />
            <div>
              <h2 className="header-title">Beyond Gyan</h2>
              <p className="header-subtitle">Powered by IRYS</p>
            </div>
          </div>
        </header>
        <main className="chat-messages">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </main>
        <form onSubmit={handleSendMessage} className="chat-input-form">
          <div className="chat-input-container">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Ask me about your saved bookmarks..."
              disabled={loading}
              className="chat-input"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="send-button"
            >
              {loading ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;