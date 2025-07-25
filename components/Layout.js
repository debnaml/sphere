import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Users,
  BarChart2,
  CalendarDays,
  FileText,
  Globe,
  Megaphone,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/', icon: Globe, label: 'Home' },
  { href: '/solicitors', icon: Users, label: 'Solicitor Stats' },
  { href: '/teams', icon: BarChart2, label: 'Team Stats' },
  { href: '/events', icon: CalendarDays, label: 'Events' },
  { href: '/content', icon: FileText, label: 'News & Updates' },
  { href: '/pr', icon: Megaphone, label: 'PR Dashboard' },
];

export default function Layout({ children }) {
  const [hovered, setHovered] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let timeout;
    if (hovered) {
      timeout = setTimeout(() => setShowLabels(true), 300);
    } else {
      setShowLabels(false);
    }
    return () => clearTimeout(timeout);
  }, [hovered]);

  return (
    <div className="flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block fixed top-0 left-0 h-full z-30 bg-white border-r border-gray-200 shadow transition-all duration-300
          ${hovered ? 'w-56' : 'w-16'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="h-full flex flex-col items-start px-2 py-4 space-y-6">
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

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white border-b border-gray-200 shadow px-4 py-3 flex items-center justify-between z-40">
        <h1 className="text-lg font-bold">Dashboard</h1>
        <button onClick={() => setMobileOpen((o) => !o)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu with Slide Animation */}
      <div
        className={`md:hidden fixed top-12 left-0 w-full bg-white shadow-lg border-b border-gray-200 z-30 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <nav className="flex flex-col w-full">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={20} className="mr-2" />
              <span className="text-sm">{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}

      <main className="flex-1 md:ml-16 ml-0 p-8 min-h-screen bg-grey-100 pt-20 md:pt-10">
        {children}
      </main>
    </div>
  );
}