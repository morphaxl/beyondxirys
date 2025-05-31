import { httpClient } from '../utils/httpClient';
import { getAccessToken } from '../utils/storage';
import { config } from '../config';
import {
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatCompletionStreamResponse,
  ChatMessage,
  ChatUsage,
  StreamChunk,
  StartChunk,
  ContentChunk,
  EndChunk,
  DoneChunk,
  ChatModel
} from './types';

/**
 * Available chat models
 */
export const CHAT_MODELS = {
  LLAMA_8B: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  LLAMA_70B: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'
} as const;

/**
 * Chat service for AI completions
 */
export class Chat {
  /**
   * Create a chat completion
   * @param params Chat completion parameters
   * @returns Promise resolving to completion response or stream response
   */
  async createCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse | ChatCompletionStreamResponse> {
    const token = getAccessToken();
    if (!token) {
      throw new Error('User must be authenticated to create chat completions');
    }

    if (!config) {
      throw new Error('SDK must be initialized before creating chat completions');
    }

    // Use AI endpoint instead of regular API endpoint
    const aiBaseUrl = config.apiUrl.replace('dev-api.beyondnetwork.xyz', 'aidev.beyondnetwork.xyz')
                                   .replace('api.beyondnetwork.xyz', 'ai.beyondnetwork.xyz');

    try {
      // Determine if we should stream based on the stream parameter
      const shouldStream = params.stream !== false; // Default to true if not specified
      
      if (shouldStream) {
        // Handle streaming response
        return await this.handleStreamingResponse(aiBaseUrl, params, token);
      } else {
        // Handle non-streaming response by collecting all chunks
        return await this.handleNonStreamingResponse(aiBaseUrl, params, token);
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message || 'Failed to create chat completion');
      }
      throw error;
    }
  }

  /**
   * Handle streaming response from the API
   */
  private async handleStreamingResponse(
    baseUrl: string, 
    params: ChatCompletionParams, 
    token: string
  ): Promise<ChatCompletionStreamResponse> {
    // Prepare the request body with all parameters
    const requestBody: any = {
      model: params.model,
      messages: params.messages,
      stream: true // Force streaming for this handler
    };

    // Add optional parameters if provided
    if (params.temperature !== undefined) requestBody.temperature = params.temperature;
    if (params.tool_choice !== undefined) requestBody.tool_choice = params.tool_choice;
    if (params.max_tokens !== undefined) requestBody.max_tokens = params.max_tokens;
    if (params.top_p !== undefined) requestBody.top_p = params.top_p;
    if (params.frequency_penalty !== undefined) requestBody.frequency_penalty = params.frequency_penalty;
    if (params.presence_penalty !== undefined) requestBody.presence_penalty = params.presence_penalty;

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let messageId = '';
    let content = '';
    let finishReason: string | undefined;
    let usage: ChatUsage | undefined;
    const chunks: StreamChunk[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          const parsedChunk = this.parseStreamLine(line);
          if (parsedChunk) {
            chunks.push(parsedChunk);

            switch (parsedChunk.type) {
              case 'start':
                messageId = (parsedChunk as StartChunk).data.messageId;
                break;
              case 'content':
                content += (parsedChunk as ContentChunk).data.content;
                break;
              case 'end':
                const endData = (parsedChunk as EndChunk).data;
                finishReason = endData.finishReason;
                usage = endData.usage;
                break;
              case 'done':
                const doneData = (parsedChunk as DoneChunk).data;
                if (!finishReason) finishReason = doneData.finishReason;
                if (!usage) usage = doneData.usage;
                break;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      messageId,
      content,
      finishReason,
      usage,
      chunks
    };
  }

  /**
   * Handle non-streaming response (when stream: false)
   */
  private async handleNonStreamingResponse(
    baseUrl: string, 
    params: ChatCompletionParams, 
    token: string
  ): Promise<ChatCompletionResponse> {
    // Prepare the request body with all parameters
    const requestBody: any = {
      model: params.model,
      messages: params.messages,
      stream: false // Force non-streaming for this handler
    };

    // Add optional parameters if provided
    if (params.temperature !== undefined) requestBody.temperature = params.temperature;
    if (params.tool_choice !== undefined) requestBody.tool_choice = params.tool_choice;
    if (params.max_tokens !== undefined) requestBody.max_tokens = params.max_tokens;
    if (params.top_p !== undefined) requestBody.top_p = params.top_p;
    if (params.frequency_penalty !== undefined) requestBody.frequency_penalty = params.frequency_penalty;
    if (params.presence_penalty !== undefined) requestBody.presence_penalty = params.presence_penalty;

    try {
      // Try non-streaming first
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response is JSON (non-streaming) or streaming
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // Handle JSON response (true non-streaming)
        const data = await response.json() as ChatCompletionResponse;
        return data;
      } else {
        // API still returns streaming even with stream: false, so collect all chunks
        const streamResponse = await this.collectStreamingResponse(response);
        
        // Convert streaming response to standard format
        return {
          id: streamResponse.messageId,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: params.model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: streamResponse.content
            },
            finishReason: streamResponse.finishReason || 'stop'
          }],
          usage: streamResponse.usage || { promptTokens: 0, completionTokens: 0 }
        };
      }
    } catch (error) {
      // Fallback to streaming if non-streaming fails
      console.warn('Non-streaming failed, falling back to streaming:', error);
      const streamResponse = await this.handleStreamingResponse(baseUrl, { ...params, stream: true }, token);
      
      return {
        id: streamResponse.messageId,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: params.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: streamResponse.content
          },
          finishReason: streamResponse.finishReason || 'stop'
        }],
        usage: streamResponse.usage || { promptTokens: 0, completionTokens: 0 }
      };
    }
  }

  /**
   * Collect streaming response into a single response object
   */
  private async collectStreamingResponse(response: Response): Promise<ChatCompletionStreamResponse> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let messageId = '';
    let content = '';
    let finishReason: string | undefined;
    let usage: ChatUsage | undefined;
    const chunks: StreamChunk[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          const parsedChunk = this.parseStreamLine(line);
          if (parsedChunk) {
            chunks.push(parsedChunk);

            switch (parsedChunk.type) {
              case 'start':
                messageId = (parsedChunk as StartChunk).data.messageId;
                break;
              case 'content':
                content += (parsedChunk as ContentChunk).data.content;
                break;
              case 'end':
                const endData = (parsedChunk as EndChunk).data;
                finishReason = endData.finishReason;
                usage = endData.usage;
                break;
              case 'done':
                const doneData = (parsedChunk as DoneChunk).data;
                if (!finishReason) finishReason = doneData.finishReason;
                if (!usage) usage = doneData.usage;
                break;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      messageId,
      content,
      finishReason,
      usage,
      chunks
    };
  }

  /**
   * Parse a single line from the stream
   */
  private parseStreamLine(line: string): StreamChunk | null {
    try {
      if (line.startsWith('f:')) {
        // Start chunk with message ID
        const data = JSON.parse(line.substring(2));
        return {
          type: 'start',
          data
        } as StartChunk;
      } else if (line.startsWith('0:')) {
        // Content chunk
        const content = JSON.parse(line.substring(2));
        return {
          type: 'content',
          data: { content }
        } as ContentChunk;
      } else if (line.startsWith('e:')) {
        // End chunk
        const data = JSON.parse(line.substring(2));
        return {
          type: 'end',
          data
        } as EndChunk;
      } else if (line.startsWith('d:')) {
        // Done chunk
        const data = JSON.parse(line.substring(2));
        return {
          type: 'done',
          data
        } as DoneChunk;
      }
    } catch (error) {
      console.warn('Failed to parse stream line:', line, error);
    }
    return null;
  }

  /**
   * Create a simple chat completion with a single message
   * @param message The user message
   * @param model The model to use (optional, defaults to Llama 8B)
   * @returns Promise resolving to the assistant's response
   */
  async chat(message: string, model?: ChatModel): Promise<string> {
    const params: ChatCompletionParams = {
      model: model || CHAT_MODELS.LLAMA_8B,
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
      stream: true // API always streams anyway
    };

    const response = await this.createCompletion(params);
    
    if ('content' in response) {
      return response.content;
    } else {
      return response.choices[0]?.message?.content || '';
    }
  }
}

export {
  ChatCompletionParams,
  ChatCompletionResponse,
  ChatCompletionStreamResponse,
  ChatMessage,
  ChatUsage,
  StreamChunk,
  ChatModel
}; 