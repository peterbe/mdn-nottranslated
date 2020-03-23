import React from "react";

export const TAGLINE = "Actually not translated on MDN?";

export function Container({ children, className }) {
  return (
    <div className={className ? `container ${className}` : "container"}>
      <div className="columns">
        <div className="column is-8-desktop is-offset-2-desktop">
          <div className="content">{children}</div>
        </div>
      </div>
    </div>
  );
}
