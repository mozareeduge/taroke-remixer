import type { Meta, StoryObj } from "@storybook/react";
import { Transport } from "../shell/Transport.js";

const meta: Meta<typeof Transport> = {
  title: "Shell/Transport",
  component: Transport,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Transport>;

export const Default: Story = {};
