import { type ActionFor, createAction } from './core'
import { UpdateCurrentUserLastActiveTimestamp_ext } from 'wasp/server/operations/actions'
import { UpdateIsUserAdminById_ext } from 'wasp/server/operations/actions'
import { GenerateGptResponse_ext } from 'wasp/server/operations/actions'
import { CreateTask_ext } from 'wasp/server/operations/actions'
import { DeleteTask_ext } from 'wasp/server/operations/actions'
import { UpdateTask_ext } from 'wasp/server/operations/actions'
import { GenerateCheckoutSession_ext } from 'wasp/server/operations/actions'
import { CreateFile_ext } from 'wasp/server/operations/actions'

// PUBLIC API
export const updateCurrentUserLastActiveTimestamp: ActionFor<UpdateCurrentUserLastActiveTimestamp_ext> = createAction<UpdateCurrentUserLastActiveTimestamp_ext>(
  'operations/update-current-user-last-active-timestamp',
  ['User'],
)

// PUBLIC API
export const updateIsUserAdminById: ActionFor<UpdateIsUserAdminById_ext> = createAction<UpdateIsUserAdminById_ext>(
  'operations/update-is-user-admin-by-id',
  ['User'],
)

// PUBLIC API
export const generateGptResponse: ActionFor<GenerateGptResponse_ext> = createAction<GenerateGptResponse_ext>(
  'operations/generate-gpt-response',
  ['User', 'Task', 'GptResponse'],
)

// PUBLIC API
export const createTask: ActionFor<CreateTask_ext> = createAction<CreateTask_ext>(
  'operations/create-task',
  ['Task'],
)

// PUBLIC API
export const deleteTask: ActionFor<DeleteTask_ext> = createAction<DeleteTask_ext>(
  'operations/delete-task',
  ['Task'],
)

// PUBLIC API
export const updateTask: ActionFor<UpdateTask_ext> = createAction<UpdateTask_ext>(
  'operations/update-task',
  ['Task'],
)

// PUBLIC API
export const generateCheckoutSession: ActionFor<GenerateCheckoutSession_ext> = createAction<GenerateCheckoutSession_ext>(
  'operations/generate-checkout-session',
  ['User'],
)

// PUBLIC API
export const createFile: ActionFor<CreateFile_ext> = createAction<CreateFile_ext>(
  'operations/create-file',
  ['User', 'File'],
)
