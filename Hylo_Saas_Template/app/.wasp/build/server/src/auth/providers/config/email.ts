import { Router, Request, Response, NextFunction } from "express";

import { ProviderConfig } from "wasp/auth/providers/types";
import type { EmailFromField } from "wasp/server/email/core/types";

import { getLoginRoute } from "../email/login.js";
import { getSignupRoute } from "../email/signup.js";
import { getRequestPasswordResetRoute } from "../email/requestPasswordReset.js";
import { resetPassword } from "../email/resetPassword.js";
import { verifyEmail } from "../email/verifyEmail.js";
import { GetVerificationEmailContentFn, GetPasswordResetEmailContentFn } from "wasp/server/auth/email";
import { handleRejection } from "wasp/server/utils";
import { env } from "wasp/server";

import { getEmailUserFields } from '../../../../../../../src/auth/userSignupFields'
const _waspUserSignupFields = getEmailUserFields

import { getVerificationEmailContent } from '../../../../../../../src/auth/email-and-pass/emails'
const _waspGetVerificationEmailContent: GetVerificationEmailContentFn = getVerificationEmailContent;
import { getPasswordResetEmailContent } from '../../../../../../../src/auth/email-and-pass/emails'
const _waspGetPasswordResetEmailContent: GetPasswordResetEmailContentFn = getPasswordResetEmailContent;


const fromField: EmailFromField = {
    name: 'Open SaaS App',
    email: 'michael682682@gmail.com',
};

const config: ProviderConfig = {
    id: "email",
    displayName: "Email and password",
    createRouter() {
        const router = Router();

        const loginRoute = handleRejection(getLoginRoute());
        router.post('/login', loginRoute);

        const signupRoute = handleRejection(getSignupRoute({
            userSignupFields: _waspUserSignupFields,
            fromField,
            clientRoute: '/email-verification',
            getVerificationEmailContent: _waspGetVerificationEmailContent,
            isEmailAutoVerified: false,
        }));
        router.post('/signup', signupRoute);
        
        const requestPasswordResetRoute = handleRejection(getRequestPasswordResetRoute({
            fromField,
            clientRoute: '/password-reset',
            getPasswordResetEmailContent: _waspGetPasswordResetEmailContent,
        }));
        router.post('/request-password-reset', requestPasswordResetRoute);

        router.post('/reset-password', handleRejection(resetPassword));
        router.post('/verify-email', handleRejection(verifyEmail));

        return router;
    },
}

export default config;
