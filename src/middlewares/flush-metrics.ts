/**
 * flush cloudwatch metrics middleware
 */

import cloudwatch from '../utils/cloudwatch'
import { MiddlewareObject } from 'middy'

const flushMetricsMiddleware: MiddlewareObject<any, any> = {
  after: (handler, next) => {
    cloudwatch.flush().then(() => next())
  },
  onError: (handler, next) => {
    cloudwatch.flush().then(() => next(handler.error))
  },
}

export default flushMetricsMiddleware
