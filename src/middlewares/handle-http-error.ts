/**
 * handle http-errors 
 */


import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { MiddlewareFunction, NextFunction } from 'middy'

type HandleHttpErrorOptions = {
  logger: (err: Error) => void
}

const handleHttpErrorMiddleware = (opts?: HandleHttpErrorOptions) => {
  const defaults = {
    logger: console.error,
  }

  const options = Object.assign({}, defaults, opts)

  const onError: MiddlewareFunction<
    APIGatewayProxyEvent,
    APIGatewayProxyResult
  > = (handler: any, next: NextFunction) => {
    if (handler.error.statusCode) {
      if (typeof options.logger === 'function') {
        options.logger(handler.error)
      }

      handler.response = {
        statusCode: handler.error.statusCode,
        body: JSON.stringify({ message: handler.error.message })
      }

      return next()
    }

    return next(handler.error)
  }

  return {
    onError,
  }
}

export default handleHttpErrorMiddleware
