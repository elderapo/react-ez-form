import { withInfo } from "@storybook/addon-info";
import { storiesOf } from "@storybook/react";
import * as React from "react";
import { useForm, InputType } from "../src";
import useSetInterval from "use-set-interval";

const Sample = () => {
  const form = useForm({
    inputs: [
      {
        name: "sampleInput",
        type: InputType.Text,
        format: val => {
          return val.replace(/\O|o/, "0");
        },
        defaultValue: "ajajaj"
      },
      {
        name: "sampleCheckbox",
        type: InputType.Checkbox,
        defaultValue: true
      },
      {
        name: "sampleNumeric",
        type: InputType.Number,
        defaultValue: 666
      },
      {
        name: "sampleInput2",
        type: InputType.Text,
        format: val => {
          return val.toUpperCase();
        },
        defaultValue: "ajajaj"
      }
    ]
  });

  const [counter, setCounter] = React.useState<number>(0);

  // useSetInterval(() => {
  //   setCounter(counter + 1);
  // }, 100);

  return (
    <div>
      <span>counter: {counter}</span>
      <form
        onSubmit={form.handleSubmit}
        style={{
          display: "grid",
          gridGap: 20,
          width: 200
        }}
      >
        <input ref={form.inputs.sampleInput.ref} />
        <input ref={form.inputs.sampleCheckbox.ref} />
        <input ref={form.inputs.sampleNumeric.ref} />
        <input ref={form.inputs.sampleInput2.ref} />

        <button>submit yo</button>
      </form>
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
