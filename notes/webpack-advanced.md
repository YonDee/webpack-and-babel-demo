# Webpack 高级概念
## Tree Shaking
### 可参考的资料：
- [guides - tree shaking (zh-Hans)](https://webpack.docschina.org/guides/tree-shaking/)  
### 概念
Webpack 2.0 正式版本开始包含的概念。本质意义就避免打包没用的代码。
> ⚠️注意1：Tree Shaking 只支持 ES Module 的形式 （`export`抛出，`import`引入，commonjs 形式 `require` 不支持。），Tree Shaking 支持静态引入，`require` 这种动态引入不适用。  
  
> ⚠️注意2：`mode: development` 默认不开启 tree shaking，如果要在该模式下使用 tree shaking，要在 config 中配置 `optimization: { usedExports: true }`，反过来说，当 `mode: production` 时，不需要配置 `optimization` 项。这里还需要注意 devtool 的配置，例如 `mode: development` 时配置 `devtool: 'cheap-module-eval-source-map'`，到了 `mode: production` 时配置`devtool: cheap-module-source-map`。  
  
> ⚠️注意3：类似于 `@babel/polyfill` 这种可以会被 tree shaking 忽略的包（因为模块本身没有导出任何内容），则需要在 `package.json` 中配置 `"sideEffects": ["@babel/polyfill", "*.css"]`(css 模块本身也不会导出任何内容)，如果要对所有模块应用 tree shaking，则配置成 `"sideEffects": false` 即可。（对于`sideEffects`属性配置是 Webpack 4 扩展的特性）

## Development 和 Production 不同 mode 的区分打包
在成熟的应用或者框架中，这个特性是必备的。  
### 暴力拆分步骤：
1. 拆分开发环境和生产环境的配置（webpack.dev.js - 开发环境配置, webpack.prod.js - 生产环境配置）
2. 在 package.json 中配置：
```javascript
"script": {
  "dev": "webpack-dev-server --config webpack.dev.js",
  "build": "webpack --config webpack.prod.js"
}
```
> 这样的拆分会导致两个模式下的配置文件的配置项大量冗余。
### 抽离公共配置部分，步骤：
相比上面的内容，我们需要多安装一个`webpack-merge`的包。
```bash
npm install webpack-merge --save-dev
```
然后:  
1. 拆分开发环境和生产环境的配置，**并且将两个配置之间共同的部分放到单独的配置文件中，在使用的时候进行合并**（webpack.dev.js - 开发环境配置, webpack.prod.js - 生产环境配置，webpack.common.js - 公共配置）
2. package.json 配置和上面一样...  
最终结果会像是这样：
```javascript
// webpack.common.js - 公共配置
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  entry: {
    main: '.src/index.js'
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }, {
      test: /\.(jpg|png|gif)$/,
      use: {
        loader: 'url-loader',
        options: {
          name: '[name]_[hash].[ext]',
          outputPath: 'images',
          limit: 10240
        }
      }
    }, {
      test: /\.(eot|ttf|svg)$/,
      use: {
        loader: 'file-loader'
      }
    }, {
      test: /\.scss$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            importLoaders: 2
          }
        },
        'sass-loader',
        'postcss-loader'
      ]
    }, {
      test: /\.css$/,
      use: [
        'style-loader',
        'css-loader',
        'postcss-loader'
      ]
    }]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),
    new CleanWebpackPlugin(['dist'])
  ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  }
}
```
```javascript
// webpack-dev-js 开发环境配置
const webpack = require('webpack')
const merge = require('webpack-merge')
const commonConfig = require('./webpack.common.js')

const devConfig = {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    contentBase: './dist',
    open: true,
    port: 8080,
    hot: true
  },
  plugins: [
    new Webpack.HotModuleReplacementPlugin()
  ],
  optimization: {
    usedExports: true
  }
}

module.exports = merge(commonConfig, devConfig)
```
```javascript
// webpack-prod-js 生产环境配置
const merge = require('webpack-merge')
const commonConfig = require('./webpack.common.js')

const prodConfig = {
  mode: 'production',
  devtool: 'cheap-module-source-map'
}

module.exports = merge(commonConfig, prodConfig)
```

## Code Splitting
[文档 - 代码分离](https://webpack.docschina.org/guides/code-splitting/)
[Guides - Code Splitting](https://webpack.js.org/guides/code-splitting/)
这是单独的概念，和 webpack 本身无关，用于分割代码，提升性能。
### webpack 实现代码分割的方式
1. 同步代码分割，需要在配置中进行配置`optimization: { splitChunks: { chunks: 'all' } }`
2. 异步代码分割（例如 import 引入的异步组件和模块），无需做任何配置，会自动分割，打包放置到新的文件中

### webpack 是如何实现代码分割的
底层使用了[SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/)插件。
