// File: pages/index.js
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import { CirclePacking } from '@nivo/circle-packing';
import { Users, BarChart2 } from 'lucide-react';

export default function HomePage() {
  const [topSolicitors, setTopSolicitors] = useState([]);
  const [topTeams, setTopTeams] = useState([]);
  const [circleData, setCircleData] = useState(null);
  const chartRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });

  useEffect(() => {
    function handleResize() {
      if (chartRef.current) {
        setDimensions({
          width: chartRef.current.offsetWidth,
          height: 500,
        });
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function loadData() {
      const { data: solicitorStats } = await supabase
        .from('solicitor_popularity_bio_30d')
        .select('solicitor_id, name, clicks_30d');

      const { data: teamLinks } = await supabase
        .from('solicitor_teams')
        .select('solicitor_id, team_id');

      const { data: teams } = await supabase
        .from('teams')
        .select('id, name');

      if (!solicitorStats || !teamLinks || !teams) return;

      const solicitorMap = new Map(solicitorStats.map(s => [s.solicitor_id, s]));
      const teamMap = new Map(teams.map(t => [t.id, t.name]));

      const teamToSolicitors = new Map();
      teamLinks.forEach(({ solicitor_id, team_id }) => {
        if (!teamToSolicitors.has(team_id)) teamToSolicitors.set(team_id, []);
        teamToSolicitors.get(team_id).push(solicitor_id);
      });

      const topSolicitorList = solicitorStats
        .filter(s => s.clicks_30d > 0)
        .sort((a, b) => b.clicks_30d - a.clicks_30d)
        .slice(0, 10);
      setTopSolicitors(topSolicitorList);

      const teamClicks = {};
      for (const [teamId, solicitorIds] of teamToSolicitors.entries()) {
        teamClicks[teamId] = solicitorIds.reduce((sum, sid) => {
          const s = solicitorMap.get(sid);
          return sum + (s?.clicks_30d || 0);
        }, 0);
      }

      const topTeamList = Object.entries(teamClicks)
        .map(([id, clicks]) => ({
          id,
          name: teamMap.get(id) || id,
          clicks
        }))
        .filter(t => t.clicks > 0)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);
      setTopTeams(topTeamList);

      const packedData = {
        name: 'Teams',
        children: Array.from(teamToSolicitors.entries()).map(([teamId, solicitorIds]) => {
          const children = solicitorIds
            .map(sid => solicitorMap.get(sid))
            .filter(s => s && s.clicks_30d > 0)
            .map(s => ({
              name: s.name,
              value: s.clicks_30d,
            }));
          const total = children.reduce((sum, c) => sum + c.value, 0);
          return total > 0 ? { name: teamMap.get(teamId) || teamId, children } : null;
        }).filter(Boolean),
      };

      setCircleData(packedData);
    }

    loadData();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left Column */}
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
                <Link href={`/solicitors/${s.solicitor_id}`} className="text-blue-600 hover:underline">
                  <strong>{i + 1}.</strong> {s.name}
                </Link>
                <span className="font-mono">{s.clicks_30d}</span>
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
                  <strong>{i + 1}.</strong> {t.name}
                </Link>
                <span className="font-mono">{t.clicks}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Column: Chart */}
      <div className="col-span-1 md:col-span-2 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Views by Team</h2>
        <div ref={chartRef} className="w-full h-[500px]">
          {circleData && (
            <CirclePacking
              data={circleData}
              id="name"
              value="value"
              width={dimensions.width}
              height={dimensions.height}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              colors={node =>
                node.depth === 1 ? '#237781' :
                node.depth === 2 ? '#331D4C' :
                '#F5F4F6'
              }
              labelSkipRadius={20}
              labelTextColor={node =>
                node.depth >= 1 ? '#FFFFFF' : '#000000'
              }
              borderColor="#FFFFFF"
              borderWidth={1}
              tooltip={({ id, value }) => (
                <div className="bg-white text-black text-sm p-2 rounded shadow border border-gray-300">
                  <strong>{id}</strong><br />
                  {value} views
                </div>
              )}
              animate={true}
              motionConfig="gentle"
              zoom={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}