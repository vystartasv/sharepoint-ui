import { defineButton } from "./button.js";
import { defineInput } from "./input.js";
import { defineTextArea } from "./textarea.js";
import { defineSelect } from "./select.js";
import { defineRadioGroup } from "./radio-group.js";
import { defineCheckbox } from "./toggle.js";

export function defineSharePointFieldBasicControls(): void {
  defineButton();
  defineInput();
  defineTextArea();
  defineSelect();
  defineRadioGroup();
  defineCheckbox();
}
