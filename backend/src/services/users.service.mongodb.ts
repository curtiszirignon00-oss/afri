import User from "../models/user.model";
import { IUser } from "../models/user.model";

export const getAllUsers = async () => {
    const users = await User.find();
    return users;
};

export const createUser = async (data: Omit<IUser, "id">) => {
    const user = await User.create(data);
    return user;
};

export const getUserById = async (id: number) => {
    const user = await User.findById(id);
    return user;
};
export const getUserByEmail = async (email: string) => {
    const user = await User.findOne({ email });
    return user;
};

export const updateUser = async (id: number, data: Partial<IUser>) => {
    const user = await User.findByIdAndUpdate(id, data, { new: true });
    return user;
};

export const deleteUser = async (id: number) => {
    const user = await User.findByIdAndDelete(id);
    return user;
};
