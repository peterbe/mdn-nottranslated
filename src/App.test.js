import React from "react";
import { render } from "@testing-library/react";
import App from "./App";

test("renders 'Pick your locale' on the home page", () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/Pick your locale/i);
  expect(linkElement).toBeInTheDocument();
});
