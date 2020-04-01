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

const deleteButtonClickKey = "delete-button-clicks";

function getTodayDeleteButtonClicksKey() {
  const now = new Date();
  // Just anything that isn't UTC bound, but client bound.
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}
export function getTodayDeleteButtonClicks() {
  const memory = getDeleteButtonClicks();
  const key = getTodayDeleteButtonClicksKey();
  return memory[key] || 0;
}

export function getDeleteButtonClicks() {
  return JSON.parse(localStorage.getItem(deleteButtonClickKey) || "{}");
}

export function incrementTodayDeleteButtonClicks() {
  const memory = JSON.parse(localStorage.getItem(deleteButtonClickKey) || "{}");
  const key = getTodayDeleteButtonClicksKey();
  const before = memory[key] || 0;
  memory[key] = before + 1;
  localStorage.setItem(deleteButtonClickKey, JSON.stringify(memory));
}
