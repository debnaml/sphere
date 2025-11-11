import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import { Users, BarChart2, X } from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import AIAssistant from '../components/AIAssistant';
import PageHeading from '../components/PageHeading';

export default function HomePage() {
  const [topSolicitors, setTopSolicitors] = useState([]);
  const [topTeams, setTopTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    async function loadInitialData() {
      const { data: solicitorStats } = await supabase
        .from('solicitor_popularity_bio_30d')
        .select('solicitor_id, name, clicks_30d')
        .order('clicks_30d', { ascending: false })
        .limit(10);

      setTopSolicitors(solicitorStats || []);

      const { data: teamStats } = await supabase
        .from('team_popularity_bio_30d')
        .select('team_id, clicks_30d, s_teams(name)')
        .order('clicks_30d', { ascending: false })
        .limit(10);

      const mappedTopTeams = (teamStats || []).map(t => ({
        id: t.team_id,
        name: t.s_teams?.name || 'Unknown',
        clicks: t.clicks_30d,
      }));

      setTopTeams(mappedTopTeams);

      const { data: allTeamsData } = await supabase
        .from('s_teams')
        .select('id, name')
        .order('name');

      setAllTeams(allTeamsData || []);
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadChartData() {
      if (selectedTeams.length === 0) {
        setChartData([]);
        return;
      }

      const { data } = await supabase.rpc('get_team_solicitor_breakdown', {
        team_ids: selectedTeams.map(t => t.id),
      });

      if (data) {
        const pivot = {};
        data.forEach(({ team_name, solicitor_name, clicks }) => {
          if (!pivot[team_name]) pivot[team_name] = { team_name };
          pivot[team_name][solicitor_name] = clicks;
        });

        setChartData(Object.values(pivot));
      }
    }

    loadChartData();
  }, [selectedTeams]);

  function handleAddTeam(id) {
    const team = allTeams.find(t => t.id === id);
    if (team && selectedTeams.length < 4 && !selectedTeams.find(t => t.id === id)) {
      setSelectedTeams([...selectedTeams, team]);
    }
  }

  function handleRemoveTeam(id) {
    setSelectedTeams(selectedTeams.filter(t => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeading>
        Welcome back, <span className="text-[#331D4C]">Name</span>
      </PageHeading>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 flex flex-col gap-6">
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

        <div className="col-span-1 md:col-span-2 bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Compare Team Bio Views</h2>

          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Add a team</label>
            <select
              onChange={(e) => handleAddTeam(e.target.value)}
              defaultValue=""
              className="border p-2 rounded w-full"
            >
              <option value="" disabled>
                Select team
              </option>
              {allTeams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTeams.map(team => (
              <span
                key={team.id}
                className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full flex items-center gap-1"
              >
                {team.name}
                <button onClick={() => handleRemoveTeam(team.id)}><X size={12} /></button>
              </span>
            ))}
          </div>

          <div className="w-full overflow-x-auto" style={{ height: '500px' }}>
            {chartData.length > 0 ? (
              <ResponsiveBar
                data={chartData}
                keys={
                  Array.from(
                    new Set(
                      chartData.flatMap(d =>
                        Object.keys(d).filter(k => k !== 'team_name')
                      )
                    )
                  )
                }
                indexBy="team_name"
                margin={{ top: 40, right: 130, bottom: 60, left: 60 }}
                padding={0.3}
                groupMode="stacked"
                axisBottom={{ tickRotation: -30 }}
                axisLeft={{ legend: 'Views', legendPosition: 'middle', legendOffset: -40 }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                legends={[]}
                animate
              />
            ) : (
              <div className="text-center text-gray-400 italic">Select up to 4 teams to compare</div>
            )}
          </div>
        </div>
      </div>

      <AIAssistant />
    </div>
  );
}
