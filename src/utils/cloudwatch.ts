/**
 * cloudwatch utility
 */

import AWS, { CloudWatch } from 'aws-sdk'
import log from './log'

const cloudwatch = new AWS.CloudWatch()

const namespace = process.env.cloudwatch_namespace || 'lambda-wrench_env_cloudwatch_namespace'
const async = (process.env.async_metrics || 'false') === 'true'

// the Lambda execution environment defines a number of env variables:
//    https://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html
// and the serverless framework also defines a STAGE env variable too
const dimensions: CloudWatch.Dimensions = [
  { Name: 'Function', Value: process.env.AWS_LAMBDA_FUNCTION_NAME as string },
  { Name: 'Version', Value: process.env.AWS_LAMBDA_FUNCTION_VERSION as string },
  { Name: 'Stage', Value: process.env.STAGE as string },
].filter(dim => dim.Value)

let countMetrics: {
  [key: string]: CloudWatch.DatapointValue
} = {}
let timeMetrics: {
  [key: string]: CloudWatch.StatisticSet
} = {}

function getCountMetricData(name: string, value: CloudWatch.DatapointValue): CloudWatch.Types.MetricDatum {
  return {
    MetricName: name,
    Dimensions: dimensions,
    Unit: 'Count',
    Value: value,
  }
}

function getTimeMetricData(name: string, statsValues: CloudWatch.StatisticSet): CloudWatch.Types.MetricDatum {
  return {
    MetricName: name,
    Dimensions: dimensions,
    Unit: 'Milliseconds',
    StatisticValues: statsValues,
  }
}

function getCountMetricDatum() {
  let keys = Object.keys(countMetrics)
  if (keys.length === 0) {
    return []
  }

  let metricDatum = keys.map(key => getCountMetricData(key, countMetrics[key]))
  countMetrics = {} // zero out the recorded count metrics
  return metricDatum
}

function getTimeMetricDatum() {
  let keys = Object.keys(timeMetrics)
  if (keys.length === 0) {
    return []
  }

  let metricDatum = keys.map(key => getTimeMetricData(key, timeMetrics[key]))
  timeMetrics = {} // zero out the recorded time metrics
  return metricDatum
}

async function flush() {
  let countDatum = getCountMetricDatum()
  let timeDatum = getTimeMetricDatum()
  let allDatum = countDatum.concat(timeDatum)

  if (allDatum.length == 0) {
    return
  }

  let metricNames = allDatum.map(x => x.MetricName).join(',')
  log.debug(`flushing [${allDatum.length}] metrics to CloudWatch: ${metricNames}`)

  var params = {
    MetricData: allDatum,
    Namespace: namespace,
  }

  try {
    await cloudwatch.putMetricData(params).promise()
    log.debug(`flushed [${allDatum.length}] metrics to CloudWatch: ${metricNames}`)
  } catch (err) {
    log.warn(`cloudn't flush [${allDatum.length}] CloudWatch metrics`, {}, err)
  }
}

function clear() {
  countMetrics = {}
  timeMetrics = {}
}

function incrCount(metricName: string, count: number = 1) {
  if (async) {
    console.log(`MONITORING|${count}|count|${metricName}|${namespace}`)
  } else {
    if (countMetrics[metricName]) {
      countMetrics[metricName] += count
    } else {
      countMetrics[metricName] = count
    }
  }
}

function recordTimeInMillis(metricName: string, ms: number) {
  if (!ms) {
    return
  }

  log.debug(`new execution time for [${metricName}] : ${ms} milliseconds`)
  if (async) {
    console.log(`MONITORING|${ms}|milliseconds|${metricName}|${namespace}`)
  } else {
    if (timeMetrics[metricName]) {
      let metric = timeMetrics[metricName]
      metric.Sum += ms
      metric.Maximum = Math.max(metric.Maximum, ms)
      metric.Minimum = Math.min(metric.Minimum, ms)
      metric.SampleCount += 1
    } else {
      let statsValues = {
        Maximum: ms,
        Minimum: ms,
        SampleCount: 1,
        Sum: ms,
      }
      timeMetrics[metricName] = statsValues
    }
  }
}


function trackExecTime<T>(
  metricName: string,
  f: () => T | Promise<T>
): Promise<T> {
  const start = new Date().getTime()
  const res = f()

  if (res && res instanceof Promise) {
    return res.then((x: T) => {
      const end = new Date().getTime()
      recordTimeInMillis(metricName, end - start)
      return x
    })
  } else {
    const end = new Date().getTime()
    recordTimeInMillis(metricName, end - start)
    return Promise.resolve(res)
  }
}

export { flush, clear, incrCount, trackExecTime }

export default {
  flush,
  clear,
  incrCount,
  trackExecTime,
}
