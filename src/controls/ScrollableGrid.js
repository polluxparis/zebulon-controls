// import React, { Component } from "react";
import { ScrollableArea } from "./ScrollableArea";
import { AxisType, toAxis } from "./constants";
import { isEmpty } from "./utils/generic";
export class ScrollableGrid extends ScrollableArea {
  constructor(props) {
    super(props);

    this.state = {
      scroll: {
        rows: { index: 0, direction: 1, startIndex: 0, shift: 0, position: 0 },
        columns: {
          index: 0,
          direction: 1,
          startIndex: 0,
          shift: 0,
          position: 0
        }
      },
      selectedRange: { start: {}, end: {} }
    };
  }
  componentWillReceiveProps(nextProps) {
    if (
      nextProps.height !== this.props.height ||
      nextProps.width !== this.props.width
    ) {
      const ratios = this.getRatios(nextProps);
      if (
        nextProps.width !== this.props.width &&
        this.ratios.horizontal.position >
          1 - Math.min(ratios.horizontal.display, 1)
      ) {
        // console.log("scroll", scroll);
        this.onScroll(
          AxisType.COLUMNS,
          null,
          null,
          1 - Math.min(ratios.horizontal.display, 1)
        );
      }
      if (
        nextProps.height !== this.props.height &&
        this.ratios.vertical.position > 1 - Math.min(ratios.vertical.display, 1)
      ) {
        // console.log("scroll", scroll);
        this.onScroll(
          AxisType.ROWS,
          null,
          null,
          1 - Math.min(ratios.vertical.display, 1)
        );
      }
    }
    if (
      this.props.scroll !== nextProps.scroll &&
      (nextProps.scroll.rows.index !== this.state.scroll.rows.index ||
        nextProps.scroll.rows.direction !== this.state.scroll.rows.direction ||
        nextProps.scroll.columns.index !== this.state.scroll.columns.index ||
        nextProps.scroll.columns.direction !==
          this.state.scroll.columns.direction)
    ) {
      this.setState({ scroll: nextProps.scroll });
    }
  }
  componentWillMount() {}
  // ------------------------------------------------
  // selected range
  // ------------------------------------------------
  selectedRange = () => this.props.selectedRange;
  selectedCell = () => {
    const cell = this.props.selectedRange.end;
    return !isEmpty(cell) ? { ...cell } : { columns: 0, rows: 0 };
  };
  selectCell = (cell, extension) => {
    const range = extension
      ? { ...this.selectedRange(), end: cell }
      : { start: cell, end: cell };
    if (range.start.rows === undefined) {
      range.start = range.end;
    }
    return this.selectRange(range);
  };
  selectRange = range => {
    // this.setState({ selectedRange: range });
    if (this.props.selectRange) {
      return this.props.selectRange(range);
    }
  };

  // ------------------------------------------------
  // to be overwritten
  // ------------------------------------------------
  scrollOnKey = (cell, axis, direction) => {
    const scroll = this.state.scroll;
    if (
      this.scrollbars[axis === AxisType.ROWS ? "vertical" : "horizontal"]
        .width &&
      ((direction === 1 &&
        cell[toAxis(axis)] >= this.stopIndex[toAxis(axis)]) ||
        (direction === -1 &&
          cell[toAxis(axis)] <= scroll[toAxis(axis)].startIndex))
    ) {
      this.onScroll(axis, -direction, cell[toAxis(axis)]);
    }
  };

  lastIndex = (axis, direction) => {
    const last =
      axis === AxisType.COLUMNS
        ? this.props.columnVisibleLength - 1
        : this.props.data.length - 1;
    return direction === 1 ? last : 0;
  };
  nextIndex = (axis, direction, index, offset) => {
    const last =
      axis === AxisType.COLUMNS
        ? this.props.columnVisibleLength - 1
        : this.props.data.length - 1;
    return Math.max(0, Math.min(last, index + offset * direction));
  };
  nextPageIndex = (axis, direction, index) => {
    // a voir
    const last =
      axis === AxisType.COLUMNS
        ? this.props.columnVisibleLength - 1
        : this.props.data.length - 1;
    const offset =
      this.stopIndex[toAxis(axis)] - this.state.scroll[toAxis(axis)].startIndex;
    return Math.max(0, Math.min(last, index + offset * direction));
  };
  // ------------------------------------------------
  nextCell = (axis, direction, offset) => {
    const cell = this.selectedCell();
    cell[toAxis(axis)] = this.nextIndex(
      axis,
      direction,
      cell[toAxis(axis)],
      offset
    );
    return cell;
  };
  nextPageCell = (axis, direction) => {
    const cell = this.selectedCell();
    cell[toAxis(axis)] = this.nextPageIndex(
      axis,
      direction,
      cell[toAxis(axis)]
    );
    return cell;
  };
  endCell = (axis, direction) => {
    const cell = this.selectedCell();
    cell[toAxis(axis)] = this.lastIndex(axis, direction);
    return cell;
  };

  handleNavigationKeys = e => {
    if (e.which === 65 && (e.metaKey || e.ctrlKey)) {
      // ctrl+A
      e.preventDefault();
      if (
        this.selectRange({
          start: {
            columns: this.lastIndex(AxisType.COLUMNS, -1),
            rows: this.lastIndex(AxisType.ROWS, -1)
          },
          end: {
            columns: this.lastIndex(AxisType.COLUMNS, 1),
            rows: this.lastIndex(AxisType.ROWS, 1)
          }
        }) === false
      ) {
        return false;
      }

      // } else if (e.which === 13) {
      //   console.log("enter", e);
    } else if ((e.which > 32 && e.which < 41) || e.which === 9) {
      // arrow keys
      let direction, cell, axis;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (
          document.activeElement.tagName === "SELECT" ||
          document.activeElement.tagName === "TEXTAREA"
        ) {
          return;
        }
        direction = e.key === "ArrowDown" ? 1 : -1;
        axis = AxisType.ROWS;
        cell = this.nextCell(axis, direction, 1);
      } else if (
        e.key === "ArrowRight" ||
        e.key === "ArrowLeft" ||
        e.key === "Tab"
      ) {
        if (
          (document.activeElement.tagName === "INPUT" ||
            document.activeElement.tagName === "TEXTAREA") &&
          e.key !== "Tab"
        ) {
          return;
        }
        direction =
          e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey) ? 1 : -1;
        axis = AxisType.COLUMNS;
        cell = this.nextCell(axis, direction, 1);
      } else if (e.key === "PageUp" || e.key === "PageDown") {
        direction = e.key === "PageDown" ? 1 : -1;
        axis = e.altKey ? AxisType.COLUMNS : AxisType.ROWS;
        cell = this.nextPageCell(axis, direction);
      } else if (e.key === "Home" || e.key === "End") {
        direction = e.key === "End" ? 1 : -1;
        axis = e.altKey ? AxisType.COLUMNS : AxisType.ROWS;
        cell = this.endCell(axis, direction);
      }
      // selection
      e.preventDefault();
      if (this.selectCell(cell, e.shiftKey && e.key !== "Tab") === false) {
        return false;
      }
      this.scrollOnKey(cell, axis, direction);

      return { ...cell, axis, direction };
    }
  };

  onScroll = (axis, dir, ix, positionRatio) => {
    const scroll = this.state.scroll;
    const { height, width, rowHeight, data, meta } = this.props;
    const newScroll = {
      rows: { ...scroll.rows },
      columns: { ...scroll.columns }
    };
    let startIndex = ix,
      index = ix,
      direction = dir,
      shift = 0,
      position;

    // scroll event =>scroll by position
    if (axis === AxisType.COLUMNS) {
      if (ix === null && positionRatio !== null) {
        const lastColumn = meta[meta.length - 1];
        position =
          (lastColumn.position + (lastColumn.width || 0) * !lastColumn.hidden) *
          positionRatio;
        const column = meta.find(
          column =>
            column.width !== 0 &&
            position >= column.position &&
            position <= column.position + (column.width || 0)
        );
        shift = column.position - position;
        direction = 1;
        index = column.index_;
        startIndex = index;
      } else if (direction === 1) {
        startIndex = index;
        position = meta[index].position;
      } else {
        let visibleWidth = width - this.scrollbars.vertical.width;
        position = Math.max(
          0,
          meta[index].position + meta[index].width - visibleWidth
        );
        const column = meta.find(
          column =>
            position >= column.position &&
            position <= column.position + (column.width || 0)
        );
        startIndex = column.index_;

        shift = Math.min(0, column.position - position);
      }
      // console.log("scroll", direction, shift, position);
      newScroll.columns = {
        index,
        direction,
        startIndex,
        shift,
        position
      };
      // console.log(column, newScroll);
      // scroll by row step
    } else if (axis === AxisType.ROWS) {
      const visibleHeight = height - this.scrollbars.horizontal.width;
      const nRows = Math.ceil(visibleHeight / rowHeight);
      // scroll event
      if (ix === null && positionRatio !== null) {
        startIndex = Math.round(data.length * positionRatio);
        direction = Math.sign(
          scroll.rows.startIndex +
            (scroll.rows.direction === -1 ? 1 : 0) -
            startIndex
        );
        index =
          direction === 1
            ? startIndex
            : Math.min(startIndex + nRows - 1, data.length - nRows);
      } else {
        startIndex = direction === 1 ? index : Math.max(0, index - nRows + 1);
      }
      newScroll.rows = {
        index,
        direction,
        startIndex,
        shift: direction === -1 ? visibleHeight - nRows * rowHeight : 0
      };
    }
    if (direction) {
      if (this.props.onScroll) {
        if (this.props.onScroll(newScroll) === false) {
          return false;
        }
      }
      this.setState({ scroll: newScroll });
      return true;
    }
  };

  onScrollEvent = e => {
    if (e.type === "scrollbar") {
      this.onScroll(
        e.direction === "horizontal" ? AxisType.COLUMNS : AxisType.ROWS,
        null,
        null,
        e.positionRatio
      );
    }
  };
  onWheel = e => {
    e.preventDefault();
    const sense = e.altKey || e.deltaX !== 0 ? "columns" : "rows";
    const {
      height,
      rowHeight,
      width,
      data,
      meta,
      scroll,
      onScroll
    } = this.props;
    let { shift, index, startIndex, position } = scroll[sense];
    let direction =
      sense === "columns" ? -Math.sign(e.deltaX) : -Math.sign(e.deltaY);
    const visibleHeight = height - this.scrollbars.horizontal.width;
    const nRows = Math.ceil(visibleHeight / rowHeight);

    if (sense === "rows") {
      if (nRows > data.length) {
        direction = 1;
      }
      shift = direction === 1 ? 0 : visibleHeight - nRows * rowHeight;
      if (direction === -1) {
        startIndex = Math.max(
          Math.min(
            scroll.rows.startIndex + (scroll[sense].direction === direction),
            data.length - nRows
          ),
          0
        );
        index = startIndex + nRows - 1;
      } else {
        index = Math.max(
          scroll.rows.startIndex - (scroll[sense].direction === direction),
          0
        );
        startIndex = index;
      }
    } else {
      direction = 1;
      const lastColumn = meta[meta.length - 1];
      position = Math.min(
        Math.max(position + e.deltaX, 0),
        lastColumn.position + lastColumn.width - width
      );
      const column = meta.find(
        column =>
          position >= column.position &&
          position <= column.position + column.width
      );
      shift = column.position - position;
      index = column.index;
      startIndex = index;
    }
    scroll[sense] = { index, direction, startIndex, shift, position };
    if (onScroll) {
      onScroll(scroll);
    }
  };
  _getContent = () => {
    const content = this.getContent();
    const rows = content.props.children;
    let rowIndex, columnIndex;
    if (Array.isArray(rows) && rows.length) {
      rowIndex = this.state.scroll.rows.startIndex + rows.length - 1;
      const columns = rows[0].props.children;
      if (Array.isArray(columns) && columns.length) {
        columnIndex = this.state.scroll.columns.startIndex + columns.length - 1;
      }
    }
    this.stopIndex = { rows: rowIndex, columns: columnIndex };
    return content;
  };
}
