import Anthropic from '@anthropic-ai/sdk';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultHeaders: { 'anthropic-beta': 'web-search-2025-03-05' },
  });

  const systemPrompt = `You are a renewable energy market intelligence analyst.
Compile an updated, comprehensive list of major global renewable energy projects.
Return ONLY valid JSON array with no markdown, no explanation.`;

  const userPrompt = `Search for and compile an updated list of 130+ major global renewable energy projects (offshore wind, solar PV, onshore wind, BESS, hydro, hybrid) that are currently in development, construction, or operation as of 2024-2025.

Include projects from these key markets: United Kingdom, Germany, Netherlands, Denmark, Norway, France, Taiwan, South Korea, Japan, Vietnam, Philippines, Indonesia, Australia, India, UAE, Saudi Arabia, United States, Brazil, Chile, and other significant markets.

Return ONLY a JSON array (no other text) with exactly this structure:
[
  {
    "id": "unique-kebab-id-string",
    "projectName": "Official Project Name",
    "country": "Country name matching one of: South Korea, Japan, China, Taiwan, Australia, Vietnam, Philippines, Indonesia, India, United Kingdom, Germany, France, Spain, Italy, Netherlands, Denmark, Norway, United States, Canada, Brazil, Chile, Mexico, Saudi Arabia, UAE, South Africa, Morocco, Other",
    "businessType": "one of: Offshore Wind, Onshore Wind, Solar PV, BESS, Hydro, Hybrid (Solar+BESS), Hybrid (Wind+BESS), Other",
    "participants": "Company1, Company2, Company3",
    "capacity": "XXX MW or XXX MW / YYY MWh"
  }
]

Include projects with capacity > 50 MW. Focus on projects that have had significant news or activity in 2023-2025.`;

  try {
    const messages = [{ role: 'user', content: userPrompt }];
    let finalText = '';

    for (let i = 0; i < 8; i++) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: systemPrompt,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages,
      });

      const textBlocks = response.content.filter(b => b.type === 'text');
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

      if (textBlocks.length > 0) finalText = textBlocks.map(b => b.text).join('');
      if (response.stop_reason === 'end_turn') break;

      if (response.stop_reason === 'tool_use' && toolUseBlocks.length > 0) {
        messages.push({ role: 'assistant', content: response.content });
        messages.push({
          role: 'user',
          content: toolUseBlocks.map(b => ({
            type: 'tool_result',
            tool_use_id: b.id,
            content: 'Search results retrieved. Please compile the comprehensive updated project list as JSON.',
          })),
        });
      } else {
        break;
      }
    }

    const stripped = finalText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');
    const jsonMatch = stripped.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패: 응답에서 JSON 배열을 찾을 수 없습니다.');

    const projects = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(projects) || projects.length === 0) {
      throw new Error('유효한 프로젝트 목록을 받지 못했습니다.');
    }

    return res.status(200).json({
      projects,
      updatedAt: new Date().toISOString(),
      count: projects.length,
    });

  } catch (error) {
    console.error('Update list error:', error);
    return res.status(500).json({ error: error.message || '데이터 업데이트 중 오류가 발생했습니다.' });
  }
}
