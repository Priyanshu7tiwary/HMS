// scheduler runs every 1 sec
// fetches due monitors from redis
// process each monitor from above list
// remove them from redis
// schedule next run for same monitor

const REDIS_ZSET_KEY = 'monitors:schedule'
const SCHEDULER_INTERVAL_MS = 1000
const BATCH_SIZE = 50

import { redis } from "../../index.js";
import monitorServices from "../health_monitor/services.js";
import healthStatusQueue from "../health_status_queue/index.js";

function enqueueJob(monitorId) {
  console.log(`Enqueued the monitor with monitor id ${monitorId} at ${Date.now()/1000}`)
}

async function fetchDueMonitors(now) {
  // console.log("fetching due monitors")
  return redis.zrangebyscore(
    REDIS_ZSET_KEY,
    0,
    now,
    'LIMIT',
    0,
    BATCH_SIZE
  )
}

async function removeFromSchedule(monitorId) {
  return redis.zrem(REDIS_ZSET_KEY, monitorId)
}

export async function scheduleNextRun(monitorId, nextCheckAt) {
  return redis.zadd(
    REDIS_ZSET_KEY,
    nextCheckAt,
    monitorId
  )
}

async function processMonitor(monitorId, now) {
  // console.log("processing monitor with monitor id:", monitorId)
  try {
    const monitor = await monitorServices.getMonitorByIdForScheduler(monitorId)
    
    if(!monitor) {
      return;
    }
    
    if(!monitor.is_active || monitor.next_check_at > now){
      return
    }

    // enqueue job
    // enqueueJob(monitorId)
    const q_msg = JSON.stringify({monitorId, jobEnqueueTime:Date.now()})
    const q_res = await healthStatusQueue.sendMsgToHealthStatusQueue(q_msg)

    const nextCheckAt = now + monitor.interval * 1000
    if(nextCheckAt <= now){
      return;
    }

    // update next_check_at
    await monitorServices.updateMonitor(monitorId, {next_check_at: nextCheckAt})

    // schedule next run
    await scheduleNextRun(monitorId, nextCheckAt)

  } catch (err) {
    console.error('Scheduler error:', err)
  }
}

async function schedulerTick() {
  const now = Date.now()

  const dueMonitors = await fetchDueMonitors(now)

  for (const monitorId of dueMonitors) {
    const removed = await removeFromSchedule(monitorId)

    if (removed === 1) {
      await processMonitor(monitorId, now)
    }
  }
}

export function startScheduler() {
  console.log('Scheduler started')

  setInterval(() => {
    schedulerTick().catch(console.error)
  }, SCHEDULER_INTERVAL_MS)
}