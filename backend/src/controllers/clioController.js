import * as clioService from '../services/clioService.js';
import * as aiService from '../services/gptService.js';
import Summary from '../models/Summary.js';
import TimeLog from '../models/TimeLog.js';
import { log } from '../utils/logger.js';

// Update Clio connection status
export const updateConnectionStatus = async (req, res) => {
  try {
    console.log('🔄 Updating Clio connection status...');
    console.log('User ID:', req.user.userId);
    console.log('Request body:', req.body);
    
    const { isConnectedToClio } = req.body;
    
    // This function is mainly for updating the connection status in the database
    // The actual connection is handled by the OAuth flow
    res.json({
      success: true,
      message: 'Connection status updated successfully',
      isConnectedToClio: isConnectedToClio
    });
    
  } catch (error) {
    console.error('❌ Update connection status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update connection status'
    });
  }
};

// Fetch Clio clients
export const fetchClients = async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 100 } = req.query;
    
    const clients = await clioService.fetchClients(userId, parseInt(limit));
    
    res.json({
      success: true,
      clients,
      count: clients.length
    });
    
  } catch (error) {
    log('Fetch clients error:', error);
    res.status(500).json({ error: 'Failed to fetch Clio clients' });
  }
};

// Fetch Clio matters
export const fetchMatters = async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 100 } = req.query;
    
    const matters = await clioService.fetchMatters(userId, parseInt(limit));
    
    res.json({
      success: true,
      matters,
      count: matters.length
    });
    
  } catch (error) {
    log('Fetch matters error:', error);
    res.status(500).json({ error: 'Failed to fetch Clio matters' });
  }
};

// Log time entry to Clio
export const logTimeEntry = async (req, res) => {
  try {
    const { userId } = req.user;
    const { 
      emailId, 
      summaryId, 
      matterId, 
      clientId, 
      description, 
      duration, 
      date 
    } = req.body;
    
    if (!emailId || !summaryId || !matterId || !description || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create summary record
    const summary = new Summary({
      email: emailId,
      user: userId,
      content: description,
      status: 'confirmed',
      model: 'template'
    });
    
    await summary.save();
    
    // Log time entry to Clio
    const clioResponse = await clioService.logTimeEntry(userId, {
      matterId,
      description,
      duration: parseInt(duration),
      date: date || new Date().toISOString().split('T')[0]
    });
    
    // Save time log record
    const timeLog = new TimeLog({
      user: userId,
      summary: summary._id,
      client: clientId,
      matter: matterId,
      clioLogId: clioResponse.data?.id,
      status: 'logged',
      duration: parseInt(duration),
      logTime: new Date()
    });
    
    await timeLog.save();
    
    res.json({
      success: true,
      timeLog: {
        id: timeLog._id,
        clioLogId: timeLog.clioLogId,
        description,
        duration,
        status: timeLog.status
      },
      message: 'Time entry logged successfully'
    });
    
  } catch (error) {
    log('Log time entry error:', error);
    res.status(500).json({ error: 'Failed to log time entry' });
  }
};

// Get time entries
export const getTimeEntries = async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 50 } = req.query;
    
    const timeEntries = await clioService.getTimeEntries(userId, parseInt(limit));
    
    res.json({
      success: true,
      timeEntries,
      count: timeEntries.length
    });
    
  } catch (error) {
    log('Get time entries error:', error);
    res.status(500).json({ error: 'Failed to get time entries' });
  }
};

// Find client by email
export const findClientByEmail = async (req, res) => {
  try {
    const { userId } = req.user;
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email parameter required' });
    }
    
    const client = await clioService.findClientByEmail(userId, email);
    
    res.json({
      success: true,
      client,
      found: !!client
    });
    
  } catch (error) {
    log('Find client by email error:', error);
    res.status(500).json({ error: 'Failed to find client' });
  }
};

// Get Clio profile
export const getClioProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const profile = await clioService.getClioProfile(userId);
    
    res.json({
      success: true,
      profile
    });
    
  } catch (error) {
    log('Get Clio profile error:', error);
    res.status(500).json({ error: 'Failed to get Clio profile' });
  }
};

// Complete one-click billing workflow
export const completeOneClickBilling = async (req, res) => {
  try {
    const { userId } = req.user;
    const { emailData, billingData } = req.body;

    if (!emailData || !billingData) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    console.log('🚀 One-click billing request:', {
      userId,
      emailData,
      billingData
    });

    // Use the existing completeOneClickBilling service
    const result = await clioService.completeOneClickBilling(userId, emailData, billingData);

    if (result.success) {
      res.json({
        success: true,
        message: 'One-click billing completed successfully',
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        data: result
      });
    }

  } catch (error) {
    log('One-click billing error:', error);
    res.status(500).json({ error: 'Failed to complete one-click billing' });
  }
};

// Create a new client in Clio
export const createClient = async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, email, phone, address, company, notes } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    console.log('📝 Create client request:', {
      userId,
      name,
      email,
      phone,
      address,
      company,
      notes
    });

    const clientData = {
      name,
      email,
      phone: phone || '',
      address: address || '',
      company: company || '',
      notes: notes || ''
    };

    const result = await clioService.createClient(userId, clientData);

    res.json({
      success: true,
      message: 'Client created successfully',
      client: result
    });

  } catch (error) {
    log('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
};

// Find or create client by email
export const findOrCreateClient = async (req, res) => {
  try {
    const { userId } = req.user;
    const { email, clientData = {} } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('🔍 Find or create client request:', {
      userId,
      email,
      clientData
    });

    const result = await clioService.findOrCreateClient(userId, email, clientData);

    if (result) {
      res.json({
        success: true,
        message: result.mock ? 'Mock client created (Clio not configured)' : 'Client found or created successfully',
        client: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to find or create client'
      });
    }

  } catch (error) {
    log('Find or create client error:', error);
    res.status(500).json({ error: 'Failed to find or create client' });
  }
}; 