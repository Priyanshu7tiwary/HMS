import mongoose, { Schema } from "mongoose";


// health monitor schema and model
const healthMonitorSchema = new Schema({
    url: {type: String, required: true},
    interval: {type: Number, required: true, default: 300}, // seconds
    expectedStatus: [], // 2xx, 3xx up, else down default
    timeout: {type: Number, default: 10}, // seconds
    request_type: {type: String, enum: ["head", "get", "post", "put", "post", "patch", "options"], default: "head"},
    request_body: {type: Object, },
    request_headers: {type: Object},

    user_id: {type: mongoose.Types.ObjectId, ref: "User", required: true},
    
    next_check_at: {type: Number, required: true, default: Date.now()/1000},
    is_active: {type: Boolean, default: true, required: true},
}, {
    timestamps: true,
})

const HealthMonitor = mongoose.model("HealthMonitor", healthMonitorSchema, "health_monitors");


// status check schema and model
const healthStatusCheckSchema = new Schema({
    monitor_id: {type: mongoose.Types.ObjectId, ref: "HealthMonitor", required: true},
    status_code: {type: Number, required: true},
    status: {type: String, enum: ["up", "down"], required: true},
    duration: {type: Number, required: true}, // in ms
    response: {type: String},
}, {
    timestamps: true,
})

const HealthStatusCheck = mongoose.model("HealthStatusCheck", healthStatusCheckSchema, "status_cheks")

export {
    HealthMonitor,
    HealthStatusCheck,
}