import pg from "pg";
import { Sequelize } from "sequelize";

const DB = process.env.DB;

const newSequlize = new Sequelize(DB, {
  logging: false,
  dialect: "postgres",
  dialectModule: pg,
});

!(async function () {
  try {
    await newSequlize.authenticate();
    console.log("successfully");
  } catch (error) {
    console.error(error);
  }
})();

export default newSequlize;
