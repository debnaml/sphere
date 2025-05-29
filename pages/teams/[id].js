// File: pages/teams/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { ResponsiveCalendar } from '@nivo/calendar';
import { ResponsiveLine } from '@nivo/line';

export default function TeamDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [team, setTeam] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      const { data: tData } = await supabase.from('teams').select('*').eq('id', id).single();

      // Use RPC instead of manual join to ensure accuracy
      const { data: calendarRaw } = await supabase.rpc('team_clicks_calendar', { teamid: id });

      const formattedStats = (calendarRaw || []).map(row => ({
        date: row.date,
        clicks: row.clicks
      }));

      setTeam(tData);
      setDailyStats(formattedStats);
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

  if (!team) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-gray-500">[Team Type: {team.type}]</p>
        </div>
        <div className="w-24 h-24 bg-gray-200 rounded-full" />
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
    </div>
  );
}