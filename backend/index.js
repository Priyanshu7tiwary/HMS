import http from "http"
import e from "express";
import cors from "cors"
import Redis from "ioredis"

import { loadConfig } from "./src/config/config.js";
import { connectMongoDB } from "./src/db/mongodb/mongo.js";
import authRouter from "./src/auth/routes.js";
import {monitorRouter, statusRouter} from "./src/health_monitor/routes.js";
import { startScheduler } from "./src/scheduler/index.js";
import healthStatusQueue from "./src/health_status_queue/index.js";

const app = e();
const server = http.createServer(app)
export const cfg = loadConfig(process.env.NODE_ENV || "dev") 
export let redis;

async function mount(cfg){
    try {
        // Load some essentail middlewares
        app.use(e.json())
        app.use(e.urlencoded({extended: true}))
        app.use(cors())

        // 1. connect to main db
        const conn = await connectMongoDB(cfg.MONGO_URI)
        console.log("MongoDBConfig: ", conn.connection.config)
        console.log("Connected to MongoDB")
        // connect to redis
        redis = new Redis(cfg.REDIS_URI)

        // 2. load all routes and middlewares
        app.get("/health", (req, res) => {
            return res.status(200).json({
                msg: `Server is listening on port: ${cfg.PORT}`,
                status: "ok",
            })
        })
        //Auth routes
        app.use("/api/v1/auth", authRouter)
        // Health Monitor routes
        app.use("/api/v1/monitor", monitorRouter)
        // Status check's routes
        app.use("/api/v1/status", statusRouter)
        
        // 3. return server
        return server
    } catch (error) {
        // console.error("Error mounting server: ", error)
        throw error
    }
}

function run(server, cfg){
    if(!cfg || !server){
        const err = {
            msg: "Provide valid configurations!",
            config: cfg,
            server: server
        }
        // console.error(err)
        throw err
    }
    try {
        server.listen(cfg.PORT)
        // run the scheduler also here
        startScheduler()
        // listen queues
        healthStatusQueue.reciveMsgFromHealthStatusQueue()
    } catch (error) {
        // console.error("Error running server: ", error)
        throw error
    }
}


async function init(){
   try {
     // 1. Load configs 
     // altready loaded above and exported for other to modules to use the same
     
     // 2. get server
     const srv = await mount(cfg)
     
     // 3. run server
     console.log(`Server starting on port: ${cfg.PORT}`)
     run(srv,cfg)
   
    } catch (error) {
        console.error("Error in init func: ",error)
        return
   }
}

init()
// healthStatusQueue.reciveMsgFromHealthStatusQueue()





