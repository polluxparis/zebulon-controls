import React, { Component, cloneElement } from "react";
import { isObject } from "./utils/generic";
import { ContextualMenuClient } from "./contextual_menu";
import {
  EditableInput,
  SelectInput,
  CheckBoxInput,
  formatValue
} from "./input_type";
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
          caption: formatValue(props, props.value, props.focused)
        };
    this.state = {
      value,
      loaded: true,
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
          editedValue: !nextProps.focused
            ? undefined
            : this.state.value.editedValue
        };
      } else {
        value.value = nextProps.value;
        value.caption = formatValue(
          nextProps,
          nextProps.value,
          nextProps.focused
        );
        value.editedValue = !nextProps.focused
          ? undefined
          : this.state.value.editedValue;
      }
      this.setState({
        value
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
    if (column.editable) {
      if (this.props.onChange) {
        if (this.props.onChange({ value, row, column, filterTo }) === false) {
          return false;
        }
      }
      this.setState({ value });
    }
  };
  // handleBlur = e => {
  //   if (!this.noOnBlur) {
  //     this.setState({
  //       value: {
  //         ...this.state.value,
  //         caption: formatValue(this.props, this.state.value.value, false),
  //         editedValue: undefined
  //       }
  //     });
  //   }
  //   this.noOnBlur = false;
  // };
  handleFocus = e => {
    const { inputType, onFocus, row } = this.props;
    const column = this.column;
    if (onFocus) {
      this.noOnBlur = true;
      onFocus(e, row, column);
      this.noOnBlur = false;
      if (inputType === "filter") {
        if (column.filterType !== "values") {
          const caption = formatValue(this.props, this.state.value.value, true);
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
      hasFocus,
      select,
      dataType
    } = this.props;
    const column = this.column;
    const value = this.state.value;
    const { handleChange, handleBlur, handleFocus } = this;
    let element = null;
    if (
      !(editable && (hasFocus || this.props.columns === undefined)) &&
      column.dataType !== "boolean" &&
      inputType !== "filter"
    ) {
      element = this.state.value.caption || this.state.value.editedValue;
    } else if (column.dataType === "boolean") {
      // booleans are check box even when not editable
      element = cloneElement(<CheckBoxInput />, {
        ...this.props,
        value,
        handleChange,
        handleFocus,
        handleBlur
      });
    } else if (select && inputType !== "filter") {
      element = cloneElement(<SelectInput />, {
        ...this.props,
        value,
        handleChange,
        handleFocus,
        handleBlur
      });
    } else {
      // this.noOnBlur = true;
      element = cloneElement(<EditableInput />, {
        ...this.props,
        value,
        handleChange,
        handleFocus,
        handleBlur
      });
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
