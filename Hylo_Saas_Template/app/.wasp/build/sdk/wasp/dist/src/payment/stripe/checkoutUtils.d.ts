import type { StripeMode } from './paymentProcessor';
import Stripe from 'stripe';
export declare function fetchStripeCustomer(customerEmail: string): Promise<Stripe.Customer>;
export declare function createStripeCheckoutSession({ userId, priceId, customerId, mode }: {
    userId: string;
    priceId: string;
    customerId: string;
    mode: StripeMode;
}): Promise<Stripe.Response<Stripe.Checkout.Session>>;
