const { validateToken } = require("../services/authentication");
const User = require("../models/user");

function checkForAuthenticationCookie(cookieName) {
  return async (req, res, next) => {
    const tokenCookieValue = req.cookies[cookieName];
    if (!tokenCookieValue) {
      req.user = null;
      return next();
    }

    try {
      const userPayload = validateToken(tokenCookieValue);
      const user = await User.findById(userPayload._id).select("-password");
      req.user = user;
    } catch (error) {
      req.user = null;
    }

    return next();
  };
}

module.exports = {
  checkForAuthenticationCookie,
};