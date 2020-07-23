module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2020: true,
  },
  extends: ["airbnb-base"],
  parserOptions: {
    ecmaVersion: 11,
  },
  rules: {
    semi: ["error", "always"],
    quotes: ["error", "double"],
    "linebreak-style": 0,
    "comma-dangle": [
      "error",
      {
        arrays: "always",
        objects: "always",
        imports: "never",
        exports: "never",
        functions: "never",
      },
    ],
    "import/newline-after-import": "never",
    "consistent-return": "never",
  },
};
