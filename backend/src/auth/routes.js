import { Router } from "express"
import authControllers from "./controllers.js"
import authMiddlewares from "./middlewares.js"

const authRouter = Router()

authRouter.post("/", authControllers.registerUser)
authRouter.get("/", authMiddlewares.checkAuth, authControllers.getUsers)
authRouter.post("/login", authControllers.loginUser)

export default authRouter