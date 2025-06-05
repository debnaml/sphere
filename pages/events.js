// pages/events.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase'; // adjust if your Supabase client is elsewhere

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [solicitors, setSolicitors] = useState([]);
  const [selectedSolicitors, setSelectedSolicitors] = useState([]);

  useEffect(() => {
    loadEvents();
    loadSolicitors();
  }, []);

  async function loadEvents() {
    const { data } = await supabase.from('events').select('*');
    setEvents(data || []);
  }

  async function loadSolicitors() {
    const { data } = await supabase.from('solicitors').select('id, name');
    setSolicitors(data || []);
  }

  async function createEvent() {
    const { data, error } = await supabase
      .from('events')
      .insert([{ title, start_date: startDate, end_date: endDate }])
      .select()
      .single();

    if (data && selectedSolicitors.length) {
      const links = selectedSolicitors.map((sid) => ({
        event_id: data.id,
        solicitor_id: sid,
      }));
      await supabase.from('event_solicitors').insert(links);
    }

    setTitle('');
    setStartDate('');
    setEndDate('');
    setSelectedSolicitors([]);
    loadEvents();
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Events</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">Add New Event</h2>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="mb-2 block w-full border p-2" />
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mb-2 block w-full border p-2" />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mb-2 block w-full border p-2" />
        <select multiple value={selectedSolicitors} onChange={e => setSelectedSolicitors([...e.target.selectedOptions].map(o => o.value))} className="mb-2 block w-full border p-2 h-40">
          {solicitors.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button onClick={createEvent} className="bg-blue-600 text-white px-4 py-2 rounded">Add Event</button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Past Events</h2>
        {events.map(e => (
          <div key={e.id} className="mb-4 p-4 bg-white shadow rounded">
            <h3 className="font-bold">{e.title}</h3>
            <p>{e.start_date} → {e.end_date}</p>
            <Link href={`/events/${e.id}`}>
  <span className="text-blue-600 hover:underline cursor-pointer">View Stats</span>
</Link>
            {/* You'll render % traffic change here later */}
          </div>
        ))}
      </div>
    </div>
  );
}