import mongoose from "mongoose";

export interface IStock extends mongoose.Document {
    symbol: string;
    name: string;
    opening: number | null;
    high: number | null;
    low: number | null;
    volume: number | null;
    volumeXOF: number | null;
    lastPrice: number | null;
    change: number | null;
}

const stockSchema = new mongoose.Schema<IStock>({
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    opening: { type: Number, default: null },
    high: { type: Number, default: null },
    low: { type: Number, default: null },
    volume: { type: Number, default: null },
    volumeXOF: { type: Number, default: null },
    lastPrice: { type: Number, default: null },
    change: { type: Number, default: null },
});

const StockModel = mongoose.model<IStock>('Stock', stockSchema);
export default StockModel;
