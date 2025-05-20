module.exports = async (req, res) => {
 res.send("<p>Hi there</p>")
};

// {
//   "version": 2,
//   "builds": [
//     {
//       "src": "./index.js",
//       "use": "@vercel/node",
//       "config": { "includeFiles": ["questions.json"] }
//     }
//   ],
//   "routes": [
//     {
//       "src": "/(.*)",
//       "dest": "/"
//     }
//   ]
// }