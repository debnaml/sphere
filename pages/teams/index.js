import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../utils/supabase';
import PageHeading from '../../components/PageHeading';

export default function TeamList() {
  const [teams, setTeams] = useState([]);
  const [bioTop, setBioTop] = useState([]);
  const [newsTop, setNewsTop] = useState([]);
  const [updateTop, setUpdateTop] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTeams();
    loadTopTeams();
  }, []);

  async function loadTeams() {
    const [teamsRes, bioRes, newsRes, updateRes] = await Promise.all([
      supabase.from('s_teams').select('*'),
      supabase.from('team_popularity_bio_30d').select('team_id, clicks_30d'),
      supabase.from('team_popularity_news_30d').select('team_id, clicks_30d'),
      supabase.from('team_popularity_updates_30d').select('team_id, clicks_30d'),
    ]);
  
    const bioMap = Object.fromEntries((bioRes.data || []).map(row => [row.team_id, row.clicks_30d]));
    const newsMap = Object.fromEntries((newsRes.data || []).map(row => [row.team_id, row.clicks_30d]));
    const updatesMap = Object.fromEntries((updateRes.data || []).map(row => [row.team_id, row.clicks_30d]));
  
    const enriched = (teamsRes.data || []).map(team => {
      const clicks_bio = bioMap[team.id] || 0;
      const clicks_news = newsMap[team.id] || 0;
      const clicks_updates = updatesMap[team.id] || 0;
      return {
        ...team,
        clicks_bio,
        clicks_news,
        clicks_updates,
        clicks_30d: clicks_bio,
      };
    });
  
    setTeams(enriched);
  }

  async function loadTopTeams() {
    const [bio, news, updates] = await Promise.all([
      supabase
        .from('team_popularity_bio_30d')
        .select('team_id, clicks_30d, s_teams(name)')
        .order('clicks_30d', { ascending: false })
        .limit(10),
      supabase
        .from('team_popularity_news_30d')
        .select('team_id, clicks_30d, s_teams(name)')
        .order('clicks_30d', { ascending: false })
        .limit(10),
      supabase
        .from('team_popularity_updates_30d')
        .select('team_id, clicks_30d, s_teams(name)')
        .order('clicks_30d', { ascending: false })
        .limit(10),
    ]);

    setBioTop(bio.data?.map(row => ({
      ...row,
      name: row.s_teams?.name || 'Unknown',
    })) || []);

    setNewsTop(news.data?.map(row => ({
      ...row,
      name: row.s_teams?.name || 'Unknown',
    })) || []);

    setUpdateTop(updates.data?.map(row => ({
      ...row,
      name: row.s_teams?.name || 'Unknown',
    })) || []);
  }

  const filteredTeams = teams
    .filter(team =>
      (filter === 'all' || team.type === filter) &&
      team.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      if (sortBy === 'popularity') {
        const aClicks = a.clicks_30d || 0;
        const bClicks = b.clicks_30d || 0;
        return bClicks - aClicks;
      }
      return 0;
    });

  function renderCard(t, index) {
    const views = t.clicks_30d ?? 0;
    const teamId = t.id || t.team_id;

    return (
      <Link
        key={teamId}
        href={`/teams/${teamId}`}
        className="block bg-white shadow p-4 rounded hover:shadow-lg transition"
      >
        <div className="flex gap-3 items-start">
          <div className="text-xl font-bold w-6">{index + 1}.</div>
          <div>
            <h2 className="text-lg font-semibold text-blue-700 mb-1">{t.name}</h2>
            <p className="text-sm text-gray-500 mb-1">View team page</p>
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
      <PageHeading>Teams (last 30 days)</PageHeading>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by team name..."
          className="border rounded px-3 py-2 w-64"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="alphabetical">Sort by A-Z</option>
          <option value="popularity">Sort by Popularity</option>
        </select>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">All Types</option>
          <option value="service">Services</option>
          <option value="sector">Sectors</option>
        </select>
      </div>

      {search || filter !== 'all' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((t, i) => renderCard(t, i))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-lg font-bold mb-2">Top Bio Views</h2>
            <div className="space-y-4">{bioTop.map((t, i) => renderCard(t, i))}</div>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2">Top Legal Update Views</h2>
            <div className="space-y-4">{updateTop.map((t, i) => renderCard(t, i))}</div>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2">Top News Views</h2>
            <div className="space-y-4">{newsTop.map((t, i) => renderCard(t, i))}</div>
          </div>
        </div>
      )}
    </div>
  );
}