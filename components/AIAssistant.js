import { useState } from 'react';

export default function AIAssistant() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setResponse('');

    const res = await fetch('/api/ai-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: input }),
    });

    const json = await res.json();
    setResponse(json.reply || 'No response');
    setLoading(false);
  }

  return (
    <div className="bg-white p-4 rounded shadow mt-6">
      <h2 className="text-lg font-semibold mb-2">AI Assistant</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          rows={3}
          className="border p-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something like: 'Which teams are underperforming this month?'"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Thinking...' : 'Ask Assistant'}
        </button>
      </form>

      {response && (
        <div className="mt-4 p-3 bg-gray-100 rounded whitespace-pre-wrap text-sm">
          {response}
        </div>
      )}
    </div>
  );
}