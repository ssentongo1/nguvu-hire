// src/utils/pesapal.ts
import crypto from 'crypto';

export interface PesapalPaymentRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  callback_url: string;
  notification_id: string;
  billing_address: {
    email_address: string;
    phone_number?: string;
    country_code: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip_code?: string;
  };
}

export interface PesapalPaymentResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  status: string;
  message?: string;
}

export interface PesapalPaymentStatus {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code: string;
  payment_status_description: string;
  description: string;
  message: string;
  payment_account: string;
  call_back_url: string;
  status_code: number;
  merchant_reference: string;
  payment_tracking_id: string;
  currency: string;
}

class PesapalAPI {
  private consumerKey: string;
  private consumerSecret: string;
  private baseUrl: string;
  private apiUrl: string;
  private isSandbox: boolean;

  constructor() {
    // Get credentials from environment variables
    this.consumerKey = process.env.PESAPAL_CONSUMER_KEY || '';
    this.consumerSecret = process.env.PESAPAL_CONSUMER_SECRET || '';
    this.isSandbox = process.env.PESAPAL_ENVIRONMENT === 'sandbox';
    
    // Set URLs based on environment
    if (this.isSandbox) {
      this.baseUrl = 'https://cybqa.pesapal.com/pesapalv3';
      this.apiUrl = 'https://cybqa.pesapal.com/pesapalv3/api';
    } else {
      this.baseUrl = 'https://pay.pesapal.com/v3';
      this.apiUrl = 'https://pay.pesapal.com/v3/api';
    }

    // Override with environment variables if set
    if (process.env.PESAPAL_BASE_URL) {
      this.baseUrl = process.env.PESAPAL_BASE_URL;
    }
    if (process.env.PESAPAL_API_URL) {
      this.apiUrl = process.env.PESAPAL_API_URL;
    }

    // Debug logging
    console.log('🔧 Pesapal API Initialized:', {
      environment: this.isSandbox ? 'sandbox' : 'live',
      hasConsumerKey: !!this.consumerKey && this.consumerKey.length > 0,
      hasConsumerSecret: !!this.consumerSecret && this.consumerSecret.length > 0,
      consumerKeyLength: this.consumerKey.length,
      consumerSecretLength: this.consumerSecret.length,
      consumerKeyPreview: this.consumerKey ? `${this.consumerKey.substring(0, 5)}...${this.consumerKey.substring(this.consumerKey.length - 5)}` : 'NOT SET',
      baseUrl: this.baseUrl,
      apiUrl: this.apiUrl
    });

    // Validate credentials
    if (!this.consumerKey || !this.consumerSecret) {
      console.error('❌ Pesapal credentials missing!');
      console.error('PESAPAL_CONSUMER_KEY:', this.consumerKey ? 'SET' : 'NOT SET');
      console.error('PESAPAL_CONSUMER_SECRET:', this.consumerSecret ? 'SET' : 'NOT SET');
      console.error('All environment variables:', Object.keys(process.env).filter(k => k.includes('PESAPAL')));
      throw new Error('Pesapal credentials are not configured in environment variables. Check your .env.local file.');
    }

    // Check for special characters that might cause issues
    if (this.consumerKey.includes('+') || this.consumerKey.includes('/') || this.consumerKey.includes('=') ||
        this.consumerSecret.includes('+') || this.consumerSecret.includes('/') || this.consumerSecret.includes('=')) {
      console.log('⚠️  Credentials contain special characters (+ / =). Make sure they are properly quoted in .env.local');
    }
  }

  private generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private generateTimestamp(): string {
    return new Date().toISOString();
  }

  private async getAccessToken(): Promise<string> {
    try {
      console.log('🔑 Requesting Pesapal access token...');
      
      const payload = {
        consumer_key: this.consumerKey,
        consumer_secret: this.consumerSecret,
      };

      console.log('📤 Sending request to:', `${this.apiUrl}/Auth/RequestToken`);
      console.log('📦 Payload:', {
        consumer_key: `${this.consumerKey.substring(0, 5)}...${this.consumerKey.substring(this.consumerKey.length - 5)}`,
        consumer_secret: `${this.consumerSecret.substring(0, 5)}...${this.consumerSecret.substring(this.consumerSecret.length - 5)}`,
      });

      const response = await fetch(`${this.apiUrl}/Auth/RequestToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // Try alternative method if first fails
        console.log('🔄 Trying alternative authentication method...');
        return await this.getAccessTokenAlternative();
      }

      const data = await response.json();
      
      if (!data.token) {
        console.error('❌ No token in response:', data);
        throw new Error('Access token not received from Pesapal');
      }

      console.log('✅ Access token received successfully');
      console.log('🔐 Token preview:', data.token.substring(0, 20) + '...');
      
      return data.token;
    } catch (error: any) {
      console.error('❌ Error getting Pesapal access token:', error);
      
      // Provide helpful error messages
      if (error.message.includes('fetch failed')) {
        throw new Error(`Cannot connect to Pesapal API. Please check your internet connection and the API URL: ${this.apiUrl}`);
      }
      
      if (error.message.includes('Unexpected token')) {
        throw new Error('Invalid response from Pesapal API. The API might be down or returning an error.');
      }
      
      throw new Error(`Failed to get access token: ${error.message}`);
    }
  }

  private async getAccessTokenAlternative(): Promise<string> {
    try {
      console.log('🔄 Trying alternative authentication (Basic Auth)...');
      
      // Create base64 encoded credentials
      const credentials = `${this.consumerKey}:${this.consumerSecret}`;
      const base64Credentials = Buffer.from(credentials).toString('base64');
      
      const response = await fetch(`${this.apiUrl}/Auth/RequestToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${base64Credentials}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Alternative auth failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error('Access token not received from Pesapal');
      }

      console.log('✅ Alternative authentication successful');
      return data.token;
    } catch (error: any) {
      console.error('❌ Alternative authentication failed:', error);
      throw error;
    }
  }

  private async makeAuthenticatedRequest(
    endpoint: string,
    method: string = 'POST',
    body?: any
  ): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const url = `${this.apiUrl}${endpoint}`;

      console.log(`🌐 Making ${method} request to:`, url);
      if (body) {
        console.log('📦 Request body:', JSON.stringify(body, null, 2));
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API request failed:', {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        throw new Error(`Pesapal API error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ API request successful');
      return data;
    } catch (error: any) {
      console.error('❌ Error in authenticated request:', error);
      throw error;
    }
  }

  async submitOrder(paymentRequest: PesapalPaymentRequest): Promise<PesapalPaymentResponse> {
    try {
      console.log('🚀 Submitting order to Pesapal...');
      console.log('📝 Order details:', {
        id: paymentRequest.id,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        description: paymentRequest.description,
        callback_url: paymentRequest.callback_url,
      });

      const orderData = {
        id: paymentRequest.id,
        currency: paymentRequest.currency,
        amount: paymentRequest.amount,
        description: paymentRequest.description,
        callback_url: paymentRequest.callback_url,
        notification_id: paymentRequest.notification_id,
        billing_address: paymentRequest.billing_address,
      };

      const response = await this.makeAuthenticatedRequest(
        '/Transactions/SubmitOrderRequest',
        'POST',
        orderData
      );

      console.log('✅ Order submitted successfully:', {
        order_tracking_id: response.order_tracking_id,
        redirect_url: response.redirect_url,
        status: response.status
      });

      return {
        order_tracking_id: response.order_tracking_id,
        merchant_reference: response.merchant_reference,
        redirect_url: response.redirect_url,
        status: response.status,
        message: response.message,
      };
    } catch (error: any) {
      console.error('❌ Error submitting order to Pesapal:', error);
      
      // Provide user-friendly error messages
      if (error.message.includes('consumer')) {
        throw new Error('Invalid Pesapal credentials. Please check your API keys.');
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('Authentication failed. Please check your Pesapal credentials.');
      }
      
      throw new Error(`Failed to submit order: ${error.message}`);
    }
  }

  async getPaymentStatus(orderTrackingId: string): Promise<PesapalPaymentStatus> {
    try {
      console.log('📊 Getting payment status for:', orderTrackingId);
      
      const response = await this.makeAuthenticatedRequest(
        `/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
        'GET'
      );

      console.log('✅ Payment status received:', {
        status: response.payment_status_description,
        amount: response.amount,
        method: response.payment_method
      });

      return response;
    } catch (error: any) {
      console.error('❌ Error getting payment status:', error);
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  async registerIPN(url: string): Promise<{ ipn_id: string; url: string; created_date: string }> {
    try {
      console.log('📝 Registering IPN URL:', url);
      
      const response = await this.makeAuthenticatedRequest(
        '/URLSetup/RegisterIPN',
        'POST',
        { url, ipn_notification_type: 'GET' }
      );

      console.log('✅ IPN registered successfully:', response.ipn_id);
      return response;
    } catch (error: any) {
      console.error('❌ Error registering IPN:', error);
      throw new Error(`Failed to register IPN: ${error.message}`);
    }
  }

  async getRegisteredIPNs(): Promise<any[]> {
    try {
      console.log('📋 Getting registered IPNs...');
      
      const response = await this.makeAuthenticatedRequest(
        '/URLSetup/GetRegisteredIPNs',
        'GET'
      );

      console.log('✅ Retrieved', response.length, 'registered IPNs');
      return response;
    } catch (error: any) {
      console.error('❌ Error getting registered IPNs:', error);
      throw new Error(`Failed to get registered IPNs: ${error.message}`);
    }
  }

  // Test method to verify API connectivity
  async testConnection(): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      console.log('🧪 Testing Pesapal API connection...');
      
      const token = await this.getAccessToken();
      
      return {
        success: true,
        message: 'Pesapal API connection successful',
        token: token.substring(0, 20) + '...' // Return partial token for verification
      };
    } catch (error: any) {
      console.error('🧪 Connection test failed:', error);
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }
}

// Create a singleton instance
const pesapalAPI = new PesapalAPI();
export default pesapalAPI;