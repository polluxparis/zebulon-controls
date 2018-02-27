import React, { Component } from "react";

import { ScrollbarSize } from "./constants";
import { Scrollbar } from "./Scrollbar";
// export const ScrollbarSize = 12;
export class ScrollableArea extends Component {
  constructor(props) {
    super(props);
    this.ratios = {
      vertical: { display: 1, position: 0 },
      horizontal: { display: 1, position: 0 }
    };
    this.drag = { vertical: {}, horizontal: {} };
  }
  getRatios = () => this.ratios;
  getScrollbars = (height, width, ratios) => {
    const scrollbars = {};
    if (ratios.vertical.display < 1 && !this.props.noVerticalScrollbar) {
      scrollbars.vertical = { width: ScrollbarSize };
    }
    if (ratios.horizontal.display < 1) {
      scrollbars.horizontal = { width: ScrollbarSize, width2: ScrollbarSize };
    }
    if (scrollbars.vertical && scrollbars.horizontal) {
      scrollbars.horizontal.length = width - ScrollbarSize;
      scrollbars.vertical.length = height - ScrollbarSize;
    } else if (scrollbars.vertical) {
      scrollbars.vertical.length = Math.min(
        height,
        height / ratios.vertical.display
      );
      scrollbars.horizontal = {
        length: Math.min(
          width - ScrollbarSize,
          (width - ScrollbarSize) / ratios.horizontal.display
        ),
        width: 0,
        width2: 0
      };
    } else if (scrollbars.horizontal) {
      scrollbars.horizontal.length = Math.min(
        width,
        width / ratios.horizontal.display
      );
      if (this.props.locked) {
        scrollbars.horizontal.width = 0;
      }
      scrollbars.vertical = {
        length: Math.min(
          height - ScrollbarSize,
          (height - ScrollbarSize) / ratios.vertical.display
        ),
        width: 0
      };
    } else {
      scrollbars.horizontal = {
        length: Math.min(width, width / ratios.horizontal.display),
        width: 0,
        width2: 0
      };
      scrollbars.vertical = {
        length: Math.min(height, height / ratios.vertical.display),
        width: 0
      };
    }

    scrollbars.horizontal.innerSize = Math.max(
      30,
      width * ratios.horizontal.display
    );
    scrollbars.vertical.innerSize = Math.max(
      30,
      height * ratios.vertical.display
    );
    this.scrollbars = scrollbars;
    return scrollbars;
  };
  _getContent = () => this.getContent();
  getContent = () => [];
  onScrollEvent = e => {
    if (e.type === "scrollbar") {
      if (e.initiator === "bar") {
        if (e.direction === "horizontal") {
          this.ratios.horizontal.position = e.positionRatio;
        } else {
          this.ratios.vertical.position = e.positionRatio;
        }
        if (this.props.onScroll) {
          this.props.onScroll(e);
        }
      }
      return true;
    }
    return false;
  };

  collect = e => {
    const { button, shiftKey, target, clientX, clientY } = e;
    const initiator = e.target.id.startsWith("thumb") ? "thumb" : "bar";
    const rect = target.getBoundingClientRect();
    const { left, top } = rect;
    let x = clientX - left,
      y = clientY - top,
      position = Math.max(
        0,
        Math.min(
          (this.props.direction === "horizontal" ? x : y) - this.innerSize / 2,
          this.props.length - this.innerSize
        )
      );
    const event = {
      type: "scrollbar",
      direction: this.props.direction,
      button,
      shiftKey,
      clientX,
      clientY,
      x,
      y,
      positionRatio: position / this.props.length,
      position,
      initiator
    };
    return event;
  };
  _handleDrag = (type, event) => {
    const { length } = this.scrollbars[event.direction];
    const display = this.ratios[event.direction].display;
    const size = Math.max(display * length, 30);
    if (type === "startDrag") {
      this.drag[event.direction] = {
        isDragging: true,
        previousPosition: event.position,
        previousPositionRatio: this.ratios[event.direction].position
      };
      // this.positionRatio = this.props.positionRatio;
    } else if (type === "endDrag") {
      this.drag[event.direction] = { isDragging: false };
    } else if (type === "drag" && this.drag[event.direction].isDragging) {
      const drag = this.drag[event.direction];
      const delta = event.position - drag.previousPosition;
      if (delta) {
        event.positionRatio = Math.min(
          Math.max(drag.previousPositionRatio + delta / length, 0),
          1 - display
        );
        event.sense = Math.sign(-delta);
        // event.position = length * event.positionRatio;
        if (this.onScrollEvent(event)) {
          // console.log(
          //   "drag",
          //   event.position,
          //   event.positionRatio,
          //   this.ratios[event.direction].position
          // );
          drag.previousPosition = event.position;
          drag.previousPositionRatio = event.positionRatio;
        }
      }
    } else if (type === "click") {
      if (event.relativePosition + size / 2 > length) {
        event.positionRatio = 1 - display;
      } else {
        event.positionRatio = Math.max(
          0,
          (event.relativePosition - size / 2) / length
        );
      }
      event.sense = Math.sign(
        this.ratios[event.direction].position - event.positionRatio
      );
      this.onScrollEvent(event);
      // console.log("click area", length, size, event);
    }
  };
  _handleMouseMove = e => {
    if (
      (this.drag.vertical.isDragging || this.drag.horizontal.isDragging) &&
      e.buttons
    ) {
      e.preventDefault();
      const direction = this.drag.vertical.isDragging
        ? "vertical"
        : "horizontal";
      this._handleDrag("drag", {
        type: "scrollbar",
        direction,
        position: direction === "horizontal" ? e.clientX : e.clientY
      });
    }
  };
  _handleMouseUp = e => {
    this.drag.vertical.isDragging = false;
    this.drag.horizontal.isDragging = false;
  };
  render() {
    const { height, width, gridId } = this.props;

    this.ratios = this.getRatios(this.props);
    const scrollbars = this.getScrollbars(height, width, this.ratios);
    const content = this._getContent(height, width);
    const style = {
      position: "relative",
      overflow: "hidden",
      height: scrollbars.vertical.length,
      width: scrollbars.horizontal.length
    };
    // console.log("ratios", this.ratios.horizontal);
    return (
      <div
        id={`grid ${gridId}`}
        // style={this.props.style || {}}
        onMouseMove={this._handleMouseMove}
        onMouseUp={this._handleMouseUp}
        // onKeyDown={e => this.console.log("KEYDOWN", e1)}
      >
        <div
          id="scrollable-area"
          style={{
            width,
            ...(this.props.style || {}),
            display: "flex",
            overflow: "hidden"
            // width
          }}
        >
          <div id="scrollable-area-content" style={style}>
            {content}
          </div>
          <Scrollbar
            direction="vertical"
            width={scrollbars.vertical.width}
            length={scrollbars.vertical.length}
            positionRatio={this.ratios.vertical.position}
            displayRatio={this.ratios.vertical.display}
            id={`vertical-scrollbar ${gridId}`}
            onScroll={this.onScrollEvent}
            _handleDrag={this._handleDrag}
          />
        </div>
        <Scrollbar
          direction="horizontal"
          width={scrollbars.horizontal.width}
          length={scrollbars.horizontal.length}
          positionRatio={this.ratios.horizontal.position}
          displayRatio={this.ratios.horizontal.display}
          id={`horizontal-scrollbar ${gridId}`}
          onScroll={this.onScrollEvent}
          _handleDrag={this._handleDrag}
        />
      </div>
    );
  }
}
