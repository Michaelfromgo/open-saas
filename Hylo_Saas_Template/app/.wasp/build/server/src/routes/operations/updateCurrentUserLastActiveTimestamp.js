import { createAction } from '../../middleware/operations.js'
import updateCurrentUserLastActiveTimestamp from '../../actions/updateCurrentUserLastActiveTimestamp.js'

export default createAction(updateCurrentUserLastActiveTimestamp)
