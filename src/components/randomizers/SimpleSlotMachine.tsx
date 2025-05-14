import React, { useState, useEffect } from 'react';
import { SlotMachine, SlotItem } from './SlotMachine';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { WinnerHistory } from '../history/WinnerHistory';
import { getThemeOptions, RandomizerTheme, BUILT_IN_THEMES } from '@/services/randomizer-theme';

interface SimpleSlotMachineProps {
  onSaveResult?: (results: string[]) => void;
  initialTheme?: string;
}

export function SimpleSlotMachine({
  onSaveResult,
  initialTheme = 'default'
}: SimpleSlotMachineProps) {
  const [items, setItems] = useState<SlotItem[]>([
    { id: '1', label: 'Option 1' },
    { id: '2', label: 'Option 2' },
    { id: '3', label: 'Option 3' },
    { id: '4', label: 'Option 4' }
  ]);
  const [columns, setColumns] = useState(3);
  const [newItemText, setNewItemText] = useState('');

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<string>(initialTheme);
  const [themeOptions, setThemeOptions] = useState<Array<{ value: string, label: string }>>([]);

  // Load theme options
  useEffect(() => {
    const options = getThemeOptions();
    setThemeOptions(options);
  }, []);
  
  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        label: newItemText.trim()
      }
    ]);
    setNewItemText('');
  };
  
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };
  
  const handleSpinEnd = (results: SlotItem[]) => {
    if (onSaveResult) {
      onSaveResult(results.map(result => result.label));
    }
  };
  
  return (
    <div className="p-4 flex flex-col items-center">
      <Card className="w-full max-w-md mb-4">
        <CardHeader>
          <CardTitle>Slot Machine Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add new option"
              className="flex-1"
            />
            <Button onClick={handleAddItem}>Add</Button>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm">Columns:</span>
            <Select
              value={columns.toString()}
              onValueChange={(value) => setColumns(parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="max-h-40 overflow-y-auto">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center p-2 border-b">
                <span>{item.label}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-destructive"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Theme selection */}
      <Card className="w-full max-w-md mb-4">
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>Customize the appearance of your slot machine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select
                value={currentTheme}
                onValueChange={setCurrentTheme}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <SlotMachine
        items={items}
        columns={columns}
        onSpinEnd={handleSpinEnd}
        theme={currentTheme}
      />

      {/* Winner history */}
      <Card className="w-full max-w-md mt-4">
        <CardHeader>
          <CardTitle>Winner History</CardTitle>
        </CardHeader>
        <CardContent>
          <WinnerHistory maxRecentWinners={5} />
        </CardContent>
      </Card>
    </div>
  );
}