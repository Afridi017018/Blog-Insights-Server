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
        'http://localhost:5173',
        'https://blog-insights.web.app',
        'https://blog-insights.firebaseapp.com'
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


app.get("/", (req, res) => {
    res.send("server is ok !!!")
})


const blogCollection = client.db("blog-insights").collection("blogs");
const commentCollection = client.db("blog-insights").collection("comments");
const wishlistCollection = client.db("blog-insights").collection("wishlist");
const userCollection = client.db("blog-insights").collection("users");

app.post("/api/v1/access-token", async (req, res) => {
    const { email } = req.body;
    const token = jwt.sign(email, process.env.JWT_SECRET);
    // console.log(token)
    res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    }).json({ success: true });

})

app.post("/api/v1/user-info", async (req, res) => {
    const { user, name, photo } = req.body;

    const data = await userCollection.findOne({ user });

    if (data === null) {
        const result = await userCollection.insertOne({ user, name, photo })
        return res.json({ result });
    }

    res.json({ data })
})


app.get("/api/v1/get-user-info/:user", async (req, res) => {
    const { user } = req.params;
    const data = await userCollection.findOne({ user });
    res.json({ data })
})


app.get("/api/v1/get-blogs", async (req, res) => {
    // console.log("Request path:", req.path);
    const { search, category } = req.query;
    const query = {}
    if (search) {
        const searchRegExp = new RegExp('.*' + search + '.*', 'i');
        query.title = searchRegExp;

    }

    if (category) {
        const categoryRegExp = new RegExp('.*' + category + '.*', 'i');
        query.category = categoryRegExp;

    }



    const result = await blogCollection.find(query).sort({ createdAt: -1 }).toArray();

    res.json({ result })

})

app.get("/api/v1/get-recent-blogs", async (req, res) => {

    const result = await blogCollection.find({}).sort({ createdAt: -1 }).limit(6).toArray();

    res.json({ result })

})



app.get('/api/v1/get-feature', async (req, res) => {
    const data = await blogCollection.find({}).sort({ createdAt: -1 }).toArray();
    const userInfo = await userCollection.find({}).toArray()

    data.sort((a, b) => {
        return b.longDesc.length - a.longDesc.length;
    });

    const result = data.slice(0, 10).map(item => {
        const user = userInfo.find(u => u.user === item.user);
        return { ...item, userPhoto: user.photo, userName: user.name  };
    });
    res.json({ result })

});



app.post("/api/v1/add-blog", verifyToken, async (req, res) => {
    const blogData = req.body;

    const result = await blogCollection.insertOne({ ...blogData, createdAt: new Date() });

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
    // console.log("Request path:", req.path);
    // console.log(req.params);
    const { blogId } = req.params;
    const result = await blogCollection.findOne({ _id: new ObjectId(blogId) });
    const comments = await commentCollection.find({ blogId }).sort({ createdAt: -1 }).toArray();

    res.json({
        result,
        comments
    })
})




app.post("/api/v1/add-comment", verifyToken, async (req, res) => {
    const comment = req.body;

    const result = await commentCollection.insertOne({ ...comment, createdAt: new Date() });

    res.json({ result })

})

// app.get("/api/v1/get-comments-by-id/:blogId", async (req, res) => {

//     const { blogId } = req.params;
//     const result = await commentCollection.find({ _id: new ObjectId(blogId) }).sort({ createdAt: -1 }).toArray();

//     res.json({ result })

// })


app.post("/api/v1/add-to-wishlist", verifyToken, async (req, res) => {
    const wishlist = req.body;

    const find = await wishlistCollection.findOne({ user: wishlist.user, blogId: wishlist.blogId })

    if (find !== null) {
        return res.json({ message: "Already in the card" })
    }

    const result = await wishlistCollection.insertOne({ ...wishlist, createdAt: new Date() });

    res.json({ result, message: "Added to the wishlist" })

})


app.get("/api/v1/get-wishlist-by-user", verifyToken, async (req, res) => {
    const { user } = req.query;
    const result = await wishlistCollection.find({ user: user }).sort({ createdAt: -1 }).toArray();

    res.json({ result });

})

app.delete("/api/v1/delete-wishlist-by-user/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    const result = await wishlistCollection.deleteOne({ _id: new ObjectId(id) });
    // console.log(result)
    res.json({ result });

})


app.post('/api/v1/logout', async (req, res) => {
    console.log("User Logged out: ", req.body.user);
    res.clearCookie('token', {
        maxAge: 0,
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    }).json({ success: true });

})


app.listen(port, () => {
    console.log(`Server is running on port: http://localhost:${port}`)
})