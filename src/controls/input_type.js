import React, { Component } from "react";
import { ContextualMenuClient } from "./contextual_menu";
import {
	isObject,
	isNullOrUndefined,
	isPromise,
	isMap,
	dateToString,
	stringToDate,
	numberToString
} from "./utils/generic";

// -------------------------------
//  editables
// -------------------------------
export const validateInput = (value, dataType, validateInput) => {
	let v = value;
	if (validateInput) {
		return validateInput(value);
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
export const formatValue = (props, value, focused) => {
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
export class EditableInput extends Component {
	// constructor(props) {
	// 	super(props);
	// }
	// componentWillReceiveProps(nextProps) {}
	handleChange = e => {
		const { row, column, inputType, handleChange, filterTo } = this.props;
		const { dataType, format } = column;
		const v = e.target.value;
		if (!validateInput(v)) {
			return;
		}
		const value = { caption: v, value: v, editedValue: v };
		if (dataType === "date") {
			value.value = stringToDate(v, format);
		} else if (dataType === "number") {
			value.value = v === "" ? null : Number(v);
			if (isNaN(value.value)) {
				value.value = null;
			}
		}
		value.caption = formatValue(this.props, value.value, true);
		handleChange({ value, row, column, filterTo });
	};
	render() {
		const {
			hasFocus,
			handleFocus,
			// handleBlur,
			id,
			className,
			inputType,
			value,
			innerStyle
		} = this.props;

		const style = {
			textAlign: this.props.style.textAlign,
			width: "100%",
			height: "100%",
			padding: "unset",
			border: "unset",
			...innerStyle
		};
		// if (inputType === "filter") {
		// 	style.padding = ".4em";
		// 	style.height = "inherit";
		// }
		return (
			<input
				type="text"
				id={id}
				key={id}
				className={className || "zebulon-input"}
				autoFocus={hasFocus && inputType !== "filter"}
				onFocus={handleFocus}
				// onBlur={handleBlur}
				style={style}
				value={value.caption || value.editedValue}
				onChange={this.handleChange}
			/>
		);
	}
}

export class SelectInput extends Component {
	constructor(props) {
		super(props);
		const options = this.getOptions(props.column, props);
		if (options) {
			this.state = { options };
		}
	}
	// componentWillReceiveProps(nextProps) {
	// 	this.column = nextProps.column || {
	// 		dataType: nextProps.dataType,
	// 		id: nextProps.id,
	// 		index_: 0,
	// 		caption: nextProps.label
	// 	};
	// 	const options = this.getOptions(nextProps.column, nextProps);
	// 	if (options) {
	// 		this.setState({ options });
	// 	}
	// }
	getOptions = (column, props) => {
		let options = props.select;
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
			if (!Array.isArray(options) && isObject(options)) {
				options = Object.values(options);
			}
			if (Array.isArray(options)) {
				options = options.map(option => {
					if (isObject(option)) {
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
	};
	handleChange = e => {
		const { row, column, filterTo, handleChange, value } = this.props;
		value.caption = e.target.value;
		value.value = e.target.value;
		// if(column.reference&&!column.onChange){}
		handleChange({ value, row, column, filterTo });
	};
	render() {
		const {
			hasFocus,
			handleFocus,
			id,
			className,
			value,
			innerStyle
		} = this.props;
		const style = {
			width: "100%",
			height: "100%",
			padding: "unset",
			border: "unset",
			...innerStyle
		};
		const options = this.state.options.map((item, index) => {
			let caption = item,
				id = item,
				style = {};
			if (isObject(item)) {
				caption = item.caption;
				id = item.id;
				style = item.style || {};
			}
			return (
				<option key={index} value={id} style={style}>
					{caption}
				</option>
			);
		});
		return (
			<select
				id={id}
				key={id}
				className={className || "zebulon-input zebulon-input-select"}
				onChange={this.handleChange}
				value={value.value}
				onFocus={handleFocus}
				autoFocus={hasFocus}
				ref={ref => (this.input = ref)}
				style={style}
			>
				{options}
			</select>
		);
	}
}
export class CheckBoxInput extends Component {
	constructor(props) {
		super(props);
	}
	componentWillReceiveProps(nextProps) {}
	handleChange = e => {
		const {
			row,
			column,
			filterTo,
			handleChange,
			inputType,
			value
		} = this.props;
		if (inputType === "filter" && value.value === false) {
			value.value = null;
		} else {
			value.value = !value.value;
			if (inputType !== "filter" && !this.props.focused) {
				onMouseDown(e);
			}
		}
		handleChange({ value, row, column, filterTo });
	};
	render() {
		const { hasFocus, id, className, value, innerStyle } = this.props;
		const style = {
			margin: "unset",
			padding: "unset",
			...innerStyle
		};
		return (
			<input
				type="checkbox"
				id={id}
				key={id}
				className={className || "zebulon-input"}
				autoFocus={hasFocus}
				style={style}
				checked={value.value || false}
				disabled={false}
				onChange={this.handleChange}
			/>
		);
	}
}
