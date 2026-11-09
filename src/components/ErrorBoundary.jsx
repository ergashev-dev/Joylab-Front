import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    console.error('UI xatosi:', error, info)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="container state" role="alert">
        <h1 className="state__title">Sahifada nosozlik yuz berdi</h1>
        <p className="state__text">Sahifani yangilang. Muammo takrorlansa, bizga xabar bering.</p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          Sahifani yangilash
        </button>
      </div>
    )
  }
}
