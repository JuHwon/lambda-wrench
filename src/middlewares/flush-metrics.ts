/**
 * flush cloudwatch metrics middleware
 */

import cloudwatch from '../utils/cloudwatch'
import { IMiddyMiddlewareObject } from 'middy';

const middleware: IMiddyMiddlewareObject = {
  after: (handler, next) => {
    cloudwatch.flush().then(() => next())
  },
  onError: (handler, next) => {
    cloudwatch.flush().then(() => next(handler.error))
  },
}

export default middleware
