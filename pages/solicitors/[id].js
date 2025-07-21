// pages/solicitors/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { ResponsiveCalendar } from '@nivo/calendar';
import { ResponsiveLine } from '@nivo/line';
import MentionsImpactChart from '../../components/MentionsImpactChart';
import SolicitorTabs from '../../components/SolicitorTabs';
import LegalUpdatesStats from '../../components/LegalUpdatesStats';
import PRMentionsPanel from '../../components/PRMentionsPanel';

export default function SolicitorDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [mentions, setMentions] = useState([]);
  const [solicitor, setSolicitor] = useState(null);
  const [stats, setStats] = useState(null);
  const [previousStats, setPreviousStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [period, setPeriod] = useState('30d');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [selectedTab, setSelectedTab] = useState('dashboard');

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const { data: mentionData } = await supabase
        .from('s_mentions')
        .select('published_at, impact_score, sentiment, medium')
        .eq('solicitor_id', id)
        .gte('published_at', oneYearAgo.toISOString())
        .order('published_at', { ascending: true });

      setMentions(mentionData || []);

      const { data: sData } = await supabase
        .from('s_solicitors')
        .select('*')
        .eq('id', id)
        .single();

      const { data: tData } = await supabase
        .from('s_solicitor_teams')
        .select('team_id, s_teams(name)')
        .eq('solicitor_id', id)
        .order('s_teams(name)');

      const { data: statData } = await supabase.rpc('get_solicitor_engagement_stats', {
        sid: id,
        period,
        from_date: fromDate,
        to_date: toDate,
      }).select('*');

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
        .from('s_stats_daily')
        .select('date, clicks')
        .gte('clicks', 1)
        .eq('solicitor_id', id)
        .order('date');

      setSolicitor(sData);
      setTeams(tData?.map(t => ({ id: t.team_id, name: t.s_teams.name })) || []);
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{solicitor.name}</h1>
          <p className="text-gray-500">{solicitor.position}</p>
        </div>
        <img
          src={`/images/solicitors/${solicitor.name.toLowerCase().replace(/\s+/g, '_')}.jpg`}
          alt={solicitor.name}
          className="w-24 h-24 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/images/solicitors/default.jpg';
          }}
        />
      </div>

      <SolicitorTabs
        tabs={[
          { value: 'dashboard', label: 'Dashboard' },
          { value: 'legal', label: 'Legal Updates' },
          { value: 'news', label: 'News' },
          { value: 'pr', label: 'PR' },
        ]}
        activeTab={selectedTab}
        onChange={(tab) => setSelectedTab(tab)}
      />

      {selectedTab === 'dashboard' && (
        <>
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

          <MentionsImpactChart solicitorId={solicitor.id} />

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
        </>
      )}

      {selectedTab === 'legal' && (
        <div className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-semibold mb-4">Legal Updates Performance</h2>
        <LegalUpdatesStats solicitorId={solicitor.id} />
      </div>
      )}
      {selectedTab === 'news' && (
        <div className="bg-white shadow rounded p-4">News content coming soon...</div>
      )}
      {selectedTab === 'pr' && (
         <PRMentionsPanel solicitorId={solicitor.id} />
      )}
    </div>
  );
}