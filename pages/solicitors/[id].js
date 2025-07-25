// pages/solicitors/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import MentionsImpactChart from '../../components/MentionsImpactChart';
import SolicitorTabs from '../../components/SolicitorTabs';
import LegalUpdatesStats from '../../components/LegalUpdatesStats';
import PRMentionsPanel from '../../components/PRMentionsPanel';
import EmailTemplate from '../../components/EmailTemplate';
import EngagementStats from '../../components/EngagementStats';
import DailyClicksCalendar from '../../components/DailyClicksCalendar';
import SolicitorProfileBar from '../../components/SolicitorProfileBar';

export default function SolicitorDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [solicitor, setSolicitor] = useState(null);
  const [teams, setTeams] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);

  // Unified range controls
  const [miRange, setMiRange] = useState(30); // 30 | 60 | 90 | 'custom'
  const [miFrom, setMiFrom] = useState(null);
  const [miTo, setMiTo] = useState(null);

  const [selectedTab, setSelectedTab] = useState('dashboard');

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      const { data: sData } = await supabase
        .from('s_solicitors')
        .select('*')
        .eq('id', id)
        .single();

      const { data: tData } = await supabase
        .from('s_solicitor_teams')
        .select('team_id, s_teams(name)')
        .eq('solicitor_id', id)
        .order('s_teams(name)');

      const { data: dailyData } = await supabase
        .from('s_stats_daily')
        .select('date, clicks')
        .gte('clicks', 1)
        .eq('solicitor_id', id)
        .order('date');

      setSolicitor(sData);
      setTeams(tData?.map((t) => ({ id: t.team_id, name: t.s_teams.name })) || []);
      setDailyStats(dailyData || []);
    }

    loadData();
  }, [id]);

  if (!solicitor) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <SolicitorProfileBar
        name={solicitor.name}
        position={solicitor.position}
      />

      <SolicitorTabs
        tabs={[
          { value: 'dashboard', label: 'Dashboard' },
          { value: 'legal', label: 'Legal Updates' },
          { value: 'news', label: 'News' },
          { value: 'pr', label: 'PR' },
          { value: 'email', label: 'Email' },
        ]}
        activeTab={selectedTab}
        onChange={(tab) => setSelectedTab(tab)}
      />

      {selectedTab === 'dashboard' && (
        <>
          {/* Daily Clicks Calendar */}
          <DailyClicksCalendar dailyStats={dailyStats} />

          {/* Range Picker */}
          <div className="bg-white shadow rounded p-4 w-full">
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium">Data Range:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={miRange}
                onChange={(e) => setMiRange(e.target.value)}
              >
                <option value={30}>Last 30 Days</option>
                <option value={60}>Last 60 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>

              {miRange === 'custom' && (
                <>
                  <input
                    type="date"
                    className="border rounded px-2 py-1 text-sm"
                    value={miFrom || ''}
                    onChange={(e) => setMiFrom(e.target.value)}
                  />
                  <span className="text-sm">to</span>
                  <input
                    type="date"
                    className="border rounded px-2 py-1 text-sm"
                    value={miTo || ''}
                    onChange={(e) => setMiTo(e.target.value)}
                  />
                </>
              )}
            </div>
          </div>

          {/* Engagement Component */}
          <EngagementStats
            solicitorId={solicitor.id}
            range={miRange}
            fromDate={miFrom}
            toDate={miTo}
          />

          {/* Mentions Impact Chart */}
          <MentionsImpactChart
            solicitorId={solicitor.id}
            range={miRange}
            fromDate={miFrom}
            toDate={miTo}
          />

          {teams.length > 0 && (
            <div className="bg-white shadow rounded p-4">
              <h2 className="text-lg font-semibold mb-2">Teams</h2>
              <ul className="divide-y divide-gray-200">
                {teams.map((t, i) => (
                  <li key={i} className="py-2">
                    <a href={`/teams/${t.id}`} className="text-blue-600 hover:underline">
                      {t.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {selectedTab === 'legal' && (
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-xl font-semibold mb-4">Legal Updates Performance</h2>
          <LegalUpdatesStats solicitorId={solicitor.id} />
        </div>
      )}

      {selectedTab === 'news' && (
        <div className="bg-white shadow rounded p-4">News content coming soon...</div>
      )}

      {selectedTab === 'pr' && <PRMentionsPanel solicitorId={solicitor.id} />}
      {selectedTab === 'email' && <EmailTemplate solicitorId={solicitor.id} />}
    </div>
  );
}