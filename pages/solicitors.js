// File: pages/solicitors/index.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';

export default function SolicitorList() {
  const [solicitors, setSolicitors] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [sort, setSort] = useState('popularity');

  useEffect(() => {
    loadTopSolicitors();
    loadTeams();
  }, []);

  useEffect(() => {
    if (search || selectedTeam) {
      handleSearchAndFilter();
    } else {
      loadTopSolicitors();
    }
  }, [search, selectedTeam]);

  async function loadTopSolicitors() {
    const { data } = await supabase
      .from('solicitor_popularity_30d')
      .select('solicitor_id, name, clicks_30d')
      .order('clicks_30d', { ascending: false })
      .limit(10);

    setSolicitors(data || []);
  }

  async function loadTeams() {
    const { data } = await supabase.from('teams').select('*');
    const sortedTeams = (data || []).sort((a, b) => a.name.localeCompare(b.name));
    setTeams(sortedTeams);
  }

  async function handleSearchAndFilter() {
    let query = supabase.from('solicitors').select('id, name');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    let { data: solicitorData } = await query;

    if (selectedTeam && solicitorData) {
      const { data: teamLinks } = await supabase
        .from('solicitor_teams')
        .select('solicitor_id')
        .eq('team_id', selectedTeam);

      const teamIds = new Set(teamLinks?.map(t => t.solicitor_id));
      solicitorData = solicitorData.filter(s => teamIds.has(s.id));
    }

    // For each solicitor, get their clicks_30d
    const enriched = await Promise.all(
      solicitorData.map(async (s) => {
        const { data } = await supabase
          .from('solicitor_popularity_30d')
          .select('clicks_30d')
          .eq('solicitor_id', s.id)
          .single();

        return {
          ...s,
          clicks_30d: data?.clicks_30d || 0,
        };
      })
    );

    if (sort === 'popularity') {
      enriched.sort((a, b) => b.clicks_30d - a.clicks_30d);
    }

    setSolicitors(enriched);
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
            <option value="popularity">Popularity (30d)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {solicitors.map(s => (
          <Link key={s.solicitor_id || s.id} href={`/solicitors/${s.solicitor_id || s.id}`} className="bg-white shadow p-4 rounded hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-blue-700 mb-1">{s.name}</h2>
            <p className="text-sm text-gray-500 mb-2">View profile</p>
            <div className="text-sm text-gray-700">
              <p><strong>Views (30d):</strong> {s.clicks_30d ?? 0}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
