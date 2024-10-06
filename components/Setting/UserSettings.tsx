import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { General, Appearance, Overrides, Extensions, ConnectedApps, Security } from './Sections';

type UserSettings = {
  user: any;
  setIsSettingsOpen: any;
  isSettingsOpen: any;
};

const settingsSections = [
  { name: 'General', component: <General /> },
  { name: 'Appearance', component: <Appearance /> },
  { name: 'Extensions', component: <Extensions /> },
  { name: 'Overrides', component: <Overrides /> },
  { name: 'Connected apps', component: <ConnectedApps /> },
];

export function UserSettings({ user, setIsSettingsOpen, isSettingsOpen }) {
  return (
    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
      <DialogContent className='sm:max-w-[800px]'>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue='General' className='flex gap-4'>
          <TabsList className='flex-col justify-start w-48 h-auto bg-transparent'>
            {settingsSections.map(({ name }) => (
              <TabsTrigger key={name} value={name} className='justify-start w-full data-[state=active]:bg-muted rounded-lg'>
                {name}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className='flex-1'>
            {settingsSections.map(({ name, component }) => (
              <TabsContent key={name} value={name} className='mt-0 min-h-96'>
                <h3 className='mb-4 text-lg font-semibold'>{name}</h3>
                {component}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
