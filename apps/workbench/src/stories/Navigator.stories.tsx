import type { Meta, StoryObj } from "@storybook/react";
import { Navigator } from "../shell/Navigator.js";

const meta: Meta<typeof Navigator> = {
  title: "Shell/Navigator",
  component: Navigator,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Navigator>;

export const Default: Story = {};
