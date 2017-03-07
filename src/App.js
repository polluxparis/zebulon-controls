import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import { PivotGridWithoutDndContext } from 'zebulon-grid';

import logo from './logo.svg';
import './App.css';

import GridControls from './controls';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <GridControls />
        <PivotGridWithoutDndContext
          customFunctions={this.props.customFunctions}
        />
      </div>
    );
  }
}

export default DragDropContext(HTML5Backend)(App);
