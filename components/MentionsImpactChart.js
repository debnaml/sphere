'use client';

import { useEffect, useState } from 'react';
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
import { format, subMonths, eachDayOfInterval } from 'date-fns';

export default function MentionsImpactChart({ solicitorId }) {
  const [chartData, setChartData] = useState([]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const impact = payload.find(p => p.dataKey === 'impact_score');
      const views = payload.find(p => p.dataKey === 'bio_views');

      return (
        <div className="bg-white border border-gray-300 p-2 rounded shadow text-sm max-w-xs">
          <div className="font-semibold">{label}</div>
          {impact && impact.payload.impact_score > 0 && (
            <>
              <div><strong>Impact Score:</strong> {impact.payload.impact_score}</div>
              <div><strong>Title:</strong> {impact.payload.title}</div>
              <div><strong>Source:</strong> {impact.payload.source}</div>
              <div><strong>Sentiment:</strong> {impact.payload.sentiment}</div>
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
      const startDate = subMonths(new Date(), 6);
      const today = new Date();

      const allDates = eachDayOfInterval({ start: startDate, end: today }).map((d) =>
        format(d, 'yyyy-MM-dd')
      );

      const [{ data: mentions }, { data: views }] = await Promise.all([
        supabase
          .from('s_mentions')
          .select('published_at, impact_score, title, source, sentiment')
          .eq('solicitor_id', solicitorId)
          .gte('published_at', startDate.toISOString())
          .lte('published_at', today.toISOString()),
        supabase
          .from('s_stats_daily')
          .select('date, clicks')
          .eq('solicitor_id', solicitorId)
          .gte('date', startDate.toISOString())
          .lte('date', today.toISOString()),
      ]);

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
          impact_score: hasImpact ? impact.impact_score : null, // prevents plotting dots
          title: hasImpact ? impact.title : '',
          source: hasImpact ? impact.source : '',
          sentiment: hasImpact ? impact.sentiment : null,
          bio_views: viewsByDate[date] || 0,
        };
      });

      setChartData(merged);
    }

    loadData();
  }, [solicitorId]);

  return (
    <div className="bg-white shadow rounded p-4">
      <h2 className="text-lg font-semibold mb-4">Mentions Impact & Bio Views (last 6 months)</h2>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(str) => {
              const date = new Date(str);
              return format(date, 'MMM');
            }}
            interval="preserveStartEnd"
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