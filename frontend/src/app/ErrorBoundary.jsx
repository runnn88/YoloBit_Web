import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            padding: "32px 20px 48px",
            color: "#132a13",
          }}
        >
          <section
            style={{
              border: "1px solid #d77a61",
              borderRadius: "18px",
              background: "#fff1ec",
              padding: "20px",
              boxShadow: "0 10px 30px rgba(19, 42, 19, 0.08)",
            }}
          >
            <h1 style={{ marginTop: 0 }}>React Render Error</h1>
            <p>The app mounted, but crashed while rendering.</p>
            <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
            </pre>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
