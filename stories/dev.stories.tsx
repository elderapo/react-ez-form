import { withInfo } from "@storybook/addon-info";
import { storiesOf } from "@storybook/react";
import * as React from "react";
import { aaa } from "../src";

const Sample = () => {
  console.log("render");

  return (
    <div>
      <form>{aaa}</form>
    </div>
  );
};

const stories = storiesOf("Dev", module);

stories.add(
  "Sample",
  withInfo({
    inline: true
  })(() => {
    return <Sample />;
  })
);
