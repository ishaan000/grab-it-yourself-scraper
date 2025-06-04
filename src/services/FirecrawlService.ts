
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
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    console.log('Firecrawl API key saved');
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
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
            extractionPrompt: 'Extract all text content, image URLs with alt text, and PDF download links from this webpage'
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

  private static parseFirecrawlData(data: any, url: string) {
    const html = data.html || data.rawHtml || '';
    const markdown = data.markdown || '';
    
    // Extract text content
    const textContent = [];
    if (data.title) textContent.push(data.title);
    if (data.description) textContent.push(data.description);
    if (markdown) {
      // Split markdown into paragraphs and filter out empty ones
      const paragraphs = markdown.split('\n\n').filter((p: string) => p.trim().length > 0);
      textContent.push(...paragraphs);
    }

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
