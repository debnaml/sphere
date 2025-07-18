// pages/api/ai-assistant.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { prompt } = req.body;
  
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }
  
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4', // Or use 'gpt-3.5-turbo' if needed
          messages: [
            {
              role: 'system',
              content:
                'You are an AI assistant embedded in a law firm marketing dashboard. You help users understand solicitor engagement metrics, team performance, and give tips based on recent data.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.6,
        }),
      });
  
      const json = await response.json();
      const reply = json.choices?.[0]?.message?.content;
  
      res.status(200).json({ reply });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    }
  }