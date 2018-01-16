// import React, { Component } from "react";
import { ScrollableArea } from "./ScrollableArea";
import { AxisType, toAxis } from "./constants";
import { isEmpty, isNullOrUndefined } from "./utils/generic";
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
  nextIndex = (axis, direction, index, offset) => {
    const { data, meta, dataLength } = this.props;
    let nextIndex = index;
    if (axis === AxisType.COLUMNS) {
      if (direction === 1) {
        nextIndex =
          meta.visibleIndexes[
            Math.min(
              meta.visibleIndexes.length - 1,
              meta.properties[index].visibleIndex_ + offset
            )
          ];
      } else {
        nextIndex =
          meta.visibleIndexes[
            Math.max(0, meta.properties[index].visibleIndex_ - offset)
          ];
      }
    } else if (axis === AxisType.ROWS) {
      nextIndex = Math.max(
        0,
        Math.min((dataLength || data.length) - 1, index + offset * direction)
      );
    }
    return nextIndex;
  };
  nextPageIndex = (axis, direction, index) => {
    // a voir
    const { data, meta, dataLength } = this.props;
    const last =
      axis === AxisType.COLUMNS
        ? meta.visibleIndexes[meta.visibleIndexes.length - 1]
        : (dataLength || data.length) - 1;
    const offset =
      this.stopIndex[toAxis(axis)] - this.state.scroll[toAxis(axis)].startIndex;
    return Math.max(0, Math.min(last, index + offset * direction));
  };
  lastIndex = (axis, direction) => {
    const { data, meta, dataLength } = this.props;
    const last =
      axis === AxisType.COLUMNS
        ? meta.visibleIndexes[meta.visibleIndexes.length - 1]
        : (dataLength || data.length) - 1;
    const first = axis === AxisType.COLUMNS ? meta.visibleIndexes[0] : 0;
    return direction === 1 ? last : first;
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
  navigationKeyHandler = e => {
    if (!((e.which > 32 && e.which < 41) || e.which === 9)) {
      return false;
    }
    let direction, cell, axis;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (
        document.activeElement.tagName === "SELECT" ||
        document.activeElement.tagName === "TEXTAREA"
      ) {
        return false;
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
        return false;
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
    return { cell, axis, direction };
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
    } else if (!isNullOrUndefined(this.selectedRange().end.rows)) {
      let navigationKeyHandler = this.navigationKeyHandler;
      if (this.props.navigationKeyHandler) {
        navigationKeyHandler = e =>
          this.props.navigationKeyHandler(e, {
            nextCell: this.nextCell,
            nextPageCell: this.nextPageCell,
            endCell: this.endCell,
            selectCell: this.selectCell
          });
      }
      const navigation = navigationKeyHandler(e);
      if (navigation) {
        const { cell, axis, direction } = navigation;
        this.scrollOnKey(cell, axis, direction);
        return { ...cell, axis, direction };
      }
    }
  };

  onScroll = (axis, dir, ix, positionRatio) => {
    const scroll = this.state.scroll;
    const { height, width, rowHeight, data, meta, dataLength } = this.props;
    const properties = meta.properties;
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
        const lastColumn = properties[properties.length - 1];
        position =
          (lastColumn.position + (lastColumn.width || 0) * !lastColumn.hidden) *
          positionRatio;
        const column = properties.find(
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
        position = properties[index].position;
      } else {
        let visibleWidth = width - this.scrollbars.vertical.width;
        position = Math.max(
          0,
          properties[index].position + properties[index].width - visibleWidth
        );
        const column = properties.find(
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
        startIndex = Math.round((dataLength || data.length) * positionRatio);
        direction = Math.sign(
          scroll.rows.startIndex +
            (scroll.rows.direction === -1 ? 1 : 0) -
            startIndex
        );
        index =
          direction === 1
            ? startIndex
            : Math.min(
                startIndex + nRows - 1,
                (dataLength || data.length) - nRows
              );
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
      dataLength,
      meta,
      scroll,
      onScroll
    } = this.props;
    const properties = meta.properties;
    let { shift, index, startIndex, position } = scroll[sense];
    let direction =
      sense === "columns" ? -Math.sign(e.deltaX) : -Math.sign(e.deltaY);
    const visibleHeight = height - this.scrollbars.horizontal.width;
    const nRows = Math.ceil(visibleHeight / rowHeight);

    if (sense === "rows") {
      if (nRows > (dataLength || data.length)) {
        direction = 1;
      }
      shift = direction === 1 ? 0 : visibleHeight - nRows * rowHeight;
      if (direction === -1) {
        startIndex = Math.max(
          Math.min(
            scroll.rows.startIndex + (scroll[sense].direction === direction),
            (dataLength || data.length) - nRows
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
      const lastColumn = properties[properties.length - 1];
      position = Math.min(
        Math.max(position + e.deltaX, 0),
        lastColumn.position + lastColumn.width - width
      );
      const column = properties.find(
        column =>
          position >= column.position &&
          column.position + column.width > position
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
