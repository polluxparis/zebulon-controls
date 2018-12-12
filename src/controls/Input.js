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
      nextProps.focused !== this.props.focused ||
      nextProps.hasFocus !== this.props.hasFocus
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
        value.editedValue =
          !nextProps.focused && nextProps.inputType === "cell"
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
        selectItems: props.select,
        editable: props.editable
      }
    );
  };
  handleChange = ({ value, row, column, filterTo }) => {
    if (column.editable || this.props.inputType === "filter") {
      if (this.props.onChange) {
        if (this.props.onChange({ value, row, column, filterTo }) === false) {
          return false;
        }
      }
      // to be sure that it will be rendered with the correct values
      // (the grid is rendered when the row is updated for the first time (in this.props.onChange)
      // and if the state is not forced with new values, the cell is rendered with previous values ???)
      const state = this.state;
      state.value = value;
      this.setState({ value });
    }
  };
  handleBlur = e => {
    if (!this.noOnBlur && this.props.inputType !== "cell") {
      this.setState({
        value: {
          ...this.state.value,
          caption: formatValue(this.props, this.state.value.value, false),
          editedValue: undefined
        }
      });
    }
    this.noOnBlur = false;
  };
  handleFocus = e => {
    const { inputType, onFocus, row } = this.props;
    const column = this.column;
    if (onFocus) {
      this.noOnBlur = true;
      onFocus(e, row, column);
      this.noOnBlur = false;
    }
    //  a verifier
    if (inputType !== "cell") {
      if (column.filterType !== "values") {
        const caption = formatValue(this.props, this.state.value.value, true);
        this.setState({
          value: { ...this.state.value, caption },
          focused: true
        });
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
      !(editable && (hasFocus || this.props.column === undefined)) &&
      column.dataType !== "boolean" &&
      inputType !== "filter"
    ) {
      element = this.state.value.caption || this.state.value.editedValue;
    } else if (column.dataType === "boolean") {
      // booleans are check box even when not editable
      element = cloneElement(<CheckBoxInput />, {
        ...this.props,
        column,
        value,
        handleChange,
        handleFocus,
        handleBlur,
        ref: ref => (this.ref = ref)
      });
    } else if (select && inputType !== "filter") {
      element = cloneElement(<SelectInput />, {
        ...this.props,
        column,
        value,
        handleChange,
        handleFocus,
        handleBlur,
        ref: ref => (this.ref = ref)
      });
    } else {
      // this.noOnBlur = true;
      element = cloneElement(<EditableInput />, {
        ...this.props,
        column,
        value,
        handleChange,
        handleFocus,
        handleBlur,
        ref: ref => (this.ref = ref)
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
}
