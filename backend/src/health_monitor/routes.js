import { Router } from "express"
import authMiddlewares from "../auth/middlewares.js"
import monitorControllers, { getMonitorStatuses } from "./controllers.js"

const monitorRouter = Router()

monitorRouter.post("/",  authMiddlewares.checkAuth, monitorControllers.registerMonitor)
monitorRouter.get("/", authMiddlewares.checkAuth, monitorControllers.getMonitorsByUserId)
monitorRouter.get("/:id", authMiddlewares.checkAuth, monitorControllers.getMonitorsById )
monitorRouter.patch("/:id",  authMiddlewares.checkAuth, monitorControllers.updateMonitorDetails)
monitorRouter.delete("/:id",  authMiddlewares.checkAuth, monitorControllers.deleteHealthMonitor)



const statusRouter = Router()

statusRouter.get("/:monitorId", authMiddlewares.checkAuth, getMonitorStatuses)

export {monitorRouter, statusRouter}