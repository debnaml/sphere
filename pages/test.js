// pages/test.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import { ResponsiveCirclePacking } from '@nivo/circle-packing';


export default function TestPage() {
    const [circleData, setCircleData] = useState(null);


    return (
      <div className="p-8">
        <h1 className="text-xl font-bold">Test Page</h1>
        <p>This is just a quick page to try something out.</p>
        {circleData && (
            <ResponsiveCirclePacking
              data={circleData}
              id="name"
              value="value"
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              colors={{ scheme: 'nivo' }}
              labelSkipRadius={20}
              label={({ id }) => id}
              tooltip={({ id, value }) => (
                <strong>
                  {id}: {value} views
                </strong>
              )}
              animate={true}
              motionConfig="gentle"
            />
          )}
      </div>
    );
  }