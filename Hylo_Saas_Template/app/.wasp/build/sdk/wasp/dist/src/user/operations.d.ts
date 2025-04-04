import { type UpdateCurrentUserLastActiveTimestamp, type UpdateIsUserAdminById, type GetPaginatedUsers } from 'wasp/server/operations';
import { type User } from 'wasp/entities';
import { type SubscriptionStatus } from '../payment/plans';
export declare const updateIsUserAdminById: UpdateIsUserAdminById<{
    id: string;
    data: Pick<User, 'isAdmin'>;
}, User>;
export declare const updateCurrentUserLastActiveTimestamp: UpdateCurrentUserLastActiveTimestamp<Pick<User, 'lastActiveTimestamp'>, User>;
type GetPaginatedUsersInput = {
    skip: number;
    cursor?: number | undefined;
    emailContains?: string;
    isAdmin?: boolean;
    subscriptionStatus?: SubscriptionStatus[];
};
type GetPaginatedUsersOutput = {
    users: Pick<User, 'id' | 'email' | 'username' | 'lastActiveTimestamp' | 'subscriptionStatus' | 'paymentProcessorUserId'>[];
    totalPages: number;
};
export declare const getPaginatedUsers: GetPaginatedUsers<GetPaginatedUsersInput, GetPaginatedUsersOutput>;
export {};
