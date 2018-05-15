import React, { Component } from "react";
// import { utils } from "zebulon-controls";
import {
  dateToString,
  stringToDate,
  numberToString,
  isNullOrUndefined,
  isPromise
} from "./utils/generic";
import { ContextualMenuClient } from "./ContextualMenu";

const formatValue = (props, value, focused) => {
  // console.log(1);
  const { row, column, status, params, data, inputType, editable } = props;
  const { dataType, formatFunction } = column || { dataType: props.dataType };
  let v = isNullOrUndefined(value) ? "" : value;
  if (
    formatFunction &&
    inputType !== "filter" &&
    (!(focused && editable) && dataType !== "boolean")
  ) {
    v = formatFunction({ value: v, row, column, params, status, data });
  } else if (dataType === "boolean" && value === "") {
    v = null;
  } else if (dataType === "date" && value !== null) {
    v = dateToString(v, undefined || "dd/mm/yyyy");
  } else if (dataType === "number" && value !== null) {
    v = focused && editable ? v.toString() : numberToString(v);
  }
  return v;
};
export class Input extends Component {
  constructor(props) {
    super(props);
    this.column = props.column || {
      dataType: props.dataType,
      id: props.id,
      index_: 0,
      caption: props.label
    };
    let value = props.value;
    this.state = {
      value,
      formatedValue: formatValue(props, value, props.focused),
      loaded: true,
      focused: props.focused
    };
    // this.focused = props.focused;
    if (props.select && props.editable && props.focused) {
      let options = props.select;
      if (typeof options === "function") {
        options = options(props.row);
      }
      if (isPromise(options)) {
        this.state.options = [];
        options.then(options => {
          this.setState({ options });
        });
      } else {
        this.state.options = options;
      }
    }
  }
  componentWillReceiveProps(nextProps) {
    this.column = nextProps.column || {
      dataType: nextProps.dataType,
      id: nextProps.id,
      index_: 0,
      caption: nextProps.label
    };

    if (
      nextProps.value !== this.state.value ||
      nextProps.focused !== this.state.focused
    ) {
      this.setState({
        value: nextProps.value,
        formatedValue: formatValue(
          nextProps,
          nextProps.value,
          nextProps.focused
        ),
        focused: nextProps.focused
      });
    }
    // this.focused = nextProps.focused;
    const options = nextProps.select;
    if (options) {
      if (isPromise(options)) {
        this.setState.options = [];
        options.then(options => {
          this.setState({ options });
        });
      } else {
        this.setState({ options });
      }
    }
  }
  validateInput = value => {
    let v = value;
    const dataType = this.column.dataType;
    if (this.props.validateInput) {
      return this.props.validateInput(value);
    } else if (dataType === "number") {
      v =
        value.slice(value.length - 1, value.length) === "."
          ? value.slice(0, value.length - 1)
          : value;
      if (v === "-") {
        v = "";
      }
      return !isNaN(Number(v));
    } else if (dataType === "date") {
      v = value.match(/[0123456789.:/ ]+/g) || [];
      return value === "" || (v.length === 1 && v[0] === value);
    }
    return true;
  };

  handleChange = e => {
    const {
      row,
      editable,
      inputType,
      onChange,
      filterTo,
      onMouseDown
    } = this.props;
    const column = this.column;
    const { dataType, format } = column || { dataType: this.props.dataType };
    if (editable) {
      let value = e.target.value,
        validatedValue;
      if (!this.validateInput(value)) return;
      // selection of an object
      if (column.reference && column.selectItems) {
        validatedValue = column.selectItems[e.target.value] || {};
      } else if (dataType === "boolean") {
        if (inputType === "filter" && this.state.value === false)
          validatedValue = null;
        else {
          validatedValue = !this.state.value;
          value = validatedValue;
          if (inputType !== "filter" && !this.props.focused) {
            onMouseDown(e);
          }
        }
      } else if (dataType === "date") {
        validatedValue = stringToDate(value, format);
      } else if (dataType === "number") {
        validatedValue = value === "" ? null : Number(value);
        if (isNaN(validatedValue)) {
          validatedValue = null;
        }
      } else {
        validatedValue = value;
      }
      if (onChange) {
        if (onChange(validatedValue, row, column, filterTo) === false) {
          return false;
        }
      }
      if (row) {
        const columnId =
          column.reference && column.select ? column.reference : column.id;
        row[columnId] = validatedValue;
        if (
          column.setForeignKeyAccessorFunction &&
          column.reference &&
          column.selectItems
        ) {
          column.setForeignKeyAccessorFunction({
            value: validatedValue.pk_,
            row
          });
        }
      }
      this.setState({ formatedValue: value, value: validatedValue });
    }
  };
  handleBlur = () => {
    this.setState({
      formatedValue: formatValue(this.props, this.state.value, false)
    });
  };
  handleFocus = e => {
    const { inputType, onFocus, row } = this.props;
    const column = this.column;
    if (inputType === "filter") {
      onFocus(e, row, column);
      if (column.filterType !== "values") {
        // this.focused = true;
        const formatedValue = formatValue(this.props, this.state.value, true);
        this.setState({
          formatedValue,
          focused: true
        });
      }
    } else if (onFocus) {
      onFocus(e, row, column);
    }
  };
  render() {
    const {
      row,
      editable,
      inputType,
      hasFocus,
      select,
      label,
      className,
      style,
      onMouseDown,
      onMouseUp,
      onDoubleClick,
      onMouseOver,
      tabIndex,
      id,
      menu,
      component
    } = this.props;
    let input;
    let value = this.state.formatedValue;
    const column = this.column;
    const { dataType } = column;
    if (
      inputType !== "filter" &&
      (!((this.state.focused || this.props.column === undefined) && editable) &&
        dataType !== "boolean")
    ) {
      input = (
        <ContextualMenuClient
          id={id}
          key={id}
          row={row}
          column={column}
          className={className || "zebulon-input zebulon-input-select"}
          style={style}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseOver={onMouseOver}
          onDoubleClick={onDoubleClick}
          ref={ref => (this.input = ref)}
          menu={menu}
          component={component}
        >
          {value}
        </ContextualMenuClient>
      );
    } else {
      const innerStyle = {
        textAlign: style.textAlign,
        width: "100%"
      };
      if (inputType === "filter" && dataType !== "boolean") {
        innerStyle.padding = ".4em";
        innerStyle.height = "inherit";
      }
      // label;
      let disabled = !editable || undefined;
      if (select) {
        let options = this.state.options;
        if (typeof options === "object") {
          if (column.reference) {
            value = column.primaryKeyAccessorFunction({ row });
            options = Object.keys(options).map(key => ({
              id: key,
              caption: column.accessorFunction({
                row: { [column.reference]: options[key] }
              })
            }));
          } else {
            options = Object.values(options);
          }
          options = [{ id: undefined, label: "" }].concat(options);
        }
        input = (
          <select
            id={id}
            key={id}
            className={className || "zebulon-input zebulon-input-select"}
            onChange={this.handleChange}
            value={value}
            style={innerStyle}
            autoFocus={hasFocus}
            onFocus={this.handleFocus}
            ref={ref => (this.input = ref)}
          >
            {options.map((item, index) => {
              return (
                <option
                  key={index}
                  value={typeof item === "object" ? item.id : item}
                  style={typeof item === "object" ? item.style || {} : {}}
                >
                  {typeof item === "object" ? item.caption : item}
                </option>
              );
            })}
          </select>
        );
      } else if (dataType === "boolean") {
        innerStyle.width = "100%";
        innerStyle.margin = "unset";
        innerStyle.padding = "unset";
        input = (
          <input
            type="checkbox"
            id={id}
            key={id}
            autoFocus={hasFocus}
            style={innerStyle}
            checked={this.state.value || false}
            disabled={false}
            onChange={this.handleChange}
            onFocus={onMouseDown}
            onMouseUp={onMouseUp}
            tabIndex={tabIndex}
            ref={ref => (this.input = ref)}
          />
        );
      } else {
        // let value = this.state.formatedValue;
        if (isNullOrUndefined(value) || value === "") {
          value = "";
        }
        input = (
          <input
            type="text"
            id={id}
            key={id}
            className={className || "zebulon-table-input"}
            autoFocus={hasFocus && inputType !== "filter"}
            style={innerStyle}
            value={
              hasFocus && inputType === "filter" ? this.state.value : value
            }
            disabled={disabled}
            onChange={this.handleChange}
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
            tabIndex={tabIndex}
            ref={ref => (this.input = ref)}
          />
        );
      }
      if (dataType === "boolean") {
        input = (
          <ContextualMenuClient
            menu={menu}
            component={component}
            id={id}
            key={id}
            row={row}
            column={column}
            className={className}
            style={{ ...style }}
            onDrop={e => e.preventDefault()}
            onDoubleClick={onDoubleClick}
          >
            {input}
          </ContextualMenuClient>
        );
      } else {
        input = (
          <ContextualMenuClient
            menu={menu}
            component={component}
            id={id}
            key={id}
            row={row}
            column={column}
            style={{ ...style }}
            onDrop={e => e.preventDefault()}
            onDoubleClick={onDoubleClick}
          >
            {input}
          </ContextualMenuClient>
        );
      }
    }
    if (inputType === "field") {
      input = (
        <label
          id={id}
          key={id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0.2em"
          }}
          // className={this.props.className}
        >
          {column.caption}
          {input}
        </label>
      );
    }
    return input;
  }
}
