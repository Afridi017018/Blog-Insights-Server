const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());




const uri = process.env.MONGO_URI;



const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const dbConnect = async () => {
    try {
        await client.connect();
        console.log("Database Connected!");
    } catch (error) {
        console.log(error.name, error.message);
    }
};
dbConnect();


app.get("/", (req, res) => {
    res.send("Hello World")
})










app.listen(port, () => {
    console.log(`Server is running on port: http://localhost:${port}`)
})