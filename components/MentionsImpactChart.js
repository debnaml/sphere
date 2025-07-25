// components/MentionsImpactChart.js
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  format,
  eachDayOfInterval,
  subDays,
  parseISO,
  isValid,
  startOfDay,
} from 'date-fns';

export default function MentionsImpactChart({
  solicitorId,
  range = 90,           // 30 | 60 | 90 | 'custom'
  fromDate = null,      // yyyy-mm-dd (only used when range === 'custom')
  toDate = null,        // yyyy-mm-dd (only used when range === 'custom')
}) {
  const [chartData, setChartData] = useState([]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const impact = payload.find((p) => p.dataKey === 'impact_score');
      const views = payload.find((p) => p.dataKey === 'bio_views');

      return (
        <div className="bg-white border border-gray-300 p-2 rounded shadow text-sm max-w-xs">
          <div className="font-semibold">{label}</div>
          {impact && impact.payload.impact_score != null && (
            <>
              <div><strong>Impact Score:</strong> {impact.payload.impact_score}</div>
              {impact.payload.title && (
                <div><strong>Title:</strong> {impact.payload.title}</div>
              )}
              {impact.payload.source && (
                <div><strong>Source:</strong> {impact.payload.source}</div>
              )}
              {impact.payload.sentiment != null && (
                <div><strong>Sentiment:</strong> {impact.payload.sentiment}</div>
              )}
            </>
          )}
          {views && (
            <div><strong>Bio Views:</strong> {views.payload.bio_views}</div>
          )}
        </div>
      );
    }

    return null;
  };

  useEffect(() => {
    if (!solicitorId) return;

    async function loadData() {
      const today = startOfDay(new Date());

      let startDate;
      let endDate;

      if (range === 'custom' && fromDate && toDate) {
        startDate = startOfDay(parseISO(fromDate));
        endDate = startOfDay(parseISO(toDate));
      } else {
        const numericRange = Number(range) || 90;
        startDate = subDays(today, numericRange);
        endDate = today;
      }

      // Guard against invalid dates
      if (!isValid(startDate) || !isValid(endDate)) {
        setChartData([]);
        return;
      }

      // Build all dates in the interval for a continuous X axis
      const allDates = eachDayOfInterval({ start: startDate, end: endDate }).map((d) =>
        format(d, 'yyyy-MM-dd')
      );

      const [{ data: mentions }, { data: views }] = await Promise.all([
        supabase
          .from('s_mentions')
          .select('published_at, impact_score, title, source, sentiment')
          .eq('solicitor_id', solicitorId)
          .gte('published_at', startDate.toISOString())
          .lte('published_at', endDate.toISOString()),
        supabase
          .from('s_stats_daily')
          .select('date, clicks')
          .eq('solicitor_id', solicitorId)
          .gte('date', startDate.toISOString())
          .lte('date', endDate.toISOString()),
      ]);

      // Aggregate mentions per day
      const impactByDate = {};
      mentions?.forEach((m) => {
        const date = m.published_at.slice(0, 10);
        if (!impactByDate[date]) {
          impactByDate[date] = {
            impact_score: 0,
            title: m.title,
            source: m.source,
            sentiment: m.sentiment,
          };
        }
        impactByDate[date].impact_score += m.impact_score || 0;
      });

      // Aggregate bio views per day
      const viewsByDate = {};
      views?.forEach((v) => {
        const date = v.date;
        viewsByDate[date] = (viewsByDate[date] || 0) + (v.clicks || 0);
      });

      const merged = allDates.map((date) => {
        const impact = impactByDate[date];
        const hasImpact = impact && impact.impact_score > 0;
        return {
          date,
          impact_score: hasImpact ? impact.impact_score : null, // don't plot 0-score dots
          title: hasImpact ? impact.title : '',
          source: hasImpact ? impact.source : '',
          sentiment: hasImpact ? impact.sentiment : null,
          bio_views: viewsByDate[date] || 0,
        };
      });

      setChartData(merged);
    }

    loadData();
  }, [solicitorId, range, fromDate, toDate]);

  // Only show each month label once
  const monthTicks = useMemo(() => {
    if (!chartData.length) return [];
    const seen = new Set();
    return chartData
      .map((d) => d.date)
      .filter((d) => {
        const key = format(parseISO(d), 'yyyy-MM');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [chartData]);

  const headingLabel =
    range === 'custom' && fromDate && toDate
      ? `Mentions Impact & Bio Views (${fromDate} → ${toDate})`
      : `Mentions Impact & Bio Views (last ${range} days)`;

  return (
    <div className="bg-white shadow rounded p-4">
      <h2 className="text-lg font-semibold mb-4">{headingLabel}</h2>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
          <XAxis
          dataKey="date"
          ticks={monthTicks}
          tickFormatter={(d) => format(parseISO(d), 'MMM')}
          interval={0}
          minTickGap={20}
        />
          <YAxis
            yAxisId="left"
            orientation="left"
            domain={[0, 'auto']}
            tick={{ fill: '#ff7f0e' }}
            label={{ value: 'Impact Score', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 'auto']}
            tick={{ fill: '#237781' }}
            label={{
              value: 'Bio Views',
              angle: -90,
              position: 'insideRight',
              fill: '#237781',
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="bio_views"
            stroke="#237781"
            name="Bio Views"
            dot={false}
          />
          <Scatter
            yAxisId="left"
            dataKey="impact_score"
            name="Impact Score"
            fill="#ff7f0e"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}