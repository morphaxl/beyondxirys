import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MessageBubble.css';
import { format } from 'date-fns';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  documentContext?: any[];
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`message-bubble-wrapper ${isAssistant ? 'assistant' : 'user'}`}>
      <div className="message-bubble">
        {isAssistant && message.documentContext && message.documentContext.length > 0 && (
          <div className="document-context">
            <ul>
              {message.documentContext.map((doc, index) => (
                <li key={index}>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    {doc.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="message-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <div className="message-time">
          {format(new Date(message.timestamp), 'p')}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble; 