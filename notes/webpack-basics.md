# Webpack 基础
## 什么是 Webpack？
**模块（不仅仅是JS）打包工具**
### 一个简单的 webpack 配置
```js
const path = require('path')
module.exports = {
  entry: './index.js',
  module: {},
  ouput: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
}
```
上面的 `entry: './index.js'` 等价于 `entry: { main: './index.js' }`
## 什么是 Loader?
[Documentation - loader](https://webpack.js.org/concepts/loaders/)
> 常见的 loader 在官网都有使用和指引  
默认情况下，Webpack 只支持 JS 文件的打包，如果我们的应用具有多样化的模块或者媒体文件，这就需要loader，loader 告诉 webpack 我们以什么样的方式进行打包并且会将资源重新编译后返回一个理想结果予以展现。
### Loader 的使用
[Guides - Asset Management](https://webpack.js.org/guides/asset-management/)
[指南 - 资源管理])(https://www.webpackjs.com/guides/asset-management/)
#### 使用
```js
module: {
  rules: [{
    test: /\.(jpg|png|gif)$/,
    use: {
      loader: 'url-loader',
      options: {
        name: '[name]_[hash].[ext]',
        outputPath: 'images/',
        limit: 10240
      }
    }
  },{
    test: /\.scss$/,
    use: [
      'style-loader',
      'css-loader',
      'sass-loader',
      'postcss-loader'
    ]
  }]
}
```
上面这段 webpack config 使用了两个 loader 表示：
1. 使用 url-loader 加载图片文件（还有中方式是使用 file-loader，但是 file-loader 一定会打包成单独的文件），图片文件大于 10kb 将会单独打包到 output 目录的 `images/` 目录下，并且按照占位符（placeholders）规则进行文件重命名。否则图片文件将会被打包到 js 文件中以 base64 的形式表示出来。
2. 使用一系列 loader 为了打包 scss 后缀的文件，所有 loader 都由后往前一步步执行

#### css loader 的其他常用技巧
在上面的流程中，scss 的样式文件如果用 `import` 引入了另一个 scss 文件，那么在没有配置的情况下，可能会导致 scss 直接被 css-loader 解析，那么可以对 css-loader 做个配置（以及一个css模块化打包配置）：
```javascript
{
  test: /\.scss$/,
  use: [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        importLoaders: 2, // 会在应用css-loader之前再运行前面的两个loader
        modules: true // 开启 css 的模块化打包
      }
    }
    'sass-loader',
    'postcss-loader'
  ]
}
```
> `importLoaders` 在新的版本下不是必须要使用的，默认也会处理被 `import` 加载的文件
#### 打包字体文件
```javascript
{
  test: /\.(eot|ttf|svg)$/,
  use: {
    loader: "file-loader"
  }
}
```
