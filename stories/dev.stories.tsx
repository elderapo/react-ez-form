import { withInfo } from "@storybook/addon-info";
import { storiesOf } from "@storybook/react";
import * as React from "react";
import { useForm, InputType } from "../src";

const Sample = () => {
  const form = useForm({
    inputs: [
      {
        name: "sampleInput",
        type: InputType.Text,
        defaultValue: "ajajaj"
      }
    ]
  });

  return (
    <form
      onSubmit={form.handleSubmit}
      style={{
        display: "grid",
        gridGap: 20,
        width: 200
      }}
    >
      <input ref={form.inputs.sampleInput.ref} />

      <button>submit yo</button>
    </form>
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
