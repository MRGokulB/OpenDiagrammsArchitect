"use client";
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', 
          justifyContent: 'center', height: '100%', padding: '2rem',
          background: 'var(--panel-bg)', borderRadius: '16px', border: '1px solid var(--danger)'
        }}>
          <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Component Crashed</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'center', maxWidth: '400px' }}>
            {this.state.error?.message || "An unexpected error occurred in this area."}
          </p>
          <button className="btn btn-primary" onClick={this.handleReset}>
            <RefreshCw size={14} /> Try to Recover
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
