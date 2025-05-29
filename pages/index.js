// File: pages/index.js
import { useEffect, useState } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveCalendar } from '@nivo/calendar';
import { supabase } from '../utils/supabase';

export default function HomePage() {
  const [lineData, setLineData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [calendarData, setCalendarData] = useState([]);

  useEffect(() => {
    async function loadStats() {
      const { data } = await supabase
        .from('stats_daily')
        .select('date, solicitor_id, clicks')
        .gte('date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('date');

      const { data: solicitors } = await supabase
        .from('solicitors')
        .select('id, name');

      // Line chart: total clicks per day
      const dailyMap = {};
      data.forEach(row => {
        if (!dailyMap[row.date]) dailyMap[row.date] = 0;
        dailyMap[row.date] += row.clicks;
      });
      const line = [{
        id: 'Total Clicks',
        data: Object.entries(dailyMap).map(([date, value]) => ({ x: date, y: value }))
      }];
      setLineData(line);

      // Bar chart: top 10 solicitors by 30-day clicks
      const recentCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentStats = data.filter(row => new Date(row.date) >= recentCutoff);
      const countMap = {};
      recentStats.forEach(row => {
        if (!countMap[row.solicitor_id]) countMap[row.solicitor_id] = 0;
        countMap[row.solicitor_id] += row.clicks;
      });
      const bar = Object.entries(countMap)
        .map(([id, clicks]) => {
          const s = solicitors.find(s => s.id === id);
          return { name: s?.name || id, clicks };
        })
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);
      setBarData(bar);

      // Calendar: total clicks per day (past 1 year)
      const calendar = Object.entries(dailyMap).map(([date, value]) => ({ day: date, value }));
      setCalendarData(calendar);
    }

    loadStats();
  }, []);

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>

      <div style={{ height: 300 }}>
        <h2 className="text-xl font-semibold mb-2">📈 Popularity Trend (Last 30 Days)</h2>
        <ResponsiveLine
          data={lineData}
          margin={{ top: 10, right: 30, bottom: 50, left: 50 }}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
          axisBottom={{ tickRotation: -45 }}
          axisLeft={{ legend: 'Clicks' }}
          curve="monotoneX"
          useMesh={true}
        />
      </div>

      <div style={{ height: 400 }}>
        <h2 className="text-xl font-semibold mb-2">🏆 Top 10 Solicitors (30 Days)</h2>
        <ResponsiveBar
          data={barData}
          keys={['clicks']}
          indexBy="name"
          margin={{ top: 10, right: 20, bottom: 80, left: 60 }}
          padding={0.3}
          layout="vertical"
          axisBottom={{ tickRotation: -45 }}
          axisLeft={{ legend: 'Clicks' }}
          colors={{ scheme: 'nivo' }}
        />
      </div>

      <div style={{ height: 300 }}>
        <h2 className="text-xl font-semibold mb-2">📆 Yearly Traffic Calendar</h2>
        <ResponsiveCalendar
          data={calendarData}
          from={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
          to={new Date().toISOString().slice(0, 10)}
          emptyColor="#eeeeee"
          colors={["#d6e685", "#8cc665", "#44a340", "#1e6823"]}
          margin={{ top: 20, right: 40, bottom: 20, left: 40 }}
          yearSpacing={40}
          monthBorderColor="#ffffff"
          dayBorderWidth={2}
          dayBorderColor="#ffffff"
        />
      </div>
    </div>
  );
}
