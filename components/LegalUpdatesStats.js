import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export default function LegalUpdatesStats({ solicitorId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!solicitorId) return;

    const fetchStats = async () => {
        setLoading(true);
      
        const { data, error } = await supabase
          .rpc('get_legal_update_stats', { sid: solicitorId });
      
        if (error) {
          console.error('Supabase RPC error:', error.message, error.details || '', error.hint || '');
        } else {
          setStats(data);
        }
      
        setLoading(false);
      };

    fetchStats();
  }, [solicitorId]);

  if (loading) {
    return <div className="text-gray-500">Loading legal update stats...</div>;
  }

  if (!stats) {
    return <div className="text-red-500">Unable to load stats.</div>;
  }

  return (
    <div className="space-y-4">
      {[12, 6, 3].map((months) => (
        <div
          key={months}
          className="border rounded p-4 bg-gray-50 flex justify-between items-center"
        >
          <div>
            <p className="text-sm text-gray-500">{months} month average</p>
            <p className="font-bold">
              {stats.avg_updates_per_month?.[`${months}_months`] ?? '–'} updates/mo
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Avg views/update</p>
            <p className="font-bold">
              {stats.avg_views_per_month?.[`${months}_months`] ?? '–'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Best day to post</p>
            <p className="font-bold">{stats.best_day_to_post ?? '–'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}