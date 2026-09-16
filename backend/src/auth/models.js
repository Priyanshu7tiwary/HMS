import mongoose, {Schema} from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
}, {
    timestamps: true
})

// Pre
userSchema.pre("save", async function (next) {
    // hash only if modified
    if(!this.isModified("password")){
        return
    }
    // hash password before saving
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds)
})

// Compare password

const User = mongoose.model("User", userSchema, "users");

export {
    User,
}