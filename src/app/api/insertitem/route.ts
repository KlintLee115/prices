import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';

type ItemsType = {
  products: string; 
  price: number;   
  address: string;  
  lat: number;  
  lng: number;  
  dateStr: string
}

const uri = process.env.MONGODB_URI
let clientPromise: Promise<MongoClient> | undefined;
let client: MongoClient


if (!clientPromise) {
    client = new MongoClient('mongodb+srv://klintmongo:Motherorange1@prices.o0nfqfl.mongodb.net/?retryWrites=true&w=majority', {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });
    clientPromise = client.connect();
}

export async function POST(req: Request) {
    try {
        await clientPromise
        const db = client.db("prices");
        const collection = db.collection('prices')

        const items = await req.json()
        const {products, price, address, lat, lng, dateStr}: ItemsType = items

        const updateData = {
            id: new ObjectId(), 
            address: address,
            price: price, // You can replace this with the actual price you want to set
            product: products,
            date: new Date(dateStr),
            coordinates: [lng, lat]
        }

        await collection.updateOne(
            { _id: new ObjectId('658ea1cdaad35de3bc68d19f') },
            { $push: {prices: updateData} }
        );

        //   // Close the database connection
        return new Response(JSON.stringify({success: 'good'}))
    }
    catch (err) {
        console.log(err)
        return new Response(JSON.stringify({ error: err }))
    }
    finally {
        await client.close()
    }
}