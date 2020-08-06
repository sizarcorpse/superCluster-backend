const { tccacmValidate } = require("./albumValidation");

module.exports = {
  CheckAlbumExists: async (req, res, next) => {
    try {
      const album = await Album.findOne({ _id: req.params.albumID })
        .populate("uploader")
        .exec();
      if (!album || album.length === 0) {
        return res.status(404).json({
          error: "No Album exists",
        });
      } else {
        req.album = album;
        next();
      }
    } catch (error) {
      res.status(404);
      next(error);
    }
  },

  isAlbumUploader: async (req, res, next) => {
    try {
      if (req.album.uploader._id == req.user._id) {
        next();
      } else {
        throw new Error();
      }
    } catch (error) {
      res.status(401);
      next(error);
    }
  },

  Pagination: function (req, res, next) {
    var page;
    if (req.query.page ? (page = req.query.page) : (page = 1)) {
      req.query.page = page;
      req.query.items = 2;
      next();
    } else {
      return res.status(404).json({
        error: `query does not exits`,
      });
    }
  },

  TagArrange: function (req, res, next) {
    const { error } = tccacmValidate(req.body);
    if (error) {
      res.status(422);
      next(error);
    } else {
      const primal_tag = req.body.tagname;

      if (primal_tag.startsWith("#")) {
        let arrange_tag = primal_tag
          .slice(1)
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join("");
        req.body.tagname = "#" + arrange_tag;
        next();
      } else {
        let arrange_tag = primal_tag
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join("");
        req.body.tagname = "#" + arrange_tag;
        next();
      }
    }
  },

  TagExists: async (req, res, next) => {
    const album = req.album;
    let primal_tag = req.body.tagname;

    let albumtags = await album.albumTags.map((tag) => tag.tagName);
    if (albumtags.includes(primal_tag)) {
      return res.status(406).json({
        err: `sorry ${primal_tag} already in tags`,
      });
    } else {
      next();
    }
  },

  TagIdExists: function (req, res, next) {
    const album = req.album;

    const primal_tag_id = req.params.tagID;
    const albumtags = album.albumTags.map((tag) => tag._id);

    if (albumtags.includes(primal_tag_id)) {
      next();
    } else {
      return res.status(404).json({
        err: `sorry  you try to delete tag that dosent exits`,
      });
    }
  },

  CategoryExists: function (req, res, next) {
    const { error } = tccacmValidate(req.body);
    if (error) {
      res.status(422);
      next(error);
    } else {
      const album = req.album;
      let primal_cats = req.body.categoryname;

      let albumcats = album.albumCategories.map((cat) => cat.categoryName);

      if (albumcats.includes(primal_cats)) {
        return res.status(406).json({
          err: `sorry ${primal_cats} already in category`,
        });
      } else {
        next();
      }
    }
  },

  CatIdExists: function (req, res, next) {
    const album = req.album;
    const primal_cat_id = req.params.catID;

    const albumcats = album.albumCategories.map((tag) => tag._id);

    if (albumcats.includes(primal_cat_id)) {
      next();
    } else {
      return res.status(404).json({
        err: `sorry  you try to delete cat that dosent exits`,
      });
    }
  },

  CoArtistExists: function (req, res, next) {
    const { error } = tccacmValidate(req.body);
    if (error) {
      res.status(422);
      next(error);
    } else {
      const album = req.album;
      let primal_coas = req.body.addcoartist;

      let albumcoas = album.coArtistNames.map((coa) => coa.coArtistName);

      if (albumcoas.includes(primal_coas)) {
        return res.status(406).json({
          err: `sorry ${primal_coas} already in category`,
        });
      } else {
        next();
      }
    }
  },

  CoAIdExists: function (req, res, next) {
    const album = req.album;
    const primal_coa_id = req.params.coaID;

    const albumcoas = album.coArtistNames.map((coa) => coa._id);

    if (albumcoas.includes(primal_coa_id)) {
      next();
    } else {
      return res.status(404).json({
        err: `sorry  you try to delete cat that dosent exits`,
      });
    }
  },

  CoModelExists: function (req, res, next) {
    const { error } = tccacmValidate(req.body);
    if (error) {
      res.status(422);
      next(error);
    } else {
      const album = req.album;
      let primal_coms = req.body.addcomodel;

      let albumcoms = album.coModelNames.map((com) => com.coModelName);

      if (albumcoms.includes(primal_coms)) {
        return res.status(406).json({
          err: `sorry ${primal_coms} already in category`,
        });
      } else {
        next();
      }
    }
  },

  CoMIdExists: function (req, res, next) {
    const album = req.album;
    const primal_com_id = req.params.comID;

    const albumcoms = album.coModelNames.map((com) => com._id);

    if (albumcoms.includes(primal_com_id)) {
      next();
    } else {
      return res.status(404).json({
        err: `sorry  you try to delete cat that dosent exits`,
      });
    }
  },
};
