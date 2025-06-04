import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ScrapedData } from '@/pages/Index';
import { FirecrawlService } from '@/services/FirecrawlService';
import { Globe, Loader2 } from 'lucide-react';

interface ScraperFormProps {
  onScrapeStart: () => void;
  onScrapeComplete: (data: ScrapedData) => void;
  isLoading: boolean;
}

export const ScraperForm = ({ onScrapeStart, onScrapeComplete, isLoading }: ScraperFormProps) => {
  const [url, setUrl] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Please enter a website URL",
        description: "Make sure to include https:// at the beginning",
        variant: "destructive",
      });
      return;
    }

    // Add https:// if missing
    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }

    onScrapeStart();
    
    try {
      console.log('Starting real scrape for URL:', processedUrl);
      const result = await FirecrawlService.scrapeWebsite(processedUrl);

      if (result.success && result.data) {
        toast({
          title: "Scraping Complete!",
          description: `Found ${result.data.text.length} text sections, ${result.data.images.length} images, and ${result.data.pdfs.length} PDFs`,
        });
        onScrapeComplete(result.data);
      } else {
        throw new Error(result.error || 'Failed to scrape website');
      }
    } catch (error) {
      console.error('Scraping error:', error);
      toast({
        title: "Couldn't scrape that website",
        description: error instanceof Error ? error.message : "The website might be blocking automated access or the URL might be incorrect",
        variant: "destructive",
      });
      onScrapeComplete({
        url: processedUrl,
        timestamp: new Date().toISOString(),
        text: [],
        images: [],
        pdfs: [],
      });
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl max-w-2xl mx-auto">
      <CardHeader className="text-center pb-6">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl">
          <Globe className="w-6 h-6 text-blue-600" />
          Enter Website to Scrape
        </CardTitle>
        <p className="text-gray-600 mt-2">
          We'll automatically find all text content, images, and PDF files on the page
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="url" className="text-base font-medium">Website URL</Label>
            <Input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com or https://example.com"
              className="h-12 text-base"
              required
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              You can enter just the domain name or the full URL
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">What we'll extract:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• All text content (headings, paragraphs, etc.)</li>
              <li>• Images with their descriptions</li>
              <li>• Downloadable PDF files</li>
            </ul>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping Website...
              </>
            ) : (
              "Start Scraping"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
