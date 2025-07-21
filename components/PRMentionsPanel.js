import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export default function PRMentionsPanel({ solicitorId }) {
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!solicitorId) return;

    const fetchMentions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_pr_mentions_for_solicitor', { sid: solicitorId });

      if (error) {
        console.error('Error fetching PR mentions:', error);
      } else {
        setMentions(data);
      }
      setLoading(false);
    };

    fetchMentions();
  }, [solicitorId]);

  if (loading) return <div className="text-gray-500">Loading PR mentions…</div>;

  if (!mentions.length) {
    return <div className="text-gray-500">No PR mentions in the past 90 days.</div>;
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mentions.map((m) => (
        <div key={m.id} className="bg-white border-l-8 rounded shadow p-6 space-y-2" style={{
          borderColor: m.sentiment === 'Positive' ? '#22c55e' : '#ef4444'
        }}>
          <div className="text-sm text-gray-500">
            {new Date(m.published_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            })}
            </div>
          <div className="text-xl font-semibold">{m.title}</div>
          <div className="text-sm text-gray-600">{m.source} – {m.medium}</div>

          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-medium text-gray-700">Sentiment:</span>
            <span className={`font-bold ${m.sentiment === 'Positive' ? 'text-green-600' : 'text-red-600'}`}>
              {m.sentiment}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Impact score:</span>
            <span className="font-semibold">{m.impact_score ?? '–'}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Views before:</span>
            <span>{m.prior_90day_avg ?? '–'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Views after:</span>
            <span>{m.post_3day_avg ?? '–'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Uplift:</span>
            <span className={m.uplift > 0 ? 'text-green-600 font-bold' : m.uplift < 0 ? 'text-red-600 font-bold' : 'text-gray-600'}>
              {m.uplift > 0 ? `+${m.uplift}` : m.uplift ?? '–'}
            </span>
          </div>

          {m.url && (
            <a
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-sm text-blue-600 underline"
            >
              View article
            </a>
          )}
        </div>
      ))}
    </div>
  );
}