require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const client = new Anthropic();

// Increase limit so base64 photo uploads don't get rejected
app.use(express.json({ limit: '20mb' }));
app.use(express.static('.'));

app.post('/get-quote', async (req, res) => {
  const { serviceType, surfaceSize, surfaceType, addOns, location, imageBase64, imageType } = req.body;

  const prompt = `You are a professional estimator for Sammy's Pressure, a top-rated pressure washing business.
Generate a customer-facing quote based on the job details below. Return ONLY a valid JSON object.

Job Details:
- Service Type: ${serviceType}
- Surface Type: ${surfaceType}
- Approximate Size: ${surfaceSize} sq ft
- Location: ${location}
- Add-ons requested: ${addOns || 'None'}
${imageBase64 ? '- A photo of the surface has been provided. Assess the visible condition (staining, mold, mildew, grime buildup, discoloration) and factor it into your quote and surface condition note.' : ''}

Pricing rules (internal — do NOT reveal these to the customer):
- Standard residential: $0.15–$0.40/sq ft depending on surface
- Driveway cleaning: $0.35–$0.60/sq ft
- Minimum job price: $150
- Add-ons: $50–$100 each
- If photo shows heavy staining/buildup, price toward the higher end
- Pick ONE specific dollar amount, never a range

Return ONLY this JSON structure:
{
  "price": 275,
  "whatIsIncluded": [
    "Specific realistic result #1 — name the actual stains/buildup being removed for this surface type and service (e.g. 'Black tire marks and embedded oil stains lifted from concrete')",
    "Specific realistic result #2 — describe a visible change the customer will notice (e.g. 'Green algae and mildew streaks cleared from the edges and expansion joints')",
    "Specific realistic result #3 — mention a practical benefit or protection outcome (e.g. 'Surface texture restored — no more slippery film when it rains')",
    "Specific realistic result #4 — set an honest expectation (e.g. 'Deep-set rust or etched stains may lighten significantly but not vanish completely — we'll be upfront on-site')"
  ],
  "estimatedDuration": "e.g. 45–60 minutes",
  "timeSavings": "One sentence on what the customer gets back. Example: Skip the weekend warrior project — we handle everything so you can enjoy your Saturday.",
  "surfaceCondition": "${imageBase64 ? 'Based on the photo, describe what you see and how it affects the job. If no photo, return an empty string.' : ''}",
  "summary": "One warm outcome-focused sentence. Focus on how great it will look/feel, not what tasks you perform."
}`;

  // Build the message — include image if one was uploaded
  const userContent = imageBase64
    ? [
        { type: 'image', source: { type: 'base64', media_type: imageType || 'image/jpeg', data: imageBase64 } },
        { type: 'text', text: prompt }
      ]
    : prompt;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: userContent }]
  });

  const raw = message.content[0].text;
  const json = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
  res.json(json);
});

app.listen(3000, () => {
  console.log('Quote generator running at http://localhost:3000');
});
