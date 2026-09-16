import mongoose from "mongoose";

export async function connectMongoDB(mongoDbConnectionString) {
    try {
        const res = await mongoose.connect(mongoDbConnectionString)
        return res
    } catch (error) {
        throw error
    }
}