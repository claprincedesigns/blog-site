import express from "express";
import bodyParser from "body-parser";
import { MongoClient, ServerApiVersion } from "mongodb";
import path from "path";
import { fileURLToPath } from 'url';


const uri = "mongodb+srv://claprince:oU4XNksOBsrB2AJ2@blog-space.leuri.mongodb.net/?retryWrites=true&w=majority";

const pw = "oU4XNksOBsrB2AJ2"

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const app = express()

app.use(express.static(path.join(__dirname, '/build')))

app.use(bodyParser.json())

const withDB = async (operations, res) => {
    try {

        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

        const db = client.db('my-blog')

        await operations(db)

        client.close()  
    } catch (err) {
        res.status(500).json({ message: `Error connecting to db: ${err}` })
    }
}

app.get('/api/articles/:name', async (req, res) => {
        withDB(async (db) => {
            const articleName = req.params.name

            const articlesInfo = await db.collection('articles').findOne({ name: articleName })

            res.status(200).json(articlesInfo) 
        }, res)
})

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
       const articleName = req.params.name

        const articlesInfo = await db.collection('articles').findOne({ name: articleName })
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articlesInfo.upvotes + 1,
            },
        })

        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName })
        res.status(200).json(updatedArticleInfo) 
    }, res)   
})

app.post('/api/articles/:name/add-comment', async (req, res) => {
    const { username, text } = req.body
    const articleName = req.params.name 
    withDB(async (db) => {
        const articlesInfo = await db.collection('articles').findOne({ name: articleName })
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articlesInfo.comments.concat({ username, text}),
            },
        })
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName })
        res.status(200).json(updatedArticleInfo) 
    }, res)
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'))
})

app.listen(8000, () => console.log('Listening on port 8000'))