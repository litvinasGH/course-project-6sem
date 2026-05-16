import { Component } from 'react';
import { logger } from '../utils/logger';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    logger.error('react_render_error', {
      error,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.error) {
      return (
        <section className="page">
          <div className="panel">
            <h1>Something went wrong</h1>
            <p className="muted">Refresh the page or return to projects.</p>
            <a className="button secondary" href="/projects">Open projects</a>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
