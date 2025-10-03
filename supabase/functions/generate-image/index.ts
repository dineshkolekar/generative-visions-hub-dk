import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style, resolution, quality, background, outputFormat } = await req.json();
    
    console.log('Generating image with params:', { prompt, style, resolution, quality, background, outputFormat });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build enhanced prompt with style
    let enhancedPrompt = prompt;
    if (style && style !== 'none') {
      const stylePrompts: Record<string, string> = {
        photorealistic: 'Ultra-realistic photography, highly detailed, professional lighting, 8K quality',
        artistic: 'Beautiful artistic painting style, creative interpretation, vibrant colors',
        abstract: 'Abstract art style, modern interpretation, bold shapes and colors',
        cinematic: 'Cinematic movie scene, dramatic lighting, film photography aesthetic',
        anime: 'Anime art style, vibrant colors, detailed character design',
        digital: 'Digital art, modern style, clean composition, professional digital painting',
      };
      enhancedPrompt = `${stylePrompts[style] || ''}. ${prompt}`;
    }

    // Add resolution to prompt for better results
    const [width, height] = resolution.split('x').map(Number);
    const aspectRatio = width === height ? '1:1' : width > height ? 'landscape' : 'portrait';
    enhancedPrompt = `${aspectRatio} aspect ratio. ${enhancedPrompt}`;

    console.log('Enhanced prompt:', enhancedPrompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: enhancedPrompt,
          }
        ],
        modalities: ['image', 'text'],
        // Additional parameters
        background: background || 'auto',
        quality: quality || 'auto',
        output_format: outputFormat || 'png',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Response received from AI Gateway');

    // Extract the generated image
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error('No image URL in response:', JSON.stringify(data));
      throw new Error('No image generated');
    }

    return new Response(
      JSON.stringify({ 
        imageUrl,
        prompt: enhancedPrompt,
        timestamp: new Date().toISOString(),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-image function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
