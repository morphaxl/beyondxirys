import { Chat, CHAT_MODELS } from '../chat/index';
import { getAccessToken } from '../utils/storage';
import * as configModule from '../config';

// Mock the dependencies
jest.mock('../utils/storage');

// Mock fetch globally
global.fetch = jest.fn();

const mockedGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;

describe('Chat', () => {
  let chat: Chat;

  beforeEach(() => {
    chat = new Chat();
    jest.clearAllMocks();
    
    // Mock config properly
    Object.defineProperty(configModule, 'config', {
      value: {
        apiUrl: 'https://dev-api.beyondnetwork.xyz'
      },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('CHAT_MODELS constants', () => {
    it('should have correct model constants', () => {
      expect(CHAT_MODELS.LLAMA_8B).toBe('meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo');
      expect(CHAT_MODELS.LLAMA_70B).toBe('meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo');
    });
  });

  describe('createCompletion', () => {
    it('should create streaming completion successfully', async () => {
      // Mock access token
      mockedGetAccessToken.mockReturnValue('mock-access-token');

      // Mock streaming response
      const mockStreamData = [
        'f:{"messageId":"test-id-123"}\n',
        '0:"Hello "\n',
        '0:"world!"\n',
        'e:{"finishReason":"stop","usage":{"promptTokens":10,"completionTokens":5},"isContinued":false}\n',
        'd:{"finishReason":"stop","usage":{"promptTokens":10,"completionTokens":5}}\n'
      ];

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[0]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[1]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[2]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[3]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[4]) })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: jest.fn()
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: () => mockReader
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const params = {
        model: CHAT_MODELS.LLAMA_8B,
        messages: [{ role: 'user' as const, content: 'Hello' }],
        temperature: 0.7,
        stream: true
      };

      const result = await chat.createCompletion(params);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://aidev.beyondnetwork.xyz/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'authorization': 'mock-access-token',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"model":"meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"')
        })
      );

      expect('content' in result).toBe(true);
      if ('content' in result) {
        expect(result.messageId).toBe('test-id-123');
        expect(result.content).toBe('Hello world!');
        expect(result.finishReason).toBe('stop');
        expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 5 });
        expect(result.chunks).toHaveLength(5);
      }
    });

    it('should create non-streaming completion successfully', async () => {
      // Mock access token
      mockedGetAccessToken.mockReturnValue('mock-access-token');

      // Mock streaming response (API always streams)
      const mockStreamData = [
        'f:{"messageId":"test-id-456"}\n',
        '0:"2+2=4"\n',
        'e:{"finishReason":"stop","usage":{"promptTokens":8,"completionTokens":3},"isContinued":false}\n',
        'd:{"finishReason":"stop","usage":{"promptTokens":8,"completionTokens":3}}\n'
      ];

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[0]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[1]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[2]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[3]) })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: jest.fn()
      };

      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/plain') // Not JSON, so will use streaming
        },
        body: {
          getReader: () => mockReader
        }
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const params = {
        model: CHAT_MODELS.LLAMA_8B,
        messages: [{ role: 'user' as const, content: 'What is 2+2?' }],
        temperature: 0,
        stream: false
      };

      const result = await chat.createCompletion(params);

      expect('choices' in result).toBe(true);
      if ('choices' in result) {
        expect(result.id).toBe('test-id-456');
        expect(result.object).toBe('chat.completion');
        expect(result.model).toBe(CHAT_MODELS.LLAMA_8B);
        expect(result.choices).toHaveLength(1);
        expect(result.choices[0].message.content).toBe('2+2=4');
        expect(result.choices[0].finishReason).toBe('stop');
        expect(result.usage).toEqual({ promptTokens: 8, completionTokens: 3 });
      }
    });

    it('should handle all optional parameters', async () => {
      mockedGetAccessToken.mockReturnValue('mock-access-token');

      const mockReader = {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
        releaseLock: jest.fn()
      };

      const mockResponse = {
        ok: true,
        body: { getReader: () => mockReader }
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const params = {
        model: CHAT_MODELS.LLAMA_70B,
        messages: [{ role: 'user' as const, content: 'Test' }],
        temperature: 0.9,
        max_tokens: 100,
        top_p: 0.95,
        frequency_penalty: 0.1,
        presence_penalty: 0.2,
        tool_choice: 'auto',
        stream: true
      };

      await chat.createCompletion(params);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://aidev.beyondnetwork.xyz/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'authorization': 'mock-access-token',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"model":"meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"')
        })
      );
    });

    it('should throw error when user is not authenticated', async () => {
      mockedGetAccessToken.mockReturnValue(null);

      const params = {
        model: CHAT_MODELS.LLAMA_8B,
        messages: [{ role: 'user' as const, content: 'Hello' }]
      };

      await expect(chat.createCompletion(params)).rejects.toThrow(
        'User must be authenticated to create chat completions'
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should throw error when SDK is not initialized', async () => {
      mockedGetAccessToken.mockReturnValue('mock-access-token');
      (configModule.config as any) = null;

      const params = {
        model: CHAT_MODELS.LLAMA_8B,
        messages: [{ role: 'user' as const, content: 'Hello' }]
      };

      await expect(chat.createCompletion(params)).rejects.toThrow(
        'SDK must be initialized before creating chat completions'
      );

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle HTTP errors', async () => {
      mockedGetAccessToken.mockReturnValue('mock-access-token');

      const mockResponse = {
        ok: false,
        status: 500
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const params = {
        model: CHAT_MODELS.LLAMA_8B,
        messages: [{ role: 'user' as const, content: 'Hello' }]
      };

      await expect(chat.createCompletion(params)).rejects.toThrow('HTTP error! status: 500');
    });

    it('should handle malformed stream data gracefully', async () => {
      mockedGetAccessToken.mockReturnValue('mock-access-token');

      const mockStreamData = [
        'f:{"messageId":"test-id"}\n',
        'invalid-line\n',
        '0:"Hello"\n',
        'e:{"finishReason":"stop","usage":{"promptTokens":5,"completionTokens":2},"isContinued":false}\n'
      ];

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[0]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[1]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[2]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[3]) })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: jest.fn()
      };

      const mockResponse = {
        ok: true,
        body: { getReader: () => mockReader }
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const params = {
        model: CHAT_MODELS.LLAMA_8B,
        messages: [{ role: 'user' as const, content: 'Hello' }]
      };

      const result = await chat.createCompletion(params);

      expect('content' in result).toBe(true);
      if ('content' in result) {
        expect(result.content).toBe('Hello');
        expect(result.chunks).toHaveLength(3); // Should skip invalid line
      }
    });
  });

  describe('chat', () => {
    it('should create simple chat completion', async () => {
      mockedGetAccessToken.mockReturnValue('mock-access-token');

      const mockStreamData = [
        'f:{"messageId":"simple-test"}\n',
        '0:"Paris is the capital of France."\n',
        'e:{"finishReason":"stop","usage":{"promptTokens":12,"completionTokens":8},"isContinued":false}\n'
      ];

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[0]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[1]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[2]) })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: jest.fn()
      };

      const mockResponse = {
        ok: true,
        body: { getReader: () => mockReader }
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await chat.chat('What is the capital of France?');

      expect(result).toBe('Paris is the capital of France.');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://aidev.beyondnetwork.xyz/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('"model":"meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo"')
        })
      );
    });

    it('should use custom model when provided', async () => {
      mockedGetAccessToken.mockReturnValue('mock-access-token');

      const mockReader = {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
        releaseLock: jest.fn()
      };

      const mockResponse = {
        ok: true,
        body: { getReader: () => mockReader }
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await chat.chat('Hello', CHAT_MODELS.LLAMA_70B);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://aidev.beyondnetwork.xyz/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('"model":"meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"')
        })
      );
    });

    it('should handle response correctly', async () => {
      mockedGetAccessToken.mockReturnValue('mock-access-token');

      const mockStreamData = [
        'f:{"messageId":"simple-test"}\n',
        '0:"Hello there!"\n',
        'e:{"finishReason":"stop","usage":{"promptTokens":5,"completionTokens":3},"isContinued":false}\n'
      ];

      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[0]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[1]) })
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockStreamData[2]) })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: jest.fn()
      };

      const mockResponse = {
        ok: true,
        body: { getReader: () => mockReader }
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await chat.chat('Hi');

      expect(result).toBe('Hello there!');
    });
  });
}); 