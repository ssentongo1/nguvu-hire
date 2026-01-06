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
  };
}

export interface PesapalPaymentResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  status: string;
  message?: string;
}

class PesapalAPI {
  private consumerKey: string;
  private consumerSecret: string;
  private baseUrl: string;

  constructor() {
    this.consumerKey = process.env.PESAPAL_CONSUMER_KEY || '';
    this.consumerSecret = process.env.PESAPAL_CONSUMER_SECRET || '';

    if (!this.consumerKey || !this.consumerSecret) {
      throw new Error('❌ Pesapal credentials missing');
    }

    // ✅ SINGLE SOURCE OF TRUTH (NO /api HERE)
    this.baseUrl =
      process.env.PESAPAL_API_URL?.replace(/\/api\/?$/, '') ||
      'https://cybqa.pesapal.com/pesapalv3';

    console.log('✅ Pesapal initialized:', {
      baseUrl: this.baseUrl,
      env: process.env.PESAPAL_ENVIRONMENT,
    });
  }

  // =========================
  // AUTH
  // =========================
  private async getAccessToken(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        consumer_key: this.consumerKey,
        consumer_secret: this.consumerSecret,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Pesapal auth failed: ${err}`);
    }

    const data = await res.json();

    if (!data.token) {
      throw new Error('Pesapal token missing in response');
    }

    return data.token;
  }

  // =========================
  // SUBMIT PAYMENT
  // =========================
  async submitOrder(
    payment: PesapalPaymentRequest
  ): Promise<PesapalPaymentResponse> {
    const token = await this.getAccessToken();

    const res = await fetch(
      `${this.baseUrl}/api/Transactions/SubmitOrderRequest`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payment),
      }
    );

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

  // =========================
  // TRANSACTION STATUS
  // =========================
  async getTransactionStatus(orderTrackingId: string) {
    const token = await this.getAccessToken();

    const res = await fetch(
      `${this.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
        orderTrackingId
      )}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Status check failed: ${err}`);
    }

    return res.json();
  }

  // =========================
  // IPN REGISTRATION (OPTIONAL)
  // =========================
  async registerIPN(url: string) {
    const token = await this.getAccessToken();

    const res = await fetch(`${this.baseUrl}/api/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        url,
        ipn_notification_type: 'GET',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`IPN registration failed: ${err}`);
    }

    return res.json();
  }
}

const pesapalAPI = new PesapalAPI();
export default pesapalAPI;
