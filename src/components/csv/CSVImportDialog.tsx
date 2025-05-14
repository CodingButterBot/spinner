import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { csvService, CSVMapping } from '@/services/csv';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, CheckIcon, XIcon } from 'lucide-react';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onImportComplete?: (data: any[]) => void;
}

export function CSVImportDialog({ open, onOpenChange, userId, onImportComplete }: CSVImportDialogProps) {
  // File input and state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [csvHeaders, setCSVHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  
  // Mapping state
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [savedMappings, setSavedMappings] = useState<CSVMapping[]>([]);
  const [selectedMapping, setSelectedMapping] = useState<string>('');
  const [delimiter, setDelimiter] = useState<',' | ';' | '\\t' | '|'>(',');
  const [hasHeader, setHasHeader] = useState<boolean>(true);
  
  // Column mapping state
  const [nameColumn, setNameColumn] = useState<string>('');
  const [ticketColumn, setTicketColumn] = useState<string>('');
  const [emailColumn, setEmailColumn] = useState<string>('');
  const [mappingName, setMappingName] = useState<string>('');
  const [saveMapping, setSaveMapping] = useState<boolean>(true);
  
  // Processing state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [importedData, setImportedData] = useState<any[]>([]);
  
  // Load saved mappings
  useEffect(() => {
    if (open && userId) {
      loadSavedMappings();
    }
  }, [open, userId]);
  
  // Load saved mappings from API
  const loadSavedMappings = async () => {
    try {
      setLoading(true);
      const mappings = await csvService.getMappings(userId);
      setSavedMappings(mappings);
      
      // If there are saved mappings, select the first one by default
      if (mappings.length > 0) {
        setSelectedMapping(mappings[0].id || '');
        
        // Pre-fill mapping fields
        setMappingName(mappings[0].name);
        setNameColumn(mappings[0].name_column);
        setTicketColumn(mappings[0].ticket_column);
        setEmailColumn(mappings[0].email_column || '');
        setDelimiter(mappings[0].delimiter);
        setHasHeader(mappings[0].has_header_row);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load mappings:', error);
      setError('Failed to load saved mappings');
      setLoading(false);
    }
  };
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (selectedFile) {
      setFile(selectedFile);
      setMappingName(selectedFile.name.split('.')[0]);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFileContent(content);
        
        // Get headers
        const headers = csvService.getCSVHeaders(content, delimiter);
        setCSVHeaders(headers);
        
        // Create preview data (first 5 rows)
        const rows = content.split(/\r?\n/).filter(row => row.trim() !== '');
        const preview = rows.slice(0, Math.min(5, rows.length)).map(
          row => csvService.splitCSVRow(row, delimiter)
        );
        setPreviewData(preview);
        
        // Auto-select columns if headers exist
        if (hasHeader && headers.length > 0) {
          // Try to find name column
          const nameMatch = headers.find(h => 
            /name|full.?name|participant|customer/i.test(h)
          );
          if (nameMatch) setNameColumn(nameMatch);
          
          // Try to find ticket column
          const ticketMatch = headers.find(h => 
            /ticket|id|number|code/i.test(h)
          );
          if (ticketMatch) setTicketColumn(ticketMatch);
          
          // Try to find email column
          const emailMatch = headers.find(h => 
            /email|e.?mail|contact/i.test(h)
          );
          if (emailMatch) setEmailColumn(emailMatch);
        }
        
        // Move to mapping tab
        setActiveTab('mapping');
      };
      
      reader.readAsText(selectedFile);
    }
  };
  
  // Handle mapping selection
  const handleMappingSelect = (mappingId: string) => {
    setSelectedMapping(mappingId);
    
    // Find the selected mapping
    const mapping = savedMappings.find(m => m.id === mappingId);
    
    if (mapping) {
      setNameColumn(mapping.name_column);
      setTicketColumn(mapping.ticket_column);
      setEmailColumn(mapping.email_column || '');
      setDelimiter(mapping.delimiter);
      setHasHeader(mapping.has_header_row);
      setMappingName(mapping.name);
    }
  };
  
  // Handle delimiter change
  const handleDelimiterChange = (value: string) => {
    setDelimiter(value as any);
    
    // Re-parse headers with new delimiter
    if (fileContent) {
      const headers = csvService.getCSVHeaders(fileContent, value);
      setCSVHeaders(headers);
      
      // Update preview data
      const rows = fileContent.split(/\r?\n/).filter(row => row.trim() !== '');
      const preview = rows.slice(0, Math.min(5, rows.length)).map(
        row => csvService.splitCSVRow(row, value as any)
      );
      setPreviewData(preview);
    }
  };
  
  // Handle import
  const handleImport = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate required fields
      if (!nameColumn) {
        setError('Name column is required');
        setLoading(false);
        return;
      }
      
      if (!ticketColumn) {
        setError('Ticket column is required');
        setLoading(false);
        return;
      }
      
      // Create mapping object
      const mapping: CSVMapping = {
        name: mappingName || 'Unnamed Mapping',
        name_column: nameColumn,
        ticket_column: ticketColumn,
        email_column: emailColumn || undefined,
        has_header_row: hasHeader,
        delimiter: delimiter
      };
      
      // Save mapping if requested
      let mappingId = selectedMapping;
      
      if (saveMapping && !selectedMapping) {
        const newMapping = await csvService.createMapping(userId, mapping);
        mappingId = newMapping.id || '';
      }
      
      // Parse CSV data
      const parsedData = csvService.parseCSV(fileContent, mapping);
      
      // Save import if we have a mapping ID
      if (mappingId && file) {
        await csvService.importCSV(userId, mappingId, file.name, parsedData);
      }
      
      // Set imported data
      setImportedData(parsedData);
      
      // Call onImportComplete callback
      if (onImportComplete) {
        onImportComplete(parsedData);
      }
      
      // Move to result tab
      setActiveTab('result');
      setLoading(false);
    } catch (error) {
      console.error('Import failed:', error);
      setError('Failed to import CSV: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setLoading(false);
    }
  };
  
  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state
      setFile(null);
      setFileContent('');
      setCSVHeaders([]);
      setPreviewData([]);
      setActiveTab('upload');
      setSelectedMapping('');
      setDelimiter(',');
      setHasHeader(true);
      setNameColumn('');
      setTicketColumn('');
      setEmailColumn('');
      setMappingName('');
      setSaveMapping(true);
      setError('');
      setImportedData([]);
    }
    
    onOpenChange(newOpen);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import CSV Data</DialogTitle>
          <DialogDescription>
            Import participant data from a CSV file
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="mapping" disabled={!fileContent}>Column Mapping</TabsTrigger>
            <TabsTrigger value="result" disabled={importedData.length === 0}>Result</TabsTrigger>
          </TabsList>
          
          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>Upload CSV File</Label>
                <Input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </div>
              
              <Separator />
              
              {savedMappings.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Label>Use Saved Mapping</Label>
                  <Select value={selectedMapping} onValueChange={handleMappingSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a saved mapping" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedMappings.map(mapping => (
                        <SelectItem key={mapping.id} value={mapping.id || ''}>
                          {mapping.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Select a previously saved column mapping
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Mapping Tab */}
          <TabsContent value="mapping" className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>File Preview</Label>
                <div className="border rounded-md overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        {previewData[0]?.map((_, colIndex) => (
                          <th key={colIndex} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                            {hasHeader && previewData[0] ? previewData[0][colIndex] : `Column ${colIndex + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {previewData.slice(hasHeader ? 1 : 0).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 text-sm">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Delimiter</Label>
                  <Select value={delimiter} onValueChange={handleDelimiterChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=",">Comma (,)</SelectItem>
                      <SelectItem value=";">Semicolon (;)</SelectItem>
                      <SelectItem value="\t">Tab</SelectItem>
                      <SelectItem value="|">Pipe (|)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="has-header"
                    checked={hasHeader}
                    onCheckedChange={setHasHeader}
                  />
                  <Label htmlFor="has-header">First row is header</Label>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Column Mapping</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name-column" className="text-red-500">
                      Name Column *
                    </Label>
                    <Select value={nameColumn} onValueChange={setNameColumn} required>
                      <SelectTrigger id="name-column">
                        <SelectValue placeholder="Select name column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={hasHeader ? header : `${index + 1}`}>
                            {hasHeader ? header : `Column ${index + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="ticket-column" className="text-red-500">
                      Ticket Column *
                    </Label>
                    <Select value={ticketColumn} onValueChange={setTicketColumn} required>
                      <SelectTrigger id="ticket-column">
                        <SelectValue placeholder="Select ticket column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={hasHeader ? header : `${index + 1}`}>
                            {hasHeader ? header : `Column ${index + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email-column">
                      Email Column (Optional)
                    </Label>
                    <Select value={emailColumn} onValueChange={setEmailColumn}>
                      <SelectTrigger id="email-column">
                        <SelectValue placeholder="Select email column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={hasHeader ? header : `${index + 1}`}>
                            {hasHeader ? header : `Column ${index + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="mapping-name">Mapping Name</Label>
                    <Input
                      id="mapping-name"
                      value={mappingName}
                      onChange={(e) => setMappingName(e.target.value)}
                      placeholder="Enter a name for this mapping"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="save-mapping"
                      checked={saveMapping}
                      onCheckedChange={setSaveMapping}
                    />
                    <Label htmlFor="save-mapping">Save this mapping for future use</Label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Result Tab */}
          <TabsContent value="result" className="space-y-4">
            <div className="space-y-4">
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-500">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <AlertTitle>Import successful!</AlertTitle>
                <AlertDescription>
                  Successfully imported {importedData.length} records.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col gap-2">
                <Label>Imported Data Preview</Label>
                <div className="border rounded-md overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          Ticket
                        </th>
                        {emailColumn && (
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                            Email
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {importedData.slice(0, 10).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="px-3 py-2 text-sm">{row.name}</td>
                          <td className="px-3 py-2 text-sm">{row.ticket}</td>
                          {emailColumn && (
                            <td className="px-3 py-2 text-sm">{row.email}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importedData.length > 10 && (
                  <p className="text-sm text-muted-foreground">
                    Showing first 10 of {importedData.length} records
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {error && (
          <Alert variant="destructive">
            <XIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {importedData.length > 0 ? 'Close' : 'Cancel'}
          </Button>
          
          {activeTab === 'upload' && (
            <Button 
              disabled={!fileContent || loading}
              onClick={() => setActiveTab('mapping')}
            >
              Next
            </Button>
          )}
          
          {activeTab === 'mapping' && (
            <Button 
              disabled={!nameColumn || !ticketColumn || loading}
              onClick={handleImport}
            >
              {loading ? 'Importing...' : 'Import'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CSVImportDialog;