import { registerJob } from 'wasp/server/jobs/core/pgBoss'
import { checkAndQueueNewsletterEmails } from '../../../../../src/newsletter/sendNewsletter'
import { sendNewsletter as _waspJobDefinition } from 'wasp/server/jobs'

registerJob({
  job: _waspJobDefinition,
  jobFn: checkAndQueueNewsletterEmails,
})
