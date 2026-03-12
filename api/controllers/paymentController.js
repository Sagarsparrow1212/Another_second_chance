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
const { creditWallet, debitWallet } = require('../services/walletService');

/**
 * @desc    Create a payment intent
 * @route   POST /api/v1/payments/create-payment-intent
 * @access  Private (should be protected in production)
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata, organization_id } = req.body;
    console.log('organization_id', organization_id);
    // find homeless user to organization 
    const homeless = await Homeless.findById(organization_id);
    console.log('homeless', homeless);

    if (!homeless) {
      return res.status(404).json({
        success: false,
        message: 'Homeless user not found',
      });
    }
    const organization = await Organization.findById(homeless.organizationId);
    console.log('organization', organization);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }
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

    // Calculate org's cut (platform keeps this; org Stripe account gets the rest)
    const cutPercentage = homeless.organizationCutPercentage || 0;
    const applicationFeeAmount = 0;

    // Create payment intent
    const paymentIntentParams = {
      amount: Math.round(amount * 100), // Convert to cents (smallest currency unit)
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },

      transfer_data: {
        destination: organization.stripeAccountId, // homeless share goes to org Stripe account

      },
      metadata: metadata || {},
    };

    // Only set application_fee_amount if org takes a cut
    if (applicationFeeAmount >= 0) {
      paymentIntentParams.application_fee_amount = applicationFeeAmount;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

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

    // 6. Credit Wallets
    console.log('--- Crediting Wallets ---');

    // Credit Organization Wallet with their cut only
    if (organizationAmount > 0) {
      await creditWallet(
        homeless.organizationId,
        organizationAmount + homelessAmount,
        donation._id,
        'Commission',
        `Commission from donation ${donation.donationId}`
      );
    }

    // Note: homelessAmount is stored in the Donation record (donation.homelessAmount).
    // The Wallet model only supports organizations, so the homeless share is
    // tracked via the Donation document and managed/disbursed by the organization.
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
/**
 * @desc    Get Stripe Account Status
 * @route   GET /api/v1/payments/account/:accountId
 * @access  Private
 */
const getAccountStatus = async (req, res) => {
  try {
    const { accountId } = req.params;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID is required',
      });
    }

    const account = await stripe.accounts.retrieve(accountId);

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error('Get account status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve acccount status',
    });
  }
};

/**
 * @desc    Get Stripe onboarding link for an organization's Connect account
 * @route   GET /api/v1/payments/onboarding-link
 * @access  Private - Organization role only
 */
const getOnboardingLink = async (req, res) => {
  try {
    // Find the organization linked to the authenticated user
    const organization = await Organization.findOne({
      userId: req.user._id,
      isDeleted: false,
    }).lean();

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found for this user',
      });
    }

    if (!organization.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'No Stripe account found for this organization. Please register first.',
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: organization.stripeAccountId,
      refresh_url: `${process.env.FRONTEND_URL || 'https://yourapp.com'}/stripe/refresh`,
      return_url: `${process.env.FRONTEND_URL || 'https://yourapp.com'}/stripe/return`,
      type: 'account_onboarding',
    });

    res.status(200).json({
      success: true,
      data: {
        url: accountLink.url,
        stripeAccountId: organization.stripeAccountId,
        expiresAt: accountLink.expires_at,
      },
      message: 'Onboarding link generated successfully',
    });
  } catch (error) {
    console.error('Get onboarding link error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate onboarding link',
    });
  }
};

/**
 * @desc    Withdraw funds from organization Stripe account to bank account
 * @route   POST /api/v1/payments/withdraw
 * @access  Private - Organization role only
 */
const withdrawFunds = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid amount is required for withdrawal',
      });
    }

    // Find the organization linked to the authenticated user
    const organization = await Organization.findOne({
      userId: req.user._id,
      isDeleted: false,
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found for this user',
      });
    }

    if (!organization.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Stripe account not connected. Please complete onboarding first.',
      });
    }

    // Create payout
    // Note: This draws from the organization's Stripe balance
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100), // convert to cents
        currency: 'usd',
      },
      {
        stripeAccount: organization.stripeAccountId, // connected account
      }
    );

    // Record the withdrawal in the organization's wallet
    await debitWallet(
      organization._id,
      amount,
      payout.id,
      'Payout',
      `Withdrawal to bank account (Stripe Payout: ${payout.id})`
    );

    res.status(200).json({
      success: true,
      data: {
        payoutId: payout.id,
        amount: payout.amount / 100,
        currency: payout.currency,
        status: payout.status,
        arrivalDate: new Date(payout.arrival_date * 1000),
      },
      message: 'Withdrawal initiated successfully',
    });
  } catch (error) {
    console.error('Withdraw funds error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate withdrawal',
    });
  }
};

/**
 * @desc    Get Stripe Connect balance by account ID
 * @route   GET /api/v1/payments/connect-balance/:accountId
 * @access  Private
 */
const getConnectBalance = async (req, res) => {
  try {
    const { accountId } = req.params;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID is required',
      });
    }
    
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    res.status(200).json({
      success: true,
      data: {
        available: balance.available[0].amount / 100,
        pending: balance.pending[0].amount / 100,
        currency: balance.available[0].currency,
      },
    });

  } catch (error) {
    console.error('Get connect balance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve connect balance',
    });
  }
};

module.exports = {
  createPaymentIntent,
  getPaymentIntent,
  confirmPaymentIntent,
  cancelPaymentIntent,
  handlePaymentSuccess,
  getAccountStatus,
  getOnboardingLink,
  withdrawFunds,
  getConnectBalance,
};
