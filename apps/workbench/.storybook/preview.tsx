import React from "react";
import type { Preview } from "@storybook/react";
import { Provider } from "react-redux";
import { store } from "../src/store/store.js";

const preview: Preview = {
  decorators: [
    (Story) => (
      <Provider store={store}>
        <div style={{ background: "#000", minHeight: "100vh", padding: "1rem" }}>
          <Story />
        </div>
      </Provider>
    ),
  ],
  parameters: {
    backgrounds: { disable: true },
    layout: "fullscreen",
  },
};

export default preview;
