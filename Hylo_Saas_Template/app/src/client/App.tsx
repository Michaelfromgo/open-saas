import './Main.css';
import NavBar from './components/NavBar/NavBar';
import CookieConsentBanner from './components/cookie-consent/Banner';
import { contentSections } from './components/NavBar/contentSections';
import { landingPageNavigationItems } from '../landing-page/contentSections';
import { useMemo, useEffect } from 'react';
import { routes } from 'wasp/client/router';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from 'wasp/client/auth';
import { useIsLandingPage } from './hooks/useIsLandingPage';
import { updateCurrentUserLastActiveTimestamp } from 'wasp/client/operations';

/**
 * use this component to wrap all child components
 * this is useful for templates, themes, and context
 */
export default function App() {
  const location = useLocation();
  const isAdminDashboard = location.pathname.startsWith('/admin');
  const isLandingPage = location.pathname === '/';
  const isAuthPage = ['/login', '/signup', '/request-password-reset', '/password-reset'].includes(location.pathname);
  const shouldDisplayAppNavBar = !isAdminDashboard && !isAuthPage;

  const { data: user, isLoading: isUserLoading } = useAuth();

  const navigationItems = useMemo(() => {
    if (!user) {
      return [];
    }
    return contentSections;
  }, [user]);

  useEffect(() => {
    if (user) {
      const lastSeenAt = new Date(user.lastActiveTimestamp);
      const today = new Date();
      if (today.getTime() - lastSeenAt.getTime() > 5 * 60 * 1000) {
        updateCurrentUserLastActiveTimestamp({ lastActiveTimestamp: today });
      }
    }
  }, [user]);

  // Redirect to agent page if user is logged in and at the home page
  if (user && location.pathname === '/') {
    return <Navigate to={routes.AgentRoute.to} replace />;
  }

  return (
    <>
      <div className='min-h-screen dark:text-white dark:bg-boxdark-2'>
        {isAdminDashboard ? (
          <Outlet />
        ) : (
          <>
            {shouldDisplayAppNavBar && <NavBar navigationItems={navigationItems} />}
            <div className='mx-auto max-w-7xl sm:px-6 lg:px-8 pt-24'>
              <Outlet />
            </div>
          </>
        )}
      </div>
      <CookieConsentBanner />
    </>
  );
}
