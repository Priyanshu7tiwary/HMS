import { cfg } from "../../index.js";
import queueController from "../shared/rabbitmq.js"
import monitorServices, { createHealthCheck } from "../health_monitor/services.js";
import axios from "axios";
import alertQueue from "../alert_queue/index.js";


// producer
async function sendMsgToHealthStatusQueue(msg, retry = 3) {
  while (retry > 0) {
    try {
      const queue = cfg.HEALTH_STATUS_QUEUE;
      await queueController.sendToQueue(queue, msg);
      return true;
    } catch (error) {
      retry--;
      console.error(
        `Error sending msg: ${error.message}. ${retry} retries left.`
      );

      if (retry === 0) {
        throw error;
      }
    }
  }
}

// worker - consumer
async function reciveMsgFromHealthStatusQueue() {
    try {
        const queue = cfg.HEALTH_STATUS_QUEUE
        await queueController.listenToQueue(queue, onMsgHealthStatusQueue)
    } catch (error) {
        console.error(`Error recieving msg from health status queue: ${error}\n`)
        throw error
    }
}

async function onMsgHealthStatusQueue(msg) {
    try {
      // console.log("health status queue recieved msg(json): ")
      // msg = JSON.parse(msg);
      const data = msg.content.toString();
      console.log(`msg: ${data} recieved health_status_queue at ${Date.now()/1000}`)
      // console.log(JSON.parse(data).monitorId)
      const d = JSON.parse(data);
      // console.log(d)
      
      const err = await checkUrlStatus(d.monitorId, d.jobEnqueueTime)
      if(err){
        console.error(err);
        console.log("Err check url status handler")
      }

    } catch (error) {
        console.log("Err in health status queue consumer handler")
      console.error(error)
    }
}

async function checkUrlStatus(monitorId, jobEnqueueTime){
  if(!monitorId) throw new Error("No monitor id provided for the status check.")
  try {
    const m = await  monitorServices.getMonitorById(monitorId);
    if(!m){
      throw new Error("No such monitor exists in db.")
    }
    
    let response = null;
    let error = null;

    const start = Date.now();

    try {
      response = await axios({
          method: m.request_type,
          url: m.url,
          // headers: m.request_headers,
          data: m.request_body,
          timeout: m.timeout*1000,
      })
    } catch (e) {
      error = e;
      console.error(`Status check failed for monitor id ${monitorId} at ${Date.now()} \nError: ${e}`)
    }

    const end = Date.now();
    
    let status_code = null;
    if(error !== null){
      status_code = error.status
    }else {
      status_code = response.status;
    }

    const status = getStatusByStatuscodeAndExpectedStatus(status_code, m.expectedStatus) ? "up" : "down";
    // if status is down push the alert in queue with timestamp of start
    // enque alert
    if(status === "down"){
      const msg = {
        monitorId,
        jobEnqueueTime,
        statusCode: status_code,
        status,
        duration: end - start,
      }
      const q_msg = JSON.stringify(msg)
      await alertQueue.sendMsgToAlertQueue(q_msg)
    }
    // const duration = end - start // in ms
    const createdCheck = await createHealthCheck(monitorId, status_code, status, end - start, "", jobEnqueueTime)
    return ;
  } catch (e) {
    throw e
  }
}

function getStatusByStatuscodeAndExpectedStatus(statusCode, expectedStatusCodes){
  if(!statusCode) return false;
  if(!expectedStatusCodes) return false // descision


  for(let i in expectedStatusCodes){
    const code = expectedStatusCodes[i]
    if(`${code}` === "2xx" ){
      if(Math.floor(statusCode/100) == 2 ) return true
    }
    if(`${code}` === "3xx" ){
      if(Math.floor(Number(statusCode)/100) == 3 ) return true
    }
    if(Number(statusCode) === Number(code)){
      return true
    }
    continue
  }

  return false
}

const healthStatusQueue = {
    sendMsgToHealthStatusQueue,
    onMsgHealthStatusQueue,
    reciveMsgFromHealthStatusQueue,
}

export default healthStatusQueue