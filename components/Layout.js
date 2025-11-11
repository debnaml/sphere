import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  BarChart2,
  CalendarDays,
  FileText,
  Globe,
  Home,
  LogOut,
  Megaphone,
  Menu,
  UserCircle,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
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
  const { user, signOut } = useAuth();

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
  {/* Sidebar uses gradient background with white icons and #CBEEF3 highlight */}
      <aside
        className={`hidden md:block fixed top-0 left-0 h-full z-30 border-r border-[#331D4C] shadow transition-all duration-300 bg-gradient-to-b from-[#030414] to-[#331D4C]
          ${hovered ? 'w-56' : 'w-16'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
  <div className="h-full flex flex-col items-start px-2 pt-8 pb-4 space-y-6">
          <div className="flex items-center w-full gap-2 px-2">
            <div className="w-12 flex justify-center">
              <Globe size={24} className="text-white" />
            </div>
            {showLabels && <span className="text-white text-sm font-semibold">Sphere</span>}
          </div>
          <nav className="flex flex-col w-full space-y-2">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className="group relative flex items-center px-2 py-2 text-white rounded-lg transition-colors hover:text-[#CBEEF3] hover:bg-[#331D4C]"
              >
                <div className="w-12 flex justify-center">
                  <Icon size={20} className="text-white transition-colors group-hover:text-[#CBEEF3]" />
                </div>
                {showLabels && (
                  <span className="absolute left-14 text-sm text-white transition-colors duration-200 group-hover:text-[#CBEEF3]">
                    {label}
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="mt-auto w-full border-t border-white/10 pt-4 space-y-2">
            <Link
              href="/profile"
              className="group flex items-center px-2 py-2 text-white rounded-lg transition-colors hover:text-[#CBEEF3] hover:bg-[#331D4C]"
            >
              <div className="w-12 flex justify-center">
                <UserCircle size={22} className="text-white transition-colors group-hover:text-[#CBEEF3]" />
              </div>
              {showLabels && (
                <span className="text-sm">
                  {user?.email ? user.email : 'Profile'}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="group flex w-full items-center px-2 py-2 text-left text-white rounded-lg transition-colors hover:text-[#CBEEF3] hover:bg-[#331D4C]"
            >
              <div className="w-12 flex justify-center">
                <LogOut size={20} className="text-white transition-colors group-hover:text-[#CBEEF3]" />
              </div>
              {showLabels && <span className="text-sm">Log out</span>}
            </button>
          </div>
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
          <div className="border-t border-gray-200 mt-2 pt-2">
            <Link
              href="/profile"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileOpen(false)}
            >
              <UserCircle size={20} className="mr-2" />
              <span className="text-sm">{user?.email || 'Profile'}</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                signOut();
              }}
              className="flex w-full items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-100"
            >
              <LogOut size={20} className="mr-2" />
              <span className="text-sm">Log out</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}

      <main className="flex-1 md:ml-16 ml-0 p-8 min-h-screen bg-[#F5F4F6] pt-24 md:pt-12">
        {children}
      </main>
    </div>
  );
}