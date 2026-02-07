import { base44 } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Generate the app icon (B on deep black)
    const iconPrompt = `
Create a professional app launcher icon with:
- Deep black background (#0B0B0B)
- Single centered capital letter "B" in pure white (#FFFFFF)
- Modern bold sans-serif typography (like system fonts)
- Size: square 512x512 pixels
- No gradients, shadows, or decorative elements
- Minimal, premium SaaS aesthetic (similar to Linear, Runway, or Stripe)
- High contrast and clean
- Must look strong and professional on iPhone home screen
`;

    const response = await base44.integrations.Core.GenerateImage({
      prompt: iconPrompt
    });

    return Response.json({
      success: true,
      iconUrl: response.url,
      message: 'App icon generated successfully. Update manifest.json to use this URL.'
    });
  } catch (error) {
    console.error('Icon generation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});