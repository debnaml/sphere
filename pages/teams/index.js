// File: pages/teams/index.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../utils/supabase';

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
    const { data } = await supabase.from('teams').select('*');
    setTeams(data || []);
  }

  async function loadTopTeams() {
    const [bio, news, updates] = await Promise.all([
      supabase.from('team_popularity_bio_30d').select('*').limit(10),
      supabase.from('team_popularity_news_30d').select('*').limit(10),
      supabase.from('team_popularity_updates_30d').select('*').limit(10),
    ]);
    setBioTop(bio.data || []);
    setNewsTop(news.data || []);
    setUpdateTop(updates.data || []);
  }

  const filteredTeams = teams
    .filter(team =>
      (filter === 'all' || team.type === filter) &&
      team.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      if (sortBy === 'popularity') {
        const aClicks = bioTop.find(t => t.team_id === a.id)?.clicks_30d || 0;
        const bClicks = bioTop.find(t => t.team_id === b.id)?.clicks_30d || 0;
        return bClicks - aClicks;
      }
      return 0;
    });

  function renderCard(t, index) {
    return (
      <Link
        key={t.team_id || t.id}
        href={`/teams/${t.team_id || t.id}`}
        className="block bg-white shadow p-4 rounded hover:shadow-lg transition"
      >
        <div className="flex gap-3 items-start">
          <div className="text-xl font-bold w-6">{index + 1}.</div>
          <div>
            <h2 className="text-lg font-semibold text-blue-700 mb-1">{t.name}</h2>
            <p className="text-sm text-gray-500 mb-1">View team page</p>
            <p className="text-sm text-gray-700">
              <strong>Views:</strong> {t.clicks_30d ?? 0}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Teams</h1>

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
