const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactIntlPlugin = require('react-intl-webpack-plugin');

module.exports = {
  // Entry point for Webpack to bundle
  entry: './src/app.js',
  // Output file for the bundled code
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'docs'), // Output directory
  },
  // Other configurations for resolving modules
  resolve: {
    alias: {
      '@js-root': path.resolve(__dirname, 'src/js'),
    }
  },
  // Loaders for handling different file types
  module: {
    rules: [
      {
        test: /\.js$/, // Apply to all JavaScript files
        exclude: /node_modules/, // Exclude node_modules folder
        use: {
          loader: 'babel-loader',
          options: {
            // Use Babel presets and plugins for modern JS/React
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/, // Apply to all CSS files
        use: ['style-loader', 'css-loader'],
      },
      // Add more loaders for other asset types (images, fonts, etc.)
    ],
  },
  // Enable source maps for easier debugging
  devtool: 'source-map',
  // Additional configurations if needed (optimization, development server, etc.)
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', // Path to your template
      filename: 'index.html', // Output filename
    }),
    new ReactIntlPlugin({
      // Specify paths for message extraction
      extractFrom: ['src/app.js'],
      // Define destination folder for translation files
      output: './translations',
      // Optionally specify supported locales
      supportedLocales: ['en', 'uk'],
    }),
  ],
};
