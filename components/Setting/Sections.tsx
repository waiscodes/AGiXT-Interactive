'use client';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import axios from 'axios';
import DynamicForm from 'jrgcomponents/DynamicForm';
import useSWR from 'swr';
import SwitchDark from 'jrgcomponents/Theming/SwitchDark';
import SwitchColorblind from 'jrgcomponents/Theming/SwitchColorblind';
import OverrideSwitch from '../Chat/OverrideSwitch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../ui/select';

export const General = () => {
  const {
    data: user,
    error,
    isLoading,
  } = useSWR('/user', async () => {
    return (
      await axios.get(`${process.env.NEXT_PUBLIC_AUTH_SERVER}/v1/user`, {
        headers: {
          Authorization: `${getCookie('jwt')}`,
        },
      })
    ).data;
  });

  const handleUserUpdate = async (updatedUserData: object) => {
    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_AUTH_SERVER}/v1/user`, updatedUserData, {
        headers: {
          Authorization: `${getCookie('jwt')}`,
        },
      });
      console.log('User updated:', response.data);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className='text-red-500'>Something went wrong, please try again later.</p>;

  return (
    <div>
      {user && (
        <DynamicForm
          toUpdate={user}
          excludeFields={['subscription', 'email', 'ip_address']}
          readOnlyFields={['input_tokens', 'output_tokens']}
          onConfirm={(updatedData) => {
            handleUserUpdate(updatedData);
          }}
        />
      )}
    </div>
  );
};

// Move to JRGComponents
export const Appearance = ({ themes = ['light', 'dark', 'colorblind', 'colorblind-dark'] }: { themes?: string[] }) => {
  const handleThemeUpdate = async (theme: string) => {
    document.body.classList.remove(...themes);
    document.body.classList.add(theme);
    setCookie('theme', theme, {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
    });
  };

  return (
    <div>
      <RadioGroup defaultValue='' onValueChange={handleThemeUpdate} className='grid grid-cols-2 gap-4'>
        {themes.map((option) => (
          <div key={option} className='flex flex-col items-center gap-2'>
            <RadioGroupItem value={option} id={option} className='sr-only peer' />
            <Label
              htmlFor={option}
              className='rounded-md peer-data-[state=checked]:bg-primary [&:has([data-state=checked])]:bg-primary p-[2px] hover:bg-primary'
            >
              <div className='items-center p-1 border rounded-md w-52 border-muted bg-background'>
                <div className={cn('p-2 space-y-2 rounded-sm bg-muted', option)}>
                  <div className='p-2 space-y-2 rounded-md shadow-sm bg-background'>
                    <div className='h-2 w-[80px] rounded-lg bg-primary' />
                    <div className='h-2 w-[100px] rounded-lg bg-secondary' />
                  </div>
                  <div className='flex items-center p-2 space-x-2 rounded-md shadow-sm bg-background'>
                    <div className='w-4 h-4 rounded-full bg-primary' />
                    <div className='h-2 w-[100px] rounded-lg bg-secondary' />
                  </div>
                  <div className='flex items-center p-2 space-x-2 rounded-md shadow-sm bg-background'>
                    <div className='w-4 h-4 rounded-full bg-foreground' />
                    <div className='h-2 w-[100px] rounded-lg bg-muted' />
                  </div>
                </div>
              </div>
            </Label>
            <span className='capitalize text-card-foreground'>{option}</span>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export const Overrides = () => {
  const showOverrideSwitches = process.env.NEXT_PUBLIC_AGIXT_SHOW_OVERRIDE_SWITCHES || '';
  const overrides = showOverrideSwitches.split(',');

  const labelName = (name: string) => {
    const labels: Record<string, string> = {
      tts: 'Text-to-Speech',
      websearch: 'Websearch',
      'create-image': 'Generate an Image',
    };
    return labels[name.toString()] || name; // toString() to prevent object sync injection security issue
  };

  const getInitialState = (override: string): string => {
    const cookie = getCookie('agixt-' + override);
    if (cookie === undefined) return 'Default';
    return cookie === 'true' ? 'Always' : 'Never';
  };

  const handleStateChange = (override: string, value: string) => {
    const cookieKey = 'agixt-' + override;
    if (value === 'Default') {
      deleteCookie(cookieKey, { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN });
    } else {
      setCookie(cookieKey, value === 'Always', {
        domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN,
        maxAge: 2147483647,
      });
    }
  };

  return (
    <div className='flex flex-col gap-4'>
      {overrides.map((override: string) => {
        const initialState = getInitialState(override);

        return (
          <div key={override} className='flex flex-col gap-2'>
            <Label>{labelName(override)}</Label>
            <Select onValueChange={(value) => handleStateChange(override, value)}>
              <SelectTrigger>
                <SelectValue placeholder={initialState ?? labelName(override)} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value='Default'>Default</SelectItem>
                  <SelectItem value='Never'>Never</SelectItem>
                  <SelectItem value='Always'>Always</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
};

export const Extensions = () => {
  return <div>Data controls</div>;
};

export const BuilderProfile = () => {
  return <div>Builder profile</div>;
};

export const ConnectedApps = () => {
  return <div>Connected apps</div>;
};

export const Security = () => {
  return <div>Security</div>;
};
