import React from "react";

export default function EventSlideOverForm({
  showForm, setShowForm, resetForm,
  title, setTitle,
  startDate, setStartDate,
  endDate, setEndDate,
  type, setType,                     // NEW
  solicitors, selectedSolicitors, setSelectedSolicitors,
  teams, selectedTeams, setSelectedTeams, // NEW
  createEvent, saving
}) {
  if (!showForm) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={() => { setShowForm(false); resetForm(); }}
      />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[28rem] bg-white z-50 shadow-xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add New Event</h3>
          <button
            onClick={() => { setShowForm(false); resetForm(); }}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {/* Title */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Event title"
              className="block w-full border rounded p-2"
            />
          </div>

          {/* Type (free text in DB; dropdown in UI for convenience) */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="block w-full border rounded p-2"
            >
              <option>Event</option>
              <option>PR Release</option>
              <option>Article</option>
              <option>Webinar</option>
              {/* You can add more options here anytime; DB remains free text */}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="block w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End date (optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="block w-full border rounded p-2"
              />
            </div>
          </div>

          {/* Teams (multi) */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Teams</label>
            <select
              multiple
              value={selectedTeams}
              onChange={e =>
                setSelectedTeams(Array.from(e.target.selectedOptions, o => o.value))
              }
              className="block w-full border rounded p-2 h-40"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
          </div>

          {/* Solicitors (multi) */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Solicitors</label>
            <select
              multiple
              value={selectedSolicitors}
              onChange={e =>
                setSelectedSolicitors(Array.from(e.target.selectedOptions, o => o.value))
              }
              className="block w-full border rounded p-2 h-48"
            >
              {solicitors.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={createEvent}
              disabled={saving || !title || !startDate}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add Event'}
            </button>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="px-3 py-2 rounded border"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}