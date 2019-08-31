import { withInfo } from "@storybook/addon-info";
import { storiesOf } from "@storybook/react";
import * as React from "react";

const Sample = () => {
  const ref = React.useRef<HTMLDivElement>();
  const [isToggled, setIsToggled] = React.useState(false);

  React.useEffect(() => {
    console.log("useEffect", ref);
  }, [ref.current]);

  return (
    <div>
      <button onClick={() => setIsToggled(!isToggled)}>toggle</button>
      {isToggled && <div ref={ref}>aaa</div>}
    </div>
  );
};

const stories = storiesOf("Dupa", module);

stories.add(
  "Sample",
  withInfo({
    inline: true
  })(() => {
    return <Sample />;
  })
);
