'use client';

import { useState } from 'react';
import { deleteCookie } from 'cookies-next';
import { Cloud, CreditCard, Github, LifeBuoy, LogOut, Menu, Settings, User } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import Gravatar from '../Gravatar';
import { UserSettings } from './UserSettings';

export function UserDropDown({ user }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const logout = () => {
    deleteCookie('jwt', {
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
    });
    window.location.reload();
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
    setIsDropdownOpen(false);
  };

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button size='icon' variant='ghost'>
          {user?.email ? <Gravatar email={user?.email} sx={{ width: '2rem', height: '2rem' }} /> : <Menu />}
        </Button>
      </DropdownMenuTrigger>

      {isSettingsOpen && <UserSettings {...{ user, setIsSettingsOpen, isSettingsOpen }} />}

      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className='w-4 h-4 mr-2' />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <CreditCard className='w-4 h-4 mr-2' />
            <span>Billing</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSettingsClick}>
            <Settings className='w-4 h-4 mr-2' />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Github className='w-4 h-4 mr-2' />
          <span>GitHub</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <LifeBuoy className='w-4 h-4 mr-2' />
          <span>Support</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Cloud className='w-4 h-4 mr-2' />
          <span>API</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className='w-4 h-4 mr-2' />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
