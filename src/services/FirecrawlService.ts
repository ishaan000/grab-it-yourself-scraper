
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
    
    // Extract text content
    const textContent = [];
    if (data.title) textContent.push(data.title);
    if (data.description) textContent.push(data.description);
    
    // Extract images from HTML
    const images: { src: string; alt: string }[] = [];
    if (html) {
      const imgRegex = /<img[^>]+src="([^"]*)"[^>]*(?:alt="([^"]*)")?[^>]*>/gi;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        const src = match[1];
        const alt = match[2] || 'Image';
        // Convert relative URLs to absolute
        const absoluteSrc = src.startsWith('http') ? src : new URL(src, url).href;
        images.push({ src: absoluteSrc, alt });
      }
    }

    // Extract PDF links from HTML
    const pdfs: { href: string; title: string }[] = [];
    if (html) {
      const pdfRegex = /<a[^>]+href="([^"]*\.pdf)"[^>]*>([^<]*)</gi;
      let match;
      while ((match = pdfRegex.exec(html)) !== null) {
        const href = match[1];
        const title = match[2].trim() || 'PDF Document';
        // Convert relative URLs to absolute
        const absoluteHref = href.startsWith('http') ? href : new URL(href, url).href;
        pdfs.push({ href: absoluteHref, title });
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
