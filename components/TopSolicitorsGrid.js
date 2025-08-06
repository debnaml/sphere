import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export default function TopSolicitorsGrid({ teamId }) {
  const [topBio, setTopBio] = useState([]);
  const [topUpdates, setTopUpdates] = useState([]);
  const [topNews, setTopNews] = useState([]);

  useEffect(() => {
    if (!teamId) return;

    async function loadTopSolicitors() {
      const [{ data: bio }, { data: updates }, { data: news }] = await Promise.all([
        supabase.rpc('top_team_solicitors_by_bio_views', { teamid: teamId }),
        supabase.rpc('top_team_solicitors_by_update_views', { teamid: teamId }),
        supabase.rpc('top_team_solicitors_by_news_views', { teamid: teamId }),
      ]);

      setTopBio(bio || []);
      setTopUpdates(updates || []);
      setTopNews(news || []);
    }

    loadTopSolicitors();
  }, [teamId]);

  const renderList = (label, list) => (
    <div>
      <h2 className="text-lg font-semibold mb-2">{label}</h2>
      <ul className="divide-y divide-gray-200">
        {list.map((s, i) => (
          <li key={s.solicitor_id} className="py-3">
            <a
              href={`/solicitors/${s.solicitor_id}`}
              className="flex justify-between hover:underline text-blue-600"
            >
              <span>{i + 1}. {s.name}</span>
              <span className="text-sm text-gray-500">{s.clicks} views</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="bg-white shadow rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      {renderList('Top 3 by Bio Views', topBio)}
      {renderList('Top 3 by Legal Update Views', topUpdates)}
      {renderList('Top 3 by News Views', topNews)}
    </div>
  );
}