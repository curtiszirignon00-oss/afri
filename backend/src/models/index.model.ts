import mongoose from "mongoose";

export interface IIndex extends mongoose.Document {
    symbol: string;
    name: string;
    opening: number | null;
    high: number | null;
    low: number | null;
    lastValue: number | null;
    change: number | null;
}

const indexSchema = new mongoose.Schema<IIndex>({
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    opening: { type: Number, default: null },
    high: { type: Number, default: null },
    low: { type: Number, default: null },
    lastValue: { type: Number, default: null },
    change: { type: Number, default: null },
});

const IndexModel = mongoose.model<IIndex>('Index', indexSchema);
export default IndexModel;
