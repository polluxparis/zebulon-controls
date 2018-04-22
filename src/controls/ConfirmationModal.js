import React from "react";
import { keyMap } from "./utils/generic";

export class ConfirmationModal extends React.Component {
	constructor(props) {
		super(props);
		if (props.show) {
			this.init(props);
		}
		this.state = { status: {}, body: this.body };
	}
	componentWillReceiveProps(nextProps) {
		if (
			nextProps.keyEvent &&
			nextProps.keyEvent !== this.props.keyEvent &&
			!(nextProps.show && !this.props.show)
		) {
			const keyCode =
				nextProps.keyEvent.which || nextProps.keyEvent.keyCode;
			const key = keyMap[keyCode];
			if (key === "Escape") {
				nextProps.keyEvent.preventDefault();
				this.onConfirm(false, false, nextProps);
			} else if (key === "Enter") {
				nextProps.keyEvent.preventDefault();
				this.onConfirm(true, true, nextProps);
			}
		}
		if (nextProps.show) {
			this.init(nextProps);
			this.setState({ body: this.body });
		}
	}
	init = (props, refresh) => {
		const { body, type, noRefresh } = props.detail;
		// do you wnat to save before
		if (type === "YesNoCancel") {
			this.buttons = [
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={e => {
						if (!e.defaultPrevented) {
							this.onConfirm(true, true, props);
						}
					}}
					tabIndex={0}
					key={0}
					autoFocus={true}
				>
					Yes
				</button>,
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={e => {
						if (!e.defaultPrevented) {
							this.onConfirm(true, false, props);
						}
					}}
					tabIndex={1}
					key={1}
				>
					No
				</button>,
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={e => {
						if (!e.defaultPrevented) {
							this.onConfirm(false, false, props);
						}
					}}
					tabIndex={2}
					key={2}
				>
					Cancel
				</button>
			];
			// do you want to continue
		} else if (type === "YesNo") {
			this.buttons = [
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={e => {
						if (!e.defaultPrevented) {
							this.onConfirm(true, undefined, props);
						}
					}}
					tabIndex={0}
					key={0}
					autoFocus={true}
				>
					Yes
				</button>,
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={e => {
						if (!e.defaultPrevented) {
							this.onConfirm(false, undefined, props);
						}
					}}
					tabIndex={0}
					key={1}
					autoFocus={true}
				>
					No
				</button>
			];
			// foreign key selection
		} else if (
			type === "foreignKey" ||
			type === "OkCancel" ||
			type === "conflict"
		) {
			this.buttons = [
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={e => {
						if (!e.defaultPrevented) {
							this.onConfirm(true, undefined, props);
						}
					}}
					tabIndex={0}
					key={0}
					autoFocus={true}
				>
					Ok
				</button>,
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={e => {
						if (!e.defaultPrevented) {
							this.onConfirm(false, undefined, props);
						}
					}}
					tabIndex={1}
					key={1}
				>
					Cancel
				</button>
			];
			if (!noRefresh && type === "foreignKey") {
				this.buttons.push(
					<button
						style={{ minWidth: 70, margin: 5 }}
						onClick={e => {
							if (!e.defaultPrevented) {
								this.init(props, true);
								this.setState({
									status: { loading: true },
									body: this.body
								});
							}
						}}
						tabIndex={2}
						key={2}
					>
						Refresh
					</button>
				);
			}
			// blocking alert
		} else if (type === "Ok") {
			this.buttons = [
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={e => {
						if (!e.defaultPrevented) {
							this.onConfirm(false, undefined, props);
						}
					}}
					tabIndex={0}
					key={0}
					autoFocus={true}
				>
					Ok
				</button>
			];
		}
		this.body = <div>{body}</div>;
		if (Array.isArray(body)) {
			this.body = body.map((line, index) => (
				<div key={index}>{line}</div>
			));
		} else if (type === "foreignKey" && props.detail.callback) {
			const foreignProps = {
				callbackForeignKey: (ok, message) => {
					this.row = message;
					this.onConfirm(ok, undefined, props);
				},
				ref: ref => {
					this.foreignTable = ref;
				},
				onDoubleClick: () => this.onConfirm(true, undefined, props),
				keyEvent: props.keyEvent,
				onRowEnter: ({ row }) => {
					this.row = row;
					return true;
				},
				isModal: true,
				status: this.state.status,
				refresh,
				ref: ref => (this.zebulonTable = ref)
			};

			this.body = <div>{React.cloneElement(body, foreignProps)}</div>;
		} else if (type === "conflict" && props.detail.callback) {
			const conflictProps = {
				keyEvent: props.keyEvent,
				ref: ref => (this.zebulonTable = ref)
			};

			this.body = <div>{React.cloneElement(body, conflictProps)}</div>;
		}
	};
	onConfirm = (carryOn_, ok, props) => {
		if (props.show) {
			let carryOn = carryOn_;
			let message = ok;
			if (props.detail.type === "foreignKey") {
				carryOn = carryOn && this.row !== undefined;
				message = this.row;
			} else if (props.detail.type === "conflict") {
				message = Object.values(this.zebulonTable.state.updatedRows)
					.filter(row => row.checked_ && row.index_ !== undefined)
					.map(row => row.index_); // a voir
			}
			props.onConfirm();
			if (props.detail.callback) {
				props.detail.callback(carryOn, message);
			}
		}
	};
	render() {
		// Render nothing if the "show" prop is false
		if (!this.props.show) {
			return null;
		}
		return (
			<div
				className="backdrop zebulon-modal-backdrop"
				style={{ zIndex: 4 }}
			>
				<div
					className="modal zebulon-modal-confirmation"
					style={{ display: "flex", top: 100, zIndex: 4 }}
				>
					{this.state.body}
					<div className="footer" style={{ display: "flex" }}>
						{this.buttons}
					</div>
				</div>
			</div>
		);
	}
}
