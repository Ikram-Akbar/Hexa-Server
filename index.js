// Import required modules
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express(); // Initialize Express application
const cookieParser = require("cookie-parser");
const port = 5000; // Set the port for the server to run
require("dotenv").config(); // Load environment variables from .env file

// =======================
// Middleware Configuration
// =======================
app.use(
    cors({
        origin: ["http://localhost:5173"],
        credentials: true,
    })
);
app.use(express.json()); // Parse JSON request bodies
app.use(cookieParser());

// =======================
// MongoDB Configuration
// =======================

/*
 * MongoDB Connection:
 * - Connects to MongoDB Atlas using credentials stored in environment variables.
 * - Uses Stable API Version 1 to ensure compatibility and prevent deprecation errors.
 */
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1pple.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

// =======================
// JWT Authentication Middleware
// =======================
const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token;

    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// =======================
// Server Main Function
// =======================
async function run() {
    try {
        // Connect to the MongoDB client
        await client.connect();

        /*
                =======================
                Database & Collection
                =======================
                    - Database: HexaaDB
                    - Collection: services, booking
            */

        const servicesCollection = client.db("HexaaDB").collection("services");
        const bookingCollection = client.db("HexaaDB").collection("booking");

        // ================================
        // API Endpoints For Authentication
        // ================================

        app.post("/jwt-auth", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "1h",
            });
            res
                .cookie("token", token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                })
                .send({ success: true });
        });

        // ==========================
        // API Endpoints For Service
        // ==========================

        app.get("/api/v1/services", async (req, res) => {
            try {
                const result = await servicesCollection.find().toArray();
                res.status(200).send(result);
            } catch (error) {
                res.status(500).send({ message: "Error fetching services", error });
            }
        });

        app.get("/api/v1/services/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            try {
                const service = await servicesCollection.findOne(filter);
                if (service) {
                    res.status(200).send(service);
                } else {
                    res.status(404).send({ message: "Service not found" });
                }
            } catch (error) {
                res.status(500).send({ message: "Error fetching the service", error });
            }
        });

        // =======================
        // API Endpoints For Booking
        // =======================

        app.get("/api/v1/booking", async (req, res) => {
            try {
                let query = {};
                if (req.query?.email) {
                    query = { email: req.query.email };
                }
                const result = await bookingCollection.find(query).toArray();
                res.status(200).send(result);
            } catch (error) {
                res.status(500).send({ message: "Error fetching booking data", error });
            }
        });

        app.post("/api/v1/booking", async (req, res) => {
            const newItem = req.body;
            try {
                const result = await bookingCollection.insertOne(newItem);
                res.status(201).send(result);
            } catch (error) {
                res.status(500).send({ message: "Error adding booking", error });
            }
        });

        app.delete("/api/v1/booking/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await bookingCollection.deleteOne(query);
                res.status(200).send(result);
            } catch (error) {
                res.status(500).send({ message: "Error deleting booking", error });
            }
        });

        // =======================
        // MongoDB Connection Test
        // =======================
        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Keep the connection open for further use (uncomment below to close the connection)
        // await client.close();
    }
}

// Run the main function and catch any errors
run().catch(console.dir);

// =======================
// Default Route for Testing
// =======================
app.get("/", (req, res) => {
    res.send("Server is running");
});

// =======================
// Start the Server
// =======================
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
