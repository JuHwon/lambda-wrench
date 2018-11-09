/**
 * logging utility
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// default to debug if not specified
const logLevel = () =>
  ((process.env.log_level || 'DEBUG') in LogLevel
    ? process.env.log_level
    : 'DEBUG') as keyof typeof LogLevel

function isEnabled(level: LogLevel) {
  return level >= LogLevel[logLevel()]
}

function appendError(params?: LogParams, err?: Error) {
  if (!err) {
    return params
  }

  return {
    ...params,
    errorName: err.name,
    errorMessage: err.message,
    stackTrace: err.stack,
  }
}

function log(
  levelName: keyof typeof LogLevel,
  message: string,
  params?: LogParams
) {
  if (!isEnabled(LogLevel[levelName])) {
    return
  }

  const logMsg = {
    ...params,
    level: levelName,
    message: message,
  }

  console.log(JSON.stringify(logMsg))
}

type LogParams = Record<string, any>

export const debug = (msg: string, params?: LogParams) =>
  log('DEBUG', msg, params)
export const info = (msg: string, params?: LogParams) =>
  log('INFO', msg, params)
export const warn = (msg: string, params?: LogParams, error?: Error) =>
  log('WARN', msg, appendError(params, error))
export const error = (msg: string, params?: LogParams, error?: Error) =>
  log('ERROR', msg, appendError(params, error))

export default { debug, info, warn, error }
