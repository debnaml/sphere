// pages/test.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';
import { ResponsiveCirclePacking } from '@nivo/circle-packing';
import PageHeading from '../components/PageHeading';


export default function TestPage() {
    const [circleData, setCircleData] = useState(null);


    return (
      <div className="space-y-4">
        <PageHeading>Test Page</PageHeading>
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