'use client';

import React, { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';
import axios from 'axios';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCompany, useAgent, useProviders } from '../hooks';
import Extension from './extension';
import { useInteractiveConfig } from '@/components/interactive/InteractiveConfigContext';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ConnectedServices } from '@/components/jrg/auth/management/ConnectedServices';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import MarkdownBlock from '@/components/interactive/Chat/Message/MarkdownBlock';

// Types remain the same
type Command = {
  friendly_name: string;
  description: string;
  command_name: string;
  command_args: Record<string, string>;
  enabled?: boolean;
  extension_name?: string;
};

type Extension = {
  extension_name: string;
  description: string;
  settings: string[];
  commands: Command[];
};

type ErrorState = {
  type: 'success' | 'error';
  message: string;
} | null;

interface ExtensionSettings {
  agent_name: string;
  settings: Record<string, string>;
}

export function Extensions() {
  const { agent } = useInteractiveConfig();
  const pathname = usePathname();
  const { data: agentData } = useAgent();
  const router = useRouter();
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [selectedExtension, setSelectedExtension] = useState<string>('');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [error, setError] = useState<ErrorState>(null);
  const [showEnabledOnly, setShowEnabledOnly] = useState(false);
  const agent_name = (getCookie('agixt-agent') || process.env.NEXT_PUBLIC_AGIXT_AGENT) ?? agent;
  const { data: activeCompany } = useCompany();
  const { data: providerData } = useProviders();
  const searchParams = useSearchParams();
  // Filter extensions for the enabled commands view
  const extensionsWithCommands = extensions.filter((ext) => ext.commands?.length > 0);
  const allEnabledCommands = extensions.flatMap((ext) =>
    ext.commands.filter((cmd) => cmd.enabled).map((cmd) => ({ ...cmd, extension_name: ext.extension_name })),
  );
  console.log('ACTIVE COMPANY', activeCompany);
  // Categorize extensions for the available tab
  const categorizeExtensions = (exts: Extension[]) => {
    return {
      // Connected extensions are those with settings and at least one command
      connectedExtensions: exts.filter((ext) => ext.settings?.length > 0 && ext.commands?.length > 0),
      // Available extensions are those with settings that aren't connected yet
      availableExtensions: exts.filter((ext) => ext.settings?.length > 0 && !ext.commands?.length),
    };
  };
  // Categorize extensions for the available tab
  const categorizeProviders = (providers: any[]) => {
    console.log(agentData);
    const connected = providers.filter(
      (provider) =>
        provider.settings &&
        Object.entries(provider.settings).every(
          ([key, defaultValue]) =>
            !['KEY', 'SECRET', 'PASSWORD', 'TOKEN'].some((this_key) => key.endsWith(this_key)) ||
            (['KEY', 'SECRET', 'PASSWORD', 'TOKEN'].some((this_key) => key.endsWith(this_key)) &&
              agentData?.settings[key] &&
              agentData?.settings[key] === 'HIDDEN'),
        ),
    );
    return agentData && agentData.settings
      ? {
          // Connected providers have all their settings fields present with non-default values
          connectedProviders: connected,
          // Available providers are those that have settings but at least one field is missing or has default value
          availableProviders: providers.filter((provider) => !connected.includes(provider)),
        }
      : {
          connectedProviders: [],
          availableProviders: [],
        };
  };
  // Fetch extensions
  const fetchExtensions = async () => {
    try {
      setError(null);

      const response = await axios.get(
        searchParams.get('mode') === 'company'
          ? `${process.env.NEXT_PUBLIC_AGIXT_SERVER}/v1/companies/${getCookie('agixt-company-id')}/extensions`
          : `${process.env.NEXT_PUBLIC_AGIXT_SERVER}/api/agent/${agent_name}/extensions`,
        {
          headers: {
            Authorization: getCookie('jwt'),
          },
        },
      );

      if (response.data?.extensions) {
        setExtensions(response.data.extensions);
      } else {
        throw new Error('Invalid extensions data received');
      }
    } catch (error: any) {
      console.error('Failed to fetch extensions:', error);
      setError({
        type: 'error',
        message: `Failed to load extensions: ${error.message}`,
      });
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, [agent_name]);

  const handleToggleCommand = async (commandName: string, enabled: boolean) => {
    try {
      const result = await axios.patch(
        searchParams.get('mode') === 'company'
          ? `${process.env.NEXT_PUBLIC_AGIXT_SERVER}/v1/companies/${getCookie('agixt-company-id')}/command`
          : `${process.env.NEXT_PUBLIC_AGIXT_SERVER}/api/agent/${agent_name}/command`,

        {
          command_name: commandName,
          enable: enabled,
        },
        {
          headers: {
            Authorization: getCookie('jwt'),
          },
        },
      );

      if (result.status === 200) {
        setExtensions((prev) =>
          prev.map((ext) => ({
            ...ext,
            commands: ext.commands.map((cmd) => (cmd.friendly_name === commandName ? { ...cmd, enabled } : cmd)),
          })),
        );
      }
    } catch (error) {
      console.error('Failed to toggle command:', error);
      setError({
        type: 'error',
        message: 'Failed to toggle command. Please try again.',
      });
    }
  };

  const handleSaveSettings = async (extensionName: string, settings: Record<string, string>) => {
    try {
      setError(null);
      const response = await axios.put<{ status: number; data: any }>(
        `${process.env.NEXT_PUBLIC_AGIXT_SERVER}/api/agent/${agent_name}`,
        {
          agent_name: agent_name,
          settings: settings,
        } as ExtensionSettings,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: getCookie('jwt'),
          },
        },
      );

      if (response.status === 200) {
        setError({
          type: 'success',
          message: 'Extension connected successfully!',
        });
        window.location.reload();
      }
    } catch (error: any) {
      setError({
        type: 'error',
        message: error.response?.data?.detail || error.message || 'Failed to connect extension',
      });
    }
  };

  const handleDisconnect = async (extension: Extension) => {
    const emptySettings = extension.settings.reduce((acc, setting) => ({ ...acc, [setting]: '' }), {});
    await handleSaveSettings(extension.extension_name, emptySettings);
  };

  console.log(providerData);

  const { connectedExtensions, availableExtensions } = categorizeExtensions(extensions);
  const { connectedProviders, availableProviders } = categorizeProviders(Object.values(providerData));
  console.log(connectedProviders, availableProviders);
  return (
    <div className='space-y-6'>
      <Tabs defaultValue='commands' className='space-y-4'>
        <div className='flex items-center gap-2'>
          <TabsList>
            <TabsTrigger value='extensions'>Extensions</TabsTrigger>
            <TabsTrigger value='commands'>Commands</TabsTrigger>
          </TabsList>
          {/* {activeCompany?.my_role >= 2 && (
            <>
              <Switch
                id='company-mode'
                checked={searchParams.get('mode') === 'company'}
                onCheckedChange={(checked) => {
                  const params = new URLSearchParams(searchParams);
                  if (checked) {
                    params.set('mode', 'company');
                  } else {
                    params.delete('mode');
                  }
                  router.push(`${pathname}?${params.toString()}`);
                }}
              />
              <Label htmlFor='company-mode'>Company Mode</Label>
            </>
          )} */}
        </div>
        <TabsContent value='commands' className='space-y-4'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-medium'>Enabled Commands</h3>
            <div className='flex items-center gap-2'>
              <Label htmlFor='show-enabled-only'>Show Enabled Only</Label>
              <Switch id='show-enabled-only' checked={showEnabledOnly} onCheckedChange={setShowEnabledOnly} />
            </div>
          </div>

          {extensionsWithCommands.length === 0 ? (
            <Alert>
              <AlertDescription>No extensions are currently enabled. Enable extensions to see them here.</AlertDescription>
            </Alert>
          ) : (
            <div className='grid gap-4'>
              {extensionsWithCommands
                .sort((a, b) => a.extension_name.localeCompare(b.extension_name))
                .map((extension) => (
                  <Card key={extension.extension_name}>
                    <CardHeader>
                      <CardTitle>{extension.extension_name}</CardTitle>
                      <CardDescription>
                        <MarkdownBlock content={extension.description || 'No description available'} />
                      </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      {extension.commands
                        .filter((command) => !showEnabledOnly || command.enabled)
                        .map((command) => (
                          <Card key={command.command_name} className='p-4 border border-border/50'>
                            <div className='flex items-center mb-2'>
                              <Switch
                                checked={command.enabled}
                                onCheckedChange={(checked) => handleToggleCommand(command.friendly_name, checked)}
                              />
                              <h4 className='text-lg font-medium'>&nbsp;&nbsp;{command.friendly_name}</h4>
                            </div>
                            <MarkdownBlock content={command.description?.split('\nArgs')[0] || 'No description available'} />
                          </Card>
                        ))}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value='extensions' className='space-y-4'>
          {searchParams.get('mode') !== 'company' && <ConnectedServices />}
          <div className='grid gap-4'>
            {connectedExtensions.map((extension) => (
              <Extension
                key={extension.extension_name}
                extension={extension}
                connected
                onDisconnect={handleDisconnect}
                settings={settings}
                onConnect={handleSaveSettings}
                setSettings={setSettings}
                error={error}
                setSelectedExtension={setSelectedExtension}
              />
            ))}

            {availableExtensions.map((extension) => (
              <Extension
                key={extension.extension_name}
                extension={extension}
                onDisconnect={handleDisconnect}
                connected={false}
                onConnect={handleSaveSettings}
                settings={settings}
                setSettings={setSettings}
                error={error}
                setSelectedExtension={setSelectedExtension}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Extensions;
