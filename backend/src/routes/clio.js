import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  completeOneClickBilling, 
  createClient, 
  findOrCreateClient,
  updateConnectionStatus 
} from '../controllers/clioController.js';
import User from '../models/User.js';

const router = express.Router();

// Update Clio connection status
router.put('/connection', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Updating Clio connection status...');
    console.log('Request body:', req.body);
    
    const { isConnectedToClio } = req.body;
    const userId = req.user.userId;
    
    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update connection status
    user.isConnectedToClio = isConnectedToClio;
    
    // If disconnecting, clear Clio tokens
    if (!isConnectedToClio) {
      user.clioTokens = null;
      user.clioId = null;
      console.log('🧹 Cleared Clio tokens for user:', userId);
    }
    
    await user.save();
    
    console.log('✅ Connection status updated successfully for user:', userId);
    
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
});

// Disconnect from Clio
router.post('/disconnect', authenticateToken, async (req, res) => {
  try {
    console.log('🔗 Disconnecting user from Clio...');
    const userId = req.user.userId;
    
    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Clear Clio connection
    user.isConnectedToClio = false;
    user.clioTokens = null;
    user.clioId = null;
    
    await user.save();
    
    console.log('✅ User disconnected from Clio successfully:', userId);
    
    res.json({
      success: true,
      message: 'Disconnected from Clio successfully'
    });
    
  } catch (error) {
    console.error('❌ Disconnect from Clio error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect from Clio'
    });
  }
});

// Complete one-click billing
router.post('/one-click-billing', authenticateToken, async (req, res) => {
  try {
    const result = await completeOneClickBilling(req, res);
    return result;
  } catch (error) {
    console.error('One-click billing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create client
router.post('/create-client', authenticateToken, async (req, res) => {
  try {
    const result = await createClient(req, res);
    return result;
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Find or create client
router.post('/find-or-create-client', authenticateToken, async (req, res) => {
  try {
    const result = await findOrCreateClient(req, res);
    return result;
  } catch (error) {
    console.error('Find or create client error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 