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