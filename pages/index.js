// File: pages/index.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import { ResponsiveCirclePacking } from '@nivo/circle-packing';
import {
  Users,
  BarChart2,
} from 'lucide-react';

export default function HomePage() {
  const [topSolicitors, setTopSolicitors] = useState([]);
  const [topTeams, setTopTeams] = useState([]);
  const [circleData, setCircleData] = useState(null);

  useEffect(() => {
    async function loadData() {
      const { data: stats } = await supabase
        .from('stats_daily')
        .select('date, solicitor_id, clicks')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: solicitors } = await supabase
        .from('solicitors')
        .select('id, name');

      const { data: solicitorTeams } = await supabase
        .from('solicitor_teams')
        .select('solicitor_id, team_id');

      const { data: teams } = await supabase
        .from('teams')
        .select('id, name');

      const solicitorMap = new Map(solicitors.map(s => [s.id, s.name]));
      const teamMap = new Map(teams.map(t => [t.id, t.name]));
      const teamBySolicitor = new Map();
      solicitorTeams.forEach(({ solicitor_id, team_id }) => {
        if (!teamBySolicitor.has(solicitor_id)) teamBySolicitor.set(solicitor_id, []);
        teamBySolicitor.get(solicitor_id).push(team_id);
      });

      const solicitorClicks = {};
      const teamClicks = {};

      for (const row of stats) {
        const solicitorId = row.solicitor_id;
        if (!solicitorId || !row.clicks) continue;

        if (!solicitorClicks[solicitorId]) solicitorClicks[solicitorId] = 0;
        solicitorClicks[solicitorId] += row.clicks;

        const teamIds = teamBySolicitor.get(solicitorId) || [];
        for (const teamId of teamIds) {
          if (!teamClicks[teamId]) teamClicks[teamId] = 0;
          teamClicks[teamId] += row.clicks;
        }
      }

      const solicitorArray = Object.entries(solicitorClicks)
        .map(([id, clicks]) => ({ id, name: solicitorMap.get(id) || id, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);
      setTopSolicitors(solicitorArray);

      const teamArray = Object.entries(teamClicks)
        .map(([id, clicks]) => ({ id, name: teamMap.get(id) || id, clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);
      setTopTeams(teamArray);

      const packedData = {
        name: 'Teams',
        children: Array.from(teamMap.entries())
          .map(([teamId, teamName]) => {
            const children = solicitors
              .filter(s => (teamBySolicitor.get(s.id) || []).includes(teamId))
              .map(s => ({ name: s.name, value: solicitorClicks[s.id] || 0 }))
              .filter(c => c.value > 0);

            const total = children.reduce((sum, c) => sum + c.value, 0);
            return total > 0 ? { name: teamName, children } : null;
          })
          .filter(Boolean)
      };
      setCircleData(packedData);
    }

    loadData();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column (1/3 width) */}
      <div className="col-span-1 flex flex-col gap-6">
        {/* Top Solicitors */}
        <div className="bg-white p-4 rounded shadow">
          <div className="flex items-center gap-2 mb-2">
            <Users size={20} />
            <h2 className="text-lg font-semibold">Top Solicitors (30 days)</h2>
          </div>
          <ul className="space-y-1">
            {topSolicitors.map((s, i) => (
              <li key={i} className="flex justify-between text-sm">
                <Link href={`/solicitors/${s.id}`} className="text-blue-600 hover:underline">
                  {s.name}
                </Link>
                <span className="font-mono">{s.clicks}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Teams */}
        <div className="bg-white p-4 rounded shadow">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 size={20} />
            <h2 className="text-lg font-semibold">Top Teams (30 days)</h2>
          </div>
          <ul className="space-y-1">
            {topTeams.map((t, i) => (
              <li key={i} className="flex justify-between text-sm">
                <Link href={`/teams/${t.id}`} className="text-blue-600 hover:underline">
                  {t.name}
                </Link>
                <span className="font-mono">{t.clicks}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Column (2/3 width) */}
      <div className="col-span-1 md:col-span-2 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">📦 Views by Team</h2>
        <div className="h-[500px]">
          {circleData && (
            <ResponsiveCirclePacking
              data={circleData}
              id="name"
              value="value"
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              colors={{ scheme: 'nivo' }}
              labelSkipRadius={20}
              label={({ id }) => id}
              tooltip={({ id, value }) => (
                <strong>
                  {id}: {value} views
                </strong>
              )}
              animate={true}
              motionConfig="gentle"
            />
          )}
        </div>
      </div>
    </div>
  );
}