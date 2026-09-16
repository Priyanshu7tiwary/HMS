import { writeErr } from "../shared/error.js"
import { verifyJwtToken } from "../utils/jwt.js";

function checkAuth(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = `${authHeader}`?.replace("Bearer ", "");

        const isCorrectJWT = verifyJwtToken(token)
        if(!isCorrectJWT){
            writeErr(res, 401, "Unauthorized request.", "Invalid JWT authorization token.")
        }

        req.user = isCorrectJWT;
        // console.log("user pushed in req: ", req.user);
        next()
    } catch (error) {
        console.error("Error in auth middleware: ",error)
        return writeErr(res, 400, "Something went wrong while validating credentials.", error)
    }
}

const authMiddlewares = {
    checkAuth,
}

export default authMiddlewares