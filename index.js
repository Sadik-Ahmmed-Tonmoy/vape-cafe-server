const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lw1wxb4.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const userCollection = client.db("vapeCafe").collection("user");
    const productCollection = client.db("vapeCafe").collection("vapeProducts");
    const cartCollection = client.db("vapeCafe").collection("cart");


    // users details.
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exists" });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // get all products
    app.get("/products", async (req, res) => {
      const products = await productCollection.find().toArray();
      res.send(products);
    });

// get data of single category
app.get("/products/:category", async (req, res) => {
  const category = req.params.category;
  const query = {category: category}
  const products = await productCollection.find(query).toArray(); 
  res.send(products)
})


// get single product all data
app.get("/productDetails/:id", async (req, res) => {
const id = req.params.id;
const query = {_id: new ObjectId(id)}
result = await productCollection.findOne(query);
res.send(result)
})

// cart data
// post data to cart
app.post("/addToCart", async(req, res) => {
  const cart = req.body;
  const result = await cartCollection.insertOne(cart);
  res.send(result)
})
// get data from cart
app.get("/cart/data/:email", async(req, res) => {
  const email = req.params.email;
  const filter = {email: email}
  const result = await cartCollection.find(filter).toArray();
  res.send(result)
})
// delete cart
app.delete("/cart/delete/:id", async(req, res) => {
  const id = req.params.id
  const filter = {_id: new ObjectId (id)}
  const result = await cartCollection.deleteOne(filter)
  res.send(result)
})




    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Cafe is vaping!");
});

app.listen(port, () => {
  console.log(`vape cafe is running on port ${port}`);
});
