const Stripe = require('stripe');

// Initialize Stripe with secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const Donation = require('../models/Donation');
const Donor = require('../models/Donor');
const Homeless = require('../models/Homeless');
const Organization = require('../models/Organization');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const { creditWallet } = require('../services/walletService');

/**
 * @desc    Create a payment intent
 * @route   POST /api/v1/payments/create-payment-intent
 * @access  Private (should be protected in production)
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required',
      });
    }

    // Validate amount is a positive number
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number',
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents (smallest currency unit)
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: metadata || {},
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent',
    });
  }
};

/**
 * @desc    Get payment intent status
 * @route   GET /api/v1/payments/payment-intent/:paymentIntentId
 * @access  Private
 */
const getPaymentIntent = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required',
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.status(200).json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: Math.round(paymentIntent.amount / 100),
        currency: paymentIntent.currency,
        clientSecret: paymentIntent.client_secret,
        metadata: paymentIntent.metadata,
      },
    });
  } catch (error) {
    console.error('Get payment intent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve payment intent',
    }
    );
  }
};

/**
 * @desc    Confirm payment intent
 * @route   POST /api/v1/payments/confirm-payment-intent
 * @access  Private
 */
const confirmPaymentIntent = async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required',
      });
    }

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    res.status(200).json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      },
    });
  } catch (error) {
    console.error('Confirm payment intent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm payment intent',
    });
  }
};

/**
 * @desc    Cancel payment intent
 * @route   POST /api/v1/payments/cancel-payment-intent
 * @access  Private
 */
const cancelPaymentIntent = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required',
      });
    }

    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    res.status(200).json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
      },
    });
  } catch (error) {
    console.error('Cancel payment intent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel payment intent',
    });
  }
};

/**
 * @desc    Handle payment success (webhook-like or app callback)
 * @route   POST /api/v1/payments/success
 * @access  Private
 */
const handlePaymentSuccess = async (req, res) => {
  try {
    const {
      paymentIntentId,
      homelessId,
      donationType = 'Money',
      message = '',
      isAnonymous = false
    } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required',
      });
    }

    if (!homelessId) {
      return res.status(400).json({
        success: false,
        message: 'Homeless ID is required',
      });
    }

    // 1. Verify payment status with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: `Payment not verified. Status: ${paymentIntent.status}`,
      });
    }

    // 2. Check for duplicate donation (idempotency)
    const existingDonation = await Donation.findOne({ transactionId: paymentIntentId });
    if (existingDonation) {
      return res.status(200).json({
        success: true,
        message: 'Donation already recorded',
        data: { donation: existingDonation },
      });
    }

    // 3. Get Donor and Homeless details
    const donor = await Donor.findOne({ userId: req.user._id });
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    const homeless = await Homeless.findById(homelessId);
    if (!homeless) {
      return res.status(404).json({ success: false, message: 'Homeless person not found' });
    }

    // 4. Create Donation Record
    const rawAmount = paymentIntent.amount; // Amount in cents

    // Retrieve the balance transaction to get the fee details
    // Note: The payment intent might not have the balance transaction expand option directly working if it's not fully processed, 
    // but usually retrieval with expand works. 
    // However, for recent payments, we might need to retrieve the charge first or just expand on retrieval.
    const paymentIntentWithCharge = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge.balance_transaction'],
    });

    let fee = 0;
    let net = rawAmount;

    if (paymentIntentWithCharge.latest_charge && paymentIntentWithCharge.latest_charge.balance_transaction) {
      const balanceTransaction = paymentIntentWithCharge.latest_charge.balance_transaction;
      fee = balanceTransaction.fee; // Fee in cents
      net = balanceTransaction.net; // Net amount in cents
    }

    const amount = rawAmount / 100; // Convert cents to base unit
    const feeAmount = fee / 100;    // Convert cents to base unit
    const netAmount = net / 100;    // Convert cents to base unit

    // Calculate split
    let organizationAmount = 0;
    let homelessAmount = netAmount;
    // Amount received
    console.log('--- Amount received ---');
    if (homeless.organizationCutPercentage && homeless.organizationCutPercentage > 0) {
      // Calculate organization cut from NET amount
      const cutPercentage = homeless.organizationCutPercentage;
      organizationAmount = Number((netAmount * (cutPercentage / 100)).toFixed(2));
      homelessAmount = Number((netAmount - organizationAmount).toFixed(2));
    }

    const currency = paymentIntent.currency.toUpperCase();
    console.log('--- Donation Created ---');
    const donation = await Donation.create({
      donationId: `DON-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      donorId: donor._id,
      homelessId: homeless._id,
      organizationId: homeless.organizationId,
      donationType: donationType,
      amount: amount,
      fee: feeAmount,
      netAmount: netAmount,
      organizationAmount: organizationAmount,
      homelessAmount: homelessAmount,
      currency: currency,
      description: message,
      status: 'Completed',
      paymentMethod: 'Card', // Assuming Stripe Card payment
      transactionId: paymentIntentId,
      completedAt: new Date(),
      metadata: {
        isAnonymous,
        stripePaymentIntentId: paymentIntentId
      }
    });

    // 5. Update Donor's total donations
    await donor.updateOne({ $inc: { totalDonations: amount } });

    // oragaization wallet
    console.log('--- oragaization wallet ---');
    // 6. Credit Organization Wallet

    if (organizationAmount > 0) {
      await creditWallet(
        homeless.organizationId,
        organizationAmount,
        donation._id,
        'Donation',
        `Commission from donation ${donation.donationId}`
      );
    }
  //  console.log('--- Notification Process Started ---');
    // 7. Send Notifications
    try {
      console.log('--- Starting Notification Process ---');
      console.log(`Homeless ID: ${homeless._id}, User ID: ${homeless.userId}`);
      console.log(`Organization ID: ${homeless.organizationId}`);

      // Notify Homeless User
      const homelessUser = await User.findById(homeless.userId);
      console.log(`Homeless User found: ${!!homelessUser}`);
      if (homelessUser) {
        console.log(`Homeless FCM Tokens: ${homelessUser.fcmTokens ? homelessUser.fcmTokens.length : 0}`);
      }

      if (homelessUser && homelessUser.fcmTokens && homelessUser.fcmTokens.length > 0) {
        console.log('Sending notification to Homeless User...');
        const response = await NotificationService.sendToMulticast(
          homelessUser.fcmTokens,
          'New Donation Received! 🎉',
          `You received a donation of ${currency} ${homelessAmount}!`,
          {
            type: 'donation',
            donationId: donation._id.toString(),
            amount: homelessAmount.toString(),
            currency: currency
          },
          homelessUser._id
        );
        console.log('Homeless notification response:', response);
      } else {
        console.log('Skipping Homeless notification: No tokens or user not found');
      }

      // Notify Organization User
      console.log(`Organization Amount: ${organizationAmount}`);
      if (organizationAmount > 0) {
        const organization = await Organization.findById(homeless.organizationId);
        console.log(`Organization found: ${!!organization}`);

        if (organization) {
          const organizationUser = await User.findById(organization.userId);
          console.log(`Organization User found: ${!!organizationUser}`);
          if (organizationUser) {
            console.log(`Organization FCM Tokens: ${organizationUser.fcmTokens ? organizationUser.fcmTokens.length : 0}`);
          }

          if (organizationUser && organizationUser.fcmTokens && organizationUser.fcmTokens.length > 0) {
            console.log('Sending notification to Organization User...');
            const orgResponse = await NotificationService.sendToMulticast(
              organizationUser.fcmTokens,
              'Commission Received',
              `You received a commission of ${currency} ${organizationAmount} from a donation to ${homeless.fullName}.`,
              {
                type: 'commission',
                donationId: donation._id.toString(),
                amount: organizationAmount.toString(),
                currency: currency,
                homelessName: homeless.fullName
              },
              organizationUser._id
            );
            console.log('Organization notification response:', orgResponse);
          } else {
            console.log('Skipping Organization notification: No tokens or user not found');
          }
        }
      } else {
        console.log('Skipping Organization notification: No commission amount');
      }
      console.log('--- Notification Process Completed ---');

    } catch (notifyError) {
      console.error('Failed to send notifications:', notifyError);
      // Don't fail the response if notification fails, just log it
    }

    res.status(201).json({
      success: true,
      message: 'Payment verified and donation recorded successfully',
      data: { donation },
    });

  } catch (error) {
    console.error('Handle payment success error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process payment success',
    });
  }
};

module.exports = {
  createPaymentIntent,
  getPaymentIntent,
  confirmPaymentIntent,
  cancelPaymentIntent,
  handlePaymentSuccess,
};

