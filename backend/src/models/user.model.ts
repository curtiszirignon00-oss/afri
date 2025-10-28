import {Schema, model, Document} from 'mongoose';

//Exemple de model si vous utilisers MongoDB avec Mongoose
export interface IUser extends Document {
    email: string;
    password: string;
    name: string;
    age: number;
}

const userSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true }
});

const UserModel = model<IUser>('User', userSchema);

export default UserModel;