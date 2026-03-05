import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { meal_text } = await req.json();

        if (!meal_text) {
            return new Response(JSON.stringify({ error: 'meal_text is required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? 'AIzaSyBHq8z8pmex7aO_nH4iOxhhuYL7ajzjnLw';

        if (!GEMINI_API_KEY) {
            throw new Error('Server Configuration Error: Gemini API key missing.');
        }

        const prompt = `You are a strict nutritional calculation AI. 
    A user has entered the following meal text: "${meal_text}".
    Estimate the total calories and total protein (in grams) for this meal.
    You must ONLY return a valid, parsable JSON object in this exact format, with no markdown formatting, no backticks, and no extra text around it:
    {
      "calories": number,
      "protein": number,
      "items": [
        { "name": "string", "calories": number, "protein": number }
      ]
    }`;

        // Note: We use the fetch API directly from Deno to keep the Edge Function lightweight without installing heavy npm SDKs.
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini Error:", data);
            // Return the raw Gemini error data so we can see it on the client
            return new Response(JSON.stringify({ error: "Gemini APIs Failed", details: data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }

        // Extract the text response from Gemini
        let aiText = data.candidates[0].content.parts[0].text;

        // Clean up potential markdown formatting that Gemini sometimes sneaks in despite instructions
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

        const result = JSON.parse(aiText);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
