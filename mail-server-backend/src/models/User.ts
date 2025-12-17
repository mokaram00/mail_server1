import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

// Define the attributes for the User model
interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  isActive: boolean;
  pop3Host?: string;
  pop3Port?: number;
  pop3User?: string;
  pop3Password?: string;
  pop3TLS?: boolean;
}

// Define the creation attributes (id and isActive are optional)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive'> {}

// Define the User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public role!: 'admin' | 'user';
  public isActive!: boolean;
  public pop3Host!: string | undefined;
  public pop3Port!: number | undefined;
  public pop3User!: string | undefined;
  public pop3Password!: string | undefined;
  public pop3TLS!: boolean | undefined;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the User model
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      defaultValue: 'user',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    pop3Host: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pop3Port: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    pop3User: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pop3Password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pop3TLS: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  }
);

export default User;