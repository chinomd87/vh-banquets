import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Menu as MenuIcon, 
  BarChart3, 
  Layout, 
  Boxes,
  Wand2,
  X as CloseIcon
} from 'lucide-react';

export function AppHeader({ setPage, currentPage }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clients', label: 'Clients' },
    { id: 'staff', label: 'Staff' },
    { id: 'clientPortal', label: 'Client Portal' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'floorPlan', label: 'Floor Plan', icon: Layout },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'runway', label: 'AI Video', icon: Wand2 },
    { id: 'runwayChickenDemo', label: '🐔 AI Loader' },
    { id: 'chickenDemo', label: '🐔 Demo' },
    { id: 'loaderTest', label: '🧪 Test' },
    { id: 'animationTest', label: '🎬 Debug' }
  ];

  const handleNavigation = (pageId) => {
    setPage(pageId);
    setIsMobileMenuOpen(false);
  };

  const getButtonClass = (pageId) => 
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      currentPage === pageId
        ? "bg-indigo-100 text-indigo-700"
        : "text-gray-600 hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    }`;

  return (
    <header className="bg-white shadow-sm" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <MenuIcon className="text-indigo-600" size={28} aria-hidden="true" />
            <h1 className="text-2xl font-bold text-gray-800">VH Banquets</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2" role="navigation" aria-label="Main navigation">
            {navigationItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={getButtonClass(item.id)}
                aria-current={currentPage === item.id ? "page" : undefined}
              >
                {item.label}
              </button>
            ))}
            
            {/* Phase 5: Advanced Features */}
            <div className="h-6 w-px bg-gray-300 mx-2" aria-hidden="true" />
            {navigationItems.slice(5).map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`${getButtonClass(item.id)} flex items-center gap-1`}
                aria-current={currentPage === item.id ? "page" : undefined}
              >
                {item.icon && <item.icon size={16} aria-hidden="true" />}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle main menu"
            >
              {isMobileMenuOpen ? (
                <CloseIcon size={24} aria-hidden="true" />
              ) : (
                <MenuIcon size={24} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <nav 
            id="mobile-menu"
            className="md:hidden bg-white border-t border-gray-200"
            aria-label="Mobile navigation"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`${
                    currentPage === item.id
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                  } w-full text-left pl-3 pr-4 py-2 border-l-4 text-sm font-medium flex items-center gap-2`}
                  aria-current={currentPage === item.id ? "page" : undefined}
                >
                  {item.icon && <item.icon size={16} aria-hidden="true" />}
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

AppHeader.propTypes = {
  setPage: PropTypes.func.isRequired,
  currentPage: PropTypes.string.isRequired
};
