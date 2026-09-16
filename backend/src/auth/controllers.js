import { writeErr } from "../shared/error.js";
import { writeRes } from "../shared/response.js";
import { generateJwtToken } from "../utils/jwt.js";
import authServices from "./services.js"
import bcrypt from "bcryptjs";

async function registerUser(req, res) {
    try {
        const {name, email, password} = req.body
        // field validations
        if(!name || !email || !password){
            return writeErr(
                res, 400,
                "Provide all required fields", 
                err={
                    required_fields:["name", "email", "password"],
                    user_input:{name, email, password},
                },
            )
        }
        // check if user already exists
        const {isExist, user} = await authServices.getUserByEmail(email)
        console.log("Existing user:", user)
        if(isExist){
            return writeErr(res, 400, "Account already exist", "Account already exist with given email address")
        }
        // if not exist then create new user
        const createdUser = await authServices.createUser(name, email, password)
        return writeRes(res, 201, "User created successfully", createdUser)
    } catch (error) {
        console.error(error)
        return writeErr(res, 500, "Failed to create account", error)
    }
}

async function getUsers(req, res) {
    try {
        const user = req.user;
        if(!user){
            return writeErr(res, 401, "Unauthorized request.", "Invalid credentials, Login again.")
        }
        const users = await authServices.getAllUsers()
        return writeRes(res, 200, "Users fetched successfully", users)
    } catch (error) {
        console.error(error)
        return writeErr(res, 500, "Failed to fetch accounts", error)
    }
}

async function loginUser(req, res) {
    try {
        const {email, password} = req.body
        if(!email || !password){
            return writeErr(res, 400, "Email and password are required fields.", "Insufficient credentials")
        }

        const {isExist, user} = await authServices.getUserByEmail(email)
        if(!isExist){
            return writeErr(res, 404, "No account found with given email.", "No such account exist.")
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if(!isPasswordCorrect){
            return writeErr(res, 401, "Invalid credentials.", "Unauthorized access.")
        }

        // if password is correct generate jwt token and send it to client
        const token = generateJwtToken({_id: user._id, email: user.email})
        return writeRes(res, 200, "User logged in successfully.", {user, token})
    } catch (error) {
        console.error(error)
        return writeErr(res, 500, "Something went wrong.", error)
    }
}

const authControllers = {
    registerUser,
    getUsers,
    loginUser,
}

export default authControllers