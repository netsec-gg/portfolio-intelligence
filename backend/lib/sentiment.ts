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
