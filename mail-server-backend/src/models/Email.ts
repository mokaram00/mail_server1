import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';
import User from './User';

// Define the attributes for the Email model
interface EmailAttributes {
  id: number;
  senderId: number;
  recipientId: number;
  subject: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
  messageId?: string;
  fromAddress?: string;
  toAddress?: string;
  receivedAt?: Date;
}

// Define the creation attributes (id is auto-generated)
interface EmailCreationAttributes extends Optional<EmailAttributes, 'id'> {}

// Define the Email model class
class Email extends Model<EmailAttributes, EmailCreationAttributes> implements EmailAttributes {
  public id!: number;
  public senderId!: number;
  public recipientId!: number;
  public subject!: string;
  public body!: string;
  public isRead!: boolean;
  public isStarred!: boolean;
  public folder!: 'inbox' | 'sent' | 'drafts' | 'trash';
  public messageId!: string | undefined;
  public fromAddress!: string | undefined;
  public toAddress!: string | undefined;
  public receivedAt!: Date | undefined;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the Email model
Email.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isStarred: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    folder: {
      type: DataTypes.ENUM('inbox', 'sent', 'drafts', 'trash'),
      defaultValue: 'inbox',
    },
    messageId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fromAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    toAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receivedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'emails',
    timestamps: true,
  }
);

// Define associations
User.hasMany(Email, { foreignKey: 'senderId', as: 'sentEmails' });
User.hasMany(Email, { foreignKey: 'recipientId', as: 'receivedEmails' });
Email.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Email.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

export default Email;