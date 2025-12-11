const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// In-memory cart storage (in production, use Redis or database)
// For now, we'll use a simple approach with user sessions
let carts = {};

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const cart = carts[userId] || [];

    res.json({
      success: true,
      data: cart,
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId, name, price, image, quantity } = req.body;

    if (!carts[userId]) {
      carts[userId] = [];
    }

    const existingItem = carts[userId].find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity || 1;
    } else {
      carts[userId].push({
        productId,
        name,
        price,
        image,
        quantity: quantity || 1
      });
    }

    res.json({
      success: true,
      data: carts[userId],
      message: 'Item added to cart'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/cart/:productId
// @desc    Update cart item quantity
// @access  Private
router.put('/:productId', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!carts[userId]) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = carts[userId].find(item => item.productId === productId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    if (quantity <= 0) {
      carts[userId] = carts[userId].filter(item => item.productId !== productId);
    } else {
      item.quantity = quantity;
    }

    res.json({
      success: true,
      data: carts[userId]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/cart/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { productId } = req.params;

    if (!carts[userId]) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    carts[userId] = carts[userId].filter(item => item.productId !== productId);

    res.json({
      success: true,
      data: carts[userId],
      message: 'Item removed from cart'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    carts[userId] = [];

    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;

