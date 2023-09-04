const express = require("express");
const app = express();
const cors = require("cors");
const SSLCommerzPayment = require("sslcommerz-lts");
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
    // await client.connect();
    // Send a ping to confirm a successful connection

    const userCollection = client.db("vapeCafe").collection("user");
    const productCollection = client.db("vapeCafe").collection("vapeProducts");
    const cartCollection = client.db("vapeCafe").collection("cart");
    const orderCollection = client.db("vapeCafe").collection("order");


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

    // app product
app.post("/addProduct", async (req, res) => {
  const product = req.body;
  const result = await productCollection.insertOne(product)
  res.send(result);
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
 // get cart data
 app.get("/cart", async (req, res) => {
  const email = req.query.email;
  if (!email) {
    res.send([]);
  }
  const query = { email: email };
  const result = await cartCollection.find(query).toArray();
  res.send(result);
});

// delete cart
app.delete("/cart/delete/:id", async(req, res) => {
  const id = req.params.id
  const filter = {_id: new ObjectId (id)}
  const result = await cartCollection.deleteOne(filter)
  res.send(result)
})










// SSL Commerz
const store_id = process.env.SSL_STORE_ID;
const store_passwd = process.env.SSL_STORE_PASS;
const is_live = false; //true for live, false for sandbox

const tran_id = new ObjectId().toString();

app.post("/order", async (req, res) => {
  const orderInfo = req.body;
  const data = {
    total_amount: orderInfo?.total,
    currency: "BDT",
    tran_id: tran_id, // use unique tran_id for each api call
    success_url: `https://vape-cafe-server.vercel.app/payment/success/${tran_id}`,
    fail_url: `https://vape-cafe-server.vercel.app/payment/fail/${tran_id}`,
    cancel_url: "http://localhost:3030/cancel",
    ipn_url: "http://localhost:3030/ipn",
    shipping_method: "Courier",
    product_name: "Computer.",
    product_category: "Electronic",
    product_profile: "general",
    cus_name: orderInfo?.name,
    cus_email: orderInfo?.email,
    cus_add1: "Dhaka",
    cus_add2: "Dhaka",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "1000",
    cus_country: "Bangladesh",
    cus_phone: "01711111111",
    cus_fax: "01711111111",
    ship_name: "Customer Name",
    ship_add1: "Dhaka",
    ship_add2: "Dhaka",
    ship_city: "Dhaka",
    ship_state: "Dhaka",
    ship_postcode: 1000,
    ship_country: "Bangladesh",
  };
  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  sslcz.init(data).then((apiResponse) => {
    // Redirect the user to payment gateway
    let GatewayPageURL = apiResponse.GatewayPageURL;
    res.send({ url: GatewayPageURL });

    const finalOrder = {
      ...orderInfo,
      paidStatus: false,
      transactionId: tran_id,
    };
    const result = orderCollection.insertOne(finalOrder)

    console.log("Redirecting to: ", GatewayPageURL);
  });
  app.post("/payment/success/:tranId", async (req, res) => {
    console.log(req.params.tranId);
    const result = await orderCollection.updateOne({transactionId:req.params.tranId},{
      $set: {
        paidStatus: true
      },
    })
    if(result.modifiedCount>0){
res.redirect(`https://vape-cafe-007.web.app/payment/success/${req.params.tranId}`)
    }
  });

  app.post("/payment/fail/:tranId", async (req, res) => {
    const result = await orderCollection.deleteOne({transactionId: req.params.tranId})
    if(result.deletedCount){
      res.redirect(`https://vape-cafe-007.web.app/payment/fail/${req.params.tranId}`)
    }
  })

});











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
