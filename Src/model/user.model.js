import { DataTypes, Model } from "sequelize";
import newSequlize from "../config/index.js";

export class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    username: {
      type: DataTypes.STRING,
      defaultValue: null,
    },

    chat_id: {
      type: DataTypes.INTEGER,
      defaultValue: null,
    },

    first_name: {
      type: DataTypes.STRING,
      defaultValue: null,
    },
  },
  {
    tableName: "Users",
    sequelize: newSequlize,
  }
);

User.sync({force:true});
