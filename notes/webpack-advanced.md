# Webpack 高级概念
用法和逻辑可能会随着版本更迭而不同，但是概念会一直存在。
## Tree Shaking
### 可参考的资料：
- [guides - tree shaking (zh-Hans)](https://webpack.docschina.org/guides/tree-shaking/)  
### 概念
Webpack 2.0 正式版本开始包含的概念。本质意义就避免打包没用的代码。
> ⚠️注意1：Tree Shaking 只支持 ES Module 的形式 （`export`抛出，`import`引入，commonjs 形式 `require` 不支持。），Tree Shaking 支持静态引入，`require` 这种动态引入不适用。  
  
> ⚠️注意2：`mode: development` 默认不开启 tree shaking，如果要在该模式下使用 tree shaking，要在 config 中配置 `optimization: { usedExports: true }`，反过来说，当 `mode: production` 时，不一定需要配置 `optimization` 项（忽略文件时依然需要开启）。这里还需要注意 devtool 对于 source map的配置，例如 `mode: development` 时配置 `devtool: 'cheap-module-eval-source-map'`，到了 `mode: production` 时配置`devtool: cheap-module-source-map`。  
  
> ⚠️注意3：类似于 `@babel/polyfill` 这种可以会被 tree shaking 忽略的包（因为模块本身没有导出任何内容），则需要在 `package.json` 中配置 `"sideEffects": ["@babel/polyfill", "*.css"]`(css 模块本身也不会导出任何内容)，如果要对所有模块应用 tree shaking，则配置成 `"sideEffects": false` 即可。（对于`sideEffects`属性配置是 Webpack 4 扩展的特性）

阻止对某个类型的文件的 tree shaking:
```javascript
//package.json
{
  /*...*/
  "sideEffects": ['*.css']
  /*...*/
}

// webpack.config.js
module.exports = {
  /*...*/
  optimization: {
    useExports: true
  }
  /*...*/
}
```

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

## Code Splitting - 代码分割
[文档 - 代码分离](https://webpack.docschina.org/guides/code-splitting/)
[Guides - Code Splitting](https://webpack.js.org/guides/code-splitting/)
> 这是 webpack 的重要特性之一
### 概念
这个特性允许开发者将代码分割成不同的包，然后可以按需加载或并行加载这些包。它可以用来实现更小的包，并控制资源加载优先级，如果使用正确，将对加载时间产生重大影响。
这是单独的概念，和 webpack 本身无关，用于分割代码，提升性能。
### 默认策略
webpack 默认有自己的代码分割策略，只对异步代码进行分割：
```
webpack will automatically split chunks based on these conditions:

New chunk can be shared OR modules are from the node_modules folder
New chunk would be bigger than 30kb (before min+gz)
Maximum number of parallel requests when loading chunks on demand would be lower or equal to 5
Maximum number of parallel requests at initial page load would be lower or equal to 3
```
### webpack 实现代码分割的方式
1. 同步代码分割，需要在配置中进行配置`optimization: { splitChunks: { chunks: 'all' } }`
2. 异步代码分割（例如 import 引入的异步组件和模块），无需做任何配置，会自动分割，打包放置到新的文件中

### webpack 是如何实现代码分割的
底层使用了[SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/)插件。

## prefetching, preloading
prefetching: 等待主要内容加载完毕后，利用空闲进行加载
```javascript
document.addEventListener('click', () => {
  import(/* webpackPrefetch: true */ './click.js').then(({default: func}) => { func() })
})
```
preloading: 和主要进程内容一起加载
> 从代码覆盖率上进行优化思考，合理使用 prefetching 可以大大提高首次加载内容的代码利用率。

## Lazy Loading 懒加载
在需要的时候进行模块的加载，第一次请求不需要加载所有模块，使得页面访问速度更快，通过 `import` 异步加载模块。这是 ECMAScript 的概念，和 Webapck 无关。

## Chunk
Webpack **打包生成的 JS 文件**都被称为 Chunk，包括代码分割的文件。例如配置项中的：
```javascript
optimization: {
  splitChunks: {
    chunks: 'all'
  }
} 
```
对同步和异步的代码进行代码分割。

## filename 和 chunkFilename
```javascript
module.exports = {
  /*...*/
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    path: path.resolve(__dirname, './dist')
  }
  /*...*/
}
```
`filename` 本身就代表了入口文件，所有内容被直接访问；而 `chunkFilename` 代表了被入口文件异步间接加载的js文件，所有间接被加载的内容都会走这个配置项。

## 打包 CSS
- 官方推荐plugin: [mini-css-extract-plugin](https://webpack.docschina.org/plugins/mini-css-extract-plugin/
)。  
这个插件会将 css 从打包到的 JS 文件中，提取到单独的 css 文件中。（对 webpack 而言，默认就是将各种资源文件打包成 JS）
> webpack 4.0 以前可能会使用 [extract-text-webpack-plugin](https://webpack.js.org/plugins/extract-text-webpack-plugin/) 插件来实现相应的功能，现在针对于 css 文件，建议使用 mini-css-extract-plugin  

> 对于不同入口文件的 css 代码分割，mini-css-extract-plugin 也有详细的[配置](https://webpack.docschina.org/plugins/mini-css-extract-plugin/#extracting-css-based-on-entry)

### loader 的配置变更
使用 mini-css-extract-plugin 生成单独文件需要将 webpack 配置文件中的 `style-loader` 替换成`MiniCssExtractPlugin.loader`

### 对单独生成的 css 文件进行压缩
- 官方推荐plugin: [optimize-css-assets-webpack-plugin](https://github.com/NMFR/optimize-css-assets-webpack-plugin)
- 官方压缩示例 - [Minimizing For Production](https://webpack.docschina.org/plugins/mini-css-extract-plugin/#minimizing-for-production)


## Webpack 和浏览器缓存
重点：在配置的 `output` 中设置 `contenthash`
```javascript
module.exports = {
  /*...*/
  output: {
    filename: '[namel].[contenthash].js',
    chunkFileName: '[name].[contenthash].js',
  }
  /*...*/
}
```
### 缓存失效
在老版本 webpack 中，manifest 可能会使缓存失效，每次打包的时候 manifest 有变化。为了避免这个情况需要配置：
```javascript
module.exports = {
  /*...*/
  optimizition: {
    runtimechunk: {
      name: 'runtime'
    }
  }
  /*...*/
}
```
把 manifest 的内容都提取到 runtime 文件中。
> 老版本的 webpack 做缓存还需要依赖一定的插件。目前版本的 webpack 已经不需要额外配置插件了。


## Shimming - 垫片
### 概念
例如 [@babel/polyfill](https://github.com/babel/babel) 可以帮我们编译低版本浏览器不支持的语法，使得代码得以运行。
### 用例
#### [wepback.ProvidePlugin()](https://webpack.js.org/plugins/provide-plugin/)
```javascript
module.exports = {
  /*...*/
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      _join: ['lodash', 'join']
    })
  ]
  /*...*/
}
```
上面这段配置表示使用 webpack 自身的 `ProvidePlugin` 插件来实现: 
1. 如果在打包的代码中检测到了 `$` 字符串，那么会自动引用 `jquery` 这个包。
2. 如果打包的代码中使用了 `_join` 这个方法，那么会自动从 `lodash` 包中查找 `join`  

#### [imports-loader](https://github.com/webpack-contrib/imports-loader)
```bash
$ npm install imports-loader --dev-save
```
```javascript
module.exports = {
  /*...*/
  module: {
    rules: [
      {
        test: /\.js$/,
        excule: /node-modules/,
        use: [
          {
            loader: 'babel-loader'
          },
          {
            loader: 'imports-loader?this=window'
          }
        ]
      }
    ]
  }
  /*...*/
}
```
使用 `imports-loader` 来实现所有打包的 js 文件中的 `this` 都指向 `window`（默认会指向模块本身）