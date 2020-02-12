import { withInfo } from "@storybook/addon-info";
import { storiesOf } from "@storybook/react";
import * as React from "react";
import { useForm, InputType, useInputValue } from "../src";
import useSetInterval from "use-set-interval";

const Sample = () => {
  const form = useForm({
    inputs: {
      sampleInput: {
        type: InputType.Text,
        format: val => {
          return val.replace(/\O|o/, "0");
        },
        defaultValue: "ajajaj"
      },
      sampleCheckbox: {
        type: InputType.Checkbox,
        defaultValue: false
      },
      sampleNumeric: {
        type: InputType.Number,
        defaultValue: 666
      },
      sampleInput2: {
        type: InputType.Text,
        format: val => {
          return val.toUpperCase();
        },
        defaultValue: "ajajaj"
      }
    }
  });

  const [counter, setCounter] = React.useState<number>(0);
  // useSetInterval(() => {
  //   setCounter(counter + 1);
  // }, 100);

  // const [isToggled, setIsToggled] = React.useState(false);

  const sampleCheckboxInputValue = useInputValue(form.inputs.sampleCheckbox.ref);

  console.log("render");

  return (
    <div>
      <span>counter: {counter}</span>
      {/* <button onClick={() => setIsToggled(!isToggled)}>toggle</button> */}
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
        <input ref={form.inputs.sampleNumeric.ref} disabled />

        {/* {isToggled && <input ref={form.inputs.sampleInput2.ref} />} */}
        {sampleCheckboxInputValue && <input ref={form.inputs.sampleInput2.ref} />}
        {/* <input ref={form.inputs.sampleInput2.ref} /> */}

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
