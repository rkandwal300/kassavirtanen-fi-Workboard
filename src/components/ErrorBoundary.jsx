import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Dashboard render failed', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <main className="fatal-error"><p className="eyebrow">WORKSPACE ERROR</p><h1>This view could not be loaded.</h1><p>Refresh the page to try again. Your saved task draft stays on this device.</p><button className="primary-button" type="button" onClick={() => window.location.reload()}>Reload workspace</button></main>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
