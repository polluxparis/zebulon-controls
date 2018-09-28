import React, { Component } from "react";
// import { utils } from "zebulon-controls";
import {
  dateToString,
  stringToDate,
  numberToString,
  isNullOrUndefined,
  isPromise,
  isMap
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
      caption: props.label,
      selectItems: props.select
    };
    const value =
      this.column.selectItems && typeof props.value === "object"
        ? props.value
        : {
            value: props.value,
            caption: formatValue(props, props.value, props.focused)
          };
    this.state = {
      value,
      loaded: true,
      focused: props.focused,
      options: []
    };
    // this.focused = props.focused;
    const options = this.getOptions(this.column, this.props);
    if (options) {
      this.state.options = options;
    }
    // if (props.select && props.editable && props.focused) {
    //   let options = props.select;
    //   if (typeof options === "function") {
    //     options = options(props.row);
    //   }
    //   if (isPromise(options)) {
    //     this.state.options = [];
    //     options.then(options => {
    //       this.setState({ options });
    //     });
    //   } else {
    //     this.state.options = options;
    //   }
    // }
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
      const value =
        this.column.selectItems && typeof nextProps.value === "object"
          ? nextProps.value
          : {
              value: nextProps.value,
              caption: formatValue(
                nextProps,
                nextProps.value,
                nextProps.focused
              )
            };
      this.setState({
        value,
        focused: nextProps.focused
      });
    }

    // this.focused = nextProps.focused;
    const options = this.getOptions(this.column, nextProps);
    if (options) {
      this.setState({ options });
    }
    // const options = nextProps.select;
    // if (options) {
    //   if (isPromise(options)) {
    //     this.setState.options = [];
    //     options.then(options => {
    //       this.setState({ options });
    //     });
    //   } else {
    //     this.setState({ options });
    //   }
    // }
  }
  shouldComponentUpdate(nextProps) {
    return !(nextProps.focused && this.props.focused);
  }
  getOptions = (column, props) => {
    let options = column.selectItems;
    if (props.select && props.editable && props.focused) {
      if (typeof options === "function") {
        options = options(props.row);
      }

      if (isMap(options)) {
        options = Array.from(options).map(option => ({
          id: option[0],
          caption: option[1]
        }));
      } else if (isPromise(options)) {
        options.then(options => {
          props.select = options;
          this.setState({ options: this.getOptions(column, props) });
        });
      } else {
        if (!Array.isArray(options) && typeof options === "object") {
          options = Object.values(options);
        }
        if (Array.isArray(options)) {
          options = options.map(option => {
            if (typeof option === "object") {
              return option;
            } else {
              return {
                id: option,
                caption: option
              };
            }
          });
        }
      }
      return options;
    }
  };
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
      if (!this.validateInput(e.target.value)) {
        return;
      }
      const value = { caption: e.target.value, value: e.target.value };
      if (column.selectItems) {
      } else if (dataType === "boolean") {
        // ??
        if (inputType === "filter" && this.state.value.value === false) {
          value.value = null;
        } else {
          value.value = !this.state.value.value;
          // value = validatedValue;
          if (inputType !== "filter" && !this.props.focused) {
            onMouseDown(e);
          }
        }
      } else if (dataType === "date") {
        value.value = stringToDate(value.caption, format);
      } else if (dataType === "number") {
        value.value = value.caption === "" ? null : Number(value.caption);
        if (isNaN(value.value)) {
          value.value = null;
        }
      }
      if (onChange) {
        if (onChange({ value, row, column, filterTo }) === false) {
          return false;
        }
      }
      if (row && (column.foreignObject || !column.onChangeFunction)) {
        row[column.id] = value.value;
      }
      this.setState({ value });
    }
  };
  handleBlur = () => {
    this.setState({
      value: {
        ...this.state.value,
        caption: formatValue(this.props, this.state.value.value, false)
      }
    });
  };
  handleFocus = e => {
    const { inputType, onFocus, row } = this.props;
    const column = this.column;
    if (inputType === "filter") {
      onFocus(e, row, column);
      if (column.filterType !== "values") {
        // this.focused = true;
        const caption = formatValue(this.props, this.state.value.value, true);
        this.setState({
          value: { ...this.state.value, caption },
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
      component,
      setRef
    } = this.props;
    let input;
    let value = this.state.value.caption;
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
        // let options = this.state.options;
        // if (typeof options === "object") {
        //   if (column.reference) {
        //     value = column.primaryKeyAccessorFunction({ row });
        //     options = Object.keys(options).map(key => ({
        //       id: key,
        //       caption: column.accessorFunction({
        //         row: { [column.reference]: options[key] }
        //       })
        //     }));
        //   } else {
        //     options = Object.values(options);
        //   }
        //   options = [{ id: undefined, label: "" }].concat(options);
        // }
        input = (
          <select
            id={id}
            key={id}
            className={className || "zebulon-input zebulon-input-select"}
            onChange={this.handleChange}
            value={this.state.value.value}
            style={innerStyle}
            autoFocus={hasFocus}
            onFocus={this.handleFocus}
            ref={ref => (this.input = ref)}
          >
            {this.state.options.map((item, index) => {
              return (
                <option
                  key={index}
                  value={item.id}
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
            checked={this.state.value.value || false}
            disabled={false}
            onChange={this.handleChange}
            onFocus={onMouseDown}
            onMouseUp={onMouseUp}
            tabIndex={tabIndex}
            ref={ref => {
              this.input = ref;
              if (setRef) {
                setRef(ref);
              }
            }}
          />
        );
      } else {
        // let value = this.state.caption;
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
              hasFocus && inputType === "filter" ? (
                this.state.value.value
              ) : (
                value
              )
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
