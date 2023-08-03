import { Sequelize } from "sequelize";

//prod

const sequelize = new Sequelize(
  "postgresql://postgres:RfIv8n9Q4OLSfr9uEm2o@containers-us-west-75.railway.app:6640/railway"
);

//dev

// const sequelize = new Sequelize("shoplist", "postgres", "1111", {
//   host: "localhost",
//   dialect: "postgres",
//   logging: false, // Disabling logging for cleaner output, set to 'true' if you want to see SQL queries.
// });

try {
  await sequelize.authenticate();
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

export default sequelize;
