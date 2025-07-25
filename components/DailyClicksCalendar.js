import { ResponsiveCalendar } from '@nivo/calendar';
import { startOfYear, endOfYear, format } from 'date-fns';

export default function DailyClicksCalendar({ dailyStats }) {
  if (!dailyStats || dailyStats.length === 0) return null;

  const currentYear = new Date().getFullYear();
  const from = format(startOfYear(new Date()), 'yyyy-MM-dd');
  const to = format(endOfYear(new Date()), 'yyyy-MM-dd');

  // Filter data for the current year only
  const currentYearData = dailyStats
    .filter((row) => row.date >= from && row.date <= to)
    .map((row) => ({
      day: row.date,
      value: row.clicks,
    }));

  if (currentYearData.length === 0) return <p className="text-gray-500">No data for {currentYear}.</p>;

  return (
    <div className="bg-white shadow rounded p-4">
      <h2 className="text-lg font-semibold mb-2">Daily Clicks Calendar</h2>
      <div style={{ height: 200 }}>
        <ResponsiveCalendar
          data={currentYearData}
          from={from}
          to={to}
          emptyColor="#eeeeee"
          colors={['#d6e685', '#8cc665', '#44a340', '#1e6823']}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          yearSpacing={40}
          monthBorderColor="#ffffff"
          dayBorderWidth={2}
          dayBorderColor="#ffffff"
        />
      </div>
    </div>
  );
}