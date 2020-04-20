import React from "react";
import { render } from "@testing-library/react";
import App from "./App";

test("renders 'Pick your locale' on the home page", () => {
  const { getByText, debug } = render(<App />);
  const linkElement = getByText(/Loading list of locales/i);
  expect(linkElement).toBeInTheDocument();
});
