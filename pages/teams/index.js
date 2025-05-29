// File: pages/teams/index.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../utils/supabase';

export default function TeamList() {
  const [teams, setTeams] = useState([]);
  const [clicks, setClicks] = useState({});
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadTeams() {
      const { data } = await supabase.from('teams').select('*');
      setTeams(data || []);
    }

    async function loadStats() {
      const { data, error } = await supabase.rpc('team_clicks_last_30_days');
      if (error) console.error('Error loading team clicks:', error);

      const map = {};
      (data || []).forEach(row => {
        map[row.team_id] = row.total_clicks;
      });
      setClicks(map);
    }

    loadTeams();
    loadStats();
  }, []);

  const filteredTeams = teams
    .filter(team =>
      (filter === 'all' || team.type === filter) &&
      team.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'popularity') {
        return (clicks[b.id] || 0) - (clicks[a.id] || 0);
      }
      return 0;
    });

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map(team => (
          <Link key={team.id} href={`/teams/${team.id}`} className="bg-white shadow p-4 rounded hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-blue-700 mb-1">{team.name}</h2>
            <p className="text-sm text-gray-500">
              Clicks (30d): {clicks[team.id] ?? '-'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Type: {team.type}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}