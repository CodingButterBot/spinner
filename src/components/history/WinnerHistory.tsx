import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { getWinnerHistory, downloadHistoryCSV, clearWinnerHistory, getHistoryByType, WinnerRecord } from '@/services/history';

interface WinnerHistoryProps {
  className?: string;
  maxRecentWinners?: number;
}

/**
 * Component for displaying and managing winner history
 */
export function WinnerHistory({ className = '', maxRecentWinners = 5 }: WinnerHistoryProps) {
  const [history, setHistory] = useState<WinnerRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'wheel' | 'slot'>('all');
  
  // Load history on component mount and when it changes
  useEffect(() => {
    loadHistory();
    
    // Add event listener to refresh history when it changes
    window.addEventListener('winnerHistoryChanged', loadHistory);
    
    return () => {
      window.removeEventListener('winnerHistoryChanged', loadHistory);
    };
  }, [activeTab]);
  
  // Load history based on active tab
  const loadHistory = () => {
    let records;
    
    switch (activeTab) {
      case 'wheel':
        records = getHistoryByType('wheel');
        break;
      case 'slot':
        records = getHistoryByType('slot');
        break;
      default:
        records = getWinnerHistory();
    }
    
    setHistory(records);
  };
  
  // Handle export button click
  const handleExport = () => {
    downloadHistoryCSV();
  };
  
  // Handle clear history button click
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all winner history? This cannot be undone.')) {
      clearWinnerHistory();
      loadHistory();
    }
  };
  
  // Format timestamp for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  // Get icon based on randomizer type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'wheel':
        return '🎡';
      case 'slot':
        return '🎰';
      default:
        return '🏆';
    }
  };
  
  return (
    <div className={`bg-card p-4 border border-border rounded-lg shadow-md ${className}`}>
      <h2 className="text-xl font-bold mb-4 text-foreground">Winner History</h2>
      
      <Tabs defaultValue="all" onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="all" className="flex-1">All Winners</TabsTrigger>
          <TabsTrigger value="wheel" className="flex-1">Wheel</TabsTrigger>
          <TabsTrigger value="slot" className="flex-1">Slot Machine</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {renderHistoryList()}
        </TabsContent>
        
        <TabsContent value="wheel" className="space-y-4">
          {renderHistoryList()}
        </TabsContent>
        
        <TabsContent value="slot" className="space-y-4">
          {renderHistoryList()}
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between mt-4">
        <Button 
          variant="outline" 
          onClick={handleExport}
          disabled={history.length === 0}
        >
          Export CSV
        </Button>
        
        <Button 
          variant="destructive" 
          onClick={handleClearHistory}
          disabled={history.length === 0}
        >
          Clear History
        </Button>
      </div>
    </div>
  );
  
  // Helper function to render history list
  function renderHistoryList() {
    if (history.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No winner history found. Start spinning to record winners!
        </div>
      );
    }
    
    return (
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
        {history.map((record) => (
          <div 
            key={record.id} 
            className="p-3 bg-background border border-border rounded-md flex items-start"
          >
            <div className="text-2xl mr-3 mt-1">
              {getTypeIcon(record.randomizerType)}
            </div>
            
            <div className="flex-1">
              <div className="font-medium text-foreground">{record.label}</div>
              <div className="text-sm text-muted-foreground">{formatDate(record.timestamp)}</div>
              {record.detail && (
                <div className="text-sm text-muted-foreground mt-1 italic">{record.detail}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
}