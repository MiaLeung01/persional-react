import $ from 'jquery'
const React =  {
  render,
  createElement,
  rootId: 0,
}

function render(elemnent, container) {
  const tag = createReactUnit(elemnent).getMarkup(React.rootId)
  $(container).html(tag)
}


// ==============

class ReactUnit {
  constructor(elemnent) {
    this._currentElement = elemnent
  }
}
class ReactTextUnit extends ReactUnit {
  getMarkup(id) {
    this._reactId = id
    const markUp = `<sapn data-reactid="${id}">${this._currentElement}</sapn>`
    return markUp
  }
}
class ReactNativeUnit extends ReactUnit {
  getMarkup(id) {
    this._reactId = id
    const {type: tag, props} = this._currentElement
    let tagStart = `<${tag} data-reactid="${id}" `
    let content = ''
    let tagEnd = `</${tag}>`
    for (let key in props) {
      if (key.startsWith('on')) {
        const action = key.slice(2).toLowerCase()
        $(document).delegate(`[data-reactid=${id}]`, `${action}.${this._reactId}}`, props[key])
      }
      if (key === 'className') {
        tagStart += ` ${key}="${props[key]}"`
      }
      if (key === 'style') {
        const styleObj = props.style
        tagStart += Object.entries(styleObj).map(([k, v]) => {
          k = k.replace(/([A-Z])/g, (match) => {
            return '-' + match.toLowerCase()
          })
          return `${k}: ${v};`
        }).join(' ')
      }
      if (key === 'children') {
        content = props.children.map((el, i) => {
          return createReactUnit(el).getMarkup(`${id}.${i}`)
        }).join('')
      }
      tagStart += ` ${key}="${props[key]}"`
    }
    return tagStart + '>' + content + tagEnd
  }
}
class ReactCompositeUnit extends ReactUnit {
  getMarkup(id) {
    this._reactId = id
    const {type: Component, props} = this._currentElement
    const instance = new Component(props)
    instance.componentWillMount()
    const unit = createReactUnit(instance.render())
    const markUp = unit.getMarkup(id)
    instance.componentDidMount()
    return markUp
  }
}

function createReactUnit (elemnent) {
  if (typeof elemnent === 'string' || typeof elemnent === 'number') {
    return new ReactTextUnit(elemnent)
  }
  if (typeof elemnent === 'object' && typeof elemnent.type === 'string') {
    return new ReactNativeUnit(elemnent)
  }
  if (typeof elemnent === 'object' && typeof elemnent.type === 'function') {
    return new ReactCompositeUnit(elemnent)
  }
}

// ==========
class Element {
  constructor(type, props) {
    this.type = type
    this.props = props
  }
}

function createElement(type, props, ...children) {
  props = props || {}
  props.children = children
  return new Element(type, props)
}

// ===========
class Component {
  constructor(props) {
    this.props = props
    this.state = {}
  }
  setState(newState) {
    Object.assign(this.state, newState)
    console.log('setState', this.state, newState)
    this.render()
  }
} 

const temp = {
  ...React,
  Component
}
export default temp