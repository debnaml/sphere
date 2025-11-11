// pages/events/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import PageHeading from '../../components/PageHeading';

export default function EventStats() {
  const router = useRouter();
  const { id } = router.query;

  const [event, setEvent] = useState(null);
  const [solicitorRows, setSolicitorRows] = useState([]);
  const [teamRows, setTeamRows] = useState([]);

  useEffect(() => {
    if (!id) return;
    fetchEventStats(id);
  }, [id]);

  async function fetchEventStats(eventId) {
    // 1) Event core
    const { data: eventData, error: eventErr } =
      await supabase.from('events').select('*').eq('id', eventId).single();
    if (eventErr || !eventData) return;

    // Time windows
    const start = eventData.start_date; // YYYY-MM-DD
    const endPlus3 = toYMD(addDays(new Date(eventData.end_date), 3));
    const beforeStartMinus7 = toYMD(addDays(new Date(eventData.start_date), -7));

    // 2) Linked solicitors
    const { data: sLinks } = await supabase
      .from('event_solicitors')
      .select('solicitor_id, s_solicitors(name)')
      .eq('event_id', eventId);

    // 3) Linked teams (event_teams → s_teams)
    const { data: tLinks } = await supabase
      .from('event_teams')
      .select('team_id, s_teams(name)')
      .eq('event_id', eventId);

    setEvent(eventData);

    // ---------- Solicitor stats ----------
    if (sLinks && sLinks.length) {
      const solicitorIds = sLinks.map(l => l.solicitor_id);
      const solicitorNames = Object.fromEntries(
       sLinks.map(l => [l.solicitor_id, l.s_solicitors?.name || 'Unknown'])
      );

      // During (+3)
      const { data: sDuring } = await supabase
        .from('s_stats_daily') // change to 'stats_daily' if that's your table name
        .select('solicitor_id, clicks, date')
        .gte('date', start)
        .lte('date', endPlus3)
        .in('solicitor_id', solicitorIds);

      // Before (-7 to day before start)
      const { data: sBefore } = await supabase
        .from('s_stats_daily') // change to 'stats_daily' if needed
        .select('solicitor_id, clicks, date')
        .gte('date', beforeStartMinus7)
        .lt('date', start)
        .in('solicitor_id', solicitorIds);

      const sRows = solicitorIds.map(sid => {
        const during = (sDuring || []).filter(r => r.solicitor_id === sid);
        const before = (sBefore || []).filter(r => r.solicitor_id === sid);

        const avgDuring = averageClicks(during);
        const avgBefore = averageClicks(before);
        const pct = percentChange(avgBefore, avgDuring);

        return {
          id: sid,
          name: solicitorNames[sid],
          avgBefore: fmt1(avgBefore),
          avgDuring: fmt1(avgDuring),
          percentChange: pct,
        };
      });

      setSolicitorRows(sRows);
    } else {
      setSolicitorRows([]);
    }

    // ---------- Team stats ----------
    if (tLinks && tLinks.length) {
      const teamIds = tLinks.map(l => l.team_id);
      const teamNames = Object.fromEntries(
        tLinks.map(l => [l.team_id, l.s_teams?.name || 'Unknown'])
      );

      // During (+3), only team page views (type='team')
      const { data: tDuring } = await supabase
        .from('s_stats_daily') // change to 'stats_daily' if needed
        .select('team_id, clicks, date')
        .eq('type', 'team')
        .gte('date', start)
        .lte('date', endPlus3)
        .in('team_id', teamIds);

      // Before (-7 to start-1), type='team'
      const { data: tBefore } = await supabase
        .from('s_stats_daily') // change to 'stats_daily' if needed
        .select('team_id, clicks, date')
        .eq('type', 'team')
        .gte('date', beforeStartMinus7)
        .lt('date', start)
        .in('team_id', teamIds);

      const tRows = teamIds.map(tid => {
        const during = (tDuring || []).filter(r => r.team_id === tid);
        const before = (tBefore || []).filter(r => r.team_id === tid);

        const avgDuring = averageClicks(during);
        const avgBefore = averageClicks(before);
        const pct = percentChange(avgBefore, avgDuring);

        return {
          id: tid,
          name: teamNames[tid],
          avgBefore: fmt1(avgBefore),
          avgDuring: fmt1(avgDuring),
          percentChange: pct,
        };
      });

      setTeamRows(tRows);
    } else {
      setTeamRows([]);
    }
  }

  // -------- helpers --------
  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  function toYMD(d) {
    return d.toISOString().slice(0, 10);
  }
  function averageClicks(rows) {
    if (!rows || rows.length === 0) return 0;
    const sum = rows.reduce((s, r) => s + (r.clicks || 0), 0);
    return sum / rows.length;
    // If you prefer *sum per window* instead of daily average, just return `sum`.
  }
  function fmt1(n) {
    return (Math.round(n * 10) / 10).toFixed(1);
  }
  function percentChange(before, during) {
    if (before === 0 && during > 0) return '∞';
    if (before === 0 && during === 0) return '0%';
    const pct = ((during - before) / before) * 100;
    return `${(Math.round(pct * 10) / 10).toFixed(1)}%`;
  }
  function isPositive(pctStr) {
    if (pctStr === '∞') return true;
    const n = parseFloat(pctStr.replace('%', ''));
    return !isNaN(n) && n >= 0;
  }

  if (!event) {
    return (
      <div className="p-4 space-y-2">
        <PageHeading>Loading event...</PageHeading>
        <p className="text-sm text-gray-600">Fetching the latest statistics.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-8">
      <div>
        <PageHeading className="mb-1">{event.title}</PageHeading>
        <p className="text-sm text-gray-600">
          {event.start_date} → {event.end_date} (+3 days)
        </p>
      </div>

      {/* Solicitor table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold">Solicitors</div>
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Solicitor</th>
              <th className="p-2">Before Avg</th>
              <th className="p-2">During Avg</th>
              <th className="p-2">% Change</th>
            </tr>
          </thead>
          <tbody>
            {solicitorRows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.avgBefore}</td>
                <td className="p-2">{r.avgDuring}</td>
                <td className={`p-2 font-semibold ${isPositive(r.percentChange) ? 'text-green-600' : 'text-red-600'}`}>
                  {r.percentChange}
                </td>
              </tr>
            ))}
            {solicitorRows.length === 0 && (
              <tr><td className="p-3 text-gray-500" colSpan={4}>No solicitors linked to this event.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Team table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold">Teams</div>
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Team</th>
              <th className="p-2">Before Avg</th>
              <th className="p-2">During Avg</th>
              <th className="p-2">% Change</th>
            </tr>
          </thead>
          <tbody>
            {teamRows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.name}</td>
                <td className="p-2">{r.avgBefore}</td>
                <td className="p-2">{r.avgDuring}</td>
                <td className={`p-2 font-semibold ${isPositive(r.percentChange) ? 'text-green-600' : 'text-red-600'}`}>
                  {r.percentChange}
                </td>
              </tr>
            ))}
            {teamRows.length === 0 && (
              <tr><td className="p-3 text-gray-500" colSpan={4}>No teams linked to this event.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}