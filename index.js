import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_DB_URI);

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if(!authHeader){
  return res.status(401).send({ message: "Unauthorized!" });
  }
  const token = authHeader.split(" ")[1]
  
if(!token){
  return res.status(401).send({ message: "Unauthorized!" });
}

const JWKS = createRemoteJWKSet(new URL(`${process.env.Client_URL}/api/auth/jwks`))

try{
const {payload} = await jwtVerify(token, JWKS)
} catch(error){
return res.status(500).send({ message: "Server Error" });
}
  next();
};

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB();
const db = mongoClient.db("wanderlast");
const destinationCollection = db.collection("destination");
const myBookingsColection = db.collection("My-Bookings");

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.post("/add-destination", verifyToken, async (req, res) => {
  const data = req.body;
  const result = await destinationCollection.insertOne(data);
  res.send(result);
});

app.post("/booking", async (req, res) => {
  const data = req.body;
  const result = await myBookingsColection.insertOne(data);
  res.send(result);
});

app.get("/my-bookings/:email", verifyToken, async (req, res) => {
  const { email } = req.params;
  const result = await myBookingsColection.find({ email: email }).toArray();
  res.send(result);
});

app.delete("/my-bookings/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const result = await myBookingsColection.deleteOne({ _id: id });
  res.send(result);
});

app.get("/destinations", async (req, res) => {
  const result = await destinationCollection.find().toArray();
  res.send(result);
});

app.get('/featured-destinations', async(req, res) => {
  const result = await destinationCollection.find().limit(5).toArray()
  res.send(result);
})

app.get("/destinations/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const result = await destinationCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

app.put("/destinations/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const result = await destinationCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: req.body },
  );
  res.send("Destination Updated Successfully");
});

app.delete("/destinations/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const result = await destinationCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.send("Destination Deleted Successfully");
});

app.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
});

export default app