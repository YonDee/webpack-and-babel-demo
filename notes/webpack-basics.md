# Webpack 基础
- [Webpack 基础](#webpack-基础)
  - [什么是 Webpack？](#什么是-webpack)
    - [一个简单的 webpack 配置](#一个简单的-webpack-配置)
  - [什么是 Loader?](#什么是-loader)
    - [Loader 的使用](#loader-的使用)
      - [使用](#使用)
      - [css loader 的其他常用技巧](#css-loader-的其他常用技巧)
      - [打包字体文件](#打包字体文件)
      - [打包图片](#打包图片)
  - [Plugin](#plugin)
    - [常用 plugin](#常用-plugin)
  - [Source Map](#source-map)
  - [WebpackDevServer](#webpackdevserver)
  - [Hot Module Replacement（HMR）](#hot-module-replacementhmr)
    - [自己实现一个 JS 的 HMR](#自己实现一个-js-的-hmr)
  - [在 Webpack 中使用 Babel 处理 ES6 代码](#在-webpack-中使用-babel-处理-es6-代码)
    - [步骤](#步骤)
      - [webpack config 示例](#webpack-config-示例)
  - [打包 React](#打包-react)
  - [附录](#附录)
    - [在这篇基础的内容中用到的包](#在这篇基础的内容中用到的包)
      - [开发相关](#开发相关)
      - [babel 相关](#babel-相关)
      - [react 相关](#react-相关)
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
默认情况下，Webpack 只支持 JS 文件的打包，如果我们的应用具有多样化的模块或者媒体文件，这就需要loader，loader 告诉 webpack 我们以**什么样的方式进行打包并且会将资源重新编译后返回一个理想结果予以展现**(资源转换成想要的结果)。
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
#### 打包图片
```js
module: {
  rules: [{
    test: /\.(jpg|png|gif)$/,
    use: {
      loader: 'url-loader',
      options: {
        name: '[name]_[hash].[ext]',
        outputPath: 'images/',

        // 小于 5kb 的图片用 base64 格式产出
        // 否则，依然延用 file-loader 的形式，产出 url 格式
        limit: 5 * 1024,

        // 打包到 img 目录下
        outputPath: '/img1/',

        // 设置图片的 cdn 地址（也可以统一在外面的 output 中设置，那将作用于所有静态资源）
        // publicPath: 'http://cdn.abc.com'
      }
    }
  }]
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
[Github - WebpackDevServer](https://github.com/webpack/webpack-dev-server)
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
> 有关于 `devServer` ，查看文档 [Documentation - DevServer](https://webpack.js.org/configuration/dev-server/)
常见的 `devServer` 配置例如：

```javascript
devSever: {
  port: 8080, // 测试所使用的端口
  progress: true, // 显示打包进度条
  contentBase: distPath, // 根目录
  open: true, // 自动打开浏览器
  compress: true, // 启动 gzip 压缩
  proxy: {
    '/api': 'http://localhost:3000',
    '/api2': {
      target: 'http://localhost:3000',
      pathRewrite: {
        '/api2': ''
      }
    }
  }
}
```
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
这样便将项目配置了 HMR，css-loader 会自动帮我们完成热加载逻辑，同样的 JS 相关的更新，也会需要相应的实现，比如 Vue 的 [vue-loader](https://vue-loader.vuejs.org/zh/) 或是 React 的 [preset-react](https://www.babeljs.cn/docs/babel-preset-react)。
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

## 在 Webpack 中使用 Babel 处理 ES6 代码
Babel 是一个非常流行的 Javascript 编译器，在 Webpack 中使用 Babel 编译 ES6 代码是非常常规的操作。官方的[setup](https://babeljs.io/setup)使用指引。
### 步骤
1. 安装核心`npm install --save-dev babel-loader @babel/core`
2. 在webpack配置的`module`项中进行配置
3. 创建 `.babelrc` 文件（分离有关于 babel 的模块配置的 `options` 项到`.babelrc`中），并且配置[`@babel/preset-env`](https://babeljs.io/docs/en/babel-preset-env)
首先我们需要安装最基础的依赖
```bash
$ npm install --save-dev babel-loader @babel/core
```
这里这是打通了webpack 与 babel 之间的通信，如果要实现代码编译，则需要额外安装预设配置或者自己配置。
```bash
$ npm install --save-dev @babel/preset-env
```
> 在 webpack loader 配置中，配置这个项目便可以实现运行。但是这个配置是不全面的（对 ES6 语法转译不全面），如果需要更全面的配置，则需要[polyfill](https://babeljs.io/docs/en/babel-polyfill)来补充(这个包安装完毕后，放在入口文件顶部,也就是所有代码执行之前调用，即可完成配置)  
  
> 值得注意的是，babel-polyfill 配置rules的options时因为是presets配置，所以会污染全局环境，在开发类库的时候，使用[@babel/plugin-transform-runtime](https://babeljs.io/docs/en/babel-plugin-transform-runtime)，这个插件(plugins)会以[闭包](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Closures)的形式去引入内容。
#### webpack config 示例
```javascript
module.exports = {
  /***/
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      options: {
        presets: [
          ['@babel/preset-env'],
          {
            useBuiltIns: 'usage' // 这个配置项会帮助我们压缩代码，按需引用，尤其在使 babel-polyfill 之后，打包的体积会变大
          }
        ],
        plugins: [["@babel/plugin-transform-runtime", {
          "corejs": 2, // 这个配置需要安装 	npm install --save @babel/runtime-corejs2
          "helpers": true,
          "regenerator": true,
          "useESModules": false
        }]]
      }
    }]
  }
  /***/
}
```
其中 `options` 的内容，可以单独以对象的形式放到 `.babelrc` 中(例如配置 `@babel/preset-env`)：
```javascript
{
  "presets": ["@babel/preset-env"]
}
```
> 注意这里的 `test` 配置是 `/\.js$/` 精准匹配了 `.js` 结尾的文件，如果遇到 js 语法拓展类型的文件，例如 jsx，则需要配置成 `/\.jsx?$/` 来进行匹配，这时候 js 和 jsx 后缀的文件都可以被 loader 打包
```javascript
// .babelrc
{
  presets: [
    ['@babel/preset-env'],
    {
      useBuiltIns: 'usage' // 这个配置项会帮助我们压缩代码，按需引用，尤其在使 babel-polyfill 之后，打包的体积会变大
    }
  ],
  plugins: [["@babel/plugin-transform-runtime", {
    "corejs": 2, // 这个配置需要安装 	npm install --save @babel/runtime-corejs2
    "helpers": true,
    "regenerator": true,
    "useESModules": false
  }]]
}
```

## 打包 React
一系列的 React 依赖安装：
```bash
$ npm install --save react react-dom
```
配置入口文件：
```javascript
import "@babel/polyfill";

import React from "react";
import ReactDom from "react-dom"
class App extends React.Component {
  render() {
    return <div>Hello world</div>
  }
}

ReactDom.render(<App />, document.getElementById('root'))
```
> 这里的 `root` 节点要在模板中配置好  
React 是不可以直接被 Webpack 打包的，需要额外安装`@babel/preset-react`包：
```bash
$ npm install @babel/preset-react --save-dev
```
对于`@babel/preset-react`的配置也可以放到 `.babelrc` 中:
```javascript
// .babelrc
{
  presets: [
    "@babel/preset-env", {
      useBuiltIns: 'useage'
    }
  ],
  "@babel/preset-react"
}
```

## 附录
### 在这篇基础的内容中用到的包
- [webpack](https://github.com/webpack/webpack)
- [webpack-cli](https://github.com/webpack/webpack-cli/)
- [file-loader](https://github.com/webpack-contrib/file-loader)
- [css-loader](https://github.com/webpack-contrib/css-loader)
- [url-loader](https://webpack.js.org/loaders/url-loader/)
#### 开发相关
- [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)
- [clean-webpack-plugin](https://github.com/johnagan/clean-webpack-plugin)
- [webpack.HotModuleReplacementPlugin](https://webpack.js.org/plugins/hot-module-replacement-plugin/)
#### babel 相关
- [babel-loader](https://github.com/babel/babel-loader)
- [@babel/core](https://babeljs.io/docs/en/babel-core)
- [@babel/preset-env](https://babeljs.io/docs/en/babel-preset-env)
- [@babel/polyfill](https://babeljs.io/docs/en/babel-polyfill)
#### react 相关
- [react](https://zh-hans.reactjs.org/)
- [react-dom](https://zh-hans.reactjs.org/docs/react-dom.html)
- [@babel/preset-react](https://babeljs.io/docs/en/babel-preset-react)