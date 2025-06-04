
import { useState } from 'react';
import { ScraperForm } from '@/components/ScraperForm';
import { ScrapedDataDisplay } from '@/components/ScrapedDataDisplay';
import { ScraperHeader } from '@/components/ScraperHeader';
import { FirecrawlService } from '@/services/FirecrawlService';

export interface ScrapedData {
  url: string;
  timestamp: string;
  text: string[];
  images: { src: string; alt: string }[];
  pdfs: { href: string; title: string }[];
  title?: string;
  description?: string;
}

const Index = () => {
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleScrapeComplete = (data: ScrapedData) => {
    setScrapedData(data);
    setIsLoading(false);
  };

  const handleScrapeStart = () => {
    setIsLoading(true);
    setScrapedData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <ScraperHeader />
        
        <div className="max-w-6xl mx-auto space-y-8">
          <ScraperForm 
            onScrapeStart={handleScrapeStart}
            onScrapeComplete={handleScrapeComplete}
            isLoading={isLoading}
          />
          
          {scrapedData && (
            <ScrapedDataDisplay data={scrapedData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
