
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScrapedData } from '@/pages/Index';
import { FileText, Image, Download, Copy, ExternalLink, CheckCircle, AlertCircle, Save, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// TypeScript interfaces for File System Access API
interface FileSystemFileHandle {
  createWritable: () => Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
}

interface ShowSaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
}

// Extend Window interface to include File System Access API
declare global {
  interface Window {
    showSaveFilePicker?: (options?: ShowSaveFilePickerOptions) => Promise<FileSystemFileHandle>;
  }
}

interface ScrapedDataDisplayProps {
  data: ScrapedData;
}

export const ScrapedDataDisplay = ({ data }: ScrapedDataDisplayProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Generate a filename based on current date
  const getDefaultFilename = () => {
    return `scraped-data-${new Date().toISOString().split('T')[0]}.json`;
  };

  // Handle traditional browser download (fallback method)
  const handleBrowserDownload = () => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getDefaultFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Your scraped data has been saved as a JSON file",
    });
  };

  // Handle download using File System Access API (allows user to choose save location)
  const handleSaveAs = async () => {
    try {
      // Check if File System Access API is supported
      if (!window.showSaveFilePicker) {
        toast({
          title: "Not supported",
          description: "Your browser doesn't support the File System Access API. Using fallback method.",
          variant: "destructive",
        });
        handleBrowserDownload();
        return;
      }

      const jsonData = JSON.stringify(data, null, 2);
      
      // Show the file picker
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: getDefaultFilename(),
        types: [{
          description: 'JSON File',
          accept: {'application/json': ['.json']},
        }],
      });
      
      // Create a writable stream and write the data
      const writable = await fileHandle.createWritable();
      await writable.write(jsonData);
      await writable.close();
      
      toast({
        title: "Saved successfully!",
        description: "Your scraped data has been saved to the location you selected",
      });
    } catch (error) {
      // User might have cancelled the save dialog
      const err = error as Error;
      if (err.name !== 'AbortError') {
        console.error('Error saving file:', err);
        toast({
          title: "Save failed",
          description: "There was an error saving your file. Using fallback method.",
          variant: "destructive",
        });
        handleBrowserDownload();
      }
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const downloadTextFile = (text: string, index: number, filename?: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `text-section-${index + 1}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: filename ? "All text has been downloaded" : "Text section has been downloaded",
    });
  };

  const downloadAllText = () => {
    if (data.text.length === 0) {
      toast({
        title: "No text to download",
        description: "There is no text content available to download",
        variant: "destructive"
      });
      return;
    }
    
    // Combine all text with double newlines between sections
    const allText = data.text.join('\n\n');
    const domain = new URL(data.url).hostname.replace('www.', '');
    const filename = `all-text-from-${domain}-${new Date().toISOString().split('T')[0]}.txt`;
    
    downloadTextFile(allText, 0, filename);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const totalItems = data.text.length + data.images.length + data.pdfs.length;

  return (
    <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Scraping Results
            </CardTitle>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">Website: <span className="font-mono break-all">{data.url}</span></p>
              <p className="text-sm text-gray-600">Completed: {formatTimestamp(data.timestamp)}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download Data
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSaveAs} className="cursor-pointer">
                <FolderOpen className="w-4 h-4 mr-2" />
                Save As... (Choose location)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBrowserDownload} className="cursor-pointer">
                <Save className="w-4 h-4 mr-2" />
                Quick Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <FileText className="w-4 h-4" />
              Text ({data.text.length})
            </TabsTrigger>
            <TabsTrigger value="images" className="gap-2">
              <Image className="w-4 h-4" />
              Images ({data.images.length})
            </TabsTrigger>
            <TabsTrigger value="pdfs" className="gap-2">
              <Download className="w-4 h-4" />
              PDFs ({data.pdfs.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              <div className="text-center">
                {totalItems > 0 ? (
                  <div className="space-y-2">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    <h3 className="text-2xl font-bold text-green-700">Success!</h3>
                    <p className="text-gray-600">Found {totalItems} items on this webpage</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AlertCircle className="w-16 h-16 text-orange-500 mx-auto" />
                    <h3 className="text-2xl font-bold text-orange-700">No Content Found</h3>
                    <p className="text-gray-600">This website might be blocking automated access or have no extractable content</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`p-4 ${data.text.length > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <FileText className={`w-8 h-8 ${data.text.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <h4 className="font-bold text-2xl">{data.text.length}</h4>
                      <p className="text-sm text-gray-600">Text Sections</p>
                    </div>
                  </div>
                </Card>
                
                <Card className={`p-4 ${data.images.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <Image className={`w-8 h-8 ${data.images.length > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <h4 className="font-bold text-2xl">{data.images.length}</h4>
                      <p className="text-sm text-gray-600">Images</p>
                    </div>
                  </div>
                </Card>
                
                <Card className={`p-4 ${data.pdfs.length > 0 ? 'bg-purple-50 border-purple-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <Download className={`w-8 h-8 ${data.pdfs.length > 0 ? 'text-purple-600' : 'text-gray-400'}`} />
                    <div>
                      <h4 className="font-bold text-2xl">{data.pdfs.length}</h4>
                      <p className="text-sm text-gray-600">PDF Files</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="text" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button 
                onClick={downloadAllText}
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={data.text.length === 0}
              >
                <Download className="w-4 h-4" />
                Download All Text
              </Button>
            </div>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {data.text.length > 0 ? (
                  data.text.map((text, index) => (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm leading-relaxed flex-1">{text}</p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadTextFile(text, index)}
                            className="gap-1 shrink-0 text-blue-600 hover:text-blue-700"
                            title="Download text"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyToClipboard(text)}
                            className="gap-1 shrink-0"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No text content found on this page</p>
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
                          {image.alt || 'No description'}
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
                    <p>No images found on this page</p>
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
                            <p className="font-medium text-sm">{pdf.title || 'Unnamed PDF'}</p>
                            <p className="text-xs text-gray-500 truncate max-w-md">{pdf.href}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = pdf.href;
                              link.download = pdf.title?.endsWith('.pdf') ? pdf.title : `${pdf.title || 'document'}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              
                              toast({
                                title: "Download started",
                                description: "The PDF is being downloaded",
                              });
                            }}
                            className="gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
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
                            title="Copy link to clipboard"
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
                    <p>No PDF files found on this page</p>
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
