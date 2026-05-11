import "./index.css";
import React from "react";
import { render } from "react-dom";
import { App } from "./App";
import { FleetStoreProvider } from "./state/FleetStore";

render(
  <FleetStoreProvider>
    <App />
  </FleetStoreProvider>,
  document.getElementById("root")
);