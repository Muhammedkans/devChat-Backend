const express = require("express");
const { userAuth } = require("../middleware/userAuth");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");

const requestRouter = express.Router();

// ✅ Send a Connection Request
requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const toUserId = req.params.toUserId;
    const status = req.params.status;

    const allowedStatus = ["ignore", "interested"];
    if (!allowedStatus.includes(status)) {
      throw new Error("Invalid status");
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) {
      throw new Error("User not found");
    }

    const existingConnectionRequest = await ConnectionRequest.findOne({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId },
      ],
    });

    if (existingConnectionRequest) {
      throw new Error("Connection request already exists");
    }

    const connectionRequest = new ConnectionRequest({
      fromUserId,
      toUserId,
      status,
    });

    const data = await connectionRequest.save();

    res.json({
      message: "Connection request sent successfully",
      data,
    });
  } catch (err) {
    res.status(400).send("Error: " + err.message);
  }
});




requestRouter.post("/friends/status/bulk", userAuth, async (req, res) => {
  try {
    const { userIds } = req.body;
    const loggedInUserId = req.user._id.toString();

    const acceptedConnections = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUserId, status: "accepted" },
        { toUserId: loggedInUserId, status: "accepted" }
      ]
    });

    const friendSet = new Set();

    for (const conn of acceptedConnections) {
      const from = conn.fromUserId.toString();
      const to = conn.toUserId.toString();
      const friendId = from === loggedInUserId ? to : from;
      friendSet.add(friendId);
    }

    const friendIds = userIds.filter((id) => friendSet.has(id));

    res.json({ friendIds });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// ✅ Review Connection Request (Accept/Reject)
requestRouter.post("/request/review/:status/:requestId", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;
    const { status, requestId } = req.params;

    const allowedStatus = ["accepted", "rejected"];
    if (!allowedStatus.includes(status)) {
      throw new Error("Status not allowed");
    }

    const connectionRequest = await ConnectionRequest.findOne({
      _id: requestId,
      toUserId: loggedInUser._id,
      status: "interested",
    });

    if (!connectionRequest) {
      throw new Error("No valid request found");
    }

    connectionRequest.status = status;
    const updatedRequest = await connectionRequest.save();

    if (status === "accepted") {
      const fromUserId = connectionRequest.fromUserId;
      const toUserId = connectionRequest.toUserId;

      await User.updateOne(
        { _id: fromUserId, friends: { $ne: toUserId } },
        { $push: { friends: toUserId }, $inc: { friendsCount: 1 } }
      );

      await User.updateOne(
        { _id: toUserId, friends: { $ne: fromUserId } },
        { $push: { friends: fromUserId }, $inc: { friendsCount: 1 } }
      );
    }

    res.json({
      message: `Connection request ${status}`,
      data: updatedRequest,
    });
  } catch (err) {
    res.status(404).send("Error: " + err.message);
  }
});

// ✅ Get All Friends
requestRouter.get("/friends", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("friends", "firstName lastName photoUrl _id")
      .select("friends");

    res.json({
      message: "Fetched friends successfully",
      friends: user.friends,
    });
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});


// ✅ Bulk Request Status Check
requestRouter.post("/request/status/bulk", userAuth, async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds must be an array" });
    }

    const requests = await ConnectionRequest.find({
      fromUserId,
      toUserId: { $in: userIds },
      status: "interested", // Only interested/pending requests
    }).select("toUserId");

    const requestedIds = requests.map((req) => req.toUserId.toString());

    res.json({ requestedIds });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




// ✅ Suggestion List API
requestRouter.get("/request/suggestions", userAuth, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId).select("friends following");

    const allFriendIds = currentUser.friends.map(id => id.toString());
    const allFollowingIds = currentUser.following.map(id => id.toString());

    const sentRequests = await ConnectionRequest.find({ fromUserId: currentUserId });
    const receivedRequests = await ConnectionRequest.find({ toUserId: currentUserId });

    const requestedIds = new Set();
    sentRequests.forEach(req => requestedIds.add(req.toUserId.toString()));
    receivedRequests.forEach(req => requestedIds.add(req.fromUserId.toString()));

    const excludeIds = new Set([
      currentUserId.toString(),
      ...allFriendIds,
      ...allFollowingIds,
      ...Array.from(requestedIds),
    ]);

    const suggestions = await User.find({
      _id: { $nin: Array.from(excludeIds) }
    }).select("_id firstName lastName photoUrl");

    res.json({
      message: "Suggestions fetched",
      suggestions,
    });
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

module.exports = requestRouter;





