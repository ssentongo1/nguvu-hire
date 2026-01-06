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

  constructor() {
    this.consumerKey = process.env.PESAPAL_CONSUMER_KEY || '';
    this.consumerSecret = process.env.PESAPAL_CONSUMER_SECRET || '';
    this.baseUrl = process.env.PESAPAL_API_URL || '';

    if (!this.consumerKey || !this.consumerSecret || !this.baseUrl) {
      throw new Error('Pesapal credentials or API URL missing in environment variables.');
    }

    console.log('✅ Pesapal API initialized:', { baseUrl: this.baseUrl });
  }

  private async getAccessToken(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        consumer_key: this.consumerKey,
        consumer_secret: this.consumerSecret,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to get Pesapal token: ${err}`);
    }

    const data = await res.json();
    if (!data.token) throw new Error('Pesapal token not received');
    return data.token;
  }

  async submitOrder(paymentRequest: PesapalPaymentRequest): Promise<PesapalPaymentResponse> {
    const token = await this.getAccessToken();

    const res = await fetch(`${this.baseUrl}/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentRequest),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Submit order failed: ${err}`);
    }

    const data = await res.json();
    return {
      order_tracking_id: data.order_tracking_id,
      merchant_reference: data.merchant_reference,
      redirect_url: data.redirect_url,
      status: data.status,
      message: data.message,
    };
  }

  async getPaymentStatus(orderTrackingId: string): Promise<PesapalPaymentStatus> {
    const token = await this.getAccessToken();

    const res = await fetch(
      `${this.baseUrl}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
        orderTrackingId
      )}`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Get payment status failed: ${err}`);
    }

    return res.json();
  }

  async getRegisteredIPNs(): Promise<any[]> {
    const token = await this.getAccessToken();

    const res = await fetch(`${this.baseUrl}/URLSetup/GetIpnList`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to get registered IPNs: ${err}`);
    }

    return res.json();
  }

  async registerIPN(url: string): Promise<any> {
    const token = await this.getAccessToken();

    const res = await fetch(`${this.baseUrl}/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, ipn_notification_type: 'GET' }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to register IPN: ${err}`);
    }

    return res.json();
  }
}

// Export singleton
const pesapalAPI = new PesapalAPI();
export default pesapalAPI;

