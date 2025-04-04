import { prisma } from 'wasp/server'

import { updateCurrentUserLastActiveTimestamp } from '../../../../../src/user/operations'


export default async function (args, context) {
  return (updateCurrentUserLastActiveTimestamp as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
    },
  })
}
