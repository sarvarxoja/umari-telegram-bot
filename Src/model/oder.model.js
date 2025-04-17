import { DataTypes, Model } from "sequelize";
import newSequlize from "../config/index.js";

export class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    orderNumber: {
      type: DataTypes.STRING,
    },

    name: {
      type: DataTypes.STRING,
    },

    phone: {
      type: DataTypes.STRING,
    },

    address: {
      type: DataTypes.STRING,
    },

    productName: {
      type: DataTypes.STRING,
    },

    color: {
      type: DataTypes.STRING,
    },

    size: {
      type: DataTypes.STRING,
    },

    price: {
      type: DataTypes.STRING,
    },

    delivery: {
      type: DataTypes.STRING,
    },

    date: {
      type: DataTypes.STRING,
    },

    photo: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "Orders",
    sequelize: newSequlize,
  }
);

Order.sync({force:true});
