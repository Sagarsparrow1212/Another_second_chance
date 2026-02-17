const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createPaymentIntent,
  getPaymentIntent,
  confirmPaymentIntent,
  cancelPaymentIntent,
  handlePaymentSuccess,
} = require('../controllers/paymentController');

/**
 * @route   POST /api/v1/payments/create-payment-intent
 * @desc    Create a new payment intent for Stripe
 * @access  Private (donor, organization)
 */
router.post('/create-payment-intent', protect, authorize('donor', 'organization', 'admin'), createPaymentIntent);

/**
 * @route   GET /api/v1/payments/payment-intent/:paymentIntentId
 * @desc    Get payment intent status by ID
 * @access  Private
 */
router.get('/payment-intent/:paymentIntentId', protect, getPaymentIntent);

/**
 * @route   POST /api/v1/payments/confirm-payment-intent
 * @desc    Confirm a payment intent
 * @access  Private
 */
router.post('/confirm-payment-intent', protect, authorize('donor', 'organization', 'admin'), confirmPaymentIntent);

/**
 * @route   POST /api/v1/payments/cancel-payment-intent
 * @desc    Cancel a payment intent
 * @access  Private
 */
router.post('/cancel-payment-intent', protect, authorize('donor', 'organization', 'admin'), cancelPaymentIntent);

/**
 * @route   POST /api/v1/payments/success
 * @desc    Handle successful payment and create donation
 * @access  Private
 */
router.post('/success', protect, authorize('donor', 'organization', 'admin'), handlePaymentSuccess);



module.exports = router;
