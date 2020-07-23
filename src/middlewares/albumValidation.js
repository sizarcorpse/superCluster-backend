const Joi = require("@hapi/joi");

const createAlbumValidate = (data) => {
  const cavSchema = Joi.object({
    albumName: Joi.string()
      .min(3)
      .max(55)
      .strip()
      .required("Album must have a title"),
    albumDetails: Joi.string().min(3).max(255).strip(),
    sector: Joi.string()
      .valid("wallpaper", "thots", "3dx")
      .required("Album must have a sector"),
    artistName: Joi.string().min(3).max(55).strip(),
    modelName: Joi.string().min(3).max(55).strip(),
    status: Joi.string()
      .valid("public", "private", "followers")
      .default("public"),
  });
  return cavSchema.validate(data);
};

const tccacmValidate = (data) => {
  const js = Joi.string()
    .min(1)
    .max(20)
    .strip()
    .regex(/^[a-z0-9_.-]+$/);

  const tcacmSchema = Joi.object({
    addcomodel: js,
    addcoartist: js,
    categoryname: js,
    tagname: js,
  });
  return tcacmSchema.validate(data);
};

module.exports.createAlbumValidate = createAlbumValidate;
module.exports.tccacmValidate = tccacmValidate;
