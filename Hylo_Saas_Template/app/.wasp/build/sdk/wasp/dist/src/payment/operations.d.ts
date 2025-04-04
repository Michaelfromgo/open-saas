import type { GenerateCheckoutSession, GetCustomerPortalUrl } from 'wasp/server/operations';
import { PaymentPlanId } from '../payment/plans';
export type CheckoutSession = {
    sessionUrl: string | null;
    sessionId: string;
};
export declare const generateCheckoutSession: GenerateCheckoutSession<PaymentPlanId, CheckoutSession>;
export declare const getCustomerPortalUrl: GetCustomerPortalUrl<void, string | null>;
