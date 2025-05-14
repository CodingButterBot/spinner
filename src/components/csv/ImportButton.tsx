import React, { useState } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { CSVImportDialog } from './CSVImportDialog';
import { FileUpIcon } from 'lucide-react';

interface ImportButtonProps extends ButtonProps {
  userId: string;
  onImportComplete?: (data: any[]) => void;
  children?: React.ReactNode;
}

export function ImportButton({ 
  userId, 
  onImportComplete, 
  children, 
  ...props 
}: ImportButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <>
      <Button 
        onClick={() => setDialogOpen(true)} 
        {...props}
      >
        {children || (
          <>
            <FileUpIcon className="mr-2 h-4 w-4" />
            Import CSV
          </>
        )}
      </Button>
      
      <CSVImportDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={userId}
        onImportComplete={onImportComplete}
      />
    </>
  );
}

export default ImportButton;