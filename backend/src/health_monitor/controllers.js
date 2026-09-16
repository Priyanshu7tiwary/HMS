import { writeErr } from "../shared/error.js"
import { writeRes } from "../shared/response.js"
import authServices from "../auth/services.js"
import monitorServices, { deleteAllStatusOfMonitor, getAllChecksByMonitorId } from "./services.js"
import { scheduleNextRun } from "../scheduler/index.js";

async function registerMonitor(req, res) {
    try {
        const body = req.body;
        if(!body){
            return writeErr(res, 400, "Insufficient request body.", "Insufficient payload")
        }
        const { url, interval, expectedStatus, timeout, request_type, request_body, request_headers, next_check_at, is_active } = body
        
        const user = req.user
        if(!user || user == null || user == undefined || !user?._id) {
            return writeErr(res, 401, "Unauthorized request.", "Invalid user info")
        }
        
        const result = await monitorServices.createMonitor({user_id: user._id, url, interval, expectedStatus, timeout, request_type, request_body, request_headers, next_check_at, is_active}) 
        // add to redis if successfull creation
        await scheduleNextRun(result._id, result.next_check_at + result.interval * 1000)

        return writeRes(res, 201, "Monitor created successfully.", {monitor: result})
    } catch (error) {
        console.error(error)
        return writeErr(res, 500, "Something went wrong while creating health check service.", error)
    }
}

async function getMonitorsByUserId(req, res) {
    try {
        const user = req.user

        if(!user || user == null || user == undefined || !user?._id) {
            return writeErr(res, 401, "Unauthorized request.", "Invalid user info")
        }
        
        const dbUser = await authServices.getUserById(user._id)
        if(!dbUser || dbUser == {} || dbUser == [] || dbUser == undefined || dbUser == null){
            return writeErr(res, 404, "No such account exists.", "Invalid account info")
        }

        // get all the monitors of a user
        const monitors = await monitorServices.getMonitorsByUserId(user._id)
        return writeRes(res, 200, "Monitors fetched successfully.", {monitors:monitors})
    } catch (error) {
        console.error(error)
        return writeErr(res, 500, "Something went wrong while fetching health monitors.", error)
    }
}

async function getMonitorsById(req, res) {
    try {

        const params = req.params;
        if(!params){
            return writeErr(res, 400, "Insufficient parameters.", "Insufficient payload")
        }
        const {id} = params
        if(!id || !id.trim() || id === null || id == undefined){
            return writeErr(res, 400, "No monitor id is provided.", "Insufficient params")
        }
        const user = req.user

        if(!user || user == null || user == undefined || !user?._id) {
            return writeErr(res, 401, "Unauthorized request.", "Invalid user info")
        }
        
        const dbUser = await authServices.getUserById(user._id)
        if(!dbUser || dbUser == {} || dbUser == [] || dbUser == undefined || dbUser == null){
            return writeErr(res, 404, "No such account exists.", "Invalid account info")
        }

        // get the monitors by monitor id
        const monitor = await monitorServices.getMonitorById(id)
        return writeRes(res, 200, "Monitor fetched successfully.", {monitor:monitor})
    } catch (error) {
        console.error(error)
        return writeErr(res, 500, "Something went wrong while fetching health monitors.", error)
    }
}

async function updateMonitorDetails(req, res) {
    try {
        const body = req.body;
        if(!body){
            return writeErr(res, 400, "Insufficient request body.", "Insufficient payload")
        }
        const params = req.params;
        if(!params){
            return writeErr(res, 400, "Insufficient parameters.", "Insufficient payload")
        }
        const {id} = params
        if(!id || !id.trim() || id === null || id == undefined){
            return writeErr(res, 400, "No monitor id is provided.", "Insufficient params")
        }

        const user = req.user
        if(!user || user == null || user == undefined || !user?._id) {
            return writeErr(res, 401, "Unauthorized request.", "Invalid user info")
        }

        const { interval, expectedStatus, timeout, request_type, request_body, request_headers, next_check_at, is_active } = body
        const monitorConfig = {interval, expectedStatus, timeout, request_type, request_body, request_headers,next_check_at, is_active}        
        
        const updatedMonitor = await monitorServices.updateMonitor(id, monitorConfig)
        return writeRes(res, 202, "Monitor updated successfully.", updatedMonitor)
    } catch (error) {
        console.error(error)
        return writeErr(res, 500, "Something went wrong while updating monitor details", error)
    }
}

async function deleteHealthMonitor(req, res) {
    try {
        const params = req.params;
        if(!params){
            return writeErr(res, 400, "Insufficient parameters.", "Insufficient request params")
        }

        const {id} = params
        if(!id || !id.trim() || id === null || id == undefined){
            return writeErr(res, 400, "No monitor id is provided.", "Insufficient params")
        }

        const user = req.user
        if(!user || user == null || user == undefined || !user?._id) {
            return writeErr(res, 401, "Unauthorized request.", "Invalid user info")
        }

        const deletedMonitor = await monitorServices.deleteMonitorByOwner(id, user._id)
        
        const deletedStatsOfMonitor = await deleteAllStatusOfMonitor(id);
        
        return writeRes(res, 200, "Monitor deleted successfully.", deletedMonitor)
    } catch (error) {
        console.error(error)
        return writeErr(res, 500, "Something went wrong while deleting monitor", error)
    }
}

const monitorControllers = {
    registerMonitor,
    getMonitorsByUserId,
    getMonitorsById,
    updateMonitorDetails,
    deleteHealthMonitor,
}

export async function getMonitorStatuses(req, res) {
    try {
        const params = req.params;
        if(!params){
            return writeErr(res, 400, "Insufficient parameters.", "Insufficient payload")
        }
        const {monitorId} = params
        if(!monitorId || !monitorId.trim() || monitorId === null || monitorId == undefined){
            return writeErr(res, 400, "No monitor id is provided.", "Insufficient params")
        }
        const user = req.user

        if(!user || user == null || user == undefined || !user?._id) {
            return writeErr(res, 401, "Unauthorized request.", "Invalid user info")
        }
        
        const dbUser = await authServices.getUserById(user._id)
        if(!dbUser || dbUser == {} || dbUser == [] || dbUser == undefined || dbUser == null){
            return writeErr(res, 404, "No such account exists.", "Invalid account info")
        }

        const allStatusRecordsOfMonitor = await getAllChecksByMonitorId(monitorId)
        const cnt = allStatusRecordsOfMonitor.length;
        return writeRes(res, 200, "All records fetced for given monitor successfully.", {count: cnt, records:allStatusRecordsOfMonitor})

    } catch (error) {
        console.error("Error in fetching Url health status records: ", error)
        return writeErr(res, 500, "Error fetching health status recordes for monitor")
    }
}

export default monitorControllers