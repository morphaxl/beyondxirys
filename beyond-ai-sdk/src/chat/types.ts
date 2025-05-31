/**
 * Chat message role types
 */
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * Chat message interface
 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/**
 * Supported models
 */
export type ChatModel = 
  | 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
  | 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'
  | string; // Allow custom models

/**
 * Chat completion request parameters
 */
export interface ChatCompletionParams {
  /**
   * Model to use for completion
   * @default "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"
   */
  model: ChatModel;
  
  /**
   * Array of messages for the conversation
   */
  messages: ChatMessage[];
  
  /**
   * Temperature for randomness (0-1)
   * @default 0.7
   */
  temperature?: number;
  
  /**
   * Tool choice setting
   * @default "auto"
   */
  tool_choice?: string;
  
  /**
   * Whether to stream the response (Note: API always streams)
   * @default true
   */
  stream?: boolean;
  
  /**
   * Maximum tokens to generate
   */
  max_tokens?: number;
  
  /**
   * Top-p sampling parameter (0-1)
   */
  top_p?: number;
  
  /**
   * Frequency penalty (-2 to 2)
   */
  frequency_penalty?: number;
  
  /**
   * Presence penalty (-2 to 2)
   */
  presence_penalty?: number;
}

/**
 * Usage statistics for the completion
 */
export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens?: number;
}

/**
 * Chat completion choice
 */
export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finishReason: string;
}

/**
 * Standard OpenAI-compatible chat completion response
 * Note: API always streams, this is a converted format
 */
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
  usage: ChatUsage;
}

/**
 * Streaming chunk data types
 */
export interface StreamChunk {
  type: 'start' | 'content' | 'end' | 'done';
  data: any;
}

/**
 * Start chunk with message ID (f: prefix)
 */
export interface StartChunk extends StreamChunk {
  type: 'start';
  data: {
    messageId: string;
  };
}

/**
 * Content chunk with text (0: prefix)
 */
export interface ContentChunk extends StreamChunk {
  type: 'content';
  data: {
    content: string;
  };
}

/**
 * End chunk with completion info (e: prefix)
 */
export interface EndChunk extends StreamChunk {
  type: 'end';
  data: {
    finishReason: string;
    usage: ChatUsage;
    isContinued: boolean;
  };
}

/**
 * Done chunk with final info (d: prefix)
 */
export interface DoneChunk extends StreamChunk {
  type: 'done';
  data: {
    finishReason: string;
    usage: ChatUsage;
  };
}

/**
 * Streaming chat completion response
 * This is the primary response format since API always streams
 */
export interface ChatCompletionStreamResponse {
  messageId: string;
  content: string;
  finishReason?: string;
  usage?: ChatUsage;
  chunks: StreamChunk[];
} 