const Joi = require("@hapi/joi");
const commentValidation = (data) => {
  const commentValidate = Joi.object({
    commentBody: Joi.string().min(1).max(255).strip().required(),
  });
  return commentValidate.validate(data);
};

const replyValidation = (data) => {
  const replyValidate = Joi.object({
    replyBody: Joi.string().min(1).max(255).strip().required(),
  });
  return replyValidate.validate(data);
};

module.exports.replyValidation = replyValidation;
module.exports.commentValidation = commentValidation;
