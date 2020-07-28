const Joi = require("@hapi/joi");

const signupValidation = (data) => {
  const mySchema = Joi.object({
    username: Joi.string()
      .regex(/^[a-z0-9_.]+$/)
      .strip()
      .min(4)
      .max(30)
      .lowercase()
      .required(),
    email: Joi.string().min(8).email().lowercase().required(),
    password: Joi.string().min(6),
  });

  return mySchema.validate(data);
};

const loginValidation = (data) => {
  const mySchema = Joi.object().keys({
    email: Joi.string().min(8).email().lowercase().required(),
    password: Joi.string().min(6),
  });

  return mySchema.validate(data);
};

const profileValidation = (data) => {
  const mySchema = Joi.object().keys({
    name: Joi.string()
      .min(4)
      .max(30)
      .regex(/^[a-zA-Z0-9_.\s]+$/)
      .strip(),
    bio: Joi.string().max(400).strip(),
    website: Joi.string().domain(),
  });

  return mySchema.validate(data);
};

module.exports.signupValidation = signupValidation;
module.exports.loginValidation = loginValidation;
module.exports.profileValidation = profileValidation;
