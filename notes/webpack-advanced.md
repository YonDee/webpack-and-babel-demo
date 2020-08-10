# Webpack 高级概念
用法和逻辑可能会随着版本更迭而不同，但是概念会一直存在。(当前版本webpack4.x)
- [Webpack 高级概念](#webpack-高级概念)
  - [Tree Shaking](#tree-shaking)
    - [可参考的资料：](#可参考的资料)
    - [概念](#概念)
  - [Development 和 Production 不同 mode 的区分打包](#development-和-production-不同-mode-的区分打包)
    - [暴力（分成不同配置文件）拆分步骤：](#暴力分成不同配置文件拆分步骤)
    - [抽离公共配置部分](#抽离公共配置部分)
      - [步骤](#步骤)
  - [Code Splitting - 代码分割](#code-splitting---代码分割)
    - [概念](#概念-1)
    - [默认策略](#默认策略)
      - [可以自己进行代码分割，在需要第三发方库的时候，异步加载就会触发默认策略从而分割：](#可以自己进行代码分割在需要第三发方库的时候异步加载就会触发默认策略从而分割)
    - [webpack 实现代码分割的方式](#webpack-实现代码分割的方式)
      - [split-chunks-plugin](#split-chunks-plugin)
        - [split-chunks-plugin 的默认规则](#split-chunks-plugin-的默认规则)
      - [使用魔法注释（magic commit）来进行 chunk 命名。](#使用魔法注释magic-commit来进行-chunk-命名)
  - [prefetching, preloading](#prefetching-preloading)
  - [Lazy Loading 懒加载](#lazy-loading-懒加载)
  - [Chunk](#chunk)
  - [filename 和 chunkFilename](#filename-和-chunkfilename)
  - [打包 CSS](#打包-css)
    - [loader 的配置变更](#loader-的配置变更)
    - [对单独生成的 css 文件进行压缩](#对单独生成的-css-文件进行压缩)
  - [多入口文件的配置](#多入口文件的配置)
  - [Webpack 和浏览器缓存](#webpack-和浏览器缓存)
    - [缓存失效](#缓存失效)
  - [Shimming - 垫片](#shimming---垫片)
    - [概念](#概念-2)
    - [用例](#用例)
      - [wepback.ProvidePlugin()](#wepbackprovideplugin)
      - [imports-loader](#imports-loader)
  - [环境变量](#环境变量)
  - [Library 库 项目的打包](#library-库-项目的打包)
    - [库项目的简单打包配置](#库项目的简单打包配置)
  - [PWA - Progressive Web Application](#pwa---progressive-web-application)
    - [概念](#概念-3)
  - [TypeScript 的打包和配置](#typescript-的打包和配置)
    - [基础使用](#基础使用)
    - [Demo](#demo)
  - [WebpackDevServer 环境下的请求转发](#webpackdevserver-环境下的请求转发)
  - [WebpackDevServer 中配置 PWA 路由](#webpackdevserver-中配置-pwa-路由)
  - [Webpack ESlint](#webpack-eslint)
  - [webpack 性能优化](#webpack-性能优化)
    - [跟上技术迭代](#跟上技术迭代)
    - [在尽可能少的模块上应用 Loader](#在尽可能少的模块上应用-loader)
      - [exclude 配置减少需要 loader 工作的目录](#exclude-配置减少需要-loader-工作的目录)
      - [include 配置指定需要 loader 工作的目录](#include-配置指定需要-loader-工作的目录)
    - [Plugin 尽可能精简并确保可靠](#plugin-尽可能精简并确保可靠)
    - [resolve 参数合理配置](#resolve-参数合理配置)
    - [避免第三方模块重复打包，从而提高打包速度](#避免第三方模块重复打包从而提高打包速度)
      - [进阶方案](#进阶方案)
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
### 暴力（分成不同配置文件）拆分步骤：
1. 拆分开发环境和生产环境的配置（webpack.dev.js - 开发环境配置, webpack.prod.js - 生产环境配置）
2. 在 package.json 中配置：
```javascript
"script": {
  "dev": "webpack-dev-server --config webpack.dev.js",
  "build": "webpack --config webpack.prod.js"
}
```
> `npm run build`执行的命令生成的目录是可以直接上线的打包文件，一般直接访问生成目录下的`index.js`即可访问  
  
> 但是这样的拆分会导致两个模式下的配置文件的配置项大量冗余。
### 抽离公共配置部分
[demos/webpack-split-dev-and-prod-mode](../demos/webpack-split-dev-and-prod-mode)
#### 步骤
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
const { merge } = require('webpack-merge')
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
const { merge } = require('webpack-merge')
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
不进行代码分割的代码，将会把所有的代码都打包在一个js文件中，随着项目内容的丰富，这个js文件会越来越大。  
这个特性允许开发者将代码分割成不同的包，然后可以按需加载或并行加载这些包。它可以用来实现更小的包，并控制资源加载优先级，如果使用正确，将对加载时间产生重大影响。  
这是单独的概念，和 webpack 本身无关，用于分割代码，提升性能。  
也就是说，Code Splitting 就是把代码分成很多块（chunk）。

### 默认策略
webpack 默认有自己的代码分割策略，只对异步代码进行分割：
```
webpack will automatically split chunks based on these conditions:

New chunk can be shared OR modules are from the node_modules folder
New chunk would be bigger than 30kb (before min+gz)
Maximum number of parallel requests when loading chunks on demand would be lower or equal to 5
Maximum number of parallel requests at initial page load would be lower or equal to 3
```
#### 可以自己进行代码分割，在需要第三发方库的时候，异步加载就会触发默认策略从而分割：
例如:
```javascript
// lodash.js
import _ from 'lodash'
window._ = _
```
异步加载 lodash,并且挂载到全局。  
最终代码会生成 `main.js` 和 `lodash.js`

### webpack 实现代码分割的方式
1. 同步代码：在配置中进行配置`optimization: { splitChunks: { chunks: 'all' }}`(这个配置默认值为：`async`) 更多配置参考 [split-chunks-plugin](https://webpack.js.org/plugins/split-chunks-plugin/)
2. 异步代码:（例如 `import` 引入的异步组件和模块），无需做任何配置，会自动分割，打包放置到新的文件中。
> 总结来说 异步代码，会自动分割，不需要 webpack 额外配置，同步代码需要配置 `optimization`

#### split-chunks-plugin
webpack 底层使用了 [split-chunks-plugin](https://webpack.js.org/plugins/split-chunks-plugin/) 插件（无需额外安装）,默认已经有一套配置来用于代码分割。  
分割规则的顺序是自上而下的，例如下面这个默认配置截图，一个代码会不会被分割就是通过这个配置从上到下（从 `chunks` 开始到 `cacheGroup` 结束）看看是否符合条件，直到 `cacheGroup` 中定义的规则是否有与之相匹配的进行分割处理。
##### split-chunks-plugin 的[默认规则](https://webpack.docschina.org/plugins/split-chunks-plugin/#optimizationsplitchunks)
```javascript
module.exports = {
  //...
  optimization: {
    splitChunks: {
      chunks: 'async',
      minSize: 20000, // 大小限制
      minRemainingSize: 0,
      maxSize: 0,
      minChunks: 1, // 至少被引用次数
      maxAsyncRequests: 6,
      maxInitialRequests: 4,
      automaticNameDelimiter: '~', // 默认名称分割符
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,  // 优先级(数字越大越靠前)
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true // 如果模块符合两个规则，则使用已经分割打包的模块而不用重新分割打包
        }
      }
    }
  }
};
```
> 比较关键的配置项，例如 `cacheGroups` 可以自定义代码风格出的文件名称和代码分割命中的规则，或者例如 `minChunks` 表示被引用多少次才进行打包等等。  
> `vendor` 表示第三方模块，一般在配置项的名称中看到这个单词就可以联想到与第三方模块有关。
#### 使用魔法注释（magic commit）来进行 chunk 命名。
```javascript
function getComponent() {
  return import(/* webpackChunkName: "lodash" */ 'lodash').then({default: _} => {
    var element = document.createElement('div');
    element.innerHTML = _.join(['Dee', 'Yon'], '_');
    return element;
  })
}

getComponent().then(element => {
  document.body.appendChild(element);
})
```
这里的 `/* webpackChunkName: "lodash" */` 就是魔法注释  
在文档中相关内容参阅[dynamic-imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports)

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
在需要的时候进行模块的加载，第一次请求不需要加载所有模块，使得页面访问速度更快，**通过 `import().then(() => {})` 异步加载模块实现懒加载（在需要的时候进行加载）**。这是 [ECMAScript 的概念](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/import)，不是某个特定的语法。
> ⚠️注意：这里不是说`import`静态导入模块，`import()`表示运行时动态加载
```javascript
//...j
setTimeout() => {
  import('./dynamic-data.js').then(res => {
    console.log(res.default.message)
  }, 1500)
}
```

## Chunk
Webpack **打包生成的 JS 文件（打包出的代码块）**都被称为 Chunk，包括代码分割的文件。例如配置项中的：
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
这个插件会将 css 从打包到的 JS 文件中，**提取到单独的 css 文件中**(在官网 code splitting 部分对于 css 的分离也提到了这个插件)。（对 webpack 而言，默认就是将各种资源文件打包成 JS）
> webpack 4.0 **以前**可能会使用 [extract-text-webpack-plugin](https://webpack.js.org/plugins/extract-text-webpack-plugin/) 插件来实现相应的功能，现在针对于 css 文件，建议使用 mini-css-extract-plugin  

> 对于不同入口文件的 css 代码分割，mini-css-extract-plugin 也有详细的[配置](https://webpack.docschina.org/plugins/mini-css-extract-plugin/#extracting-css-based-on-entry)

### loader 的配置变更
使用 mini-css-extract-plugin 生成单独文件需要将 webpack 配置文件中的 `style-loader` 替换成`MiniCssExtractPlugin.loader`

### 对单独生成的 css 文件进行压缩
- 官方推荐plugin1: 
  - [terser-webpack-plugin](https://github.com/terser/terser)
  - [optimize-css-assets-webpack-plugin](https://github.com/NMFR/optimize-css-assets-webpack-plugin)
- 官方压缩示例 - [Minimizing For Production](https://webpack.docschina.org/plugins/mini-css-extract-plugin/#minimizing-for-production)
```javascript
// webpack.prod.js
const TerserJSPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
module.exports = {
  //...
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contentHash:8].js' // 打包到 css 目录下
    })
  ],
  optimization: {
    // 压缩 css
    minimizer: [
      new TerserJSPlugin({}),
      new OptimizeCSSAssetsPlugin({})
    ]
  }
  //...
}
```
> 注意在生产发布的环境中，打包JS要加上`[contentHash]`来使用缓存

## 多入口文件的配置
当 `entry` 存在多个 key 的时候，就需要进行额外的配置来配合多入口文件。
```javascript
// webpack.prod.js
// ...
module.exports = {
  //...
  entry: {
    index: './src/index.js',
    other: './src/other.js'
  }
  //...
  output: {
    filename: '[name].[contentHash:8].js',
    path: resolve(__dirname, "dist")
  },
  // 除此之外 还需要额外配置 html-webpack-plugin
  plugins: [
    //...
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "index.html",
      // chunks 表示该页面要引用哪些 chunk (打包的文件)，包括要使用的 splitting 的 chunk
      chunks: ['index'] // 只引用 index.js
    }),
    new HtmlWebpackPlugin({
      template: "./src/other.html",
      filename: "other.html",
      chunks: ['other']
    })
  ]
}
```

## Webpack 和浏览器缓存
重点：在配置的 `output` 中设置 `contenthash`
```javascript
module.exports = {
  /*...*/
  output: {
    filename: '[name].[contenthash].js',
    chunkFileName: '[name].[contenthash].js',
  }
  /*...*/
}
```
> 这里的`[name]`表示entry的属性名（key），多个 entry 配置成这样是必要的，可以表示 entry 的多个key
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

## 环境变量
使用环境变量来控制 webpack 配置文件的使用，这样在 package.json 中配置打包命令的时候，所使用的配置文件可以直接使用通用文件导出的配置内容，这个内容根据逻辑判断来采用相对应的环境配置：
```javascript
const devConfig = require("./config/webpack.dev.js")
const prodConfig = require("./config/webpack.prod.js")
const commonConfig = {
  /*...*/
  /*...*/
}

module.exports = (env) => {
  if(env && env.production) {
    return merge(commonConfig, prodConfig);
  } else {
    return merge(commonConfig, devConfig);
  }
}
```
```javascript
{
  /*...*/
  "script": {
    "dev": "webpack --config ./config/webpack.common.js",
    "build": "webpack --env=production --config ./config/webpack/common.js"
  }
  /*...*/
}
```

> 并不代表这种方式比传统直接使用配置文件并且在各自配置文件中使用 `merge` 更为先进，只是除了这样的方式，还有**环境变量**方式可供选择。

## Library 库 项目的打包
需要了解的配置项目：
- [`externals`](https://webpack.js.org/configuration/externals/) - eg: `externals: 'lodash'` (打包项目时不打包自带的 lodash，而引用外部指定成 lodash 的包 ——  单独安装 lodash)
- `output`的 [`library`](https://webpack.js.org/configuration/output/#outputlibrary) 和 [`libraryTarget`](https://webpack.js.org/configuration/output/#outputlibrarytarget)

### 库项目的简单打包配置
```javascript
const path = reurie('path')
module.exports = {
  mode: 'production',
  entry: './src/index.js',
  externals: 'lodash',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'library.js',
    library: 'root',
    libraryTarget: 'umd'
  }
}
```
> 注意最终我们（使用库时）使用的是 dist 中打包出来的文件，所以在 `package.json` 文件中，我们需要将 `main: 'index.js'` 配置项修改成 `main: './dist/index.js'`类似这样的文件引用的修改。  
> 如果配置中，只使用 `libraryTarget` 这个配置项，那么我们可以访问到库的方式有：`import xxx from 'xxx'`， `const xxx = require('xxx')`，`require(['xxx'], function() {})`。如果我们需要在使用标签时，默认可以使用库文件，那么就需要配置 `library` 这个配置项（`library`用于配置挂载内容的名称——变量名），配置项配置完毕之后，即可在 `libraryTarget` 指定的范围中使用库（`libraryTarget`指定的挂载目标）。

## PWA - Progressive Web Application
[指南](https://webpack.docschina.org/guides/progressive-web-application/)
### 概念
在服务器离线的情况下，客户端还可以有内容可以使用或展示。一般来说成熟的同构框架或者cli都带了pwa的选项选项配置。如果需要自己实现的话，可以使用 [wordbox-webpack-plugin](https://github.com/GoogleChrome/workbox) 这个插件

## TypeScript 的打包和配置
TypeScript 作为 JavaScript 的超集。越来越主流，尤其在团队协作的情况下，可以更好的规范代码提高维护性，报错提示。

### 基础使用
- 需要安装 [TypeScript](https://www.typescriptlang.org/)
- 需要的 loader: [ts-loader](https://github.com/TypeStrong/ts-loader)
- 可选的语法检查支持模块：[TypeSearch](https://microsoft.github.io/TypeSearch/)
- 额外需要创建的文件，在使用 ts-loader 之后，并不是说可以直接打包 ts 文件，还需要创建 tsconfig.json 配置文件来使用。

### Demo
[Webpack-Typescript](../demos/wepback-typescript)


## WebpackDevServer 环境下的请求转发
- 官方使用文档 - [devServer.proxy](https://webpack.js.org/configuration/dev-server/#devserverproxy)
- devServer.proxy 基于 - [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware)

## WebpackDevServer 中配置 PWA 路由
配置（就这么简单）：[devServer.historyApiFallback](https://webpack.js.org/configuration/dev-server/#devserverhistoryapifallback)


## Webpack ESlint
本身 ESlint 和 Webpack 没有什么关系，独立安装 ESlint 进行配置并且借助 `npx eslint xxx` 这样命令行检测也好，编辑器插件也好，都可以基本使用 eslint。  
而 webpack 也可以借助 [eslint-loader](https://webpack.js.org/loaders/eslint-loader/)，来在 JS 文件打包的时候先进行 eslint 规则的检测，并在页面上进行相应的报错提示。简单配置如下：
```javascript
module.exports = {
  /*...*/
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node-modules/,
        use: ['babel-loader', 'eslint-loader']
      }
    ]
  }
  /*...*/
}
```
这样在打包 js 文件的时候就会先检测 eslint 配置的规则，然后进行 babel 的代码转译。
> 比较常见使用 webpack 进行规则应用的有 vue-cli  
> eslint-loader 会对打包性能有影响。一般在生产环境中不建议使用。解决这个问题的方案除了命令行和编辑器的插件，还有 [git hooks](https://git-scm.com/book/zh/v2/%E8%87%AA%E5%AE%9A%E4%B9%89-Git-Git-%E9%92%A9%E5%AD%90) 可以在代码提交前进行 eslint 检测。

## webpack 性能优化
### 跟上技术迭代
- webpack（尽可能新的）
- Node（webpack 运行在 node 之上）
- Npm（模块之间相互引用，新版本更快的分析依赖也会间接也会优化到性能）
- Yarn（同上）
### 在尽可能少的模块上应用 Loader
#### exclude 配置减少需要 loader 工作的目录
比如一般进行 `babel-loader` 的时候，为了不进行重复的检查和转译，我们会忽略`exclude: /node_modules/`，因为一般我们引入的第三方模块都是打包好的，没有必要进行重复的打包和转译。  
#### include 配置指定需要 loader 工作的目录
除了上面所说的忽略某个文件目录来进行优化，还有个等价的方式可以进行相同的操作，例如配置`include: path.resolve(__dirname, '../src')`来指定`src`目录下的文件需要通过 loader 进行操作。

### Plugin 尽可能精简并确保可靠
没有必要使用的 plugin 就不使用，比如在生产环境下打包需要用到的代码压缩 [mini-css-extract-plugin](https://webpack.js.org/plugins/mini-css-extract-plugin/)，在开发环境下就无须使用。  
同样的生产环境也用不到热更新（[webpack.HotModuleReplacementPlugin](https://webpack.js.org/plugins/hot-module-replacement-plugin/)）等等一系列为了开发方便而使用的 plugin 。这也就是为什么要区分配置的原因之一。  
尽可能使用**官方推荐**（或社区验证过并认可）的插件进行打包，毕竟是推荐，从可靠性和性能来说至少不会很差。

### resolve 参数合理配置
所谓合理配置，就是**不要滥用**这个配置！
：
```javascript
module.exports = {
  /*...*/
  resolve: {
    extensions: ['.js', '.jsx'],
    mainFiles: ['index', 'child'],
    alias: {
      yondee: path.resolve(__dirname, '../src/child')
    }
  }
  /*...*/
}
```
在项目中使用语法拓展文件，例如 jsx 后缀的文件，一般直接引入则需要配置 loader 外还需要在引入时完整写好文件后缀，
`extensions` 的配置表示：会先查找相关命名的 `.js` 后缀文件，之后查找与之相匹配的 `.jsx` 后缀文件，之后文件`import Child from './child/child'`，假设 `child` 是个 jsx 后缀的组件，也会被正常打包。  
有时候引入一个组件就只引入一个目录，然后默认会找到名为 `index` 文件来挂载，那么`mainFiles` 可以声明出更多命名，而不仅仅是`index`，所以 `import Child from './child/'` 也会默认引用到 `child` 组件（在没有找到 `index` 的前提下）。  
`alias` 表示别名引入，`import Child from 'yondee'` 便会理解成 `import Child from '/src/child'`，这个配置的应用场景在需要复杂目录层级的情况下，可以使用 `alias` 使得更加直观简洁，尤其在被多个组件引用的情况下，如果发生了目录的更改，`alias` 的配置将会更加方便。

### 避免第三方模块重复打包，从而提高打包速度
一般第三方模块没做处理的话会被重复打包，每次打包的时候都会动态的引用第三方模块，合理的拆分这些依赖将会提高打包速度。  
```javascript
// webpack.dll.js
const path = require('path')
module.exports = {
  mode: 'production',
  entry: {
    vendors: ['react', 'react-dom', 'lodash']
  },
  output: [
    filename: '[name].dll.js',
    path: path.resolve(__dirname, '../dll')
    library: "[name]"
  ]
}
```
配置中最后使用`[name]`变量的方式配置了`library`从而向全局暴露这个模块以供使用（这里根据`entry`的配置，全局访问`vendors`可以访问模块的内容和方法） 
  
```javascript
// package.json
{
  /*...*/
  "script": {
    /*...*/
    "build:dll": "webpack --config ./build/webpack.dll.js"
  }
  /*...*/
}
```
这样配置完毕之后，`react` `react-dom` `lodash` 这样的第三方模块将会被单独打包到`./dll/vendors.dll.js`下，`vendors`的由来是因为`entry`配置（`entry` 配置可以配置成多个，例如`react: ['react', 'react-dom']`）。  
  
```shell
$ npm install add-asset-html-webpack-plugin --save
```
安装添加静态资源插件
```javascript
// webpack.common.js
module.exports = {
  /*...*/
  plugin: [
    /*...*/
    new AddAssetHtmlWebpackPlugin({
      filepath: path.resolve(__dirname, '../dll/vendors.dll.js')
    })
  ]
  /*...*/
}
```
使用`add-asset-html-webpack-plugin` 来将生成的 dll 挂载到全局变量上。

> 至此，可以实现模块的单独打包并且挂载到全局，但是全局必须要从`vendors`这个名称进行模块的访问。

#### 进阶方案
使用 webpack 自带的 `webpack.DllPlugin` 生成动态链接库，并配合 `webpack.DllRefencePlugin` 插件来引用动态链接库的代码。