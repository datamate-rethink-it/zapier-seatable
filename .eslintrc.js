module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: "google",
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    "semi": ["error", "always"],
    "quotes": ["error", "double"],
    "max-len": "off",
  },
};
