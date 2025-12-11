const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/orders
// @desc    Get all orders (user's own orders or all orders for admin)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    // Users can only see their own orders, admins can see all
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name price image')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name price image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Users can only view their own orders unless they're admin
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { items, deliveryDetails, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    if (!deliveryDetails || !deliveryDetails.fullName || !deliveryDetails.phone || !deliveryDetails.address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all delivery details'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please select a payment method'
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Map cart items to order items format
    // Cart items have productId (string), but Order needs product (ObjectId)
    const orderItems = await Promise.all(items.map(async (item) => {
      let productId = null;
      
      // Try to convert productId to ObjectId if it exists and is valid
      if (item.productId) {
        try {
          // Check if it's a valid ObjectId format
          if (mongoose.Types.ObjectId.isValid(item.productId)) {
            productId = new mongoose.Types.ObjectId(item.productId);
            // Verify product exists
            const product = await Product.findById(productId);
            if (!product) {
              console.warn(`Product not found: ${item.productId}`);
              productId = null;
            }
          } else {
            console.warn(`Invalid productId format: ${item.productId}`);
          }
        } catch (error) {
          console.warn(`Error converting productId: ${error.message}`);
        }
      }
      
      // If no valid productId, try to find product by name
      if (!productId && item.name) {
        try {
          const product = await Product.findOne({ name: item.name });
          if (product) {
            productId = product._id;
          }
        } catch (error) {
          console.warn(`Error finding product by name: ${error.message}`);
        }
      }
      
      // If still no productId, create a dummy ObjectId (product reference is optional)
      if (!productId) {
        productId = new mongoose.Types.ObjectId();
      }
      
      return {
        product: productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      };
    }));

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      deliveryDetails,
      paymentMethod,
      status: 'pending'
    });

    // Populate order with user and product details
    let populatedOrder;
    try {
      populatedOrder = await Order.findById(order._id)
        .populate('user', 'name email')
        .populate('items.product', 'name price image');
    } catch (populateError) {
      // If population fails, return order without populated fields
      console.warn('Error populating order:', populateError);
      populatedOrder = order;
    }

    res.status(201).json({
      success: true,
      data: populatedOrder,
      message: 'Order placed successfully'
    });
  } catch (error) {
    console.error('Order creation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'name email')
     .populate('items.product', 'name price image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order,
      message: 'Order status updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Cancel order
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Users can only cancel their own orders unless they're admin
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Only allow cancellation if order is pending or confirmed
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully'
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

