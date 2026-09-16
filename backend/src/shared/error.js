export function writeError({res, msg, err, statusCode}){
    return res.status(statusCode).json({msg, err})
}

export function writeErr(res, statusCode, msg, err){
    return res.status(statusCode).json({
        msg: msg,
        err: err
    })
}