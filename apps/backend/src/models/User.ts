import mongoose, { Schema } from 'mongoose';

export interface UserDoc {
  email: string;
  passwordHash: string;
  telegramChatId?: string;
  discordWebhook?: string;
  emailTarget?: string;
  customWebhook?: string;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    telegramChatId: String,
    discordWebhook: String,
    emailTarget: String,
    customWebhook: String
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<UserDoc>('User', userSchema);
