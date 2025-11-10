import OpenAI from 'openai';

// Hardcoded API key for now
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function scoreSentiment(headlines: string[]) {
  try {
    const prompt = `
You are a financial sentiment analyzer.
Score each headline on a scale from -5 (very negative) to +5 (very positive).
Return JSON: [{ "headline": "...", "score": 3 }, ...].
Headlines:
${headlines.map(h => `- ${h}`).join('\n')}
`;
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0
    });
    return JSON.parse(resp.choices[0].message.content || '[]');
  } catch (error: any) {
    // Handle OpenAI quota errors - return neutral sentiment
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('429')) {
      console.warn('OpenAI quota exceeded, returning neutral sentiment scores');
      return headlines.map(headline => ({ headline, score: 0 }));
    }
    // For other errors, return neutral sentiment
    console.error('Error scoring sentiment:', error);
    return headlines.map(headline => ({ headline, score: 0 }));
  }
}
