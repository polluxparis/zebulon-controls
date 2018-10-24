import React, { Component } from "react";

export class EventHandler extends Component {
  componentWillReceiveProps(nextProps) {
    if (this.props.component) {
      this.keyEvent = nextProps.component.props.keyEvent;
      if (this.keyEvent && this.keyEvent !== this.previouskeyEvent) {
        this.previouskeyEvent = this.keyEvent;
        this.handleKeyEvent(this.keyEvent);
      }
    }
  }
  // if the prop keyEvent is not defined, key events are managed localy
  // if the key events are managed directly by calling handleKeyEvent, set the prop to null
  // else pass the event in the prop
  componentDidMount() {
    if (this.props.component) {
      if (this.props.component.props.keyEvent === undefined) {
        document.addEventListener("copy", this.handleKeyEvent);
        document.addEventListener("paste", this.handleKeyEvent);
        document.addEventListener("keydown", this.handleKeyEvent);
      }
      if (this.props.component.props.getComponent) {
        this.props.component.props.getComponent(this.props.component);
      }
    }
  }
  componentWillUnmount() {
    if (
      this.props.component &&
      this.props.component.props.keyEvent === undefined
    ) {
      document.removeEventListener("copy", this.handleKeyEvent);
      document.removeEventListener("paste", this.handleKeyEvent);
      document.removeEventListener("keydown", this.handleKeyEvent);
    }
  }
  shouldComponentUpdate() {
    if (this.updateKey) {
      this.updateKey = false;
      return false;
    }
    return true;
  }
  handleKeyEvent = e => {
    if (
      this.props.component &&
      !e.defaultPrevented &&
      (this.props.component.props.isActive === undefined ||
        this.props.component.props.isActive) &&
      this.props.component.handleKeyEvent
    ) {
      this.props.component.handleKeyEvent(e);
    } else {
      this.updateKey = true;
    }
  };
  onClick = () => {
    if (this.props.component.props.onActivation) {
      this.props.component.props.onActivation(this.props.component);
    }
  };
  render() {
    // pivot grid
    let div = (
      <div id={this.props.id || "event-handler"} onClick={this.onClick}>
        {this.props.children}
      </div>
    );
    return div;
  }
}
