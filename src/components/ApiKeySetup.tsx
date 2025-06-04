
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FirecrawlService } from '@/services/FirecrawlService';
import { Key, ExternalLink } from 'lucide-react';

interface ApiKeySetupProps {
  onApiKeySet: () => void;
}

export const ApiKeySetup = ({ onApiKeySet }: ApiKeySetupProps) => {
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }

    FirecrawlService.saveApiKey(apiKey.trim());
    toast({
      title: "API Key Saved!",
      description: "You can now start scraping websites",
    });
    onApiKeySet();
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl max-w-2xl mx-auto">
      <CardHeader className="text-center pb-6">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl">
          <Key className="w-6 h-6 text-blue-600" />
          Setup Firecrawl API
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Enter your Firecrawl API key to start scraping websites with real data
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">How to get your API key:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Visit Firecrawl.dev and create an account</li>
            <li>Go to your dashboard and generate an API key</li>
            <li>Copy and paste it below</li>
          </ol>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 gap-2"
            onClick={() => window.open('https://www.firecrawl.dev/', '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            Get API Key
          </Button>
        </div>

        <div className="space-y-3">
          <Label htmlFor="apiKey" className="text-base font-medium">Firecrawl API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="fc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className="h-12 text-base font-mono"
          />
          <p className="text-sm text-gray-500">
            Your API key is stored locally and never shared
          </p>
        </div>

        <Button 
          onClick={handleSaveKey}
          className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Save API Key & Start Scraping
        </Button>
      </CardContent>
    </Card>
  );
};
