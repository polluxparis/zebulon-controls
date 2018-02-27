import React from "react";
export class ConfirmationModal extends React.Component {
	constructor(props) {
		super(props);
		if (props.show) {
			this.init(props);
		}
		this.state = { status: {}, body: this.body };
	}
	componentWillReceiveProps(nextProps) {
		if (nextProps.keyEvent !== this.props.keyEvent) {
			if (nextProps.keyEvent.code === "Escape") {
				this.props.onConfirm("cancel");
			} else if (nextProps.keyEvent.code === "Enter") {
				if (nextProps.detail.type === "foreignKey") {
					this.onForeignKey(true);
				} else {
					this.props.onConfirm("yes");
				}
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
					onClick={() => this.onConfirm(true, true)}
					tabIndex={0}
					key={0}
					autoFocus={true}
				>
					Yes
				</button>,
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={() => this.onConfirm(true, false)}
					tabIndex={1}
					key={1}
				>
					No
				</button>,
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={() => this.onConfirm(false, false)}
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
					onClick={() => this.onConfirm(true)}
					tabIndex={0}
					key={0}
					autoFocus={true}
				>
					Yes
				</button>,
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={() => this.onConfirm(false)}
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
					onClick={() => this.onConfirm(true)}
					tabIndex={0}
					key={0}
					autoFocus={true}
				>
					Ok
				</button>,
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={() => this.onConfirm(false)}
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
						onClick={() => {
							this.init(this.props, true);
							this.setState({
								status: { loading: true },
								body: this.body
							});
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
					onClick={() => this.onConfirm(false)}
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
					this.onConfirm(ok);
					// props.detail.callback(message);
				},
				ref: ref => {
					this.foreignTable = ref;
				},
				onDoubleClick: () => this.onConfirm(true),
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
				// callbackForeignKey: message => {
				// 	props.onConfirm(message === false ? "cancel" : "ok");
				// 	props.detail.callback(message);
				// },
				// ref: ref => {
				// 	this.foreignTable = ref;
				// },
				// onDoubleClick: () => this.onForeignKey(true),
				keyEvent: props.keyEvent,
				ref: ref => (this.zebulonTable = ref)
				// ,
				// onRowEnter: ({ row }) => {
				// 	this.row = row;
				// 	return true;
				// },
				// isModal: true,
				// status: this.state.status,
				// refresh,
				// ref: ref => (this.zebulonTable = ref)
			};

			this.body = <div>{React.cloneElement(body, conflictProps)}</div>;
		}
	};
	onConfirm = (carryOn_, ok) => {
		let carryOn = carryOn_;
		let message = ok;
		if (this.props.detail.type === "foreignKey") {
			carryOn = carryOn && this.row !== undefined;
			message = this.row;
		} else if (this.props.detail.type === "conflict") {
			message = Object.values(this.zebulonTable.state.updatedRows)
				.filter(row => row.checked_ && row.index_ !== undefined)
				.map(row => row.index_); // a voir
		}

		// const confirm = { button, type };
		// let message;
		// if (type === "foreignKey") {
		// 	// confirm.button = carryOn && this.row ? "ok" : "cancel";
		// this.props.onConfirm(
		// 	carryOn && this.row ? "ok" : "cancel",
		// 	this.props.detail.type
		// );
		// this.props.detail.callback(
		// 	carryOn && this.row ? this.row || false : false
		// );
		// 	message = this.row;
		// }
		this.props.onConfirm();
		if (this.props.detail.callback) {
			this.props.detail.callback(carryOn, message);
		}
	};
	// onForeignKey = carryOn => {
	// 	this.props.onConfirm(
	// 		carryOn && this.row ? "ok" : "cancel",
	// 		this.props.detail.type
	// 	);
	// 	this.props.detail.callback(
	// 		carryOn && this.row ? this.row || false : false
	// 	);
	// };
	render() {
		// Render nothing if the "show" prop is false
		if (!this.props.show) {
			return null;
		}
		return (
			<div className="backdrop zebulon-modal-backdrop">
				<div
					className="modal zebulon-modal-confirmation"
					style={{ display: "flex", top: 100 }}
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
