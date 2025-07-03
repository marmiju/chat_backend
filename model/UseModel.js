import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        trim: true,
    },
    email: {
        type: String,
        require: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        require: true,
    },
    isAdmin:{
        type:Boolean,
        default: false}
},{
    timestamps:true
})

// hashed password befor save User
userSchema.pre('save', async(next)=>{
    if(!this.isModified('password')){
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10)
})

// ? compare password are matches or not
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)   
}

export const User = mongoose.model('Users', userSchema ) 