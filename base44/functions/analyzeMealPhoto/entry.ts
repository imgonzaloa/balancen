import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { imageUrl, lang } = body;

    if (!imageUrl) {
      console.error('[MEAL] Missing imageUrl in request');
      return Response.json({ error: 'Se requiere imageUrl' }, { status: 400 });
    }

    console.log('[MEAL] Analyzing image:', imageUrl, 'lang:', lang);

    const langInstruction = lang === 'en'
      ? 'Respond in English.'
      : lang === 'pt'
      ? 'Responda em português.'
      : 'Responde en español.';

    // Call AI to analyze the meal
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Analiza esta foto de comida y proporciona:
1. Lista de alimentos detectados con confianza
2. Calorías totales estimadas
3. Macronutrientes (proteína, carbohidratos, grasas en gramos)
4. Notas sobre la comida (tamaño de porción, preparación)

${langInstruction} Sé preciso pero realista con las estimaciones.`,
      add_context_from_internet: false,
      file_urls: [imageUrl],
      response_json_schema: {
        type: "object",
        properties: {
          foodName: { type: "string" },
          confidence: { type: "number" },
          description: { type: "string" },
          detectedItems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                confidence: { type: "number" }
              }
            }
          },
          caloriesTotal: { type: "number" },
          macros: {
            type: "object",
            properties: {
              protein_g: { type: "number" },
              carbs_g: { type: "number" },
              fat_g: { type: "number" }
            }
          },
          notes: { type: "string" },
          warnings: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    console.log('[MEAL] Analysis result:', analysisResult);

    // Transform to expected format
    const result = {
      foodName: analysisResult.foodName || (analysisResult.detectedItems?.[0]?.name || 'Comida detectada'),
      confidence: analysisResult.confidence || (analysisResult.detectedItems?.[0]?.confidence || 0.85),
      description: analysisResult.description || '',
      calories: analysisResult.caloriesTotal || 0,
      protein: analysisResult.macros?.protein_g || 0,
      carbs: analysisResult.macros?.carbs_g || 0,
      fats: analysisResult.macros?.fat_g || 0,
      items: analysisResult.detectedItems?.map(item => item.name) || [],
      notes: analysisResult.notes || '',
      warnings: analysisResult.warnings || []
    };

    return Response.json(result);
  } catch (err) {
    console.error('[MEAL] Analysis error:', err);
    return Response.json(
      { error: 'Error al analizar la comida', details: err.message },
      { status: 500 }
    );
  }
});