import React, { Component } from "react";
import classNames from "classnames";

const buildItems = (items, style, level, handleMenuEvent) => {
	return (
		<div
			key={`group-${level}`}
			className="zebulon-contextmenu-group"
			style={style}
		>
			{items.map((item, index) => {
				item.level = level;
				if (item.type === "jsx") {
					return item.content;
				} else {
					return (
						<MenuItem
							key={`item-${item.id}`}
							item={item}
							handleMenuEvent={handleMenuEvent}
						/>
					);
				}
			})}
		</div>
	);
};
const buildMenu = (menu, top, left, handleEvent) => {
	if (menu && menu.visible) {
		let opened = 0,
			level = 0,
			groupTop = 0;
		let item = menu,
			groups = [];
		let style = {
			position: "absolute",
			top: top,
			left,
			display: "flex"
		};
		while (opened >= 0) {
			groupTop += opened * 24;
			const group = buildItems(
				item.children,
				{
					position: "relative",
					top: groupTop // a voir 24 pour prendre en co;pte le padding 2
				},
				level,
				handleEvent
			);
			groups.push(group);
			level++;
			opened = item.children.findIndex(child => child.opened);
			if (opened !== -1) {
				item = item.children[opened];
			}
		}
		return (
			<div id="contextual-menu" style={style}>
				{groups}
			</div>
		);
	} else {
		return (
			<div
				id="contextual-menu"
				style={{ height: 0, width: 0, position: "relative" }}
			/>
		);
	}
};
export class MenuItem extends Component {
	handleMenuEvent = e => {
		// console.log(this.props, e);
		e.preventDefault();
		this.props.handleMenuEvent(e, this.props.item);
	};

	render() {
		const item = this.props.item;
		const className = classNames({
			"zebulon-contextmenu-item": true,
			"zebulon-contextmenu-item-separation": item.separation,
			"zebulon-contextmenu-item-disable": item.disable,
			"zebulon-contextmenu-item-selected": item.opened || item.selected,
			"zebulon-contextmenu-item-checked": item.checked,
			"zebulon-contextmenu-sub-menu ": item.type === "sub-menu"
		});
		const check = item.checked ? (
			<div style={{ marginRight: ".3em" }}>√</div>
		) : null;
		const arrow =
			item.type === "sub-menu" ? (
				<div
					style={{
						marginLeft: ".3em",
						textAlign: "right"
					}}
				>
					›
				</div>
			) : null;
		return (
			<div
				className={className}
				onClick={this.handleMenuEvent}
				onMouseOver={this.handleMenuEvent}
			>
				<div
					style={{
						textAlign: "left",
						marginRight: ".5em",
						display: "flex"
					}}
				>
					{check}
					{item.caption}
				</div>
				<div style={{ textAlign: "right", display: "flex" }}>
					{item.accelerator}
					{arrow}
				</div>
			</div>
		);
	}
}
const MENU_EVENT = "MENU_EVENT";
export class ContextualMenu extends Component {
	constructor(props) {
		super(props);
		this.state = {
			menu: null,
			componentId: props.componentId,
			position: { x: 0, y: 0 }
		};
		this.openedLevel = {};
		this.hoveredItem = {};
	}
	componentDidMount() {
		window.addEventListener("MENU_EVENT", this.handleEvent);
		this.div = document.getElementById(this.state.componentId);
	}
	componentWillUnmount() {
		window.removeEventListener("MENU_EVENT", this.handleEvent);
	}
	close = () => {
		this.setState({ menu: null });
	};
	handleEvent = e => {
		const { position, menuId, data, componentId } = e.detail;
		if (componentId === this.state.componentId) {
			const rect = this.div.getBoundingClientRect();
			position.y -= rect.top;
			position.x -= rect.left;
			const menu = this.props.getMenu(menuId, data);
			if (menu) {
				menu.visible = true;
				this.setState({ menu, data, position });
			}
		}
	};
	handleMenuEvent = (e, item, data) => {
		if (e.type === "click" && !item.disable) {
			if (
				item.type === "sub-menu" &&
				item.children &&
				item.children.length
			) {
				item.opened = !item.opened;
				this.navigation = false;
				if (item.opened) {
					if (
						this.openedLevel[item.level] &&
						this.openedLevel[item.level].id !== item.id
					) {
						this.openedLevel[item.level].opened = false;
					}
					this.openedLevel[item.level] = item;
					if (item.children[0].type === "jsx") {
						this.navigation = item.children[0].navigation;
					}
				} else {
					this.openedLevel[item.level] = undefined;
				}
				this.setState({ menu: this.state.menu });
			} else if (item.onClick) {
				const menuItem = item.onClick(this.state.data, item);
				if (
					item.type === "sub-menu" &&
					menuItem &&
					menuItem["$$typeof"].toString() === "Symbol(react.element)"
				) {
					const newItem = {
						type: "jsx",
						level: item.level + 1,
						content: menuItem,
						navigation: true
					};
					item.children.push(newItem);
					this.openedLevel[item.level] = newItem;
					item.opened = true;
					this.setState({ menu: this.state.menu });
				} else {
					this.close();
				}
			}

			// console.log("internal menu event", e.target, item);
		} else if (
			e.type === "mouseover" &&
			this.hoveredItem.id !== item.id &&
			!item.disable
		) {
			this.hoveredItem.selected = false;
			this.hoveredItem = item;
			item.selected = true;
			this.setState({ menu: this.state.menu });
		}
	};
	handleKeyDown = (e, item) => {
		// console.log("keydown menu event", e.key, this.navigation);
		if (this.state.menu.visible) {
			// escape
			if (e.which === 27) {
				e.preventDefault();
				this.close();
				return true;
			}
			if (this.navigation && e.key === "Tab") {
				return true;
			}
		}
	};
	render() {
		if (this.state.menu) {
			return buildMenu(
				this.state.menu,
				this.state.position.y,
				this.state.position.x,
				this.handleMenuEvent
			);
		}
		return null;
	}
}

export class ContextualMenuClient extends Component {
	onContextMenu = e => {
		if (e.button === 2) {
			e.preventDefault();
			e.persist();
			// e.stopPropagation();
			const event = new CustomEvent(MENU_EVENT, {
				detail: {
					componentId: this.props.componentId,
					ref: this.ref,
					position: { x: e.clientX, y: e.clientY },
					menuId: this.props.menuId,
					data: this.props.collect
						? this.props.collect(this.props)
						: this.props
				}
			});
			window.dispatchEvent(event);
			return true;
		}
	};
	render() {
		return (
			<div
				onContextMenu={this.onContextMenu}
				ref={ref => (this.ref = ref)}
				style={{ width: "inherit" }}
			>
				{this.props.children}
			</div>
		);
	}
}
