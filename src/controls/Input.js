import React, { Component, cloneElement } from "react";
import { isObject } from "./utils/generic";
import { ContextualMenuClient } from "./ContextualMenu";
import {
  EditableInput,
  SelectInput,
  CheckBoxInput,
  formatValue
} from "./Input2";
// 3 values are managed {value,caption,editedValue}
// value is an id or the resulting value (as a date,number...}
// caption is the label corresponding to the id or the formated value
// edited value is the value entered by the user as a string
// id and caption may be null during transition (eg if 01/1 is entered for a date,there's no date nor formated date,only the edited value
export class Input extends Component {
  constructor(props) {
    super(props);
    this.column = this.initColumn(props);
    const value = isObject(props.value)
      ? props.value
      : {
          value: props.value,
          caption: formatValue(props, props.value)
        };
    this.state = {
      value,
      loaded: true,
      focused: props.focused,
      options: []
    };
  }
  componentWillReceiveProps(nextProps) {
    this.column = this.initColumn(nextProps);
    if (
      nextProps.value !== this.props.value ||
      nextProps.focused !== this.props.focused
    ) {
      let value = this.state.value;
      if (isObject(nextProps.value)) {
        value = {
          ...nextProps.value,
          editedValue: this.state.value.editedValue
        };
      } else {
        value.value = nextProps.value;
        value.caption = formatValue(nextProps, nextProps.value);
      }
      this.setState({
        value,
        focused: nextProps.focused
      });
    }
  }
  initColumn = props => {
    return (
      props.column || {
        dataType: props.dataType,
        id: props.id,
        index_: 0,
        caption: props.label,
        selectItems: props.select
      }
    );
  };
  handleChange = ({ value, row, column, filterTo }) => {
    if (onChange) {
      if (onChange({ value, row, column, filterTo }) === false) {
        return false;
      }
    }
    if (row && !column.onChangeFunction) {
      row[column.id] = value.value;
    }
    this.setState({ value });
  };
  handleBlur = () => {
    this.setState({
      value: {
        ...this.state.value,
        caption: formatValue(this.props, this.state.value.value)
      }
    });
  };
  handleFocus = e => {
    const { inputType, onFocus, row } = this.props;
    const column = this.column;
    if (onFocus) {
      onFocus(e, row, column);
      if (inputType === "filter") {
        if (column.filterType !== "values") {
          const caption = formatValue(this.props, this.state.value.value);
          this.setState({
            value: { ...this.state.value, caption },
            focused: true
          });
        }
      }
    }
  };
  render() {
    const {
      id,
      row,
      className,
      style,
      onMouseDown,
      onMouseUp,
      onDoubleClick,
      onMouseOver,
      menu,
      component,
      editable,
      inputType,
      hasFocus
    } = this.props;
    const column = this.column;
    const value = this.state.value;
    let element = null;
    if (!(editable && hasFocus) && column.datatype !== "boolean") {
      element = this.state.value.caption || this.state.value.editedValue;
    } else if (column.datatype === "boolean") {
      // booleans are check box even when not editable
      element = cloneElement(<CheckBoxInput />, { ...this.props, value });
    } else if (column.selectItems) {
      element = cloneElement(<SelectInput />, { ...this.props, value });
    } else {
      element = cloneElement(<EditableInput />, { ...this.props, value });
    }
    return (
      <ContextualMenuClient
        id={id}
        key={id}
        row={row}
        column={column}
        className={className || "zebulon-input"}
        style={style}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseOver={onMouseOver}
        onDoubleClick={onDoubleClick}
        menu={menu}
        component={component}
        handleChange={this.handleChange}
      >
        {element}
      </ContextualMenuClient>
    );
  }

  // if (inputType === "field") {
  //   input = (
  //     <label
  //       id={id}
  //       key={id}
  //       style={{
  //         display: "flex",
  //         justifyContent: "space-between",
  //         padding: "0.2em"
  //       }}
  //       // className={this.props.className}
  //     >
  //       {column.caption}
  //       {input}
  //     </label>
  //   );
  // }
  // return input;
  // }
}
