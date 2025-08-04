import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import Popup from './pages/Popup';
import Assistant from './pages/Assistant';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import EmailTracking from './pages/EmailTracking';

const NavigationHeader = ({ currentPage, onBack, onSettings }) => {
  const getPageTitle = () => {
    switch (currentPage) {
      case 'assistant':
        return 'BillableAI Assistant';
      case 'settings':
        return 'Settings';
      case 'email-tracking':
        return 'Email Tracking';
      default:
        return 'BillableAI';
    }
  };

  const showBackButton = currentPage !== 'popup' && currentPage !== 'home';
  const showSettingsButton = currentPage !== 'settings';

  return (
    <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm border-b border-white/20">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      </div>
      
      {showSettingsButton && (
        <button
          onClick={onSettings}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}
    </div>
  );
};

const AppContent = () => {
  const { currentPage, isAuthenticatedUser, setCurrentPage } = useAppContext();

  const handleBack = () => {
    setCurrentPage('popup');
  };

  const handleSettings = () => {
    setCurrentPage('settings');
  };

  // Show onboarding page if user is not authenticated
  if (!isAuthenticatedUser) {
    return <Onboarding />;
  }

  // Render pages with navigation header
  switch (currentPage) {
    case 'assistant':
      return (
        <div className="flex flex-col h-full">
          <NavigationHeader 
            currentPage={currentPage} 
            onBack={handleBack} 
            onSettings={handleSettings} 
          />
          <div className="flex-1 overflow-hidden">
            <Assistant />
          </div>
        </div>
      );
    case 'settings':
      return (
        <div className="flex flex-col h-full">
          <NavigationHeader 
            currentPage={currentPage} 
            onBack={handleBack} 
            onSettings={handleSettings} 
          />
          <div className="flex-1 overflow-hidden">
            <Settings />
          </div>
        </div>
      );
    case 'email-tracking':
      return (
        <div className="flex flex-col h-full">
          <NavigationHeader 
            currentPage={currentPage} 
            onBack={handleBack} 
            onSettings={handleSettings} 
          />
          <div className="flex-1 overflow-hidden">
            <EmailTracking />
          </div>
        </div>
      );
    case 'onboarding':
      return <Onboarding />;
    case 'home':
    case 'popup':
    default:
      return <Popup />;
  }
};

function App() {
  return (
    <AppProvider>
      <div className="App bg-gradient-to-b bg-gradient-to-br from-black via-blue-900 to-purple-600 min-h-screen">
        <AppContent />
      </div>
    </AppProvider>
  );
}

export default App;
