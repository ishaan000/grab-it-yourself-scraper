
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScrapedData } from '@/pages/Index';
import { FileText, Image, Download, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScrapedDataDisplayProps {
  data: ScrapedData;
}

export const ScrapedDataDisplay = ({ data }: ScrapedDataDisplayProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('text');

  const handleExportJSON = () => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scraped-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Data exported as JSON file",
    });
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-2xl">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-2">Scraped Results</CardTitle>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">URL: <span className="font-mono">{data.url}</span></p>
              <p className="text-sm text-gray-600">Scraped: {formatTimestamp(data.timestamp)}</p>
            </div>
          </div>
          <Button onClick={handleExportJSON} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
        </div>
        
        <div className="flex gap-4 mt-4">
          <Badge variant="secondary" className="gap-1">
            <FileText className="w-3 h-3" />
            {data.text.length} Text Items
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Image className="w-3 h-3" />
            {data.images.length} Images
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Download className="w-3 h-3" />
            {data.pdfs.length} PDFs
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="gap-2">
              <FileText className="w-4 h-4" />
              Text Content
            </TabsTrigger>
            <TabsTrigger value="images" className="gap-2">
              <Image className="w-4 h-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="pdfs" className="gap-2">
              <Download className="w-4 h-4" />
              PDFs
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="mt-6">
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {data.text.length > 0 ? (
                  data.text.map((text, index) => (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start gap-4">
                        <p className="text-sm leading-relaxed flex-1">{text}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyToClipboard(text)}
                          className="gap-1 shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No text content found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="images" className="mt-6">
            <ScrollArea className="h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.images.length > 0 ? (
                  data.images.map((image, index) => (
                    <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="text-gray-400 text-sm">Image not accessible</div>';
                            }
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-600 mb-2 truncate" title={image.alt}>
                          {image.alt || 'No alt text'}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(image.src, '_blank')}
                            className="gap-1 text-xs flex-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyToClipboard(image.src)}
                            className="gap-1 text-xs"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No images found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="pdfs" className="mt-6">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {data.pdfs.length > 0 ? (
                  data.pdfs.map((pdf, index) => (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Download className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{pdf.title || 'PDF Document'}</p>
                            <p className="text-xs text-gray-500 truncate max-w-md">{pdf.href}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(pdf.href, '_blank')}
                            className="gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyToClipboard(pdf.href)}
                            className="gap-1"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Download className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No PDF files found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
