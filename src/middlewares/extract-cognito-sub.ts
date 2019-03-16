/**
 * extract cognito sub from IAM token
 */

import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context
  } from 'aws-lambda'
  
  import { MiddlewareFunction, NextFunction, HandlerLambda } from 'middy'
  
  interface EnhancedContext extends Context {
    cognito_sub?: string
  }
  
  const searchTerm = 'CognitoSignIn:'
  
  const before: MiddlewareFunction<
    APIGatewayProxyEvent,
    APIGatewayProxyResult
  > = (handler: HandlerLambda, next: NextFunction) => {
    const { identity } = handler.event.requestContext
    if (identity && identity.cognitoAuthenticationProvider) {
      const idx = identity.cognitoAuthenticationProvider.indexOf(searchTerm)
      if (idx > 0) {
        const sub = identity.cognitoAuthenticationProvider.substr(
          idx + searchTerm.length
        ) as string
        (handler.context as EnhancedContext).cognito_sub = sub
      }
    }
  
    next()
  }
  
  function extractCognitoSubMiddleware() {
    return {
      before,
    }
  }
  
  export default extractCognitoSubMiddleware