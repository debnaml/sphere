import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export default function EmailTemplate({ solicitorId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!solicitorId) return;

    const fetchStats = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_email_template_stats', { sid: solicitorId });

      if (error) {
        console.error('Supabase RPC error:', error);
      } else {
        setStats(data);
      }
      setLoading(false);
    };

    fetchStats();
  }, [solicitorId]);

  const renderDelta = (current, previous) => {
    const diff = current - previous;
    if (Math.abs(diff) === 0) return null;
    const arrow = diff > 0 ? '↑' : '↓';
    const color = diff > 0 ? 'text-green-600' : 'text-red-600';
    return (
      <span className={`ml-2 ${color}`}>
        {arrow} {Math.abs(diff)}
      </span>
    );
  };

  if (loading) return <div>Loading email stats...</div>;
  if (!stats) return <div className="text-red-500">Unable to load stats.</div>;

  const sections = [
    { key: 'bio', label: 'Bio Views' },
    { key: 'events', label: 'Events Attended' },
    { key: 'updates', label: 'Legal Updates Posted' },
    { key: 'news', label: 'News Items' },
    { key: 'mentions', label: 'Mentions' },
  ];

  return (
    <div className="space-y-4">
      {sections.map(({ key, label }) => (
        <div key={key} className="bg-white shadow rounded p-4 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">{label} (last 30 days)</p>
            <p className="text-xl font-bold">{stats[key].current}</p>
          </div>
          <div className="text-sm text-gray-600">
            Previous: {stats[key].previous}
            {renderDelta(stats[key].current, stats[key].previous)}
          </div>
        </div>
      ))}
    </div>
  );
}