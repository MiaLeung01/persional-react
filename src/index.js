import React from './lib/react';
// import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';

class Child extends React.Component {
  componentWillMount () {
    console.log('child will mount')
  }
  componentDidMount () {
    console.log('child did mount')
  }
  render() {
    return 2
  }
}
class Btn extends React.Component {
  constructor(props) {
    super(props)
    this.state = {num: 1}
  }
  componentWillMount () {
    console.log('btn will mount')
  }
  componentDidMount () {
    console.log('btn Did mount')
  }
  render() {
    // return React.createElement(Child, {name: 'mia', data: this.state.num})
    const self = this
    return  React.createElement('button', {
      onClick: function() {
        console.log('button click');
        self.setState({
          num: 2
        })
      }
    }, this.state.num)
  }
}
 
React.render(
  React.createElement(
    Btn, {
      onClick: function() {
        console.log('button click')
      },
      style: {
        color: 'red',
        backgroundColor: 'red',
        fontSize: '20px'
      },
      className: 'new old'
    }),
  document.getElementById('root')
);
