export function writeRes(res, statusCode, msg, data){
    return res.status(statusCode).json({
        msg,
        data,
    })
}