import React, { useState, useEffect } from 'react';
import { UserProfile, AdminLevel } from './types';
import { authService } from './services/AuthService';
import { dbEngine } from './lib/storageEngine';
import { TopBar } from './components/common/TopBar';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { BankModal } from './components/common/BankModal';
import { AdminTerminalModal } from './components/common/AdminTerminalModal';
import { AuthModal } from './components/auth/AuthModal';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { InventoryPage } from './pages/InventoryPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { ShopPage } from './pages/ShopPage';
import { UpgradesPage } from './pages/UpgradesPage';
import { CasinoPage } from './pages/CasinoPage';
import { JobsPage } from './pages/JobsPage';
import { MissionsPage } from './pages/MissionsPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ClansPage } from './pages/ClansPage';
import { BusinessesPage } from './pages/BusinessesPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [isBankOpen, setIsBankOpen] = useState<boolean>(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Subscribe to persistent reactive profile updates
  useEffect(() => {
    const unsubAuth = authService.subscribe((profile) => {
      setUser(profile);
      if (!profile) {
        setIsAuthModalOpen(true);
      }
    });

    const unsubDB = dbEngine.subscribe(() => {
      const current = authService.getCurrentProfile();
      if (current) {
        const state = dbEngine.getState();
        setUser(state.profiles[current.id] || null);
      }
    });

    return () => {
      unsubAuth();
      unsubDB();
    };
  }, []);

  // Global Keybindings (Ctrl+Q or F8 for Admin Terminal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'q' || e.key.toLowerCase() === 'й')) {
        e.preventDefault();
        if (user && user.admin_level >= 1) {
          setIsTerminalOpen((prev) => !prev);
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (user && user.admin_level >= 1) {
          setIsTerminalOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  const handleSwitchAdminRole = (lvl: AdminLevel) => {
    authService.switchDemoAccount(lvl);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthModalOpen(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <AuthModal
          isOpen={true}
          onSuccess={() => {
            setIsAuthModalOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div id="bandit-app-root" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Header Bar */}
      <TopBar
        user={user}
        activePage={activePage}
        onNavigate={(page) => setActivePage(page)}
        onOpenBank={() => setIsBankOpen(true)}
        onOpenTerminal={() => setIsTerminalOpen(true)}
        onLogout={handleLogout}
        onSwitchAdminRole={handleSwitchAdminRole}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1680px] w-full mx-auto">
        {/* Persistent Sidebar */}
        <Sidebar
          user={user}
          activePage={activePage}
          onNavigate={(page) => setActivePage(page)}
          onOpenTerminal={() => setIsTerminalOpen(true)}
        />

        {/* Content Container */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden min-h-[calc(100vh-61px)]">
          {activePage === 'dashboard' && (
            <DashboardPage
              user={user}
              onNavigate={(page) => setActivePage(page)}
              onOpenBank={() => setIsBankOpen(true)}
            />
          )}
          {activePage === 'profile' && <ProfilePage user={user} />}
          {activePage === 'inventory' && <InventoryPage user={user} />}
          {activePage === 'vehicles' && <VehiclesPage user={user} />}
          {activePage === 'shop' && <ShopPage user={user} />}
          {activePage === 'upgrades' && (
            <UpgradesPage user={user} onOpenBank={() => setIsBankOpen(true)} />
          )}
          {activePage === 'casino' && (
            <CasinoPage user={user} onOpenBank={() => setIsBankOpen(true)} />
          )}
          {activePage === 'jobs' && <JobsPage user={user} />}
          {activePage === 'missions' && <MissionsPage user={user} />}
          {activePage === 'achievements' && <AchievementsPage user={user} />}
          {activePage === 'clans' && <ClansPage user={user} />}
          {activePage === 'businesses' && <BusinessesPage user={user} />}
          {activePage === 'admin' && <AdminPage user={user} />}
          {activePage === 'settings' && <SettingsPage user={user} />}
        </main>
      </div>

      {/* Global Modals & Toast Alert Overlay */}
      <BankModal
        user={user}
        isOpen={isBankOpen}
        onClose={() => setIsBankOpen(false)}
      />

      {user.admin_level >= 1 && (
        <AdminTerminalModal
          admin={user}
          isOpen={isTerminalOpen}
          onClose={() => setIsTerminalOpen(false)}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onSuccess={() => setIsAuthModalOpen(false)}
      />

      <ToastContainer />
    </div>
  );
}
