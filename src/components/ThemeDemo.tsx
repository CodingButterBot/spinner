import { ThemeSwitcher } from './ThemeSwitcher';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Slider } from '../components/ui/slider';

export function ThemeDemo() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">SpinPick Theme Demo</h1>
        <ThemeSwitcher />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Color Palette */}
        <div className="space-y-4 p-4 bg-surface rounded-lg border border-border">
          <h2 className="text-lg font-semibold">Color Palette</h2>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-primary rounded-md"></div>
              <div>
                <div className="font-medium">Primary</div>
                <div className="text-sm text-foreground/60">bg-primary</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-primary-light rounded-md"></div>
              <div>
                <div className="font-medium">Primary Light</div>
                <div className="text-sm text-foreground/60">bg-primary-light</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-primary-dark rounded-md"></div>
              <div>
                <div className="font-medium">Primary Dark</div>
                <div className="text-sm text-foreground/60">bg-primary-dark</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-secondary rounded-md"></div>
              <div>
                <div className="font-medium">Secondary</div>
                <div className="text-sm text-foreground/60">bg-secondary</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-background rounded-md border border-border"></div>
              <div>
                <div className="font-medium">Background</div>
                <div className="text-sm text-foreground/60">bg-background</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-surface rounded-md border border-border"></div>
              <div>
                <div className="font-medium">Surface</div>
                <div className="text-sm text-foreground/60">bg-surface</div>
              </div>
            </div>
          </div>
        </div>

        {/* UI Components */}
        <div className="space-y-6 p-4 bg-surface rounded-lg border border-border">
          <h2 className="text-lg font-semibold">UI Components</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Buttons</h3>
              <div className="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Input Fields</h3>
              <div className="space-y-2">
                <Input placeholder="Enter text here..." />
                <div className="flex items-center space-x-2">
                  <Switch id="theme-mode" />
                  <label htmlFor="theme-mode">Enable Dark Mode</label>
                </div>
                <div>
                  <span className="text-sm mb-2 block">Volume</span>
                  <Slider defaultValue={[50]} max={100} step={1} />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Navigation</h3>
              <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="account" className="p-2 bg-background/50 rounded mt-2">
                  Account settings tab
                </TabsContent>
                <TabsContent value="settings" className="p-2 bg-background/50 rounded mt-2">
                  General settings tab
                </TabsContent>
                <TabsContent value="history" className="p-2 bg-background/50 rounded mt-2">
                  History tab
                </TabsContent>
              </Tabs>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Badges</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Theme Implementation Details</h2>
          <p className="text-sm text-foreground/80">
            This demo showcases SpinPick's comprehensive theming system with both light and dark modes.
            The theme controls all UI elements through CSS variables, ensuring consistent styling across
            the application. Use this as a reference for seeing how components adapt to the current theme.
          </p>
          <div className="mt-4 bg-primary/10 p-2 rounded text-sm">
            <p>The theme system uses Tailwind CSS custom properties for all colors and styles.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}