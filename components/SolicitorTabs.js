// components/SolicitorTabs.js
'use client';

export default function SolicitorTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="mb-6 border-b border-gray-200">
      <nav className="flex space-x-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`pb-2 text-sm font-medium ${
              activeTab === tab.value
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}