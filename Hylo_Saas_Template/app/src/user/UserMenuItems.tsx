import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { type User } from 'wasp/entities';
import { logout } from 'wasp/client/auth';
import { MdOutlineSpaceDashboard } from 'react-icons/md';
import { TfiDashboard } from 'react-icons/tfi';
import { MdOutlineRestaurantMenu } from 'react-icons/md';
import { RiRobot2Line } from 'react-icons/ri';
import { cn } from '../client/cn';

export const UserMenuItems = ({ user, setMobileMenuOpen }: { user?: Partial<User>; setMobileMenuOpen?: any }) => {
  const path = window.location.pathname;
  const landingPagePath = routes.LandingPageRoute.to;
  const adminDashboardPath = routes.AdminRoute.to;

  const handleMobileMenuClick = () => {
    if (setMobileMenuOpen) setMobileMenuOpen(false);
  };

  return (
    <>
      <ul
        className={cn('flex flex-col gap-5 border-b border-stroke py-4 dark:border-strokedark', {
          'sm:px-6': path !== adminDashboardPath,
          'px-6': path === adminDashboardPath,
        })}
      >
        <li>
          <WaspRouterLink
            to={routes.AgentRoute.to}
            className='flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-yellow-500'
            onClick={handleMobileMenuClick}
          >
            <RiRobot2Line size='1.1rem' />
            Agent
          </WaspRouterLink>
        </li>
        <li>
          <WaspRouterLink
            to={routes.MealPlanRoute.to}
            className='flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-yellow-500'
            onClick={handleMobileMenuClick}
          >
            <MdOutlineRestaurantMenu size='1.1rem' />
            Meal Plan
          </WaspRouterLink>
        </li>
        <li>
          <WaspRouterLink
            to={routes.AccountRoute.to}
            className='flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-yellow-500'
            onClick={handleMobileMenuClick}
          >
            <svg
              className='fill-current'
              width='18'
              height='18'
              viewBox='0 0 18 18'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M9.0002 7.79065C11.0814 7.79065 12.7689 6.1594 12.7689 4.1344C12.7689 2.1094 11.0814 0.478149 9.0002 0.478149C6.91895 0.478149 5.23145 2.1094 5.23145 4.1344C5.23145 6.1594 6.91895 7.79065 9.0002 7.79065ZM9.0002 1.7719C10.3783 1.7719 11.5033 2.84065 11.5033 4.16252C11.5033 5.4844 10.3783 6.55315 9.0002 6.55315C7.62207 6.55315 6.49707 5.4844 6.49707 4.16252C6.49707 2.84065 7.62207 1.7719 9.0002 1.7719Z'
                fill=''
              />
              <path
                d='M10.8283 9.05627H7.17207C4.16269 9.05627 1.71582 11.5313 1.71582 14.5406V16.875C1.71582 17.2125 1.99707 17.5219 2.3627 17.5219C2.72832 17.5219 3.00957 17.2407 3.00957 16.875V14.5406C3.00957 12.2344 4.89394 10.3219 7.22832 10.3219H10.8564C13.1627 10.3219 15.0752 12.2063 15.0752 14.5406V16.875C15.0752 17.2125 15.3564 17.5219 15.7221 17.5219C16.0877 17.5219 16.3689 17.2407 16.3689 16.875V14.5406C16.2846 11.5313 13.8377 9.05627 10.8283 9.05627Z'
                fill=''
              />
            </svg>
            Account
          </WaspRouterLink>
        </li>
      </ul>
      {!!user && user.isAdmin && (
        <ul
          className={cn('flex flex-col gap-5 border-b border-stroke py-4 dark:border-strokedark', {
            'sm:px-6': path !== adminDashboardPath,
            'px-6': path === adminDashboardPath,
          })}
        >
          <li className='flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-yellow-500'>
            <WaspRouterLink
              to={routes.AdminRoute.to}
              onClick={handleMobileMenuClick}
              className='flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-yellow-500'
            >
              <TfiDashboard size='1.1rem' />
              Admin Dashboard
            </WaspRouterLink>
          </li>
        </ul>
      )}
      <div className='py-4'>
        <a
          href='#'
          onClick={(e) => {
            e.preventDefault();
            logout();
            if (setMobileMenuOpen) setMobileMenuOpen(false);
          }}
          className='flex items-center gap-3.5 text-sm font-medium duration-300 ease-in-out hover:text-yellow-500 sm:px-6'
        >
          <svg
            width='18'
            height='18'
            viewBox='0 0 18 18'
            fill='none'
            stroke='currentColor'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l-3-3m3 3v6'
              transform='rotate(90, 12, 12)'
            />
          </svg>
          Log out
        </a>
      </div>
    </>
  );
};
