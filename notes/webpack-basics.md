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

## Plugin
[Documentation - Plugin](https://webpack.js.org/plugins/)  
plugin 可以在 webpack 运行到某一时刻的时候，帮助开发者做一些事情。
### 常用 plugin
- [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) - 会在打包结束后，自动生成一个 html 文件，并把打包生成的 js 自动引入到这个 html 文件中。
- [clean-webpack-plugin](https://github.com/johnagan/clean-webpack-plugin) -  在打包之前运行，自动清除打包目录，重新生成。
```javascript
const HtmlWebpackPlugin = reqire('html-webpack-plugin');
const {CleanWebpackPlugin} = reqire('clean-webpack-plugin')
module.exports = {
  /***/
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),
    new CleanWebpackPlugin(),
  ]
  /***/
}
```
> plugin 的用法会随着版本更迭而发生使用上的变化

## Source Map
[Documentation - Devtool](https://webpack.js.org/configuration/devtool/)
主要用于debug，在 webpack 中也有配置项可以对应生产环境和开发环境。
```javascript
module.exports = {
  /***/
  devtool: 'source-map'
  /***/
}
```
其中的`devtool: 'source-map'` 的配置可以配置成想要的，比较建议的有：
- `mode: 'production'` - `devtool: cheap-module-source-map`
- `mode: 'development'` - `devtool: cheap-module-eval-source-map`

## WebpackDevServer
如果想要自动打包实现的方式有几种：
1. 在 package.json 的 `scripts` 配置项中，为 webpack 打包指令，添加 `--watch` 配置项
```javascript
// package.json
{
  /***/
  "scripts": {
    "watch": "webpack --watch"
  }
  /***/
}
```
> 这种方法需要手动刷新浏览器，并且无法发送 Ajax 请求。
2. 安装并且使用 WebpackDevServer (`npm install WebpackDevServer -D`)
```javascript
// package.json
{
  /***/
  "scripts": {
    "dev": "webpack-dev-server"
  }
  /***/
}

// webpack.config.js
// 这里的配置会帮助自动打开项目
module.exports = {
  /***/
  devServer: {
    contentBase: './dist' // 服务器启动的目录，一般都是webpack 打包输出的目录
    open: true,
    proxy: {
      '/api': 'http://localhost:3000' // 路由转发
    },
    part: 8080 // 指定本地服务器端口
  }
  /***/
}
```
> 会自动监听并且刷新浏览器，可以发送 Ajax 请求。  
> 有关于 devServer ，查看文档 [Documentation - DevServer](https://webpack.js.org/configuration/dev-server/)
3. 在 Node 环境中使用 Koa 或 express 之类的中间件自己实现服务器并实现监听
```bash
$ npm install express webpack-dev-middleware -D
```
> 有关于 Node 环境的 webpack api 参考 [API - node](https://webpack.js.org/api/node/)

## Hot Module Replacement（HMR）
[Guides - Hot Module Replacement](https://webpack.js.org/guides/hot-module-replacement/)
[API - Hot Module Replacement](https://webpack.js.org/api/hot-module-replacement/)
需要配置+插件实现热加载方便调试
```javascript
const webpack = require('webpack')

module.exports = {
  /***/
  devServer: {
    hot: true,
    hotOnly: true
  },
  /***/
  plugins: [
    new webpack.HotModuleReplacementPlugin();
  ]
  /***/
}
```
这样便将项目配置了 HMR，css-loader 会自动帮我们完成热加载逻辑，同样的 JS 相关的更新，也会需要相应的实现，比如 Vue 的 vue-loader 或是 React 的 babel-preset。
### 自己实现一个 JS 的 HMR
```javascript
// 假设已有 counter 和 number 两个模块
import counter from './counter';
import number from './number';

counter();
number();

if(moudle.hot) {
  moudle.hot.accept('./number', () => {
    document.body.removeChild(document.getElementById('number')); // 这里需要先移除原先的元素，然后按照逻辑进行重新渲染。
    number()
  })
}
```
> 同样的，如果是依赖 Node 实现的 server，想要更新也需要做特殊处理，具体查看[Via the Node.js API](https://webpack.js.org/guides/hot-module-replacement/#via-the-nodejs-api)

