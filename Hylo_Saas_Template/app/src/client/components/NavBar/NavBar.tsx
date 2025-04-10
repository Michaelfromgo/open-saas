import { Link as ReactRouterLink } from 'react-router-dom';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { useAuth } from 'wasp/client/auth';
import { useState, Dispatch, SetStateAction } from 'react';
import { Dialog } from '@headlessui/react';
import { BiLogIn } from 'react-icons/bi';
import { AiFillCloseCircle } from 'react-icons/ai';
import { HiBars3 } from 'react-icons/hi2';
import logo from '../../static/logo.webp';
import DropdownUser from '../../../user/DropdownUser';
import { UserMenuItems } from '../../../user/UserMenuItems';
import DarkModeSwitcher from '../DarkModeSwitcher';
import { useIsLandingPage } from '../../hooks/useIsLandingPage';
import { cn } from '../../cn';

export interface NavigationItem {
  name: string;
  to: string;
}

const NavLogo = () => <img className='h-8 w-8' src={logo} alt='Your SaaS App' />;

export default function AppNavBar({ navigationItems }: { navigationItems: NavigationItem[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLandingPage = useIsLandingPage();

  const { data: user, isLoading: isUserLoading } = useAuth();
  return (
    <header
      className={cn('fixed inset-x-0 top-0 z-50 w-full dark:bg-boxdark-2', {
        'shadow bg-white bg-opacity-50 backdrop-blur-lg backdrop-filter dark:border dark:border-gray-100/10':
          !isLandingPage,
      })}
    >
      <nav className='flex items-center justify-between p-3 md:p-4 lg:px-8' aria-label='Global'>
        <div className='flex items-center'>
          <WaspRouterLink
            to={routes.LandingPageRoute.to}
            className='flex items-center -m-1.5 p-1.5 text-gray-900 duration-300 ease-in-out hover:text-blue-500 dark:text-white dark:hover:text-blue-400'
          >
            <NavLogo />
            {isLandingPage && (
              <span className='ml-2 text-sm font-semibold leading-6 dark:text-white'>Your Saas</span>
            )}
          </WaspRouterLink>
        </div>
        <div className='flex lg:hidden'>
          <button
            type='button'
            className='inline-flex items-center justify-center rounded-md p-2 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className='sr-only'>Open main menu</span>
            <HiBars3 className='h-6 w-6' aria-hidden='true' />
          </button>
        </div>
        <div className='hidden lg:flex lg:gap-x-8'>{renderNavigationItems(navigationItems)}</div>
        <div className='hidden lg:flex lg:items-center lg:gap-3'>
          <DarkModeSwitcher />
          {isUserLoading ? null : !user ? (
            <WaspRouterLink to={routes.LoginRoute.to} className='text-sm font-semibold leading-6 ml-3'>
              <div className='flex items-center duration-300 ease-in-out text-gray-900 hover:text-blue-500 dark:text-white dark:hover:text-blue-400'>
                Log in <BiLogIn size='1.1rem' className='ml-1 mt-[0.1rem]' />
              </div>
            </WaspRouterLink>
          ) : (
            <div className='ml-3 flex items-center gap-4'>
              <span className='text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline-block'>
                Credits: {user.credits}
              </span>
              <DropdownUser user={user} />
            </div>
          )}
        </div>
      </nav>
      <Dialog as='div' className='lg:hidden' open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className='fixed inset-0 z-50 bg-black/30 dark:bg-black/50' aria-hidden="true" onClick={() => setMobileMenuOpen(false)} />
        <Dialog.Panel className='fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:text-white dark:bg-boxdark px-4 py-4 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10'>
          <div className='flex items-center justify-between'>
            <WaspRouterLink to={routes.LandingPageRoute.to} className='flex items-center'>
              <span className='sr-only'>Your SaaS</span>
              <NavLogo />
              <span className='ml-2 text-sm font-semibold leading-6 dark:text-white'>Your Saas</span>
            </WaspRouterLink>
            <button
              type='button'
              className='rounded-md p-2 text-gray-700 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800'
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className='sr-only'>Close menu</span>
              <AiFillCloseCircle className='h-6 w-6' aria-hidden='true' />
            </button>
          </div>
          <div className='mt-6 flow-root'>
            <div className='-my-6 divide-y divide-gray-500/10 dark:divide-gray-700'>
              <div className='space-y-2 py-6'>{renderNavigationItems(navigationItems, setMobileMenuOpen)}</div>
              <div className='py-6'>
                {isUserLoading ? null : !user ? (
                  <WaspRouterLink to={routes.LoginRoute.to}>
                    <div className='flex justify-end items-center duration-300 ease-in-out text-gray-900 hover:text-blue-500 dark:text-white dark:hover:text-blue-400'>
                      Log in <BiLogIn size='1.1rem' className='ml-1' />
                    </div>
                  </WaspRouterLink>
                ) : (
                  <>
                    <div className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-right'>
                      Credits: {user.credits}
                    </div>
                    <UserMenuItems user={user} setMobileMenuOpen={setMobileMenuOpen} />
                  </>
                )}
              </div>
              <div className='py-6 flex justify-end'>
                <DarkModeSwitcher />
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  );
}

function renderNavigationItems(
  navigationItems: NavigationItem[],
  setMobileMenuOpen?: Dispatch<SetStateAction<boolean>>
) {
  const menuStyles = cn({
    'block w-full rounded-lg px-3 py-2.5 text-base font-medium text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800/70':
      !!setMobileMenuOpen,
    'text-sm font-semibold text-gray-900 duration-300 ease-in-out hover:text-blue-500 dark:text-white dark:hover:text-blue-400':
      !setMobileMenuOpen,
  });

  return navigationItems.map((item) => {
    return (
      <ReactRouterLink
        to={item.to}
        key={item.name}
        className={menuStyles}
        onClick={setMobileMenuOpen && (() => setMobileMenuOpen(false))}
      >
        {item.name}
      </ReactRouterLink>
    );
  });
}
