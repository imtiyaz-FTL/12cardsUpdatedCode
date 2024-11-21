const mongoose=require("mongoose")
mongoose.set("strictQuery", false);
const connectDB=async()=>{
    try {
        const conn=await mongoose.connect(process.env.MONGO_URI,{         
        })
        console.log("databse conected")
    } catch (error) {
        console.log(error)
    }
}

module.exports=connectDB