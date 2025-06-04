
interface FirecrawlResult {
  success: boolean;
  data?: {
    url: string;
    timestamp: string;
    title?: string;
    description?: string;
    text: string[];
    images: { src: string; alt: string }[];
    pdfs: { href: string; title: string }[];
  };
  error?: string;
}

export class FirecrawlService {
  /**
   * Formats a filename to look like a title
   * Example: "annual-report-2023.pdf" -> "Annual Report 2023"
   * Also handles date patterns like "Erie Settle 8 18 11" -> "Erie Settle"
   */
  private static formatFilenameAsTitle(filename: string): string {
    // Remove file extension
    let title = filename.replace(/\.pdf$/i, '');
    
    // Replace hyphens, underscores, and dots with spaces
    title = title.replace(/[-_.]/g, ' ');
    
    // Check if the title contains date patterns (numbers separated by spaces at the end)
    // Common patterns: "Document Name 8 18 11" or "Document 2021 05 23"
    const datePattern = /(.+?)\s+(\d+\s+\d+\s+\d+)$/;
    const dateMatch = title.match(datePattern);
    
    if (dateMatch) {
      // Use only the document name part, removing the date numbers at the end
      title = dateMatch[1];
    }
    
    // Capitalize first letter of each word
    title = title.split(' ')
      .map(word => {
        if (word.length === 0) return '';
        // Don't lowercase acronyms (words that are all uppercase)
        if (word === word.toUpperCase() && word.length > 1) return word;
        return word[0].toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
    
    // Trim extra spaces
    return title.trim();
  }
  
  static getApiKey(): string | null {
    // First try to get API key from environment variable
    const envApiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
    
    if (envApiKey) {
      return envApiKey;
    }
    
    // Fallback to localStorage for backward compatibility
    return localStorage.getItem('firecrawl_api_key');
  }


  static async scrapeWebsite(url: string): Promise<FirecrawlResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found. Please enter your Firecrawl API key.' };
    }

    try {
      console.log('Scraping with Firecrawl API:', url);
      
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url: url,
          pageOptions: {
            includeHtml: true,
            includeRawHtml: true
          },
          extractorOptions: {
            mode: 'llm-extraction-from-raw-html',
            extractionSchema: {
              title: { type: 'string', description: 'The title of the webpage' },
              description: { type: 'string', description: 'Meta description or summary of the webpage' },
              textContent: { type: 'array', items: { type: 'string' }, description: 'Main text content from the webpage' },
              images: { type: 'array', items: { type: 'object', properties: { src: { type: 'string' }, alt: { type: 'string' } } }, description: 'Images with their source URLs and alt text' },
              pdfLinks: { type: 'array', items: { type: 'object', properties: { href: { type: 'string' }, title: { type: 'string' } } }, description: 'PDF links with their URLs and titles' }
            }
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Scraping failed');
      }

      // Parse the scraped content
      const scrapedData = this.parseFirecrawlData(result.data, url);
      
      return {
        success: true,
        data: scrapedData
      };
    } catch (error) {
      console.error('Firecrawl API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape website'
      };
    }
  }

  private static parseFirecrawlData(data: {
    html?: string;
    rawHtml?: string;
    extractedData?: {
      title?: string;
      description?: string;
      textContent?: string[];
      images?: { src: string; alt: string }[];
      pdfLinks?: { href: string; title: string }[];
    };
    title?: string;
    description?: string;
  }, url: string) {
    // Use extracted data from LLM extraction if available
    if (data.extractedData) {
      const extractedData = data.extractedData;
      
      // Get text content from extracted data
      const textContent = [];
      if (extractedData.title) textContent.push(extractedData.title);
      if (extractedData.description) textContent.push(extractedData.description);
      if (extractedData.textContent && Array.isArray(extractedData.textContent)) {
        textContent.push(...extractedData.textContent);
      }
      
      // Get images and PDFs directly from extracted data
      const images = extractedData.images || [];
      const pdfs = extractedData.pdfLinks || [];
      
      return {
        url,
        timestamp: new Date().toISOString(),
        title: extractedData.title || 'Scraped Content',
        description: extractedData.description || 'Content extracted from website',
        text: textContent,
        images,
        pdfs
      };
    }
    
    // Fallback to HTML parsing if no extracted data
    const html = data.html || data.rawHtml || '';
    
    // Extract text content from HTML
    const textContent = [];
    
    // Add title and description if available
    if (data.title) textContent.push(data.title);
    if (data.description) textContent.push(data.description);
    
    // Extract text from HTML using a temporary div element
    if (html) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Remove script and style elements
        const scripts = doc.querySelectorAll('script, style, noscript, iframe, nav, header, footer');
        scripts.forEach(script => script.remove());
        
        // Get main content or fall back to body
        const mainContent = doc.querySelector('main, article, [role="main"], .main, .content, .post') || doc.body;
        
        // Extract text from headings and paragraphs
        const contentElements = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, td, th, blockquote, pre, code');
        const seenText = new Set();
        
        contentElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text && !seenText.has(text) && text.length > 10) { // Minimum 10 chars to avoid small fragments
            seenText.add(text);
            textContent.push(text);
          }
        });
      } catch (e) {
        console.error('Error parsing HTML:', e);
        // Fallback to simple text extraction
        const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (text) textContent.push(text);
      }
    }
    
    // Extract images from HTML
    const images: { src: string; alt: string }[] = [];
    if (html) {
      const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
      const altRegex = /alt=["']([^"']*)["']/i;
      let match;
      
      while ((match = imgRegex.exec(html)) !== null) {
        const imgTag = match[0];
        const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
          const src = srcMatch[1].split(/[\s?]/)[0]; // Remove query params and fragments
          const altMatch = imgTag.match(altRegex);
          const alt = (altMatch && altMatch[1]) || 'Image';
          
          // Convert relative URLs to absolute
          try {
            const absoluteSrc = src.startsWith('http') ? src : new URL(src, url).href;
            images.push({ src: absoluteSrc, alt });
          } catch (e) {
            console.warn('Invalid image URL:', src);
          }
        }
      }
    }

    // Extract PDF links from HTML
    const pdfs: { href: string; title: string }[] = [];
    if (html) {
      const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;
      let match;
      
      while ((match = linkRegex.exec(html)) !== null) {
        const href = match[2];
        if (href.toLowerCase().endsWith('.pdf')) {
          // Try to get title from link text
          const titleMatch = match[0].match(/>(.*?)<\/a>/i);
          let title = (titleMatch && titleMatch[1]?.trim()) || '';
          
          try {
            const absoluteHref = href.startsWith('http') ? href : new URL(href, url).href;
            
            // If no title was found in the link text, extract filename from the URL
            if (!title) {
              // Parse the URL to get the pathname
              const urlObj = new URL(absoluteHref);
              // Get the last part of the path which should be the filename
              const pathParts = urlObj.pathname.split('/');
              const filename = pathParts[pathParts.length - 1];
              // Format the filename as a title
              title = FirecrawlService.formatFilenameAsTitle(decodeURIComponent(filename));
            }
            
            pdfs.push({ href: absoluteHref, title });
          } catch (e) {
            console.warn('Invalid PDF URL:', href);
          }
        }
      }
    }

    return {
      url,
      timestamp: new Date().toISOString(),
      title: data.title || 'Scraped Content',
      description: data.description || 'Content extracted from website',
      text: textContent,
      images,
      pdfs
    };
  }
}
