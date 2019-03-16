/**
 * sample logging lambda middleware
 */

import { MiddlewareObject } from 'middy'
import log, { LogLevel } from "../utils/log";

type SmapleLoggingMiddlewareConfig = {
  sampleRate: number
};

const getSampleLogginMiddleware = (config: SmapleLoggingMiddlewareConfig): MiddlewareObject<any, any> => {
  let oldLogLevel: keyof typeof LogLevel | undefined = undefined;
  return {
    before: (handler, next) => {
      if (config.sampleRate && Math.random() <= config.sampleRate) {
        oldLogLevel = process.env.log_level as keyof typeof LogLevel;
        process.env.log_level = "DEBUG";
      }
      next();
    },
    after: (handler, next) => {
      if (oldLogLevel) {
        process.env.log_level = oldLogLevel;
      }
      next();
    },
    onError: (handler, next) => {
      let awsRequestId = handler.context.awsRequestId;
      let invocationEvent = JSON.stringify(handler.event);
      log.error(
        "invocation failed",
        { awsRequestId, invocationEvent },
        handler.error
      );
      next(handler.error);
    }
  };
};

export default getSampleLogginMiddleware
