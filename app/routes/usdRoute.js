import express from "express"
import { getAllKurs } from "../methods/getKurs.js"
const router = express.Router()
router.get("/", async(req, res) => {
    const data = await getAllKurs()
  res.send(JSON.stringify(data))
})
 export default router