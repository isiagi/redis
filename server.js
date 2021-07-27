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
    redisClient.get(`photos?albumId=${albumId}`, async (error, photos) => {
        if (error) console.error(error)
        if(photos != null){
            return res.json(JSON.parse(photos))
        }else{
            const { data } = await axios.get("https://jsonplaceholder.typicode.com/photos", {params: {albumId}})
            redisClient.setex(`photos?albumId=${albumId}`, defaultExpiration, JSON.stringify(data));
            res.json(data)
        }
    })
   
})

app.get('/photos/:id', async(req, res) => {
    const { data } = await axios.get(`https://jsonplaceholder.typicode.com/photos/${req.params.id}`)
    res.json(data)
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