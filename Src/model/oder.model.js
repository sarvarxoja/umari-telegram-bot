// orderModel.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: String,
  name: String,
  phone: String,
  address: String,
  productName: String,
  color: String,
  size: String,
  price: String,
  delivery: String,
  date: String,
  photo: String
});

export const Order = mongoose.model('Order', orderSchema);