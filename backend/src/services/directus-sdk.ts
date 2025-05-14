/**
 * Directus API service using @directus/sdk
 * Provides secure server-side methods to interact with Directus
 */

import { createDirectus, rest, staticToken, readItems, createItem, updateItem, deleteItem } from '@directus/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DIRECTUS_BASE_URL = process.env.DIRECTUS_BASE_URL || 'http://localhost:8082';
const DIRECTUS_ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;

// Define Directus collection schemas
export interface Theme {
  id?: string | number;
  name: string;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  user: string;
}

export interface SpinResult {
  id?: string | number;
  result: string;
  timestamp: string;
  type: 'wheel' | 'slot';
  user: string;
}

export interface CSVMapping {
  id?: string | number;
  name: string;
  name_column: string;
  ticket_column: string;
  email_column?: string;
  additional_columns?: Record<string, string>;
  has_header_row: boolean;
  delimiter: string;
  user: string;
  created_at?: string;
  updated_at?: string;
}

export interface CSVImport {
  id?: string | number;
  filename: string;
  mapping_id: string;
  data: any[];
  row_count: number;
  user: string;
  imported_at: string;
}

// Define schema for Directus client
interface Schema {
  themes: Theme;
  spin_results: SpinResult;
  csv_mappings: CSVMapping;
  csv_imports: CSVImport;
}

// Initialize Directus client with SDK
const directusClient = createDirectus<Schema>(DIRECTUS_BASE_URL)
  .with(staticToken(DIRECTUS_ADMIN_TOKEN || ''))
  .with(rest());

/**
 * Directus service class providing methods to interact with Directus API using SDK
 */
export class DirectusService {
  /**
   * Create a new collection in Directus
   * @param collectionName - Name of the collection to create
   * @param fields - Fields configuration for the collection
   */
  async createCollection(collectionName: string, fields: any) {
    try {
      // Using traditional fetch for collection creation since SDK doesn't expose this functionality directly
      const response = await fetch(`${DIRECTUS_BASE_URL}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          collection: collectionName,
          meta: {
            icon: 'box',
            note: `Collection for ${collectionName}`
          },
          schema: {
            name: collectionName
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create collection: ${response.statusText}`);
      }

      // Add fields to the collection
      for (const [fieldName, fieldConfig] of Object.entries(fields)) {
        const fieldResponse = await fetch(`${DIRECTUS_BASE_URL}/fields`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}`
          },
          body: JSON.stringify({
            collection: collectionName,
            field: fieldName,
            type: fieldConfig.type,
            meta: {
              interface: fieldConfig.interface || 'input',
              special: fieldConfig.special || null,
              options: fieldConfig.options || null,
              display: fieldConfig.display || null,
              display_options: fieldConfig.display_options || null,
              readonly: fieldConfig.readonly || false,
              hidden: fieldConfig.hidden || false,
              width: fieldConfig.width || 'full',
              note: fieldConfig.note || null
            },
            schema: {
              is_nullable: fieldConfig.required === true ? false : true,
              default_value: fieldConfig.default_value || null
            }
          })
        });

        if (!fieldResponse.ok) {
          throw new Error(`Failed to create field ${fieldName}: ${fieldResponse.statusText}`);
        }
      }
      
      return { success: true, message: `Collection ${collectionName} created successfully` };
    } catch (error: any) {
      console.error('Error creating collection:', error);
      return { 
        success: false, 
        message: 'Failed to create collection', 
        error: error.response?.data || error.message 
      };
    }
  }
  
  /**
   * Create a new item in a collection
   * @param collectionName - Name of the collection
   * @param itemData - Data for the new item
   */
  async createItem<T extends keyof Schema>(collectionName: T, itemData: Partial<Schema[T]>) {
    try {
      const response = await createItem(directusClient, collectionName, itemData);
      return { success: true, data: response };
    } catch (error: any) {
      console.error(`Error creating item in ${collectionName}:`, error);
      return { 
        success: false, 
        message: `Failed to create item in ${collectionName}`, 
        error: error.response?.data || error.message 
      };
    }
  }
  
  /**
   * Get items from a collection
   * @param collectionName - Name of the collection
   * @param query - Query parameters (filter, sort, limit, etc.)
   */
  async getItems<T extends keyof Schema>(collectionName: T, query: Record<string, any> = {}) {
    try {
      const response = await readItems(directusClient, collectionName, {
        filter: query.filter,
        sort: query.sort,
        limit: query.limit,
        offset: query.offset,
        fields: query.fields
      });
      
      return { success: true, data: response };
    } catch (error: any) {
      console.error(`Error getting items from ${collectionName}:`, error);
      return { 
        success: false, 
        message: `Failed to get items from ${collectionName}`, 
        error: error.response?.data || error.message 
      };
    }
  }
  
  /**
   * Update an item in a collection
   * @param collectionName - Name of the collection
   * @param id - ID of the item to update
   * @param itemData - New data for the item
   */
  async updateItem<T extends keyof Schema>(collectionName: T, id: string | number, itemData: Partial<Schema[T]>) {
    try {
      const response = await updateItem(directusClient, collectionName, id, itemData);
      return { success: true, data: response };
    } catch (error: any) {
      console.error(`Error updating item in ${collectionName}:`, error);
      return { 
        success: false, 
        message: `Failed to update item in ${collectionName}`, 
        error: error.response?.data || error.message 
      };
    }
  }
  
  /**
   * Delete an item from a collection
   * @param collectionName - Name of the collection
   * @param id - ID of the item to delete
   */
  async deleteItem<T extends keyof Schema>(collectionName: T, id: string | number) {
    try {
      await deleteItem(directusClient, collectionName, id);
      return { success: true, message: `Item deleted from ${collectionName}` };
    } catch (error: any) {
      console.error(`Error deleting item from ${collectionName}:`, error);
      return { 
        success: false, 
        message: `Failed to delete item from ${collectionName}`, 
        error: error.response?.data || error.message 
      };
    }
  }
  
  /**
   * Get user profile
   * @param userId - Optional user ID (uses current user if not provided)
   */
  async getUserProfile(userId?: string) {
    try {
      // For SDK, we use the users collection directly
      const endpoint = userId ? 'users' : 'users/me';
      const response = await fetch(`${DIRECTUS_BASE_URL}/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get user profile: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error: any) {
      console.error('Error getting user profile:', error);
      return { 
        success: false, 
        message: 'Failed to get user profile', 
        error: error.response?.data || error.message 
      };
    }
  }
  
  /**
   * Create a theme for a user
   * @param userId - User ID
   * @param themeData - Theme configuration data
   */
  async createUserTheme(userId: string, themeData: Omit<Theme, 'user'>) {
    try {
      const response = await createItem(directusClient, 'themes', {
        ...themeData,
        user: userId
      });
      
      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error creating user theme:', error);
      return { 
        success: false, 
        message: 'Failed to create user theme', 
        error: error.response?.data || error.message 
      };
    }
  }
  
  /**
   * Get user themes
   * @param userId - User ID
   */
  async getUserThemes(userId: string) {
    try {
      const response = await readItems(directusClient, 'themes', {
        filter: {
          user: { _eq: userId }
        }
      });

      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error getting user themes:', error);
      return {
        success: false,
        message: 'Failed to get user themes',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get user CSV mappings
   * @param userId - User ID
   */
  async getUserCSVMappings(userId: string) {
    try {
      const response = await readItems(directusClient, 'csv_mappings', {
        filter: {
          user: { _eq: userId }
        },
        sort: ['-created_at']
      });

      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error getting user CSV mappings:', error);
      return {
        success: false,
        message: 'Failed to get user CSV mappings',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Create a CSV mapping configuration
   * @param userId - User ID
   * @param mappingData - CSV mapping configuration data
   */
  async createCSVMapping(userId: string, mappingData: Omit<CSVMapping, 'user'>) {
    try {
      const response = await createItem(directusClient, 'csv_mappings', {
        ...mappingData,
        user: userId
      });

      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error creating CSV mapping:', error);
      return {
        success: false,
        message: 'Failed to create CSV mapping',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Save imported CSV data
   * @param userId - User ID
   * @param mappingId - Mapping configuration ID
   * @param filename - Original CSV filename
   * @param data - Processed CSV data
   */
  async saveCSVImport(userId: string, mappingId: string, filename: string, data: any[]) {
    try {
      const response = await createItem(directusClient, 'csv_imports', {
        user: userId,
        mapping_id: mappingId,
        filename,
        data,
        row_count: data.length,
        imported_at: new Date().toISOString()
      });

      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error saving CSV import:', error);
      return {
        success: false,
        message: 'Failed to save CSV import',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get user's CSV imports
   * @param userId - User ID
   * @param limit - Optional limit for number of imports to return
   */
  async getUserCSVImports(userId: string, limit?: number) {
    try {
      const params: any = {
        filter: {
          user: { _eq: userId }
        },
        sort: ['-imported_at']
      };

      if (limit) {
        params.limit = limit;
      }

      const response = await readItems(directusClient, 'csv_imports', params);

      return { success: true, data: response };
    } catch (error: any) {
      console.error('Error getting user CSV imports:', error);
      return {
        success: false,
        message: 'Failed to get user CSV imports',
        error: error.response?.data || error.message
      };
    }
  }
  
  /**
   * Initialize required collections for the application
   * Creates user themes, spin results, and CSV mappings collections if they don't exist
   */
  async initializeCollections() {
    try {
      // Checking for themes collection
      try {
        // Using traditional fetch since SDK doesn't expose this functionality directly
        const response = await fetch(`${DIRECTUS_BASE_URL}/collections/themes`, {
          headers: { 'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}` }
        });
        
        if (response.ok) {
          console.log('Themes collection already exists');
        } else if (response.status === 404) {
          // Create themes collection
          await this.createCollection('themes', {
            id: {
              type: 'integer',
              interface: 'input',
              special: ['uuid'],
              primary: true
            },
            name: {
              type: 'string',
              interface: 'input',
              required: true
            },
            primary_color: {
              type: 'string',
              interface: 'color',
              note: 'Primary theme color'
            },
            secondary_color: {
              type: 'string',
              interface: 'color',
              note: 'Secondary theme color'
            },
            background_color: {
              type: 'string',
              interface: 'color',
              note: 'Background color'
            },
            text_color: {
              type: 'string',
              interface: 'color',
              note: 'Main text color'
            },
            user: {
              type: 'uuid',
              interface: 'select-dropdown-m2o',
              special: ['m2o'],
              options: {
                template: '{{first_name}} {{last_name}}'
              },
              required: true
            }
          });
          console.log('Created themes collection');
        } else {
          throw new Error(`Unexpected status when checking themes collection: ${response.status}`);
        }
      } catch (error) {
        console.error('Error checking/creating themes collection:', error);
      }

      // Check if spin_results collection exists
      try {
        const response = await fetch(`${DIRECTUS_BASE_URL}/collections/spin_results`, {
          headers: { 'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}` }
        });
        
        if (response.ok) {
          console.log('Spin results collection already exists');
        } else if (response.status === 404) {
          // Create spin_results collection
          await this.createCollection('spin_results', {
            id: {
              type: 'integer',
              interface: 'input',
              special: ['uuid'],
              primary: true
            },
            result: {
              type: 'string',
              interface: 'input',
              required: true,
              note: 'The result of the spin'
            },
            timestamp: {
              type: 'timestamp',
              interface: 'datetime',
              required: true,
              options: {
                includeSeconds: true
              }
            },
            type: {
              type: 'string',
              interface: 'select-dropdown',
              options: {
                choices: [
                  { text: 'Wheel', value: 'wheel' },
                  { text: 'Slot Machine', value: 'slot' }
                ]
              },
              required: true
            },
            user: {
              type: 'uuid',
              interface: 'select-dropdown-m2o',
              special: ['m2o'],
              options: {
                template: '{{first_name}} {{last_name}}'
              },
              required: true
            }
          });
          console.log('Created spin_results collection');
        } else {
          throw new Error(`Unexpected status when checking spin_results collection: ${response.status}`);
        }
      } catch (error) {
        console.error('Error checking/creating spin_results collection:', error);
      }

      // Check if csv_mappings collection exists
      try {
        const response = await fetch(`${DIRECTUS_BASE_URL}/collections/csv_mappings`, {
          headers: { 'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}` }
        });
        
        if (response.ok) {
          console.log('CSV mappings collection already exists');
        } else if (response.status === 404) {
          // Create csv_mappings collection
          await this.createCollection('csv_mappings', {
            id: {
              type: 'integer',
              interface: 'input',
              special: ['uuid'],
              primary: true
            },
            name: {
              type: 'string',
              interface: 'input',
              required: true,
              note: 'Name of this mapping configuration (e.g., "Ticket System A")'
            },
            name_column: {
              type: 'string',
              interface: 'input',
              required: true,
              note: 'CSV column header that contains participant names'
            },
            ticket_column: {
              type: 'string',
              interface: 'input',
              required: true,
              note: 'CSV column header that contains ticket numbers'
            },
            email_column: {
              type: 'string',
              interface: 'input',
              note: 'CSV column header that contains email addresses (optional)'
            },
            additional_columns: {
              type: 'json',
              interface: 'input-code',
              options: {
                language: 'json'
              },
              note: 'Additional column mappings as JSON {columnName: description}'
            },
            has_header_row: {
              type: 'boolean',
              interface: 'boolean',
              default_value: true,
              note: 'Whether the CSV includes a header row'
            },
            delimiter: {
              type: 'string',
              interface: 'select-dropdown',
              options: {
                choices: [
                  { text: 'Comma (,)', value: ',' },
                  { text: 'Semicolon (;)', value: ';' },
                  { text: 'Tab (\\t)', value: '\\t' },
                  { text: 'Pipe (|)', value: '|' }
                ]
              },
              default_value: ',',
              note: 'CSV delimiter character'
            },
            user: {
              type: 'uuid',
              interface: 'select-dropdown-m2o',
              special: ['m2o'],
              options: {
                template: '{{first_name}} {{last_name}}'
              },
              required: true
            },
            created_at: {
              type: 'timestamp',
              interface: 'datetime',
              special: ['date-created'],
              readonly: true
            },
            updated_at: {
              type: 'timestamp',
              interface: 'datetime',
              special: ['date-updated'],
              readonly: true
            }
          });
          console.log('Created csv_mappings collection');
        } else {
          throw new Error(`Unexpected status when checking csv_mappings collection: ${response.status}`);
        }
      } catch (error) {
        console.error('Error checking/creating csv_mappings collection:', error);
      }

      // Check if csv_imports collection exists
      try {
        const response = await fetch(`${DIRECTUS_BASE_URL}/collections/csv_imports`, {
          headers: { 'Authorization': `Bearer ${DIRECTUS_ADMIN_TOKEN}` }
        });
        
        if (response.ok) {
          console.log('CSV imports collection already exists');
        } else if (response.status === 404) {
          // Create csv_imports collection
          await this.createCollection('csv_imports', {
            id: {
              type: 'integer',
              interface: 'input',
              special: ['uuid'],
              primary: true
            },
            filename: {
              type: 'string',
              interface: 'input',
              required: true,
              note: 'Original filename of the imported CSV'
            },
            mapping_id: {
              type: 'uuid',
              interface: 'select-dropdown-m2o',
              special: ['m2o'],
              collection: 'csv_mappings',
              options: {
                template: '{{name}}'
              },
              required: true,
              note: 'The mapping configuration used for this import'
            },
            data: {
              type: 'json',
              interface: 'input-code',
              options: {
                language: 'json'
              },
              note: 'Processed CSV data as JSON array'
            },
            row_count: {
              type: 'integer',
              interface: 'input',
              note: 'Number of rows imported'
            },
            user: {
              type: 'uuid',
              interface: 'select-dropdown-m2o',
              special: ['m2o'],
              options: {
                template: '{{first_name}} {{last_name}}'
              },
              required: true
            },
            imported_at: {
              type: 'timestamp',
              interface: 'datetime',
              special: ['date-created'],
              readonly: true
            }
          });
          console.log('Created csv_imports collection');
        } else {
          throw new Error(`Unexpected status when checking csv_imports collection: ${response.status}`);
        }
      } catch (error) {
        console.error('Error checking/creating csv_imports collection:', error);
      }

      return { success: true, message: 'Collections initialized successfully' };
    } catch (error: any) {
      console.error('Error initializing collections:', error);
      return { 
        success: false, 
        message: 'Failed to initialize collections', 
        error: error.response?.data || error.message 
      };
    }
  }
}

// Export singleton instance
export const directusService = new DirectusService();
export default directusService;