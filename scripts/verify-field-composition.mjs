import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const bundle = await build({
  stdin: {
    contents: `import * as React from "react"; import {createRoot} from "react-dom/client"; import {Field,TextField,Input,TextArea,Checkbox,Switch,Radio,RadioGroup,Select,SpinButton,Slider,DatePicker,ComboBox,ComboOption,SearchBox,ColorPicker,FileUpload,RichTextEditor} from "${resolve("packages/sharepoint-ui/src/react.tsx")}"; import {createFormField} from "${resolve("packages/sharepoint-ui/src/elements/field-composition.ts")}"; import {defineInput} from "${resolve("packages/sharepoint-ui/src/elements/input.ts")}";
function App(){return <><Field data-testid="react-error-field" label="Work email" hint="Use your company address." validationMessage="Enter a valid work email." validationMessageIcon={<span data-testid="custom-validation-icon">×</span>} validationState="error" required><Input type="email" name="email" /></Field><Field data-testid="react-success-field" label="Department" validationMessage="Department verified." validationState="success"><Input name="department" defaultValue="Engineering" /></Field><Field data-testid="react-render-field" label="Project code" hint="Use six characters." validationMessage="Code may be reused." validationState="warning" required>{fieldProps=>{window.fieldRenderProps=fieldProps;return <Input name="projectCode" {...fieldProps} aria-describedby="manual-help" />;}}</Field><Field data-testid="react-nested-field" label="Nested work item" hint="Wrapped control description." validationMessage="This value needs attention." validationState="error" required size="large"><div><Input name="nestedWorkItem" /></div></Field><Field data-testid="react-nested-textarea-field" label="Long notes" size="small"><div><TextArea name="nestedNotes" /></div></Field><Field data-testid="react-nested-checkbox-field" label="Subscribe" validationMessage="Subscription requires review." validationState="error" required><div><Checkbox name="subscribe" /></div></Field><Field data-testid="react-nested-switch-field" label="Enable reminders" required><div><Switch name="reminders" /></div></Field><Field data-testid="react-nested-radio-field" label="Delivery method" required><div><RadioGroup name="delivery"><Radio value="email">Email</Radio><Radio value="post">Post</Radio></RadioGroup></div></Field><Field data-testid="react-nested-select-field" label="Department" required><div><Select name="fieldDepartment"><option value="sales">Sales</option></Select></div></Field><Field data-testid="react-nested-spin-field" label="Quantity" hint="Choose a whole number." validationMessage="Quantity is out of range." validationState="error" required><div><SpinButton name="quantity" defaultValue={2} /></div></Field><Field data-testid="react-nested-slider-field" label="Volume" hint="Set output volume." required><div><Slider name="volume" defaultValue={35} /></div></Field><Field data-testid="react-nested-date-field" label="Start date" required validationMessage="Date needs review." validationState="error"><div><DatePicker name="startDate" /></div></Field><Field data-testid="react-nested-combo-field" label="Owner" required><div><ComboBox name="owner"><ComboOption value="ava">Ava</ComboOption></ComboBox></div></Field><Field data-testid="react-nested-search-field" label="Search records" hint="Search by title or owner." required><div><SearchBox /></div></Field><Field data-testid="react-nested-textfield" label="Short title" required><div><TextField name="shortTitle" /></div></Field><Field data-testid="react-nested-color-field" label="Brand color" required validationMessage="Color needs review." validationState="error"><div><ColorPicker name="brandColor" /></div></Field><Field data-testid="react-nested-upload-field" label="Attach report" required validationMessage="Choose a report." validationState="error"><div><FileUpload name="report" /></div></Field><Field data-testid="react-nested-richtext-field" label="Description" required validationMessage="Description needs review." validationState="error"><div><RichTextEditor name="description" /></div></Field></>}createRoot(document.querySelector("#react")).render(<App/>);
window.mountNative=()=>{defineInput();const native=document.createElement("input");native.type="email";native.name="contact";native.setAttribute("aria-describedby","external-help");const nativeField=createFormField(native,{id:"native-email-field",label:"Contact email",hint:"We only use this address for updates.",validationMessage:"Address is invalid.",validationState:"error",required:true,orientation:"horizontal"});document.querySelector("#native").append(nativeField);const custom=document.createElement("spui-input");custom.setAttribute("type","email");custom.setAttribute("name","customEmail");const customField=createFormField(custom,{id:"custom-email-field",label:"Backup email",hint:"Optional recovery address.",validationMessage:"Recovery address is valid.",validationState:"success"});document.querySelector("#native").append(customField);};`,
    resolveDir: process.cwd(), sourcefile: "field-composition-check.tsx", loader: "tsx",
  },
  bundle: true, format: "iife", platform: "browser", target: ["es2020"], write: false,
  alias: { react: resolve("node_modules/react"), "react-dom/client": resolve("examples/spfx124-webpart/node_modules/react-dom/client.js") },
  nodePaths: [resolve("examples/spfx124-webpart/node_modules")],
});
const server = createServer((request, response) => request.url === "/bundle.js"
  ? response.writeHead(200, { "content-type": "text/javascript" }).end(bundle.outputFiles[0].contents)
  : response.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><html><body><div id='react'></div><div id='native'></div><script src='/bundle.js'></script></body></html>"));
await new Promise(done => server.listen(0, "127.0.0.1", done));
const require = createRequire(import.meta.url);
const { chromium } = require("/Users/vilius/.t3/projects/spfx-research/node_modules/playwright");
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.setDefaultTimeout(5000);
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const reactError = page.getByRole("textbox", { name: "Work email" });
  assert.equal(await reactError.getAttribute("aria-invalid"), "true", "React error Field marks its control invalid");
  assert.equal(await reactError.evaluate(node => node.required), true, "React Field exposes native required state");
  assert.equal(await reactError.getAttribute("aria-describedby"), null, "React Field avoids generated ID references across the control shadow root");
  assert.equal(await reactError.getAttribute("aria-description"), "Enter a valid work email. Use your company address.", "React Field announces validation and hint through a shadow-safe description");
  const reactSuccess = page.getByRole("textbox", { name: "Department" });
  assert.equal(await reactSuccess.getAttribute("aria-invalid"), null, "success state does not mark the control invalid");
  assert.equal(await page.getByText("Department verified.").getAttribute("data-field-validation"), "success");
  assert.equal(await reactSuccess.getAttribute("aria-invalid"), null, "success does not mark the control invalid");
  assert.equal(await page.getByText("Enter a valid work email.").getAttribute("role"), "alert", "error validation is announced as an alert");
  assert.equal(await page.getByTestId("custom-validation-icon").textContent(), "×", "Field accepts a replacement validationMessageIcon slot");
  assert.equal(await page.getByTestId("custom-validation-icon").evaluate(node => node.parentElement.getAttribute("aria-hidden")), "true", "decorative replacement icon is hidden from assistive technology");
  assert.equal(await page.locator("[data-testid=react-render-field] [data-slot=validationMessageIcon]").textContent(), "!", "Field retains its default icon when no replacement is supplied");
  const renderControl = page.getByRole("textbox", { name: "Project code" });
  assert.ok(await page.locator("[data-testid=react-render-field] spui-input").getAttribute("id"), "render-function props assign the generated control id to the control host");
  assert.equal(await page.evaluate(() => window.fieldRenderProps.id), await page.locator("[data-testid=react-render-field] spui-input").getAttribute("id"));
  assert.equal(await renderControl.getAttribute("aria-invalid"), null, "warning state does not mark the control invalid");
  assert.equal(await renderControl.evaluate(node => node.required), true, "render-function required state reaches the native control");
  assert.equal(await page.getByText("Code may be reused.").getAttribute("role"), "alert", "warning validation is announced as an alert");
  assert.equal(await renderControl.getAttribute("aria-description"), "Code may be reused. Use six characters.", "render-function Field text is exposed without cross-shadow ID references");
  assert.equal(await renderControl.getAttribute("aria-describedby"), "manual-help", "caller-provided description references remain merged");

  const nestedControl = page.getByRole("textbox", { name: "Nested work item" });
  assert.equal(await nestedControl.getAttribute("aria-invalid"), "true", "Field context reaches controls under wrapper elements");
  assert.equal(await nestedControl.evaluate(node => node.required), true, "nested control inherits native required state");
  assert.equal(await page.locator("[data-testid=react-nested-field] spui-input").getAttribute("size"), "large", "nested control inherits Field size");
  assert.equal(await nestedControl.getAttribute("aria-description"), "This value needs attention. Wrapped control description.", "nested control receives Field text through a shadow-safe description");
  const nestedTextArea = page.getByRole("textbox", { name: "Long notes" });
  assert.equal(await page.locator("[data-testid=react-nested-textarea-field] spui-textarea").getAttribute("size"), "small", "nested textarea inherits Field size");
  const nestedCheckbox = page.getByRole("checkbox", { name: "Subscribe" });
  assert.equal(await nestedCheckbox.evaluate(node => node.required), true, "nested checkbox inherits native required state");
  assert.equal(await nestedCheckbox.getAttribute("aria-invalid"), "true", "nested checkbox inherits invalid state");
  const nestedRadioGroup = page.getByRole("group", { name: "Delivery method" });
  assert.equal(await page.locator("[data-testid=react-nested-radio-field] spui-radio-group").evaluate(node => node.shadowRoot.querySelector("input")?.required), true, "nested radio group makes its options required");
  assert.equal(await nestedRadioGroup.getAttribute("aria-invalid"), null, "unvalidated radio groups stay valid");
  assert.equal(await page.getByRole("switch", { name: "Enable reminders" }).evaluate(node => node.required), true, "nested Switch inherits required state");
  assert.equal(await page.getByRole("combobox", { name: "Department" }).evaluate(node => node.required), true, "nested Select inherits required state");
  const nestedSpin = page.getByRole("spinbutton", { name: "Quantity" });
  assert.equal(await nestedSpin.getAttribute("aria-invalid"), "true", "nested SpinButton inherits validation state");
  assert.equal(await nestedSpin.evaluate(node => node.required), true, "nested SpinButton inherits required state");
  const nestedSlider = page.getByRole("slider", { name: "Volume" });
  assert.equal(await nestedSlider.getAttribute("aria-description"), "Set output volume.", "nested Slider inherits Field description");
  assert.equal(await nestedSlider.getAttribute("aria-required"), "true", "nested Slider inherits Field required semantics");
  const nestedDate = page.locator("[data-testid=react-nested-date-field] spui-date-picker");
  assert.equal(await nestedDate.getAttribute("aria-label"), "Start date", "nested DatePicker receives a shadow-safe accessible name");
  assert.equal(await nestedDate.evaluate(node => node.shadowRoot.querySelector(".control input").required), true, "nested DatePicker inherits native required state");
  assert.equal(await nestedDate.evaluate(node => node.shadowRoot.querySelector(".control input").getAttribute("aria-label")), "Start date", "nested DatePicker forwards its label into the native control");
  assert.equal(await nestedDate.evaluate(node => node.shadowRoot.querySelector(".control input").getAttribute("aria-invalid")), "true", "nested DatePicker inherits Field invalid state");
  assert.equal(await page.getByRole("combobox", { name: "Owner" }).evaluate(node => node.required), true, "nested ComboBox inherits required state");
  const nestedSearch = page.getByRole("searchbox", { name: "Search records" });
  assert.equal(await nestedSearch.getAttribute("aria-description"), "Search by title or owner.", "nested SearchBox inherits Field description");
  assert.equal(await nestedSearch.getAttribute("aria-required"), "true", "nested SearchBox inherits Field required semantics");
  assert.equal(await page.getByRole("textbox", { name: "Short title" }).evaluate(node => node.required), true, "nested TextField inherits required state");
  const nestedColor = page.locator("[data-testid=react-nested-color-field] spui-color-picker");
  assert.equal(await nestedColor.evaluate(node => node.shadowRoot.querySelector(".picker").getAttribute("aria-label")), "Brand color", "nested ColorPicker inherits a shadow-safe label");
  assert.equal(await nestedColor.evaluate(node => node.shadowRoot.querySelector(".picker").getAttribute("aria-invalid")), "true", "nested ColorPicker inherits invalid state");
  assert.equal(await nestedColor.evaluate(node => node.required), true, "nested ColorPicker inherits native required state");
  const nestedUpload = page.locator("[data-testid=react-nested-upload-field] spui-file-upload");
  assert.equal(await nestedUpload.getAttribute("role"), "group", "FileUpload exposes a named form group");
  assert.equal(await nestedUpload.evaluate(node => node.shadowRoot.querySelector("input").required), true, "nested FileUpload inherits native required state");
  assert.equal(await nestedUpload.evaluate(node => node.shadowRoot.querySelector("input").getAttribute("aria-invalid")), "true", "nested FileUpload inherits invalid state");
  const nestedEditor = page.getByRole("textbox", { name: "Description" });
  assert.equal(await nestedEditor.getAttribute("aria-required"), "true", "nested RichTextEditor inherits required state");
  assert.equal(await nestedEditor.getAttribute("aria-invalid"), "true", "nested RichTextEditor inherits invalid state");

  await page.evaluate(() => window.mountNative());
  const nativeError = page.getByRole("textbox", { name: "Contact email" });
  assert.equal(await nativeError.getAttribute("aria-invalid"), "true");
  assert.equal(await nativeError.evaluate(node => node.required), true);
  const nativeDescribedBy = (await nativeError.getAttribute("aria-describedby")).split(" ");
  assert.deepEqual(nativeDescribedBy, ["native-email-field-validation", "native-email-field-hint", "external-help"], "validation is announced before the hint and existing descriptions");
  assert.ok(nativeDescribedBy.includes("external-help"), "existing descriptions are preserved");
  assert.ok(nativeDescribedBy.includes("native-email-field-hint"));
  assert.ok(nativeDescribedBy.includes("native-email-field-validation"));
  assert.equal(await nativeError.evaluate(node => node.checkValidity()), false, "native required validation remains active");
  assert.equal(await page.locator("#native-email-field").getAttribute("data-orientation"), "horizontal");
  const customSuccess = page.getByRole("textbox", { name: "Backup email" });
  assert.equal(await customSuccess.getAttribute("aria-invalid"), null, "custom-element success state remains valid");
  assert.equal(await customSuccess.getAttribute("aria-describedby"), null, "custom controls do not receive broken generated ID references");
  assert.equal(await customSuccess.getAttribute("aria-description"), "Recovery address is valid. Optional recovery address.");
  assert.equal(await page.locator("#custom-email-field-validation").getAttribute("data-field-validation"), "success");
  assert.deepEqual(errors, [], "no browser errors");
  console.log(JSON.stringify({ status: "passed", reactErrorRequiredAndDescriptions: true, reactSuccessState: true, renderFunctionChild: true, nestedFieldContext: true, nestedFormControls: ["TextField", "Input", "TextArea", "Select", "RadioGroup", "Checkbox", "Switch", "SpinButton", "Slider", "DatePicker", "ComboBox", "SearchBox", "ColorPicker", "FileUpload", "RichTextEditor"], validationAlertSemantics: true, nativeInputComposition: true, customElementComposition: true, existingDescriptionPreserved: true, requiredValidity: true, pageErrors: errors }, null, 2));
} finally {
  await browser?.close();
  server.close();
}
