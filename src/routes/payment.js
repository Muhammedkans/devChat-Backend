const express = require("express");
const { userAuth } = require("../middleware/userAuth");
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payment");
const { memberShipAmout } = require("../utils/constant");
const paymentRouter = express.Router();
const {validateWebhookSignature} = require('razorpay/dist/utils/razorpay-utils');

const User = require("../models/user");

 paymentRouter.post("/payment/create",userAuth, async (req,res)=>{
  
  try{
  

    const {membershipType} = req.body;
    const {firstName , lastName , emailId} = req.user

    const order = await razorpayInstance.orders.create({
      amount:memberShipAmout[membershipType]*100,
      currency:"INR",
      receipt:"receipt#1",
      notes:{
        firstName,
        lastName,
        emailId,
        membershipType:membershipType,
      }
    })

   



    const payment = new Payment({
  userId: req.user._id,
  orderId: order.id,
  status: order.status,
  amount: order.amount,
  currency: order.currency,
  receipt: order.receipt,
  notes: {
    firstName,
    lastName,
    memberShipType: membershipType // ✅ save it manually, no trust issues
  }
});


 const savedPayment  = await payment.save();


    res.json({...savedPayment.toJSON() , keyId:process.env.RAZORPAY_KEY_ID});
  }catch(err){

res.status(404).send("error happening")
  }

 });


 paymentRouter.post("/payment/webhook" , async(req,res)=>{
  try{
    const webhookSignature = req.get("X-Razorpay-Signature");
   const isWebhook =  validateWebhookSignature(JSON.stringify(req.body), webhookSignature, process.env.RAZORPAY_WEBHOOK_SECRET);

if(!isWebhook){
 return  res.status(400).json({msg: "webhook signature is invalid"})
}

const paymentDetails = req.body.payload.payment.entity;
const payment = await Payment.findOne({ orderId: paymentDetails.order_id });

payment.status = paymentDetails.status;
await payment.save();

// ✅ Check if payment.notes exists & membershipType is safe
if (payment.notes?.memberShipType) {
  const user = await User.findOne({ _id: payment.userId });
  user.isPremium = true;
  user.membershipType = payment.notes.memberShipType;
  await user.save();
}

res.status(200).json({msg: "webhook recieved succefully"});

  }catch(err){
   
 return  res.status(500).json({msg: err.message});

  }
 });


 paymentRouter.get("/premium/verify", userAuth, async (req, res)=>{

  const user = req.user.toJSON();

  if(user.isPremium){
    return res.json({isPremium: true});
  }
  return res.json({isPremium: false});
 });

module.exports = paymentRouter;  