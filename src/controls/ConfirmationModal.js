import React from "react";
export class ConfirmationModal extends React.Component {
	constructor(props) {
		super(props);
		if (props.show) {
			this.init(props);
		}
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
		}
	}
	init = props => {
		const { text, type } = props.detail;
		if (type === "YesNoCancel") {
			this.buttons = [
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={() => this.props.onConfirm("yes", type)}
					tabIndex={0}
					key={0}
					autoFocus={true}
				>
					Yes
				</button>,
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={() => this.props.onConfirm("no", type)}
					tabIndex={1}
					key={1}
				>
					No
				</button>,
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={() => this.props.onConfirm("cancel", type)}
					tabIndex={2}
					key={2}
				>
					Cancel
				</button>
			];
		} else if (type === "YesNo") {
			this.buttons = [
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={() => this.onConfirm("yes", type)}
					tabIndex={0}
					key={0}
					autoFocus={true}
				>
					Yes
				</button>,
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={() => this.onConfirm("no", type)}
					tabIndex={0}
					key={1}
					autoFocus={true}
				>
					No
				</button>
			];
		} else if (type === "foreignKey") {
			this.buttons = [
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={() => this.onForeignKey(true)}
					tabIndex={0}
					key={0}
					autoFocus={true}
				>
					Ok
				</button>,
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={() => this.onForeignKey(false)}
					tabIndex={1}
					key={1}
				>
					Cancel
				</button>
			];
		} else if (type === "Ok") {
			this.buttons = [
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={() => this.onConfirm("ok", type)}
					tabIndex={0}
					key={0}
					autoFocus={true}
				>
					Ok
				</button>
			];
		}

		this.body = <div>{text}</div>;
		if (Array.isArray(text)) {
			this.body = text.map((line, index) => (
				<div key={index}>{line}</div>
			));
		} else if (type === "foreignKey" && props.detail.callback) {
			this.body = (
				<div>
					{React.cloneElement(text, {
						callbackForeignKey: message => {
							props.onConfirm(
								message === false ? "cancel" : "ok"
							);
							props.detail.callback(message);
						},
						ref: ref => {
							this.foreignTable = ref;
						},
						onDoubleClick: () => this.onForeignKey(true),
						keyEvent: props.keyEvent,
						onRowEnter: ({ row }) => {
							this.row = row;
							return true;
						}
					})}
				</div>
			);
		}
	};
	onConfirm = (button, type) => {
		this.props.onConfirm(button, type);
		if (this.props.detail.callback) {
			this.props.detail.callback(button, type);
		}
	};
	onForeignKey = ok => {
		this.props.onConfirm(
			ok && this.row ? "ok" : "cancel",
			this.props.detail.type
		);
		this.props.detail.callback(ok && this.row ? this.row || false : false);
	};
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
					{this.body}
					<div className="footer" style={{ display: "flex" }}>
						{this.buttons}
					</div>
				</div>
			</div>
		);
	}
}
