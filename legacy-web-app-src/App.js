// App.js - Main Application Component

import { useState, useCallback } from "react";
import PropTypes from 'prop-types';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useData } from './contexts/AppContext';
import { useChickenLoader } from './hooks/useChickenLoader';
import { AuthProvider } from './contexts/AuthContext';
import AuthWrapper from './components/AuthWrapper';

// Authentication and E-signature Components
import ESignaturePage from './components/ESignaturePage';
import ContractManagement from './components/ContractManagement';

// Page Components
import ClientPortalPage from './components/ClientPortalPage';
import ChickenChaseLoader from './components/ChickenChaseLoader';
import ChickenLoaderDemo from './components/ChickenLoaderDemo';
import RunwayChickenLoaderDemo from './components/RunwayChickenLoaderDemo';
import AnimationDebugTest from './components/AnimationDebugTest';
import RunwayVideoGenerator from './components/RunwayVideoGenerator';
import RunwayDemo from './components/RunwayDemo';

// Advanced Feature Components
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { FloorPlanEditor } from './components/FloorPlanEditor';
import { InventoryManagement } from './components/InventoryManagement';

// Core Components
import { AppHeader } from './components/AppHeader';
import { EventForm } from './components/EventForm';
import { Dashboard } from './components/Dashboard';
import { EventDetail } from './components/EventDetail';
import { ClientsPage } from './components/ClientsPage';
import { ContractsPage } from './components/ContractsPage';
import StaffManagement from './components/StaffManagement';

// Custom hook to encapsulate navigation and state logic
function useAppNavigation() {
  const [page, setPage] = useState("dashboard");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { isLoading } = useData() || { isLoading: false };
  const chickenLoader = useChickenLoader() || {};

  const navigateTo = useCallback((pageName, data = null) => {
    setSelectedEvent(data);
    setPage(pageName);
  }, []);

  const handleEventUpdate = useCallback((updatedEvent) => {
    setSelectedEvent(updatedEvent);
  }, []);

  return {
    page,
    setPage,
    selectedEvent,
    isLoading,
    chickenLoader,
    navigateTo,
    handleEventUpdate
  };
}

// Page rendering logic (refactored to reduce complexity)
function renderPage(page, selectedEvent, navigateTo, handleEventUpdate) {
  const pageMap = {
    newEvent: () => <EventForm onBack={() => navigateTo("dashboard")} />,
    eventDetail: () => (
      <EventDetail
        event={selectedEvent}
        onBack={() => navigateTo("dashboard")}
        navigateTo={navigateTo}
        onUpdate={handleEventUpdate}
      />
    ),
    editEvent: () => (
      <EventForm
        event={selectedEvent}
        onBack={() => navigateTo("eventDetail", selectedEvent)}
        onSave={(eventData) => {
          handleEventUpdate(eventData);
          navigateTo("eventDetail", eventData);
        }}
      />
    ),
    clients: () => <ClientsPage navigateTo={navigateTo} />,
    staff: () => <StaffManagement />,
    clientPortal: () => <ClientPortalPage navigateTo={navigateTo} />,
    contracts: () => <ContractsPage navigateTo={navigateTo} />,
    contractManagement: () => <ContractManagement />,
    analytics: () => <AnalyticsDashboard navigateTo={navigateTo} />,
    floorPlan: () => <FloorPlanEditor navigateTo={navigateTo} />,
    inventory: () => <InventoryManagement navigateTo={navigateTo} />,
    chickenDemo: () => <ChickenLoaderDemo />,
    runwayChickenDemo: () => <RunwayChickenLoaderDemo />,
    loaderTest: () => (
      <div className="flex items-center justify-center h-64">
        <span className="text-lg text-gray-600">Simple Loader Test Placeholder</span>
      </div>
    ),
    animationTest: () => <AnimationDebugTest />,
    runway: () => <RunwayDemo />,
    runwayFull: () => <RunwayVideoGenerator />,
  };
  return pageMap[page] ? pageMap[page]() : <Dashboard navigateTo={navigateTo} />;
}

// Loading Component
function CenteredLoader({ message }) {
  return (
    <div className="flex items-center justify-center h-screen">
      <ChickenChaseLoader isVisible={true} message={message} />
    </div>
  );
}

CenteredLoader.propTypes = {
  message: PropTypes.string.isRequired
};

// Skip Link Component
function SkipLink() {
  return (
    <a 
      href="#main-content" 
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white p-2 z-50 focus:z-50"
    >
      Skip to main content
    </a>
  );
}

// Main Content Wrapper
function MainContent({ children }) {
  return (
    <main 
      id="main-content" 
      role="main" 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {children}
    </main>
  );
}

MainContent.propTypes = {
  children: PropTypes.node.isRequired
};

// Main App Component
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/sign/:sessionId" element={<ESignaturePage />} />
          <Route path="/signature-complete" element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                <div className="text-green-500 text-6xl mb-4">✓</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Signature Complete!</h2>
                <p className="text-gray-600 mb-6">Your contract has been successfully signed and recorded.</p>
                <button 
                  onClick={() => window.close()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close Window
                </button>
              </div>
            </div>
          } />
          <Route path="/*" element={
            <AuthWrapper>
              <AppContent />
            </AuthWrapper>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// App Content Component (the main application)
function AppContent() {
  const {
    page,
    setPage,
    selectedEvent,
    isLoading,
    chickenLoader,
    navigateTo,
    handleEventUpdate
  } = useAppNavigation();

  if (isLoading) {
    return <CenteredLoader message="Loading Application..." />;
  }

  return (
    <div className="bg-gray-100 min-h-screen text-gray-800">
      <SkipLink />
      <ChickenChaseLoader 
        isVisible={chickenLoader?.isLoading || false} 
        message={chickenLoader?.isLoading ? "Please wait..." : ""} 
      />
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <AppHeader setPage={setPage} currentPage={page} />
      <MainContent>
        {renderPage(page, selectedEvent, navigateTo, handleEventUpdate)}
      </MainContent>
    </div>
  );
}