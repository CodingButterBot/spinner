/**
 * SpinPick Backend API Server
 * Provides secure Directus integration and API endpoints for the SpinPick application
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { directusService } from './services/directus';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Directus collections on startup
(async () => {
  try {
    const result = await directusService.initializeCollections();
    console.log('Directus initialization:', result.message);
  } catch (error) {
    console.error('Failed to initialize Directus:', error);
  }
})();

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SpinPick API is running' });
});

// User themes endpoints
app.get('/api/themes/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await directusService.getUserThemes(userId);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error getting user themes:', error);
    res.status(500).json({ error: 'Failed to get user themes' });
  }
});

app.post('/api/themes', async (req, res) => {
  try {
    const { userId, theme } = req.body;
    
    if (!userId || !theme) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await directusService.createUserTheme(userId, theme);
    
    if (result.success) {
      res.status(201).json(result.data);
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error creating theme:', error);
    res.status(500).json({ error: 'Failed to create theme' });
  }
});

// Spin results endpoints
app.get('/api/results/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await directusService.getItems('spin_results', {
      filter: { user: { _eq: userId } },
      sort: ['-timestamp']
    });
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error getting results:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

app.post('/api/results', async (req, res) => {
  try {
    const { userId, result, type } = req.body;

    if (!userId || !result || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const response = await directusService.createItem('spin_results', {
      result: typeof result === 'string' ? result : JSON.stringify(result),
      timestamp: new Date().toISOString(),
      type,
      user: userId
    });

    if (response.success) {
      res.status(201).json(response.data);
    } else {
      res.status(400).json({ error: response.message });
    }
  } catch (error) {
    console.error('Error saving result:', error);
    res.status(500).json({ error: 'Failed to save result' });
  }
});

// CSV Mapping endpoints
app.get('/api/csv/mappings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await directusService.getUserCSVMappings(userId);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error getting CSV mappings:', error);
    res.status(500).json({ error: 'Failed to get CSV mappings' });
  }
});

app.post('/api/csv/mappings', async (req, res) => {
  try {
    const { userId, mappingData } = req.body;

    if (!userId || !mappingData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await directusService.createCSVMapping(userId, mappingData);

    if (result.success) {
      res.status(201).json(result.data);
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error creating CSV mapping:', error);
    res.status(500).json({ error: 'Failed to create CSV mapping' });
  }
});

// CSV Import endpoints
app.get('/api/csv/imports/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const result = await directusService.getUserCSVImports(userId, limit);

    if (result.success) {
      res.json(result.data);
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error getting CSV imports:', error);
    res.status(500).json({ error: 'Failed to get CSV imports' });
  }
});

app.post('/api/csv/imports', async (req, res) => {
  try {
    const { userId, mappingId, filename, data } = req.body;

    if (!userId || !mappingId || !filename || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await directusService.saveCSVImport(userId, mappingId, filename, data);

    if (result.success) {
      res.status(201).json(result.data);
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error saving CSV import:', error);
    res.status(500).json({ error: 'Failed to save CSV import' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`SpinPick API server running on port ${PORT}`);
});

export default app;