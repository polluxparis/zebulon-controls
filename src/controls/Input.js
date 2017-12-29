import React, { Component } from "react";
import { dateToString, stringToDate, isNullOrUndefined } from "./utils/generic";

const formatValue = (value, dataType, format) => {
  let v = isNullOrUndefined(value) ? "" : value;
  if (dataType === "boolean" && value === "") {
    v = null;
  } else if (dataType === "date" && value !== null) {
    v = dateToString(v, format || "dd/mm/yyyy");
  }
  // console.log(value, v, type);
  return v;
};
export class Input extends Component {
  constructor(props) {
    super(props);
    let value = props.value;
    if (props.object && props.objectKey) {
      value = props.object[props.objectKey];
    }
    this.state = {
      value,
      formatedValue: formatValue(value, props.dataType, props.format)
    };
  }
  componentWillReceiveProps(nextProps) {
    let value = nextProps.value;
    if (nextProps.object && nextProps.objectKey) {
      value = nextProps.object[nextProps.objectKey];
    }
    if (value !== this.state.value) {
      this.setState({
        value,
        formatedValue: formatValue(
          nextProps.value,
          nextProps.dataType,
          nextProps.format
        )
      });
    }
  }
  value = () => {
    return this.state.formatedValue || null;
  };
  validateInput = value => {
    let v = value;
    if (this.props.validateInput) {
      v = this.props.validateInput(value);
    } else if (this.props.dataType === "number") {
      v =
        value === "" ? null : isNaN(Number(value)) ? undefined : Number(value);
    } else if (this.props.dataType === "date") {
      v =
        value === "" || value === value.match(/[0123456789.:/ ]+/g)[0]
          ? value
          : undefined;
    }
    return v;
  };

  handleChange = e => {
    if (this.props.editable) {
      let value = e.target.value;
      let validatedValue = this.validateInput(value);
      if (this.props.dataType === "boolean") {
        if (this.props.inputType === "filter" && this.state.value === false) {
          validatedValue = null;
        } else {
          validatedValue = !this.state.value;
        }
        value = validatedValue;
      }
      if (validatedValue !== undefined) {
        this.setState({ formatedValue: value, value: validatedValue });
        if (this.props.dataType === "date") {
          validatedValue = stringToDate(validatedValue, this.props.format);
          if (validatedValue !== undefined) {
            this.setState({
              value: validatedValue,
              formatedValue: formatValue(
                validatedValue,
                this.props.dataType,
                this.props.format
              )
            });
          }
        }
        // if (    validatedValue !== undefined) {
        if (this.props.row && this.props.id) {
          this.props.row[this.props.id] = validatedValue;
        }
        if (this.props.onChange) {
          this.props.onChange(validatedValue);
        }
        //   }
      }
    }
  };
  handleBlur = e => {
    let value = e.target.value;
    if (this.props.dataType === "date") {
      value = stringToDate(value, this.props.format);
      if (value === undefined) {
        this.setState({ value: null });
      }
    }
    if (this.props.onBlur) {
      this.props.onBlur(value);
    }
  };

  render() {
    if (
      this.props.row &&
      !(this.props.focused && this.props.editable) &&
      this.props.dataType !== "boolean"
    ) {
      return (
        <div
          key={this.props.id}
          className={
            this.props.className || "zebulon-input zebulon-input-select"
          }
          style={this.props.style}
          onClick={this.props.onClick}
          // onDoubleClick={e => onDoubleClick(e, row, column)}
          onMouseOver={this.props.onMouseOver}
        >
          {this.state.formatedValue}
        </div>
      );
    }
    const style = {
      textAlign: this.props.style.textAlign
    };
    if (this.props.inputType === "filter") {
      style.padding = ".4em";
      // style.border = 0;
      // style.width = "98%";
    }

    let type = "text",
      input,
      checkboxLabel,
      label;
    let disabled = !this.props.editable || undefined;
    if (this.props.select) {
      let options = this.props.select;
      if (typeof options === "function") {
        options = options(this.props.row);
      }
      input = (
        <select
          className={
            this.props.className || "zebulon-input zebulon-input-select"
          }
          onChange={this.handleChange}
          value={this.state.formatedValue}
          style={style}
          autoFocus={true}

          // onEnter={() => console.log("enter")}
        >
          {options.map((item, index) => (
            <option key={index} value={typeof item === "object" ? 1 : item}>
              {typeof item === "object" ? 1 : item}
            </option>
          ))}
        </select>
      );
    } else {
      if (this.props.dataType === "boolean") {
        type = "checkbox";
        disabled = false;
        style.width = "unset";
        checkboxLabel = (
          <label htmlFor={this.props.id || "input"}>{this.props.label}</label>
        );
      }
      input = (
        <input
          type={type}
          key={this.props.id}
          className={this.props.className || "zebulon-input"}
          autoFocus={this.props.inputType !== "filter"}
          style={style}
          value={this.state.formatedValue}
          checked={this.state.value || false}
          disabled={disabled}
          onChange={this.handleChange}
          ref={ref => (this.focused = ref)}
          tabIndex={0}
          onFocus={e => (this.props.onFocus || (() => {}))(e)}
        />
      );
    }
    input = (
      <div
        id="div-input"
        key={this.props.id}
        className={this.props.className || "zebulon-input"}
        style={this.props.style}
        onClick={this.props.onClick || (() => {})}
        onDoubleClick={this.props.onDoubleClick || (() => {})}
        // onFocus={() => console.log("focus")}
      >
        {input}
        {checkboxLabel}
      </div>
    );
    if (this.props.label && this.props.dataType !== "boolean") {
      return (
        <label
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0.2em"
          }}
          // className={this.props.className}
        >
          {this.props.label}
          {input}
        </label>
      );
    } else {
      return input;
    }
  }
}

export class InputInterval extends Component {
  constructor(props) {
    super(props);
    const initialValues = props.initialValues || [null, null];
    this.state = { from: initialValues[0], to: initialValues[1] };
  }
  // componentDidMount() {
  //   if (this.props.hasFocus) {
  //     document.getElementById("focused").focus();
  //     console.log("int", document.activeElement);
  //   }
  // }
  getFrom = () => {
    return this.state.from;
  };
  getTo = () => {
    return this.state.to;
  };
  handleChange = (type, value) => {
    this.setState({ [type]: value });
    if (this.props.onChange) {
      this.props.onChange([
        type === "from" ? value : this.getFrom(),
        type === "to" ? value : this.getTo()
      ]);
    }
  };
  handleBlur = (type, value) => {
    if (this.props.onChange) {
      this.props.onChange([this.getFrom(), this.getTo()]);
    }
  };

  render() {
    const { dataType, format, style, hasFocus } = this.props;
    return (
      <div key={this.props.id} style={this.props.style}>
        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            paddingBottom: this.props.title ? 10 : 0
          }}
        >
          {this.props.title}
        </div>
        <div>
          <Input
            hasFocus={hasFocus}
            style={style}
            value={this.getFrom()}
            dataType={dataType}
            format={format}
            onChange={value => this.handleChange("from", value)}
            onBlur={value => this.handleBlur("from", value)}
            editable={true}
          />
        </div>
        <div>
          <Input
            hasFocus={false}
            style={style}
            value={this.getTo()}
            dataType={dataType}
            format={format}
            onChange={value => this.handleChange("to", value)}
            onBlur={value => this.handleBlur("to", value)}
            editable={true}
          />
        </div>
      </div>
    );
  }
}
