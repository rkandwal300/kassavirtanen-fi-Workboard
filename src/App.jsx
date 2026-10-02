import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import ErrorBoundary from './components/ErrorBoundary';
import TaskDashboard from './components/TaskDashboard';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <TaskDashboard />
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
