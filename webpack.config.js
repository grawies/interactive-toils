//webpack.config.js
const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = path.resolve(__dirname, './src')
const outDir = path.resolve(__dirname, './build')

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    main: "./src/main.ts",
  },
  output: {
    path: outDir,
    filename: "tetromino-puzzler-bundle.js" // <--- Will be compiled to this single file
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: "ts-loader"
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve(srcDir, 'html/tetromino_puzzler.html'), to: 'tetromino_puzzler.html' },
      ],
    }),
  ],
};
