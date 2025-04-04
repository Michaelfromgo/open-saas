import { prisma } from 'wasp/server'
import type { JSONValue, JSONObject } from 'wasp/server/_types/serialization'
import { type JobFn, createJobDefinition } from 'wasp/server/jobs/core/pgBoss'

const entities = {
  User: prisma.user,
}

// PUBLIC API
export type SendNewsletter<Input extends JSONObject, Output extends JSONValue | void> = JobFn<Input, Output, typeof entities>

const jobSchedule = {
  cron: "0 7 * * 1",
  options: {},
}

// PUBLIC API
export const sendNewsletter = createJobDefinition({
  jobName: 'sendNewsletter',
  defaultJobOptions: {},
  jobSchedule,
  entities,
})
