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
					onClick={() => this.props.onConfirm("yes")}
					tabIndex={0}
					key={0}
					autoFocus={true}
				>
					Yes
				</button>,
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={() => this.props.onConfirm("no")}
					tabIndex={1}
					key={1}
				>
					No
				</button>,
				<button
					style={{ minWidth: 70, margin: 5 }}
					onClick={() => this.props.onConfirm("cancel")}
					tabIndex={2}
					key={2}
				>
					Cancel
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
					onClick={() => this.props.onConfirm("ok")}
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
	onForeignKey = ok => {
		this.props.detail.callback(ok && this.row ? this.row || false : false);
		// console.log("foreignKey", this.foreignTable.table.row);
		this.props.onConfirm(ok && this.row ? "ok" : "cancel");
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
