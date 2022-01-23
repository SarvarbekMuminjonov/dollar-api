import express from "express"
import getAllKurs from "./routes/usdRoute.js"
const app = express()
const port = process.env.PORT
app.use('/getAllKurs',getAllKurs)
app.listen(port || 3000,()=>console.log('api started'))