
import { Globe, Download, FileText, Image } from 'lucide-react';

export const ScraperHeader = () => {
  return (
    <div className="text-center mb-12">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
        <Globe className="w-10 h-10 text-white" />
      </div>
      
      <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
        Web Scraper Pro
      </h1>
      
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Extract content from any website with precision. Select specific elements, scrape text, images, and PDFs with ease.
      </p>
      
      <div className="flex justify-center gap-8 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span>Text Content</span>
        </div>
        <div className="flex items-center gap-2">
          <Image className="w-4 h-4" />
          <span>Images</span>
        </div>
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          <span>PDF Files</span>
        </div>
      </div>
    </div>
  );
};
