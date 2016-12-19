import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';
import { createStore } from 'redux';

import { reducer, hydrateStore } from 'zebulon-grid';
import 'zebulon-grid/lib/index.css';
import * as actions from 'zebulon-grid/lib/commonjs/actions';

import App from './App';
import './index.css';
import { getMockDatasource, basicConfig } from './utils/mock';

const store = createStore(
  reducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
);

const customFunctions = hydrateStore(store, basicConfig);
store.dispatch(actions.pushData(getMockDatasource(1, 100, 100)));

ReactDOM.render(
  <Provider store={store}>
    <App customFunctions={customFunctions}/>
  </Provider>
  ,
  document.getElementById('root')
);
