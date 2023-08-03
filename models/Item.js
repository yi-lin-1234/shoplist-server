import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Define Item model
const Item = sequelize.define("Item", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  purchased: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default Item;
