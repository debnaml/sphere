import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import { Users, BarChart2 } from 'lucide-react';

export default function HomePage() {
  const [topSolicitors, setTopSolicitors] = useState([]);
  const [topTeams, setTopTeams] = useState([]);

  useEffect(() => {
    async function loadData() {
      // Load Top Solicitors by bio views
      const { data: solicitorStats } = await supabase
        .from('solicitor_popularity_bio_30d')
        .select('solicitor_id, name, clicks_30d')
        .order('clicks_30d', { ascending: false })
        .limit(10);

      setTopSolicitors(solicitorStats || []);

      // Load Top Teams by direct team page views
      const { data: teamStats } = await supabase
        .from('team_popularity_bio_30d') // Or a new 'team_popularity_page_30d'
        .select('team_id, clicks_30d, s_teams(name)')
        .order('clicks_30d', { ascending: false })
        .limit(10);

      const mappedTeams = (teamStats || []).map(t => ({
        id: t.team_id,
        name: t.s_teams?.name || 'Unknown',
        clicks: t.clicks_30d
      }));

      setTopTeams(mappedTeams);
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

      {/* Right Column (Chart placeholder) */}
      <div className="col-span-1 md:col-span-2 bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Views by Team</h2>
        <div className="w-full h-[500px] flex items-center justify-center text-gray-400 italic">
          (Chart temporarily disabled)
        </div>
      </div>
    </div>
  );
}