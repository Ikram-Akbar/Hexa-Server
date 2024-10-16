// Import required modules
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express(); // Initialize Express application
const port = 5000; // Set the port for the server to run
require("dotenv").config(); // Load environment variables from .env file

// =======================
// Middleware Configuration
// =======================
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

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

        // =======================
        // API Endpoints
        // =======================

        /*
         * GET /api/v1/Services
         * --------------------
         * - Fetches all services from the "Services" collection.
         * - Returns: An array of service objects.
         */
        app.get("/api/v1/services", async (req, res) => {
            try {
                const result = await servicesCollection.find().toArray();
                console.log(result);
                res.status(200).send(result);
            } catch (error) {
                res.status(500).send({ message: "Error fetching services", error });
            }
        });

        /*
         * GET /api/v1/Services/:id
         * ------------------------
         * - Fetches a specific service by its ID from the "services" collection.
         * - ID is passed as a route parameter.
         * - Returns: The service object if found, or a 404 error if not found.
         */
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

        /*
         * GET /api/v1/booking
         * -------------------
         *  - Fetch booking data based on query parameters (e.g., by email).
         *  - If no query is provided, it will fetch all bookings.
         *  - If no results are found, it will return an empty array.
         */

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

        /*
         * POST /api/v1/booking
         * -----------------
         *  - Insert a new item into the collection.
         */
        app.post("/api/v1/booking", async (req, res) => {
            const newItem = req.body;
            try {
                const result = await bookingCollection.insertOne(newItem);
                res.status(201).send(result);
            } catch (error) {
                res.status(500).send({ message: "Error adding item", error });
            }
        });

        // =======================
        // MongoDB Connection Test
        // =======================
        /*
         * Pings the MongoDB deployment to ensure a successful connection.
         * Logs a success message when connected.
         */
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
/*
 * GET /
 * -----
 * - Returns a confirmation message to check if the server is running.
 */
app.get("/", (req, res) => {
    res.send("Server is running");
});

// =======================
// Start the Server
// =======================
/*
 * Starts the Express server on port 5000.
 * Logs the URL when the server is running.
 */
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
