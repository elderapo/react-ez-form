import { withInfo } from "@storybook/addon-info";
import { storiesOf } from "@storybook/react";
import * as React from "react";
import { useForm, InputType } from "../src";
import { sleep } from "../src/utils";

type SampleProps = {
  defaultName: string;
};

const Sample = (props: SampleProps) => {
  console.log("render");

  const form = useForm({
    configure: () => ({
      name: {
        type: InputType.Text,
        default: props.defaultName,
        format: input => input.toLowerCase().replace(/\d+/g, "")
      },
      age: {
        type: InputType.Number,
        default: -7,
        validators: [
          async age => {
            await sleep(150);

            if (age < 0) {
              throw new Error("Age cannot be negative!");
            }
          },
          async age => {
            await sleep(170);

            if (age === 0) {
              throw new Error(`Age cannot be 0!`);
            }
          },
          age => {
            if (age > 130) {
              throw new Error("Age cannot be greather than 130!");
            }
          }
        ]
      }
    }),
    mapOnSubmitErrorToInput: err => {
      if (err.message.toLocaleLowerCase().includes("age")) {
        return "age";
      }

      return null;
    },
    onSubmit: () => {
      // c
    }
  });

  const [n, setN] = React.useState(1);

  console.log(form.isValidating);

  return (
    <div>
      <form
        onSubmit={form.onSubmit}
        style={{
          display: "grid",
          gridGap: 15,
          background: form.isValidating ? "grey" : "none"
        }}
      >
        <div>
          <div>Name:</div>
          <input ref={form.inputs.name.ref} />
          {form.inputs.name.error && <div style={{ color: "red" }}>{form.inputs.name.error}</div>}
        </div>
        <div>
          <div>Age:</div>
          <input ref={form.inputs.age.ref} />
          {form.inputs.age.error && <div style={{ color: "red" }}>{form.inputs.age.error}</div>}
        </div>
        <button type="reset" onClick={() => setN(n => n + 1)}>
          increment n({n})
        </button>
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
    return <Sample defaultName="Tomek" />;
  })
);
