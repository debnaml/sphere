import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';

export default function SolicitorList() {
  const [bioTop, setBioTop] = useState([]);
  const [newsTop, setNewsTop] = useState([]);
  const [updateTop, setUpdateTop] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [filteredSolicitors, setFilteredSolicitors] = useState([]);

  useEffect(() => {
    loadTopSolicitors();
    loadTeams();
  }, []);

  useEffect(() => {
    if (search || selectedTeam) {
      handleSearchAndFilter();
    } else {
      setFilteredSolicitors([]);
    }
  }, [search, selectedTeam]);

  async function loadTopSolicitors() {
    const [bio, news, updates] = await Promise.all([
      supabase.from('solicitor_popularity_bio_30d').select('*').limit(10),
      supabase.from('solicitor_popularity_news_30d').select('*').limit(10),
      supabase.from('solicitor_popularity_updates_30d').select('*').limit(10),
    ]);

    setBioTop(bio.data || []);
    setNewsTop(news.data || []);
    setUpdateTop(updates.data || []);
  }

  async function loadTeams() {
    const { data } = await supabase.from('s_teams').select('*');
    const sorted = (data || []).sort((a, b) => a.name.localeCompare(b.name));
    setTeams(sorted);
  }

  async function handleSearchAndFilter() {
    let query = supabase
      .from('solicitor_popularity_bio_30d')
      .select('solicitor_id, name, clicks_30d');
  
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
  
    let { data: solicitorData } = await query;
  
    if (selectedTeam && solicitorData) {
      const { data: teamLinks } = await supabase
        .from('s_solicitor_teams')
        .select('solicitor_id')
        .eq('team_id', selectedTeam);
  
      const teamIds = new Set(teamLinks?.map(t => t.solicitor_id));
      solicitorData = solicitorData.filter(s => teamIds.has(s.solicitor_id));
    }
  
    setFilteredSolicitors(solicitorData || []);
  }

  function renderCard(s, index, type) {
    const views = s.clicks_30d ?? 0;
    const solicitorId = s.solicitor_id || s.id;
    
    return (
      <Link
        key={solicitorId}
        href={`/solicitors/${solicitorId}`}
        className="block bg-white shadow p-4 rounded hover:shadow-lg transition"
      >
        <div className="flex gap-3 items-start">
        <div className="text-xl font-bold min-w-[2.5rem] text-right">{index + 1}.</div>
          <div>
            <h2 className="text-lg font-semibold text-blue-700 mb-1">{s.name}</h2>
            <p className="text-sm text-gray-500 mb-1">View profile</p>
            <p className="text-sm text-gray-700">
              <strong>Views:</strong> {views}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Solicitors (last 30 days)</h1>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="border rounded px-3 py-2 w-64"
          />
          <select
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Teams</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredSolicitors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSolicitors.map((s, i) => renderCard(s, i))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-lg font-bold mb-2">Top Bio Views</h2>
            <div className="space-y-4">{bioTop.map((s, i) => renderCard(s, i, 'bio'))}</div>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2">Top Legal Update Views</h2>
            <div className="space-y-4">{updateTop.map((s, i) => renderCard(s, i, 'update'))}</div>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2">Top News Views</h2>
            <div className="space-y-4">{newsTop.map((s, i) => renderCard(s, i, 'news'))}</div>
          </div>
        </div>
      )}
    </div>
  );
}