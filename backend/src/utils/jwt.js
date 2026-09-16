import jwt  from "jsonwebtoken";
import { cfg } from "../../index.js";

export function generateJwtToken(payload){
    if(!payload){
        throw new Error("No payload provided to sign jwt token.")
    }
    try {
        const token = jwt.sign(payload, cfg.JWT_SECRET_KEY,
        {
            algorithm: "HS256",
            expiresIn: "7d",
            issuer: cfg.JWT_TOKEN_ISSUER,
            mutatePayload: false,
            noTimestamp:false,
        })
        return token
    } catch (error) {
        throw error
    }
}

export function verifyJwtToken(token) {
    if(!token){
        throw new Error("No token provided to verify the jwt token.")
    }
    try {
        const verifiedToken = jwt.verify(token, cfg.JWT_SECRET_KEY, {
            issuer: cfg.JWT_TOKEN_ISSUER
        })
        return verifiedToken
    } catch (error) {
        throw error
    }
}