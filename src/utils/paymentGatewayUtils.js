/**
 * Task 66: Implement payment gateway integration
 * Stripe integration for payment processing
 */

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';

export class PaymentGateway {
  constructor(publishableKey = STRIPE_PUBLIC_KEY) {
    this.publishableKey = publishableKey;
    this.stripe = null;
    this.loadStripe();
  }

  /**
   * Load Stripe library
   */
  async loadStripe() {
    try {
      const publishableKey = this.publishableKey || STRIPE_PUBLIC_KEY;
      if (!publishableKey) {
        throw new Error('Stripe public key is not defined. Add VITE_STRIPE_PUBLIC_KEY to your .env file.');
      }
      if (window.Stripe) {
        this.stripe = window.Stripe(publishableKey);
      }
    } catch (error) {
      console.error('Failed to load Stripe:', error);
    }
  }

  /**
   * Create payment intent on backend
   */
  async createPaymentIntent(amount, currency = 'INR', metadata = {}) {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, metadata })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Handle payment confirmation
   */
  async confirmPayment(clientSecret) {
    try {
      if (!this.stripe) throw new Error('Stripe not initialized');

      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: await this.stripe.createToken(),
          billing_details: {
            name: 'Customer Name' // Get from user input
          }
        }
      });

      return result;
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(customerId, priceId) {
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, priceId })
      });
      return await response.json();
    } catch (error) {
      console.error('Subscription error:', error);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentIntentId, amount = null) {
    try {
      const response = await fetch('/api/refund-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId, amount })
      });
      return await response.json();
    } catch (error) {
      console.error('Refund error:', error);
      throw error;
    }
  }
}

/**
 * Task 71: Create social authentication flows
 */
export class SocialAuth {
  /**
   * Initiate Google login
   */
  static async loginWithGoogle() {
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const { auth, googleProvider } = await import('../firebase');
      
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  /**
   * Initiate GitHub login
   */
  static async loginWithGitHub() {
    try {
      const { signInWithPopup, GithubAuthProvider } = await import('firebase/auth');
      const { auth } = await import('../firebase');

      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error('GitHub login error:', error);
      throw error;
    }
  }

  /**
   * Initiate Facebook login
   */
  static async loginWithFacebook() {
    try {
      const { signInWithPopup, FacebookAuthProvider } = await import('firebase/auth');
      const { auth } = await import('../firebase');

      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error('Facebook login error:', error);
      throw error;
    }
  }

  /**
   * Link social account to existing user
   */
  static async linkSocialAccount(user, provider) {
    try {
      const { linkWithPopup } = await import('firebase/auth');
      
      let authProvider;
      if (provider === 'google') {
        const { GoogleAuthProvider } = await import('firebase/auth');
        authProvider = new GoogleAuthProvider();
      } else if (provider === 'github') {
        const { GithubAuthProvider } = await import('firebase/auth');
        authProvider = new GithubAuthProvider();
      }

      const result = await linkWithPopup(user, authProvider);
      return result;
    } catch (error) {
      console.error('Link social account error:', error);
      throw error;
    }
  }
}

export default PaymentGateway;
