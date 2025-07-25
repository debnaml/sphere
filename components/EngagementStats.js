import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const isValidDateString = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const toYMD = (d) =>
  d instanceof Date
    ? d.toISOString().slice(0, 10)
    : isValidDateString(d)
    ? d
    : null;

function calcRange(range, fromDate, toDate) {
  const today = new Date();

  // CUSTOM
  if (range === 'custom') {
    const fromStr = toYMD(fromDate);
    const toStr = toYMD(toDate);
    if (!fromStr || !toStr) {
      // not ready yet (user hasn't picked both dates)
      return { ready: false };
    }

    const from = new Date(fromStr);
    const to = new Date(toStr);
    const lengthDays =
      Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

    return {
      ready: true,
      currentFrom: fromStr,
      currentTo: toStr,
      lengthDays,
    };
  }

  // NUMERIC DAYS (30, 60, 90)
  const days = Number(range);
  const end = today;
  const start = new Date(end);
  start.setDate(start.getDate() - (isNaN(days) ? 30 : days) + 1);

  return {
    ready: true,
    currentFrom: toYMD(start),
    currentTo: toYMD(end),
    lengthDays: isNaN(days) ? 30 : days,
  };
}

export default function EngagementStats({ solicitorId, range, fromDate, toDate }) {
  const [stats, setStats] = useState(null);
  const [previousStats, setPreviousStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!solicitorId) return;

    async function loadStats() {
      const { ready, currentFrom, currentTo, lengthDays } = calcRange(
        range,
        fromDate,
        toDate
      );

      if (!ready) {
        // Custom selected but dates not chosen yet
        setStats(null);
        setPreviousStats(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      // ---- current period
      const { data: current, error: currentError } = await supabase.rpc(
        'get_solicitor_engagement_range', // <-- your new function name
        {
          sid: solicitorId,
          from_date: currentFrom,
          to_date: currentTo,
        }
      );

      if (currentError) {
        console.error('Error fetching current stats:', currentError);
        setStats(null);
      } else {
        setStats(
          current?.[0] || { bio_clicks: 0, update_clicks: 0, news_clicks: 0 }
        );
      }

      // ---- previous equal-length period
      const prevToDate = new Date(currentFrom);
      prevToDate.setDate(prevToDate.getDate() - 1);
      const prevFromDate = new Date(prevToDate);
      prevFromDate.setDate(prevFromDate.getDate() - (lengthDays - 1));

      const prevFromStr = toYMD(prevFromDate);
      const prevToStr = toYMD(prevToDate);

      const { data: previous, error: prevError } = await supabase.rpc(
        'get_solicitor_engagement_range',
        {
          sid: solicitorId,
          from_date: prevFromStr,
          to_date: prevToStr,
        }
      );

      if (prevError) {
        console.error('Error fetching previous stats:', prevError);
        setPreviousStats(null);
      } else {
        setPreviousStats(
          previous?.[0] || { bio_clicks: 0, update_clicks: 0, news_clicks: 0 }
        );
      }

      setLoading(false);
    }

    loadStats();
  }, [solicitorId, range, fromDate, toDate]);

  const renderDelta = (current, previous) => {
    if (previous == null || current == null) return null;
    const diff = current - previous;
    if (diff === 0) return null;
    const up = diff > 0;
    const color = up ? 'text-green-600' : 'text-red-600';
    const arrow = up ? '↑' : '↓';
    return (
      <span className={`ml-1 text-sm ${color}`}>
        {arrow} {Math.abs(diff)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded p-4 w-full">
        <h2 className="text-lg font-semibold mb-4">Engagement</h2>
        <div className="text-gray-500">Loading…</div>
      </div>
    );
  }

  // If custom not ready yet
  if (!stats) {
    return (
      <div className="bg-white shadow rounded p-4 w-full">
        <h2 className="text-lg font-semibold mb-4">Engagement</h2>
        {range === 'custom' ? (
          <div className="text-gray-500">
            Pick a **from** and **to** date to see stats.
          </div>
        ) : (
          <div className="text-gray-500">No data.</div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded p-4 w-full">
      <h2 className="text-lg font-semibold mb-4">Engagement</h2>

      <div className="flex gap-4">
        <div className="bg-gray-50 border rounded p-4 w-48">
          <p className="text-sm text-gray-500">Bio Views</p>
          <p className="text-xl font-bold">
            {stats?.bio_clicks ?? 0}
            {renderDelta(stats?.bio_clicks, previousStats?.bio_clicks)}
          </p>
        </div>

        <div className="bg-gray-50 border rounded p-4 w-48">
          <p className="text-sm text-gray-500">Legal Update Views</p>
          <p className="text-xl font-bold">
            {stats?.update_clicks ?? 0}
            {renderDelta(stats?.update_clicks, previousStats?.update_clicks)}
          </p>
        </div>

        <div className="bg-gray-50 border rounded p-4 w-48">
          <p className="text-sm text-gray-500">News Views</p>
          <p className="text-xl font-bold">
            {stats?.news_clicks ?? 0}
            {renderDelta(stats?.news_clicks, previousStats?.news_clicks)}
          </p>
        </div>
      </div>
    </div>
  );
}