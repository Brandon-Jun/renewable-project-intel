import Anthropic from '@anthropic-ai/sdk';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { projectName, country, businessType, participants, capacity } = req.body;
  if (!projectName || !country || !businessType) {
    return res.status(400).json({ error: '필수 입력값이 없습니다 (프로젝트명, 국가, 사업유형)' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultHeaders: { 'anthropic-beta': 'web-search-2025-03-05' },
  });

  const systemPrompt = `You are a senior renewable energy project intelligence analyst specializing in global energy markets.
Search for comprehensive, accurate information about the specified energy project.
IMPORTANT: Always respond with ONLY valid JSON. No markdown, no explanation text, just the raw JSON object.
Use null for unavailable fields. Never make up financial figures—mark as null if uncertain.`;

  const userPrompt = `Search for detailed information about this renewable energy project and return a structured JSON report.

Project Name: ${projectName}
Country: ${country}
Business Type: ${businessType}
${participants ? `Known Participants: ${participants}` : ''}
${capacity ? `Stated Capacity: ${capacity}` : ''}

Search for and return ONLY this JSON structure (no other text):
{
  "projectName": "official project name",
  "alternativeNames": [],
  "location": {
    "city": "city or area",
    "region": "province/state/region",
    "country": "${country}",
    "coordinates": { "lat": null, "lng": null },
    "address": null
  },
  "siteSizeHectares": null,
  "capacity": {
    "mw": null,
    "mwh": null,
    "unit": "MW"
  },
  "stakeholders": {
    "developer": [{ "name": "company", "country": "country", "equity": null }],
    "constructor": [{ "name": "company", "country": "country" }],
    "operator": [{ "name": "company", "country": "country" }],
    "investor": [{ "name": "company", "country": "country", "equity": null, "type": "equity" }]
  },
  "phase": "development",
  "timeline": {
    "startYear": null,
    "codYear": null,
    "currentStatus": "brief status in Korean"
  },
  "financials": {
    "expectedGenerationGwh": null,
    "irr": null,
    "totalInvestmentUSD": null,
    "totalInvestmentLocal": null,
    "currency": "USD"
  },
  "gridConnection": {
    "status": "unknown",
    "substation": null,
    "transmissionOperator": null,
    "curtailmentRisk": "unknown",
    "curtailmentNotes": null
  },
  "powerPurchase": {
    "type": "unknown",
    "buyer": null,
    "term": null,
    "price": null
  },
  "news": [
    {
      "title": "news headline",
      "summary": "2-3 sentence summary in Korean",
      "date": "YYYY-MM or approximate",
      "source": "source name",
      "url": null,
      "hasCurtailment": false,
      "isHighlight": false
    }
  ],
  "dataConfidence": "medium",
  "searchDate": "${new Date().toISOString().split('T')[0]}",
  "sources": ["source1", "source2"]
}

Rules:
- phase must be one of: "development", "construction", "operation"
- gridConnection.status: "connected", "pending", "planned", "unknown"
- gridConnection.curtailmentRisk: "high", "medium", "low", "unknown"
- powerPurchase.type: "PPA", "market", "merchant", "unknown"
- dataConfidence: "high", "medium", "low"
- news: up to 5 most recent items, mark hasCurtailment:true if curtailment related
- All Korean-language summary fields should be in Korean
- Return raw JSON only`;

  try {
    const messages = [{ role: 'user', content: userPrompt }];
    let finalText = '';

    for (let i = 0; i < 8; i++) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages,
      });

      const textBlocks = response.content.filter(b => b.type === 'text');
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

      if (textBlocks.length > 0) {
        finalText = textBlocks.map(b => b.text).join('');
      }

      if (response.stop_reason === 'end_turn') break;

      if (response.stop_reason === 'tool_use' && toolUseBlocks.length > 0) {
        messages.push({ role: 'assistant', content: response.content });
        messages.push({
          role: 'user',
          content: toolUseBlocks.map(b => ({
            type: 'tool_result',
            tool_use_id: b.id,
            content: 'Search results retrieved. Please synthesize and return the JSON report.',
          })),
        });
      } else {
        break;
      }
    }

    // Strip markdown code fences if present
    const stripped = finalText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패: AI 응답에서 JSON을 찾을 수 없습니다.');

    const projectData = JSON.parse(jsonMatch[0]);
    return res.status(200).json(projectData);

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: error.message || '검색 중 오류가 발생했습니다.' });
  }
}
