import express from 'express'
import axios from 'axios'
import cors from 'cors'
import Redis from 'redis'


const redisClient = Redis.createClient()

const defaultExpiration = 3600;

const app = express();

app.use(cors())

app.get('/photos', async(req, res) => {
    const albumId = req.query.albumId
    const photos = await getOrSetCache(`photos?albumId=${albumId}`, async() => {
        const { data } = await axios.get("https://jsonplaceholder.typicode.com/photos", {params: {albumId}})
        return data
    })
   res.json(photos)
})

app.get('/photos/:id', async(req, res) => {
    const photos = await getOrSetCache(`photos:${req.params.id}`, async() => {
        const { data } = await axios.get(`https://jsonplaceholder.typicode.com/photos/${req.params.id}`)
        return data
    })
   res.json(photos)
})

function getOrSetCache(key, cb){
    return new Promise((resolve, reject) => {
        redisClient.get(key, async (error, data) => {
            if(error) reject(error)
            if(data != null) resolve(JSON.parse(data))
            const freshData = await cb()
            redisClient.setex(key, defaultExpiration, JSON.stringify(freshData))
            resolve(freshData)
        })
    })
}



const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
    console.log(`we are listening on PORT ${PORT}`);
})