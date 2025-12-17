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
  imapHost?: string;
  imapPort?: number;
  imapUser?: string;
  imapPassword?: string;
  imapTLS?: boolean;
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
  public imapHost!: string | undefined;
  public imapPort!: number | undefined;
  public imapUser!: string | undefined;
  public imapPassword!: string | undefined;
  public imapTLS!: boolean | undefined;

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
    imapHost: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imapPort: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    imapUser: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imapPassword: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    imapTLS: {
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