import { prisma } from 'wasp/server';
import { createJobDefinition } from 'wasp/server/jobs/core/pgBoss';
const entities = {
    User: prisma.user,
};
const jobSchedule = {
    cron: "0 7 * * 1",
    options: {},
};
// PUBLIC API
export const sendNewsletter = createJobDefinition({
    jobName: 'sendNewsletter',
    defaultJobOptions: {},
    jobSchedule,
    entities,
});
//# sourceMappingURL=sendNewsletter.js.map