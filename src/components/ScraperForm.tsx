
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ScrapedData } from '@/pages/Index';
import { WebScraperService } from '@/services/WebScraperService';
import { Globe, Settings, Code } from 'lucide-react';

interface ScraperFormProps {
  onScrapeStart: () => void;
  onScrapeComplete: (data: ScrapedData) => void;
  isLoading: boolean;
}

export const ScraperForm = ({ onScrapeStart, onScrapeComplete, isLoading }: ScraperFormProps) => {
  const [url, setUrl] = useState('');
  const [textSelector, setTextSelector] = useState('p, h1, h2, h3, h4, h5, h6, span, div');
  const [imageSelector, setImageSelector] = useState('img');
  const [pdfSelector, setPdfSelector] = useState('a[href$=".pdf"]');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    onScrapeStart();
    
    try {
      console.log('Starting scrape for URL:', url);
      const result = await WebScraperService.scrapeWebsite(url, {
        textSelector,
        imageSelector,
        pdfSelector,
      });

      if (result.success && result.data) {
        toast({
          title: "Success",
          description: `Successfully scraped content from ${url}`,
        });
        onScrapeComplete(result.data);
      } else {
        throw new Error(result.error || 'Failed to scrape website');
      }
    } catch (error) {
      console.error('Scraping error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to scrape website",
        variant: "destructive",
      });
      onScrapeComplete({
        url,
        timestamp: new Date().toISOString(),
        text: [],
        images: [],
        pdfs: [],
      });
    }
  };

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
      <CardHeader className="text-center pb-6">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl">
          <Globe className="w-6 h-6 text-blue-600" />
          Configure Your Scraper
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-base font-medium">Website URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="h-12 text-base"
              required
            />
          </div>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Advanced Selectors
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                  <h4 className="font-medium text-blue-800 mb-2">Text Content</h4>
                  <p className="text-sm text-blue-600">Automatically extracts paragraphs, headings, and text elements</p>
                </div>
                <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
                  <h4 className="font-medium text-purple-800 mb-2">Images</h4>
                  <p className="text-sm text-purple-600">Finds all images with their sources and alt text</p>
                </div>
                <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <h4 className="font-medium text-green-800 mb-2">PDF Files</h4>
                  <p className="text-sm text-green-600">Locates downloadable PDF documents</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="textSelector">Text Content Selector</Label>
                  <Textarea
                    id="textSelector"
                    value={textSelector}
                    onChange={(e) => setTextSelector(e.target.value)}
                    placeholder="p, h1, h2, h3, h4, h5, h6, span, div"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">CSS selectors for text elements</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imageSelector">Image Selector</Label>
                  <Input
                    id="imageSelector"
                    value={imageSelector}
                    onChange={(e) => setImageSelector(e.target.value)}
                    placeholder="img"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">CSS selector for images</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pdfSelector">PDF Selector</Label>
                  <Input
                    id="pdfSelector"
                    value={pdfSelector}
                    onChange={(e) => setPdfSelector(e.target.value)}
                    placeholder='a[href$=".pdf"]'
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">CSS selector for PDF links</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            {isLoading ? "Scraping Website..." : "Start Scraping"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
