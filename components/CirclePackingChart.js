// components/CirclePackingChart.js
import { ResponsiveCirclePacking } from '@nivo/circle-packing'

export default function CirclePackingChart({ data }) {
  return (
    <div style={{ height: '600px', width: '100%' }}>
      <ResponsiveCirclePacking
        data={data}
        id="name"
        value="value"
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        colors={{ scheme: 'purpleRed_green' }}
        childColor={{ from: 'color' }}
        padding={4}
        enableLabels={true}
        labelsSkipRadius={10}
        labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
        tooltip={({ id, value }) => (
          <strong>{id}: {value} views</strong>
        )}
      />
    </div>
  )
}