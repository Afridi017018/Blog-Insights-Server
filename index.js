const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;


app.use(cors({
    origin: [
        'http://localhost:5173',
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());




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






app.post("/api/v1/access-token",async (req,res)=>{
     const {user} = req.body;
    //  console.log('user for token', user);
     const token = jwt.sign(user, "process.env.ACCESS_TOKEN_SECRET");
     res.json({token});
})









app.listen(port, () => {
    console.log(`Server is running on port: http://localhost:${port}`)
})