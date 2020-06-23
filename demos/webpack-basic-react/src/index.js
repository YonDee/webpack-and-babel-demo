import "@babel/polyfill"

import React from "react"
import ReactDom from "react-dom"

class App extends React.Component {
  render () {
    return <div>hello world</div>
  }
}

ReactDom.render(<App />, document.getElementById('root'))
