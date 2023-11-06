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



const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) {
        return res.status(401).json({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
}


app.get("/",verifyToken, (req, res) => {
    res.send("Hello World")
})

const blogCollection = client.db("blog-insights").collection("blogs");
// const cartCollection = client.db("brand-shop").collection("cart");

app.post("/api/v1/access-token",async (req,res)=>{
     const {user} = req.body;
     const token = jwt.sign(user, process.env.JWT_SECRET);
     res.json({token});
})

app.post("/api/v1/add-blog",async (req,res)=>{
    const blogInfo = req.body;
   
    const result = await blogCollection.insertOne({...blogInfo, createAt: new Date()});

    res.json({result})

})









app.listen(port, () => {
    console.log(`Server is running on port: http://localhost:${port}`)
})