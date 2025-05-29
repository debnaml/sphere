// File: pages/solicitors/[id].js
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
  const [teams, setTeams] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [teamStats, setTeamStats] = useState([]);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      const { data: sData } = await supabase.from('solicitors').select('*').eq('id', id).single();
      const { data: tData } = await supabase
        .from('solicitor_teams')
        .select('team_id, teams(name)')
        .eq('solicitor_id', id);
      const { data: statData } = await supabase.rpc('get_solicitor_stats', { sid: id }).select('*');
      const { data: dailyData } = await supabase
        .from('stats_daily')
        .select('date, clicks')
        .eq('solicitor_id', id)
        .order('date');
      const { data: teamStatsData } = await supabase
        .rpc('get_team_stats_for_solicitor', { sid: id })
        .select('*');

      setSolicitor(sData);
      setTeams(tData?.map(t => ({ id: t.team_id, name: t.teams.name })) || []);      
      setStats(statData?.[0]);
      setDailyStats(dailyData || []);
      setTeamStats(teamStatsData || []);
    }

    loadData();
  }, [id]);

  const calendarData = dailyStats.map((row) => ({
    day: row.date,
    value: row.clicks,
  }));

  const lineData = [
    {
      id: 'Clicks',
      data: dailyStats.map(row => ({
        x: row.date,
        y: row.clicks,
      })),
    },
  ];

  if (!solicitor) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{solicitor.name}</h1>
          <p className="text-gray-500">[Job title here]</p>
        </div>
        <div className="w-24 h-24 bg-gray-300 rounded-full" />
      </div>

      <div className="flex gap-4">
        <div className="bg-white shadow rounded p-4 w-48">
          <p className="text-sm text-gray-500">Today</p>
          <p className="text-xl font-bold">{stats?.clicks_today ?? 0}</p>
        </div>
        <div className="bg-white shadow rounded p-4 w-48">
          <p className="text-sm text-gray-500">Last 7 Days</p>
          <p className="text-xl font-bold">{stats?.clicks_7d ?? 0}</p>
        </div>
        <div className="bg-white shadow rounded p-4 w-48">
          <p className="text-sm text-gray-500">Last 30 Days</p>
          <p className="text-xl font-bold">{stats?.clicks_30d ?? 0}</p>
        </div>
      </div>

      {calendarData.length > 0 && (
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Daily Clicks Calendar</h2>
          <div style={{ height: 200 }}>
            <ResponsiveCalendar
              data={calendarData}
              from={calendarData[0].day}
              to={calendarData[calendarData.length - 1].day}
              emptyColor="#eeeeee"
              colors={['#d6e685', '#8cc665', '#44a340', '#1e6823']}
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
          <h2 className="text-lg font-semibold mb-2">Popularity Trend (Last 30 Days)</h2>
          <div style={{ height: 300 }}>
            <ResponsiveLine
              data={lineData}
              margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 0, max: 'auto', stacked: false, reverse: false }}
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

      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Teams</h2>
        <ul className="list-disc list-inside text-gray-700">
          {teams.map((t, i) => (
            <li key={i}>
              <a href={`/teams/${t.id}`} className="text-blue-600 hover:underline">
                {t.name}
              </a>
            </li>
          ))}
        </ul>
        
      </div>

      {teamStats.length > 0 && (
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Team Clicks (Last 30 Days)</h2>
          <ul className="divide-y divide-gray-200">
            {teamStats.map((t, i) => (
              <li key={i} className="flex justify-between py-2">
                <span className="text-gray-700">{t.team_name}</span>
                <span className="font-bold">{t.total_clicks}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
