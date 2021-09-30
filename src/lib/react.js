import $, { type } from 'jquery'
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
  update(newEle) {
    if (this._currentElement !== newEle) {
      $(`[data-reactid="${this._rootId}"]`).replaceWith(newEle)
    }
  }
  getMarkup(id) {
    this._rootId = id
    const markUp = `<sapn data-reactid="${id}">${this._currentElement}</sapn>`
    return markUp
  }
}
class ReactNativeUnit extends ReactUnit {
  update(newEle) {
    let newProps = newEle.props
    let oldProps = this._currentElement.props
    this.updateDomProperties(oldProps, newProps)
    this.updateDomChildren(newEle.props.children)
  }
  updateDomProperties(oldProps, newProps) {
    for (let k in oldProps) {
      // 删除属性
      if (!newProps.hasOwnProperty(k)) {
        $(`[data-reactid=${this._rootId}]`).removeProp(k)
      }
      // 删除事件
      if(k.startsWith('on')) {
        $(`[data-reactid=${this._rootId}]`).undelegate()
      }
    }
    for (let key in newProps) {
      if (key.startsWith('on')) {
        const action = key.slice(2).toLowerCase()
        $(`[data-reactid=${this._rootId}]`).delegate(`[data-reactid=${this._rootId}]`, `${action}.${this._rootId}}`, newProps[key])
        continue
      }
      if (key === 'className') {
        $(`[data-reactid=${this._rootId}]`).attr('class', newProps[key])
        continue
      }
      if (key === 'style') {
        Object.entries(newProps.style).map(([k, v]) => {
          k = k.replace(/([A-Z])/g, (match) => {
            return '-' + match.toLowerCase()
          })
          $(`[data-reactid=${this._rootId}]`).css(k, v)
        })
        continue
      }
      if(key === 'children') {
        continue
      }
      $(`[data-reactid=${this._rootId}]`).prop(key, newProps[key])
    }  
  }
  updateDomChildren(newChildrenElement) {
    const oldChildrenUnitMap = this.getOldChildrenMap()
    const newChildrenUnit = this.getNewChildren(oldChildrenUnitMap, newChildrenElement)
    this.diff(oldChildrenUnitMap, newChildrenUnit)
  }
  getOldChildrenMap() {
    const children = this._currentChildrenUnit
    const childMap = new Map()
    children.forEach((childUnit) => {
      const key =  childUnit._currentElement?.props?.key || childUnit.index
      childMap.set(key, childUnit)
    })
    console.log(childMap)
    return childMap 
  }
  getNewChildren( oldChildrenUnitMap, newChildElements) {
    console.log('this._currentChildrenUnit', this._currentChildrenUnit)
    const newChildrenUnit = []
    newChildElements.forEach((newChildElement, i) => {
      const newChildKey = newChildElement.props?.key || i
      const oldChildUnit = oldChildrenUnitMap.get(newChildKey)
      const oldElement = oldChildUnit && oldChildUnit._currentElement
      if( shouldDeepCompare(oldElement, newChildElement) ) {
        oldChildUnit.update(newChildElement)
        newChildrenUnit.push(oldChildUnit)
        this._currentChildrenUnit[i] = oldChildUnit
      } else {
        const newChildUnit = createReactUnit(newChildElement)
        newChildUnit.index = i
        newChildrenUnit.push(newChildUnit)
        this._currentChildrenUnit[i] = newChildUnit
      }
    })
    console.log('this._currentChildrenUnit new', this._currentChildrenUnit)
    console.log('newChildrenUnit', newChildrenUnit)
    return newChildrenUnit
  }
  diff (oldChildrenUnitMap, newChildrenUnit) {
    let diffQueue = []
    let lastIndex = 0
    const oldChildMap = oldChildrenUnitMap
    console.log('oldChildMap', oldChildMap)
    newChildrenUnit.forEach((newChild, i) => {
      const newChildKey = newChild.props?.key || i
      const oldChild = oldChildMap.get(newChildKey)
      // 没有 oldChild, 新增
      if (!oldChild) {
        diffQueue.push({
          action: 'Insert',
          index: i,
          element: newChild
        })
        lastIndex = i
      } else {
        const oldChildKey =  oldChild._currentElement?.props?.key || oldChild.index
        if (oldChild._currentElement.type !== newChild._currentElement.type) {
          diffQueue.push({
            action: 'Remove',
            index: i
          })
        } else {
          if (oldChildKey < lastIndex) {
            // 移动
            diffQueue.push({
              action: 'Move',
              fromIndex: oldChildKey,
              toIndex: lastIndex,
              element: newChild
            })
            lastIndex += 1
          }
        }
      }
    })
    console.log('diffQueue', diffQueue)
  }
  getMarkup(id) {
    this._rootId = id
    const {type: tag, props} = this._currentElement
    let tagStart = `<${tag} data-reactid="${id}" `
    let content = ''
    let tagEnd = `</${tag}>`
    for (let key in props) {
      if (key.startsWith('on')) {
        const action = key.slice(2).toLowerCase()
        $(document).delegate(`[data-reactid=${id}]`, `${action}.${this._rootId}}`, props[key])
        continue
      }
      if (key === 'className') {
        tagStart += ` ${key}="${props[key]}"`
        continue
      }
      if (key === 'style') {
        const styleObj = props.style
        const styleVal = Object.entries(styleObj).map(([k, v]) => {
          k = k.replace(/([A-Z])/g, (match) => {
            return '-' + match.toLowerCase()
          })
          return `${k}: ${v};`
        }).join(' ')
        tagStart = `${tagStart} style="${styleVal}"`
        continue
      }
      if (key === 'children') {
        let children = []
        content = props.children.map((el, i) => {
          const childUnit = createReactUnit(el)
          childUnit.index = i
          children.push(childUnit)
          return childUnit.getMarkup(`${id}.${i}`)
        }).join('')
        this._currentChildrenUnit = children
        continue
      }
      tagStart += ` ${key}="${props[key]}"`
    }
    const markUp = tagStart + '>' + content + tagEnd
    return markUp
  }
}
class ReactCompositeUnit extends ReactUnit {
  update(newEle, newState) {
    this._currentElement = newEle ? newEle : this._currentElement
    let nextState = Object.assign(this._currentInstance.state, newState)
    let nextProps = this._currentElement.props
    // 下一级元素
    const preRenderedElement = this._currentUnit._currentElement
    // 新的下一级元素
    const newRenderedElement = this._currentInstance.render()
    if (!this._currentInstance?.shouldComponentUpdate?.(nextState, nextProps)) {
      // 不更新
      return
    }
    if (shouldDeepCompare(preRenderedElement, newRenderedElement)) {
      this._currentUnit.update(newRenderedElement)
      // didUpdate
      this._currentInstance.componentDidUpdate?.()
    } else {
      // 交给下一级全部更新
      const unit = createReactUnit(newRenderedElement)
      this._currentUnit = unit
      const markUp = unit.getMarkup(this._rootId)
      $(`[data-reactid=${this._rootId}]`).replaceWith(markUp)
    }
  }
  getMarkup(id) {
    this._rootId = id
    const {type: Component, props} = this._currentElement
    this._currentInstance = new Component(props)
    this._currentInstance.componentWillMount()
    this._currentUnit = createReactUnit(this._currentInstance.render())
    // 把实例 Unit 挂到实例，让它能访问到 Unit.update
    this._currentInstance._currentUnit = this
    const markUp = this._currentUnit.getMarkup(id)
    this._currentInstance.componentDidMount()
    return markUp
  }
}
function shouldDeepCompare(oldEle, newEle) {
  if ((typeof newEle === 'string' || typeof newEle === 'number') && (typeof oldEle === 'string' || typeof oldEle === 'number')) {
    return true
  }
  if ((typeof newEle) !== (typeof oldEle)) {
    return false
  }
  if (newEle instanceof Element && oldEle instanceof Element ) {
    return newEle.type === oldEle.type
  }
}

function createReactUnit (element) {
  if (typeof element === 'string' || typeof element === 'number') {
    return new ReactTextUnit(element)
  }
  if (element instanceof Element && typeof element.type === 'string') {
    return new ReactNativeUnit(element)
  }
  if (element instanceof Element && typeof element.type === 'function') {
    return new ReactCompositeUnit(element)
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
  }
  shouldComponentUpdate (nextState, nextProps) {
    return true
  }
  setState(newState) {
    this._currentUnit.update(null, newState)
  }
} 

const temp = {
  ...React,
  Component
}
export default temp