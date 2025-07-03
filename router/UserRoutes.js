import express from  'express'




//! configure 

const userRouter = express.Router()

userRouter.post('/register',(req,res)=>{
    const {username,email,password} =req.body
})