import express from "express";
import cors from "cors";
import morgan from "morgan";
import sequelize from "./config/db.js";
import { auth } from "express-oauth2-jwt-bearer";
import axios from "axios";

//dev
// import { config } from "dotenv";
// config();

import Item from "./models/Item.js";

const app = express();

// Configure CORS(dev)
// const corsOptions = {
//   origin: "http://localhost:3000", // specify the exact origin
// };

// Configure CORS(prod)
const corsOptions = {
  origin: "https://inspiring-squirrel-e515f6.netlify.app/", // specify the exact origin
};

// middleware
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json());

const jwtCheck = auth({
  audience: process.env.AUDIENCE,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  tokenSigningAlg: process.env.TOKEN_SIGNING_ALG,
});

// enforce on all endpoints
app.use(jwtCheck);

sequelize
  .sync()
  .then(() => {
    console.log("items table created successfully!");
  })
  .catch((error) => {
    console.error("unable to create table : ", error);
  });

//======================( middleware )=============================

const getUserEmail = async (req, res, next) => {
  try {
    const auth = req.auth;
    const token = auth.token;
    const response = await axios.get(process.env.GET_USER_INFO_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    req.userEmail = response.data.email;
    next();
  } catch (error) {
    console.error("Error fetching user email", error);
    res.status(500).json({ message: "Error fetching user email" });
  }
};

app.use(getUserEmail);

// 🟢 🟢 🟢 🟢 🟢 🟢 POST 🟢 🟢 🟢 🟢 🟢 🟢

//===================( create new item )===========================

app.post("/item", async (req, res) => {
  try {
    const { name, category } = req.body;

    // Check if all fields are present
    if (!name || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create a new item
    const item = await Item.create({
      name: name,
      category: category,
      userEmail: req.userEmail,
    });

    res.status(201).json({
      message: "Item created successfully",
      item: item,
    });
  } catch (error) {
    console.error("Error creating item", error);
    res.status(500).json({ message: "Error creating item" });
  }
});

// 🔵 🔵 🔵 🔵 🔵 🔵 GET 🔵 🔵 🔵 🔵 🔵 🔵

//===================( get all unpurchased items )===========================

app.get("/all-unpurchased-items", async (req, res) => {
  try {
    // Retrieve all items where purchased is false
    const items = await Item.findAll({
      where: { purchased: false, userEmail: req.userEmail },
    });

    // If no items found, return appropriate message
    if (items.length === 0) {
      return res.status(404).json({ message: "No unpurchased items found" });
    }

    res.status(200).json({
      message: "Unpurchased items fetched successfully",
      items: items,
    });
  } catch (error) {
    console.error("Error fetching unpurchased items", error);
    res.status(500).json({ message: "Error fetching unpurchased items" });
  }
});

//===================( get all purchased items )===========================

app.get("/all-purchased-items", async (req, res) => {
  try {
    // Retrieve all items where purchased is true
    const items = await Item.findAll({
      where: { purchased: true, userEmail: req.userEmail },
    });

    // If no items found, return appropriate message
    if (items.length === 0) {
      return res.status(404).json({ message: "No purchased items found" });
    }

    res.status(200).json({
      message: "Purchased items fetched successfully",
      items: items,
    });
  } catch (error) {
    console.error("Error fetching purchased items", error);
    res.status(500).json({ message: "Error fetching purchased items" });
  }
});

//===================( get an item by id )===========================

app.get("/item/:id", async (req, res) => {
  try {
    // Retrieve the item id from the request parameters
    const id = req.params.id;

    // Check if id is valid
    if (!id) {
      return res.status(400).json({ message: "Item ID is required." });
    }

    // Find the item
    const item = await Item.findByPk(id);

    // If no item found, return appropriate message
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.userEmail !== req.userEmail) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    res.status(200).json({
      message: "Item fetched successfully",
      item: item,
    });
  } catch (error) {
    console.error("Error fetching item", error);
    res.status(500).json({ message: "Error fetching item" });
  }
});

// ===================( group items by category )============================

app.get("/items-count-by-category", async (req, res) => {
  try {
    const data = await Item.findAll({
      where: { purchased: true, userEmail: req.userEmail },
      group: ["category"],
      attributes: [
        "category",
        [
          sequelize.cast(
            sequelize.fn("COUNT", sequelize.col("category")),
            "integer"
          ),
          "count",
        ],
      ],
      order: [[sequelize.literal('"count"'), "DESC"]],
    });

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No items found" });
    }
    res.status(200).json({ message: "data fetched successfully", data: data });
  } catch (error) {
    res.status(500).json({ message: "Error getting items count by category" });
  }
});

// 🔴 🔴 🔴 🔴 🔴 🔴 DELETE 🔴 🔴 🔴 🔴 🔴 🔴

//===================( delete a item by id )===========================

app.delete("/item/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Item ID is required." });
    }

    // Find the item by id
    const item = await Item.findByPk(id);

    // If no item found, return appropriate message
    if (!item) {
      return res.status(404).json({ message: `No item found with id: ${id}` });
    }
    if (item.userEmail !== req.userEmail) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    // Delete the item
    await item.destroy();

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting item" });
  }
});

// 🟡 🟡 🟡 🟡 🟡 🟡 PUT 🟡 🟡 🟡 🟡 🟡 🟡

//===================( update a item )===========================

app.put("/item/:id", async (req, res) => {
  try {
    const { name, category } = req.body;

    // Validate inputs
    if (!name || !category) {
      return res
        .status(400)
        .json({ message: "Name and category are required." });
    }

    // Retrieve the item id from the request parameters
    const id = req.params.id;

    // Find the item
    const item = await Item.findByPk(id);

    // If no item found, return appropriate message
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.userEmail !== req.userEmail) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    // Update the item
    await item.update({
      name: name,
      category: category,
    });

    res.status(200).json({
      message: "Item updated successfully",
    });
  } catch (error) {
    console.error("Error updating item", error);
    res.status(500).json({ message: "Error updating item" });
  }
});

//===================( update an item status to purchased  )===========================

app.put("/item-purchased/:id", async (req, res) => {
  try {
    // Retrieve the item id from the request parameters
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ message: "Item ID is required." });
    }

    // Find the item
    const item = await Item.findByPk(id);

    // If no item found, return appropriate message
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.userEmail !== req.userEmail) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    // Update the item
    await item.update({
      purchased: true,
    });

    res.status(200).json({
      message: "Item updated successfully",
    });
  } catch (error) {
    console.error("Error updating item", error);
    res.status(500).json({ message: "Error updating item" });
  }
});

// const port = process.env.PORT || 3000;

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
