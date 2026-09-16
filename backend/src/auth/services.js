import { User } from "./models.js"

async function createUser(name, email, password){
    try {
        const user = await User.create({name, email, password});
        return user
    } catch (error) {
        throw error
    }
}

async function getUserById(id){
    try {
        const user = await User.findById(id).select("-password")
        return user
    } catch (error) {
        throw error
    }
}

async function getUserByEmail(email) {
    try {
        const user = await User.findOne({email})
        if(!user){
            return {isExist: false, user: null}
        }
        return {isExist:true, user:user};
    } catch (error) {
        throw error
    }
}

async function getAllUsers(){
    try {
        const users = await User.find({}).select("-password");
        return users
    } catch (error) {
        throw error
    }
}

const authServices = {
    createUser,
    getUserById,
    getUserByEmail,
    getAllUsers,
}

export default authServices