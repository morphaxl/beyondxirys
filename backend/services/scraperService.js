import axios from 'axios';
import * as cheerio from 'cheerio';
import { parse } from 'node-html-parser';

class ScraperService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  /**
   * Scrape content from a URL and extract meaningful information
   */
  async scrapeUrl(url) {
    try {
      console.log('🔍 Starting to scrape URL:', url);
      
      // Validate URL
      const urlObj = new URL(url);
      console.log('🌐 Domain:', urlObj.hostname);

      // Fetch the webpage
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 30000,
        maxRedirects: 5
      });

      console.log('✅ Successfully fetched webpage');
      console.log('📊 Content length:', response.data.length, 'characters');

      // Parse with Cheerio for better content extraction
      const $ = cheerio.load(response.data);
      
      // Extract title
      const title = this.extractTitle($);
      
      // Extract main content
      const content = this.extractMainContent($);
      
      // Extract metadata
      const metadata = this.extractMetadata($, urlObj);
      
      // Generate summary
      const summary = this.generateSummary(content);
      
      // Extract additional information
      const additionalInfo = this.extractAdditionalInfo($);

      const result = {
        url: url,
        title: title,
        content: content,
        summary: summary,
        metadata: metadata,
        ...additionalInfo,
        scrapedAt: new Date().toISOString(),
        contentLength: content.length,
        wordCount: content.split(/\s+/).length
      };

      console.log('✅ Content extraction completed');
      console.log('📄 Title:', title);
      console.log('📝 Content length:', content.length, 'characters');
      console.log('📊 Word count:', result.wordCount);

      return result;
    } catch (error) {
      console.error('❌ Failed to scrape URL:', error.message);
      
      // Try fallback method
      if (error.response?.status === 403 || error.response?.status === 429) {
        console.log('🔄 Trying fallback scraping method...');
        return await this.fallbackScrape(url);
      }
      
      throw new Error(`Failed to scrape URL: ${error.message}`);
    }
  }

  /**
   * Extract title from the webpage
   */
  extractTitle($) {
    // Try multiple selectors for title
    const titleSelectors = [
      'title',
      'h1',
      '[property="og:title"]',
      '[name="twitter:title"]',
      '.title',
      '.headline',
      'article h1',
      '.post-title'
    ];

    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const title = element.attr('content') || element.text();
        if (title && title.trim().length > 0) {
          return title.trim().substring(0, 200); // Limit title length
        }
      }
    }

    return 'Untitled Document';
  }

  /**
   * Extract main content from the webpage
   */
  extractMainContent($) {
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share').remove();
    
    // Try multiple selectors for main content
    const contentSelectors = [
      'article',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      'main',
      '.main-content',
      '[role="main"]',
      '.post-body',
      '.story-body'
    ];

    let content = '';

    // Try each selector
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length) {
        content = element.text().trim();
        if (content.length > 100) { // Ensure we have substantial content
          break;
        }
      }
    }

    // Fallback: get all paragraph text
    if (!content || content.length < 100) {
      content = $('p').map((i, el) => $(el).text().trim()).get().join('\n\n');
    }

    // Final fallback: get body text
    if (!content || content.length < 50) {
      content = $('body').text().trim();
    }

    // Clean up the content
    content = content
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n') // Clean up line breaks
      .trim();

    return content.substring(0, 50000); // Limit content length for storage
  }

  /**
   * Extract metadata from the webpage
   */
  extractMetadata($, urlObj) {
    const metadata = {
      domain: urlObj.hostname,
      path: urlObj.pathname,
      description: '',
      author: '',
      publishDate: '',
      tags: [],
      language: '',
      image: ''
    };

    // Description
    metadata.description = $('[name="description"]').attr('content') || 
                          $('[property="og:description"]').attr('content') || 
                          $('[name="twitter:description"]').attr('content') || '';

    // Author
    metadata.author = $('[name="author"]').attr('content') || 
                     $('[property="article:author"]').attr('content') || 
                     $('.author').first().text().trim() || '';

    // Publish date
    metadata.publishDate = $('[property="article:published_time"]').attr('content') || 
                          $('[name="date"]').attr('content') || 
                          $('time').first().attr('datetime') || '';

    // Language
    metadata.language = $('html').attr('lang') || 
                       $('[property="og:locale"]').attr('content') || 'en';

    // Image
    metadata.image = $('[property="og:image"]').attr('content') || 
                    $('[name="twitter:image"]').attr('content') || '';

    // Tags/Keywords
    const keywords = $('[name="keywords"]').attr('content');
    if (keywords) {
      metadata.tags = keywords.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }

    return metadata;
  }

  /**
   * Generate a summary of the content
   */
  generateSummary(content) {
    if (!content || content.length < 100) {
      return 'No summary available';
    }

    // Simple extractive summary - take first few sentences
    const sentences = content.match(/[^\.!?]+[\.!?]+/g) || [];
    const summary = sentences.slice(0, 3).join(' ').trim();
    
    return summary.length > 500 ? summary.substring(0, 500) + '...' : summary;
  }

  /**
   * Extract additional information
   */
  extractAdditionalInfo($) {
    return {
      links: $('a[href]').map((i, el) => $(el).attr('href')).get().slice(0, 10),
      headings: $('h1, h2, h3').map((i, el) => $(el).text().trim()).get().slice(0, 10),
      images: $('img[src]').map((i, el) => $(el).attr('src')).get().slice(0, 5)
    };
  }

  /**
   * Fallback scraping method for difficult websites
   */
  async fallbackScrape(url) {
    try {
      console.log('🔄 Using fallback scraping method...');
      
      // Try with different headers
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'curl/7.68.0',
          'Accept': '*/*'
        },
        timeout: 15000
      });

      const root = parse(response.data);
      
      const title = root.querySelector('title')?.text || 'Untitled Document';
      const content = root.querySelector('body')?.text || 'No content available';
      
      return {
        url: url,
        title: title.trim().substring(0, 200),
        content: content.trim().substring(0, 10000),
        summary: content.trim().substring(0, 300) + '...',
        metadata: {
          domain: new URL(url).hostname,
          description: 'Extracted via fallback method'
        },
        scrapedAt: new Date().toISOString(),
        contentLength: content.length,
        wordCount: content.split(/\s+/).length,
        method: 'fallback'
      };
    } catch (error) {
      throw new Error(`Fallback scraping also failed: ${error.message}`);
    }
  }

  /**
   * Validate if URL is scrapeable
   */
  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      const validProtocols = ['http:', 'https:'];
      return validProtocols.includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
}

export const scraperService = new ScraperService(); 