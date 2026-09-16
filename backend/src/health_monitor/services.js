import axios from "axios"
import { HealthMonitor, HealthStatusCheck } from "./models.js"
import { error } from "console"

async function createMonitor(monitorConfig) {
    try {
        
        // field validations
        if(!monitorConfig?.url || !monitorConfig?.url?.trim() ){
            throw new Error({err: "Insufficient payload", msg: "monitor url is a mandetory information."})
        }

        // start creating object
        const monitor = {
            user_id: monitorConfig?.user_id,
            url: `${monitorConfig?.url}`.trim(),
            interval: Number(monitorConfig?.interval) <= 0 ? 300 : Number(monitorConfig?.interval),
            expectedStatus: monitorConfig?.expectedStatus ?? ["2xx", "3xx"],
            timeout: Number(monitorConfig?.timeout) <= 0 ? 15 : Number(monitorConfig?.timeout),
            request_type: monitorConfig?.request_type ?? "head",
            request_body: monitorConfig?.request_body,
            request_headers: monitorConfig?.request_headers,
            next_check_at: monitorConfig?.next_check_at ?? Date.now(),
            is_active: (monitorConfig.is_active == undefined || monitorConfig.is_active == null || !monitorConfig.is_active) ? true : monitorConfig.is_active ,
        }

        const res = await HealthMonitor.create(monitor)
        return res
    } catch (error) {
        throw error
    }
}

async function getMonitorsByUserId (userId) {
    if(!userId || userId?.trim() == ""){
        throw new Error("Invalid user id");
    }
    try {
        const monitors = await HealthMonitor.find({user_id: userId});
        return monitors;
    } catch (error) {
        throw error
    }
}

async function getMonitorById (monitorId) {
    if(!monitorId || monitorId?.trim() == ""){
        throw new Error("Invalid monitor id");
    }
    try {
        const monitor = await HealthMonitor.findById(monitorId).populate("user_id", "-password");
        return monitor;
    } catch (error) {
        throw error
    }
}

async function updateMonitor (monitorId, monitorUpdates) {
    if(!monitorId || !monitorUpdates || monitorUpdates == []) {
        throw new Error("Insufficient payload");
    }
    try {
        const res = await HealthMonitor.findByIdAndUpdate(monitorId, monitorUpdates, {new: true});
        return res
    } catch (error) {
        throw error
    }
}

async function deleteMonitorByOwner(monitorId, userId) {
    if(!monitorId || !monitorId?.trim() || !userId || !userId?.trim()){
        throw new Error("Insufficient arguments")
    }
    try {
        const monitor = await HealthMonitor.findById(monitorId)
        if(monitor.user_id != userId){
            throw new Error("Unauthorized request")
        }
        const res = await HealthMonitor.findByIdAndDelete(monitorId);
        return res
    } catch (error) {
        throw error
    }
}

async function deleteMonitor(monitorId) {
    if(!monitorId || !monitorId?.trim()){
        throw new Error("Invalid monitor id")
    }
    try {
        const res = await HealthMonitor.findByIdAndDelete(monitorId);
        return res
    } catch (error) {
        throw error
    }
}

async function  getMonitorByIdForScheduler(monitorId) {
    try {
        const monitor = await HealthMonitor.findById(monitorId).select("interval next_check_at is_active")
        return monitor
    } catch (error) {
        throw error
    }
}

// Health check status repo
export async function createHealthCheck(monitorId, statusCode, status, duration, resBody, createdAt) {
    if(!monitorId){
        throw new Error("No monitor id provided to check monitor health.")
    }
    try {
        const m = await getMonitorById(monitorId)
        if(!m){
            throw new Error("No such monitor exist")
        }


        // create a report for status check
        const res = await HealthStatusCheck.create({
            monitor_id: m._id, 
            status: status, 
            status_code: statusCode,
            duration: duration,
            response: resBody ?? "",
            createdAt: createdAt,
        })
        return res
    } catch (error) {
        console.log("Error in creating health check: ",error)
        throw error
    }
}

export async function getAllChecksByMonitorId(monitorId) {
    try {
        const res = await HealthStatusCheck.find({monitor_id: monitorId}).sort({createdAt: -1}).select("-_id -__v -updatedAt");
        return res
    } catch (error) {
        throw error
    }
}

export async function getCheckByJobEnqueueTime(monitorId, enqueTime) {
    try {
        const check = await HealthStatusCheck.find({monitor_id: monitorId, createdAt: enqueTime})
        return check
    } catch (error) {
        throw error
    }
}

export async function deleteAllStatusOfMonitor(monitorId) {
    try {
        const res = await HealthStatusCheck.deleteMany({monitor_id: monitorId});
        return res
    } catch (error) {
        throw error
    }
}
/**************************************************************/

const monitorServices = {
    createMonitor,
    getMonitorsByUserId,
    getMonitorById,
    updateMonitor,
    deleteMonitor,
    deleteMonitorByOwner,
    getMonitorByIdForScheduler
}

export default monitorServices