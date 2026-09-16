import { cfg } from "../../index.js";
import { createHealthCheck, getCheckByJobEnqueueTime } from "../health_monitor/services.js";
import queueController from "../shared/rabbitmq.js";

// producer
async function sendMsgToAlertQueue(msg, retry = 3) {
  while (retry > 0) {
    try {
      const queue = cfg.ALERT_QUEUE ?? "alert_queue"
      await queueController.sendToQueue(queue, msg)
      return true
    } catch (error) {
      retry--
      console.error(
        `Error sending msg: ${error.message}. ${retry} retries left.`
      )

      if (retry === 0) {
        throw error
      }
    }
  }
}

// consumer

// alert listner
async function reciveMsgFromAlertQueue() {
    try {
        const queue = cfg.ALERT_QUEUE ?? "alert_queue"
        await queueController.listenToQueue(queue, onMsgAlertQueue)
    } catch (error) {
        console.error(`Error recieving msg from alert queue: ${error}\n`)
        throw error
    }
}

// alert handler
async function onMsgAlertQueue(msg){
    if(!msg || !msg?.monitorId || !msg.jobEnqueueTime){
        console.error("Insufficu=ient msg in alert queue.")
    }
    // msg = { monitorId, jobEnqueueTime}
    // 1. cross check db for if record created or not
    // 2. if not then create it
    // 3. if created then send notification or push in multiple notification queues.
    let status_record = await getCheckByJobEnqueueTime(msg.monitorId, msg.jobEnqueueTime)
    if(!status_record){
        // create record
        status_record = await createHealthCheck(msg.monitorId, msg.statusCode ?? 400, msg.status,msg.duration, "", msg.jobEnqueueTime)
        // if(!checkRecord){
        // }
    }

    // sendAlert(status_record._id)
    console.log("sending alert with status record id: ", status_record?._id); 
    console.log(`sending alert to user..\nmsg: ${msg}`)
}


const alertQueue = {
    sendMsgToAlertQueue,
    reciveMsgFromAlertQueue,
}

export default alertQueue