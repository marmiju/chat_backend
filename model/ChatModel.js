import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        require:true
    },
    content:{
        type:String,
        require:true,
    },
    group:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
},{timestamps:true})

export const Message = mongoose.model('Message',messageSchema) 