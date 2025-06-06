import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import CreditsDisplay from './CreditsDisplay';
import DocumentSidebar from './DocumentSidebar';
import type { Document } from '../utils/apiService';
import { getBeyondSdk } from '../utils/beyondSdk';
import { apiService } from '../utils/apiService';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatInterfaceProps {
  userEmail: string;
  onSignOut: () => void;
  documents: Document[];
  onDocumentAdded: (document: Document) => void;
  onDocumentDeleted: (documentId: string) => void;
  documentsLoading?: boolean;
  documentsError?: string;
  onRetryLoadDocuments?: () => Promise<Document[]>;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  userEmail, 
  onSignOut, 
  documents, 
  onDocumentAdded,
  onDocumentDeleted,
  documentsLoading = false,
  documentsError = '',
  onRetryLoadDocuments
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      timestamp: new Date()
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
      timestamp: new Date()
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
        timestamp: new Date()
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
        timestamp: new Date()
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
      timestamp: new Date()
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
    <div className="chat-interface-with-sidebar">
      <header className="chat-header">
        <div className="header-brand">
          <img src="/logo.svg" alt="Beyond Gyan Logo" className="header-logo" />
          <div className="user-info">
            <h2>Beyond Gyan</h2>
            <p className="subtitle">Powered by IRYS</p>
          </div>
        </div>
        <div className="header-actions">
          <CreditsDisplay />
          <button onClick={handleSignOut} className="sign-out-button">
            Sign Out
          </button>
        </div>
      </header>

      <div className="chat-main-content">
        <div className="sidebar-section">
          <DocumentSidebar 
            documents={documents}
            onDocumentAdded={handleDocumentAdded} 
            onDocumentDeleted={onDocumentDeleted}
            documentsLoading={documentsLoading}
            documentsError={documentsError}
            onRetryLoadDocuments={onRetryLoadDocuments}
          />
        </div>

        <div className="chat-section">
          <div className="chat-messages">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {loading && (
              <div className="message-bubble assistant">
                <div className="message-content">
                  <div className="message-text">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <div className="chat-input-container">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  documents.length > 0 
                    ? `Ask me about your ${documents.length} saved bookmark(s)...`
                    : "Save some bookmarks first, then ask me to find or summarize them..."
                }
                disabled={loading}
                className="chat-input"
              />
              <button 
                type="submit" 
                disabled={!inputValue.trim() || loading}
                className="send-button"
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;