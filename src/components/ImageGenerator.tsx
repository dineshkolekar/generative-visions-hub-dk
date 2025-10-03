import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Download, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: string;
}

export const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [style, setStyle] = useState("photorealistic");
  const [resolution, setResolution] = useState("1024x1024");
  const [quality, setQuality] = useState("high");
  const [background, setBackground] = useState("auto");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: prompt.trim(),
          style,
          resolution,
          quality,
          background,
          outputFormat: 'png',
        }
      });

      if (error) {
        console.error('Error generating image:', error);
        if (error.message.includes('429')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.message.includes('402')) {
          toast.error('Payment required. Please add credits to your workspace.');
        } else {
          toast.error('Failed to generate image. Please try again.');
        }
        return;
      }

      if (data?.imageUrl) {
        setGeneratedImage({
          url: data.imageUrl,
          prompt: data.prompt || prompt,
          timestamp: data.timestamp || new Date().toISOString(),
        });
        toast.success('Image generated successfully!');
      } else {
        toast.error('No image was generated. Please try again.');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage.url;
    link.download = `ai-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded!');
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-2xl shadow-[var(--shadow-glow)]">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            AI Image Generator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your ideas into stunning visuals with advanced AI technology
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Control Panel */}
          <Card className="p-6 bg-card border-border shadow-[var(--shadow-card)] space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-lg font-semibold">Describe Your Vision</Label>
              <Textarea
                id="prompt"
                placeholder="A serene mountain landscape at sunset with vibrant colors..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] bg-background border-border focus:border-primary transition-colors resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger id="style" className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photorealistic">Photorealistic</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                    <SelectItem value="cinematic">Cinematic</SelectItem>
                    <SelectItem value="anime">Anime</SelectItem>
                    <SelectItem value="digital">Digital Art</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger id="resolution" className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024x1024">1024×1024 (Square)</SelectItem>
                    <SelectItem value="1536x1024">1536×1024 (Landscape)</SelectItem>
                    <SelectItem value="1024x1536">1024×1536 (Portrait)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality">Quality</Label>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger id="quality" className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background">Background</Label>
                <Select value={background} onValueChange={setBackground}>
                  <SelectTrigger id="background" className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="transparent">Transparent</SelectItem>
                    <SelectItem value="opaque">Opaque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-[var(--shadow-glow)] text-lg font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Image
                </>
              )}
            </Button>
          </Card>

          {/* Preview Panel */}
          <Card className="p-6 bg-card border-border shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Preview</h2>
              {generatedImage && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </div>

            <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-glow-pulse" />
                  </div>
                  <p className="text-muted-foreground">Creating your masterpiece...</p>
                </div>
              ) : generatedImage ? (
                <img 
                  src={generatedImage.url} 
                  alt={generatedImage.prompt}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <ImageIcon className="w-16 h-16 opacity-50" />
                  <p className="text-center px-4">Your generated image will appear here</p>
                </div>
              )}
            </div>

            {generatedImage && !isGenerating && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Prompt used:</p>
                <p className="text-sm">{generatedImage.prompt}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
