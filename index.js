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
        'http://127.0.0.1:5173',
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


app.get("/api/v1/h", (req, res) => {
    res.send("Hello World")
})


const blogCollection = client.db("blog-insights").collection("blogs");
const commentCollection = client.db("blog-insights").collection("comments");
// const cartCollection = client.db("brand-shop").collection("cart");

app.post("/api/v1/access-token", async (req, res) => {
    const { email } = req.body;
    const token = jwt.sign(email, process.env.JWT_SECRET);
    // console.log(token)
    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    }).json({success: true });

})


app.get("/api/v1/get-blogs", async(req, res) => {
    
    const result = await blogCollection.find({}).toArray();

    res.json({result})
    
})



app.post("/api/v1/add-blog", verifyToken, async (req, res) => {
    const blogData = req.body;

    const result = await blogCollection.insertOne({ ...blogData, createAt: new Date() });

    res.json({ result })

})


app.put('/api/v1/update-blog', verifyToken, async (req, res) => {
    const { _id, title, category, image, shortDesc, longDesc } = req.body;
    const query = { _id: new ObjectId(_id) }
    const update = {
        $set: {
            title,
            category,
            image,
            shortDesc,
            longDesc
        },
    };

    const result = await blogCollection.findOneAndUpdate(query, update)

    res.json({ result });
})



app.get("/api/v1/get-single-blog/:blogId", async (req, res) => {

    const { blogId } = req.params;
    const result = await blogCollection.findOne({ _id: new ObjectId(blogId) });

    res.json({
        result
    })
})




app.post("/api/v1/add-comment", async (req, res) => {
    const comment = req.body;

    const result = await commentCollection.insertOne({ ...comment, createAt: new Date() });

    res.json({ result })

})


app.listen(port, () => {
    console.log(`Server is running on port: http://localhost:${port}`)
})