// File: pages/solicitors/index.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';

export default function SolicitorList() {
  const [solicitors, setSolicitors] = useState([]);
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [sort, setSort] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    async function loadSolicitors() {
      const { data } = await supabase.from('solicitors').select('*');
      setSolicitors(data || []);
      setFiltered(data || []);
    }

    async function loadTeams() {
      const { data } = await supabase.from('teams').select('*');
      const sortedTeams = (data || []).sort((a, b) => a.name.localeCompare(b.name));
      setTeams(sortedTeams);
    }

    async function loadStats() {
      const { data } = await supabase
        .from('stats_daily')
        .select('solicitor_id, date, clicks');
      setStats(data || []);
    }

    loadSolicitors();
    loadTeams();
    loadStats();
  }, []);

  useEffect(() => {
    const lower = search.toLowerCase();

    async function filterSolicitors() {
      let filteredList = solicitors.filter(s =>
        s.name.toLowerCase().includes(lower)
      );

      if (selectedTeam) {
        const { data: teamLinks } = await supabase
          .from('solicitor_teams')
          .select('solicitor_id')
          .eq('team_id', selectedTeam);

        const teamIds = new Set(teamLinks?.map(t => t.solicitor_id));
        filteredList = filteredList.filter(s => teamIds.has(s.id));
      }

      if (sort === 'popularity') {
        filteredList = [...filteredList].sort((a, b) => {
          const aClicks = getStatPreview(a.id).count30;
          const bClicks = getStatPreview(b.id).count30;
          return bClicks - aClicks;
        });
      }

      setFiltered(filteredList);
    }

    filterSolicitors();
  }, [search, selectedTeam, sort, solicitors, stats]);

  function getStatPreview(solicitorId) {
    const today = new Date();
    const past7 = new Date(today);
    const past30 = new Date(today);
    past7.setDate(today.getDate() - 7);
    past30.setDate(today.getDate() - 30);

    let count7 = 0;
    let count30 = 0;

    stats.forEach(row => {
      const date = new Date(row.date);
      if (row.solicitor_id === solicitorId) {
        if (date >= past30) count30 += row.clicks;
        if (date >= past7) count7 += row.clicks;
      }
    });

    return { count7, count30 };
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Solicitors</h1>
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
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Sort by</option>
            <option value="popularity">Popularity (30d)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const stats = getStatPreview(s.id);
          return (
            <Link key={s.id} href={`/solicitors/${s.id}`} className="bg-white shadow p-4 rounded hover:shadow-lg transition">
              <h2 className="text-xl font-semibold text-blue-700 mb-1">{s.name}</h2>
              <p className="text-sm text-gray-500 mb-2">View profile</p>
              <div className="text-sm text-gray-700">
                <p><strong>Last 7 days:</strong> {stats.count7}</p>
                <p><strong>Last 30 days:</strong> {stats.count30}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
