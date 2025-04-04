import { HttpError } from 'wasp/server';
export const updateIsUserAdminById = async ({ id, data }, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    if (!context.user.isAdmin) {
        throw new HttpError(403);
    }
    const updatedUser = await context.entities.User.update({
        where: {
            id,
        },
        data: {
            isAdmin: data.isAdmin,
        },
    });
    return updatedUser;
};
export const updateCurrentUserLastActiveTimestamp = async ({ lastActiveTimestamp }, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.User.update({
        where: {
            id: context.user.id,
        },
        data: { lastActiveTimestamp },
    });
};
export const getPaginatedUsers = async (args, context) => {
    var _a;
    if (!((_a = context.user) === null || _a === void 0 ? void 0 : _a.isAdmin)) {
        throw new HttpError(401);
    }
    const allSubscriptionStatusOptions = args.subscriptionStatus;
    const hasNotSubscribed = allSubscriptionStatusOptions === null || allSubscriptionStatusOptions === void 0 ? void 0 : allSubscriptionStatusOptions.find((status) => status === null);
    let subscriptionStatusStrings = allSubscriptionStatusOptions === null || allSubscriptionStatusOptions === void 0 ? void 0 : allSubscriptionStatusOptions.filter((status) => status !== null);
    const queryResults = await context.entities.User.findMany({
        skip: args.skip,
        take: 10,
        where: {
            AND: [
                {
                    email: {
                        contains: args.emailContains || undefined,
                        mode: 'insensitive',
                    },
                    isAdmin: args.isAdmin,
                },
                {
                    OR: [
                        {
                            subscriptionStatus: {
                                in: subscriptionStatusStrings,
                            },
                        },
                        {
                            subscriptionStatus: {
                                equals: hasNotSubscribed,
                            },
                        },
                    ],
                },
            ],
        },
        select: {
            id: true,
            email: true,
            username: true,
            isAdmin: true,
            lastActiveTimestamp: true,
            subscriptionStatus: true,
            paymentProcessorUserId: true,
        },
        orderBy: {
            id: 'desc',
        },
    });
    const totalUserCount = await context.entities.User.count({
        where: {
            AND: [
                {
                    email: {
                        contains: args.emailContains || undefined,
                        mode: 'insensitive',
                    },
                    isAdmin: args.isAdmin,
                },
                {
                    OR: [
                        {
                            subscriptionStatus: {
                                in: subscriptionStatusStrings,
                            },
                        },
                        {
                            subscriptionStatus: {
                                equals: hasNotSubscribed,
                            },
                        },
                    ],
                },
            ],
        },
    });
    const totalPages = Math.ceil(totalUserCount / 10);
    return {
        users: queryResults,
        totalPages,
    };
};
//# sourceMappingURL=operations.js.map