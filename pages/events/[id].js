// pages/events/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';

export default function EventStats() {
  const router = useRouter();
  const { id } = router.query;
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    if (id) {
      fetchEventStats(id);
    }
  }, [id]);

  async function fetchEventStats(eventId) {
    const { data: eventData } = await supabase.from('events').select('*').eq('id', eventId).single();
    const { data: links } = await supabase
      .from('event_solicitors')
      .select('solicitor_id, solicitors(name)')
      .eq('event_id', eventId);

    if (!eventData || !links) return;

    const start = eventData.start_date;
    const end = new Date(new Date(eventData.end_date).getTime() + 3 * 86400000).toISOString().split('T')[0];
    const before = new Date(new Date(eventData.start_date).getTime() - 7 * 86400000).toISOString().split('T')[0];

    const solicitorIds = links.map(l => l.solicitor_id);
    const names = Object.fromEntries(links.map(l => [l.solicitor_id, l.solicitors.name]));

    const { data: duringViews } = await supabase
      .from('stats_daily')
      .select('solicitor_id, clicks, date')
      .gte('date', start)
      .lte('date', end)
      .in('solicitor_id', solicitorIds);

    const { data: beforeViews } = await supabase
      .from('stats_daily')
      .select('solicitor_id, clicks, date')
      .gte('date', before)
      .lt('date', start)
      .in('solicitor_id', solicitorIds);

    const result = solicitorIds.map(id => {
      const during = duringViews?.filter(v => v.solicitor_id === id) ?? [];
      const before = beforeViews?.filter(v => v.solicitor_id === id) ?? [];

      const avgDuring = during.length ? during.reduce((s, v) => s + v.clicks, 0) / during.length : 0;
      const avgBefore = before.length ? before.reduce((s, v) => s + v.clicks, 0) / before.length : 0;
      const change = avgBefore === 0 ? '∞' : (((avgDuring - avgBefore) / avgBefore) * 100).toFixed(1);

      return {
        name: names[id],
        avgBefore: avgBefore.toFixed(1),
        avgDuring: avgDuring.toFixed(1),
        percentChange: change,
      };
    });

    setEvent(eventData);
    setStats(result);
  }

  if (!event) return <div className="p-4">Loading event stats...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">{event.title}</h1>
      <p className="mb-4">{event.start_date} → {event.end_date} (+3 days)</p>

      <table className="min-w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">Solicitor</th>
            <th className="p-2">Before Avg</th>
            <th className="p-2">During Avg</th>
            <th className="p-2">% Change</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(s => (
            <tr key={s.name} className="border-t">
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.avgBefore}</td>
              <td className="p-2">{s.avgDuring}</td>
              <td className={`p-2 font-semibold ${s.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {s.percentChange === '∞' ? '∞' : `${s.percentChange}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}