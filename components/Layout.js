import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Home,
  Users,
  BarChart2,
  CalendarDays,
  FileText,
  Globe,
} from 'lucide-react';

const navItems = [
  { href: '/', icon: Globe, label: 'Home' },
  { href: '/solicitors', icon: Users, label: 'Solicitor Stats' },
  { href: '/teams', icon: BarChart2, label: 'Team Stats' },
  { href: '/calendar', icon: CalendarDays, label: 'Calendar View' },
  { href: '/content', icon: FileText, label: 'News & Updates' },
];

export default function Layout({ children }) {
  const [hovered, setHovered] = useState(false);
  const [showLabels, setShowLabels] = useState(false);

  useEffect(() => {
    let timeout;
    if (hovered) {
      timeout = setTimeout(() => setShowLabels(true), 300); // Match transition duration
    } else {
      setShowLabels(false); // Instantly hide on collapse
    }
    return () => clearTimeout(timeout);
  }, [hovered]);

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 bg-white border-r border-gray-200 shadow transition-all duration-300
          ${hovered ? 'w-56' : 'w-16'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="h-full flex flex-col items-start px-2 py-4 space-y-6">
          {/* Navigation */}
          <nav className="flex flex-col w-full space-y-2">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="relative flex items-center px-2 py-2 text-gray-700 hover:text-blue-600"
              >
                <div className="w-12 flex justify-center">
                  <Icon size={20} />
                </div>
                {showLabels && (
                  <span className="absolute left-14 text-sm transition-opacity duration-200">
                    {label}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-16 p-8 bg-gray-100 min-h-screen">
        {children}
      </main>
    </div>
  );
}