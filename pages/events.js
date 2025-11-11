// pages/events.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import EventSlideOverForm from '../components/EventSlideOverForm';
import PageHeading from '../components/PageHeading';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [solicitors, setSolicitors] = useState([]);
  const [teams, setTeams] = useState([]);

  // form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Event'); // free text in DB, dropdown in UI
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSolicitors, setSelectedSolicitors] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEvents();
    loadSolicitors();
    loadTeams();
  }, []);

  async function loadEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });

    if (!error) setEvents(data || []);
  }

  async function loadSolicitors() {
    const { data, error } = await supabase
      .from('s_solicitors')
      .select('id, name')
      .order('name', { ascending: true });

    if (!error) setSolicitors(data || []);
  }

  // NOTE: if your teams table is named s_teams, change 'teams' -> 's_teams' below.
  async function loadTeams() {
    const { data, error } = await supabase
      .from('s_teams')
      .select('id, name')
      .order('name', { ascending: true });

    if (!error) setTeams(data || []);
  }

  function resetForm() {
    setTitle('');
    setType('Event');
    setStartDate('');
    setEndDate('');
    setSelectedSolicitors([]);
    setSelectedTeams([]);
  }

  async function createEvent() {
    if (!title || !startDate) return;
    setSaving(true);

    const { data: inserted, error } = await supabase
      .from('events')
      .insert([{
        title,
        type, // free text column
        start_date: startDate,
        end_date: endDate || startDate,
      }])
      .select()
      .single();

      

    if (!error && inserted) {
      alert('Event created successfully!');
      if (selectedSolicitors.length) {
        const links = selectedSolicitors.map((sid) => ({
          event_id: inserted.id,
          solicitor_id: sid,
        }));
        console.log('event_solicitors → inserting:', links);
        const { error: solicitorLinkError } = await supabase.from('event_solicitors').insert(links);
        
        if (solicitorLinkError) {
          alert(`Failed to link solicitors: ${solicitorLinkError.message}`);
        } else {
          alert(`inserted ${selectedSolicitors.length} solicitors.`);
        }
      }

      if (selectedTeams.length) {
        const tlinks = selectedTeams.map((tid) => ({
          event_id: inserted.id,
          team_id: tid,
        }));
        const { error: teamLinkError } = await supabase.from('event_teams').insert(tlinks);
        
        if (teamLinkError) {
          alert(`Failed to link teams: ${teamLinkError.message}`);
        } else {
          alert(`Linked ${selectedTeams.length} teams.`);
        }
      }
    }

    setSaving(false);
    setShowForm(false);
    resetForm();
    loadEvents();
  }

  // ----- derived lists
  const todayYMD = new Date().toISOString().slice(0, 10);
  const upcomingEvents = (events || []).filter(e => (e.start_date || '') >= todayYMD);
  const pastEvents = (events || [])
    .filter(e => (e.start_date || '') < todayYMD)
    .sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));

  return (
    <div className="relative">
      <PageHeading className="mb-6">Events</PageHeading>

      {/* Upcoming */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Upcoming Events</h2>
          <span className="text-sm text-gray-500">{upcomingEvents.length}</span>
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="text-gray-500">No upcoming events.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingEvents.map(e => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Past Events</h2>
          <span className="text-sm text-gray-500">{pastEvents.length}</span>
        </div>
        {pastEvents.length === 0 ? (
          <p className="text-gray-500">No past events.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pastEvents.map(e => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-600 text-white text-3xl leading-none shadow-lg flex items-center justify-center hover:bg-blue-700"
        aria-label="Add event"
      >
        +
      </button>

      {/* Slide-over Form (component) */}
      <EventSlideOverForm
        showForm={showForm}
        setShowForm={setShowForm}
        resetForm={resetForm}
        title={title}
        setTitle={setTitle}
        type={type}
        setType={setType}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        solicitors={solicitors}
        selectedSolicitors={selectedSolicitors}
        setSelectedSolicitors={setSelectedSolicitors}
        teams={teams}
        selectedTeams={selectedTeams}
        setSelectedTeams={setSelectedTeams}
        createEvent={createEvent}
        saving={saving}
      />
    </div>
  );
}

function EventCard({ event }) {
  const sameDay = !event.end_date || event.end_date === event.start_date;
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{event.title}</h3>
        {event.type && (
          <span className="ml-3 text-xs px-2 py-1 rounded bg-gray-100 border text-gray-600">
            {event.type}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-1">
        {event.start_date}
        {!sameDay ? ` → ${event.end_date}` : ''}
      </p>
      <div className="mt-3">
        <Link href={`/events/${event.id}`} className="text-blue-600 hover:underline">
          View Stats
        </Link>
      </div>
    </div>
  );
}