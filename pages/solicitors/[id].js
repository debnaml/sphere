// Update for pages/solicitors/[id].js
// Adds trend comparisons for last 30 days only.

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { ResponsiveCalendar } from '@nivo/calendar';
import { ResponsiveLine } from '@nivo/line';

export default function SolicitorDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [solicitor, setSolicitor] = useState(null);
  const [stats, setStats] = useState(null);
  const [previousStats, setPreviousStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [teamStats, setTeamStats] = useState([]);
  const [period, setPeriod] = useState('30d');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      const { data: sData } = await supabase.from('solicitors').select('*').eq('id', id).single();
      const { data: tData } = await supabase
        .from('solicitor_teams')
        .select('team_id, teams(name)')
        .eq('solicitor_id', id)
        .order('teams(name)');

      const { data: statData } = await supabase.rpc('get_solicitor_engagement_stats', {
        sid: id,
        period,
        from_date: fromDate,
        to_date: toDate,
      }).select('*');

      // Load previous 30-day stats for comparison (only if current period is 30d)
      let prevStatData = null;
      if (period === '30d') {
        const prevStart = new Date();
        prevStart.setDate(prevStart.getDate() - 60);
        const prevEnd = new Date();
        prevEnd.setDate(prevEnd.getDate() - 30);

        const { data: prevStats } = await supabase.rpc('get_solicitor_engagement_stats', {
          sid: id,
          period: 'custom',
          from_date: prevStart.toISOString().slice(0, 10),
          to_date: prevEnd.toISOString().slice(0, 10),
        }).select('*');

        prevStatData = prevStats?.[0];
      }

      const { data: dailyData } = await supabase
        .from('stats_daily')
        .select('date, clicks')
        .gte('clicks', 1)
        .eq('solicitor_id', id)
        .order('date');

      setSolicitor(sData);
      setTeams(tData?.map(t => ({ id: t.team_id, name: t.teams.name })) || []);
      setStats(statData?.[0]);
      setPreviousStats(prevStatData);
      setDailyStats(dailyData || []);
    }

    loadData();
  }, [id, period, fromDate, toDate]);

  const renderDelta = (current, previous) => {
    if (previous == null || current == null) return null;
    const diff = current - previous;
    const up = diff > 0;
    const color = up ? 'text-green-600' : 'text-red-600';
    const arrow = up ? '↑' : '↓';
    return <span className={`ml-1 text-sm ${color}`}>{arrow} {Math.abs(diff)}</span>;
  };

  const calendarData = dailyStats.map((row) => ({
    day: row.date,
    value: row.clicks,
  }));

  const lineData = [
    {
      id: 'Clicks',
      data: dailyStats.map(row => ({ x: row.date, y: row.clicks })),
    },
  ];

  if (!solicitor) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{solicitor.name}</h1>
          <p className="text-gray-500">[Job title here]</p>
        </div>
        <div className="w-24 h-24 bg-gray-300 rounded-full" />
      </div>

      {/* Stats Summary */}
      <div className="bg-white shadow rounded p-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Engagement</h2>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="ytd">Year to Date</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <div className="flex gap-4">
          <div className="bg-gray-50 border rounded p-4 w-48">
            <p className="text-sm text-gray-500">Bio Views</p>
            <p className="text-xl font-bold">
              {stats?.bio_clicks ?? 0}
              {period === '30d' && renderDelta(stats?.bio_clicks, previousStats?.bio_clicks)}
            </p>
          </div>
          <div className="bg-gray-50 border rounded p-4 w-48">
            <p className="text-sm text-gray-500">Legal Update Views</p>
            <p className="text-xl font-bold">
              {stats?.update_clicks ?? 0}
              {period === '30d' && renderDelta(stats?.update_clicks, previousStats?.update_clicks)}
            </p>
          </div>
          <div className="bg-gray-50 border rounded p-4 w-48">
            <p className="text-sm text-gray-500">News Views</p>
            <p className="text-xl font-bold">
              {stats?.news_clicks ?? 0}
              {period === '30d' && renderDelta(stats?.news_clicks, previousStats?.news_clicks)}
            </p>
          </div>
        </div>

        {period === 'custom' && (
          <div className="mt-4 flex gap-2">
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              onChange={(e) => setFromDate(e.target.value)}
            />
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Calendar + Charts */}
      {/* (No changes here) */}

      {calendarData.length > 0 && (
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Daily Clicks Calendar</h2>
          <div style={{ height: 200 }}>
            <ResponsiveCalendar
              data={calendarData}
              from={calendarData[0].day}
              to={calendarData[calendarData.length - 1].day}
              emptyColor="#eeeeee"
              colors={["#d6e685", "#8cc665", "#44a340", "#1e6823"]}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              yearSpacing={40}
              monthBorderColor="#ffffff"
              dayBorderWidth={2}
              dayBorderColor="#ffffff"
            />
          </div>
        </div>
      )}

      {lineData[0].data.length > 0 && (
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Popularity Trend</h2>
          <div style={{ height: 300 }}>
            <ResponsiveLine
              data={lineData}
              margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false }}
              axisBottom={{
                orient: 'bottom',
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: 'Date',
                legendOffset: 36,
                legendPosition: 'middle',
              }}
              axisLeft={{
                orient: 'left',
                tickSize: 5,
                tickPadding: 5,
                legend: 'Clicks',
                legendOffset: -40,
                legendPosition: 'middle',
              }}
              colors={{ scheme: 'category10' }}
              pointSize={6}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              useMesh={true}
            />
          </div>
        </div>
      )}

      {teams.length > 0 && (
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Teams</h2>
          <ul className="divide-y divide-gray-200">
            {teams.map((t, i) => (
              <li key={i} className="py-2">
                <a href={`/teams/${t.id}`} className="text-blue-600 hover:underline">
                  {t.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
