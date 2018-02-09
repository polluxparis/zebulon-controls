import React, { cloneElement } from "react";

import { ScrollableArea } from "./ScrollableArea";
import { AxisType, toAxis, ScrollbarSize } from "./constants";
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
      selectedRange: props.selectedRange || { start: {}, end: {} },
      meta: props.meta
    };
    if (!props.meta) {
      this.state.meta = {
        visibleIndexes: [0],
        properties: [{ width: props.rowWidth, position: 0, visibleIndex_: 0 }]
      };
    }
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
          null,
          1 - Math.min(ratios.vertical.display, 1)
        );
      }
    }
    if (
      this.props.scroll !== nextProps.scroll &&
      (nextProps.scroll.rows.index !== this.props.scroll.rows.index ||
        nextProps.scroll.rows.direction !== this.props.scroll.rows.direction ||
        nextProps.scroll.columns.index !== this.props.scroll.columns.index ||
        nextProps.scroll.columns.direction !==
          this.props.scroll.columns.direction)
    ) {
      this.setState({ scroll: nextProps.scroll });
    }
    if (this.props.selectedRange !== nextProps.selectedRange) {
      this.setState({ selectedRange: nextProps.selectedRange });
    }
    if (this.props.meta !== nextProps.meta) {
      this.setState({ meta: nextProps.meta });
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.keyEvent !== nextProps.keyEvent) {
      if (nextProps.isActive === undefined || nextProps.isActive) {
        this.handleNavigationKeys(nextProps.keyEvent);
      }
      return false;
    }
    return true;
  }
  componentWillMount() {}
  // ------------------------------------------------
  // selected range
  // ------------------------------------------------
  selectedRange = () => this.state.selectedRange;
  selectedCell = () => {
    const cell = this.state.selectedRange.end;
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
      if (!this.props.selectRange(range)) {
        return false;
      }
    }
    this.setState({ selectedRange: range });
  };

  // ------------------------------------------------
  // to be overwritten
  // ------------------------------------------------
  scrollOnKey = (cell, axis, direction, extension) => {
    const scroll = this.state.scroll;
    // console.log("scrollonkey", this.props.scroll, this.stopIndex);
    if (
      this.scrollbars[axis === AxisType.ROWS ? "vertical" : "horizontal"]
        .width &&
      ((direction === 1 &&
        cell[toAxis(axis)] >= this.stopIndex[toAxis(axis)]) ||
        (direction === -1 &&
          cell[toAxis(axis)] <= scroll[toAxis(axis)].startIndex))
    ) {
      this.onScroll(axis, -direction, cell, extension);
    }
    // else {
    this.selectCell(cell, extension);
    // }
  };
  nextIndex = (axis, direction, index, offset) => {
    const { data, dataLength } = this.props;
    const meta = this.state.meta;
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
    const { data, dataLength } = this.props;
    const meta = this.state.meta;
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
        e.key !== "Tab" &&
        !e.altKey
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
    // if (this.selectCell(cell, e.shiftKey && e.key !== "Tab") === false) {
    //   return false;
    // }
    return { cell, axis, direction, extension: e.shiftKey && e.key !== "Tab" };
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
      // console.log("scrollonkey-2", this.props.scroll);
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
        const { cell, axis, direction, extension } = navigation;
        // console.log("scrollonkey-1", this.props.scroll, cell);
        this.scrollOnKey(cell, axis, direction, extension);
        return { ...cell, axis, direction };
      }
    }
  };

  onScroll = (axis, dir, cell, extension, positionRatio) => {
    const ix = cell ? cell[toAxis(axis)] : null;
    const scroll = { ...this.state.scroll };
    // console.log("scrollable", scroll, cell);
    const { height, width, rowHeight, data, dataLength } = this.props;
    const meta = this.state.meta;
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
            column.computedWidth !== 0 &&
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
            position <= column.position + (column.computedWidth || 0)
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
        direction = isNullOrUndefined(dir)
          ? Math.sign(
              scroll.rows.startIndex +
                (scroll.rows.direction === -1 ? 1 : 0) -
                startIndex
            )
          : dir;
        if (direction === 1) {
          index = startIndex;
        } else {
          index = startIndex + nRows - 1;
          if (index >= (dataLength || data.length)) {
            startIndex = Math.max(
              0,
              startIndex - index + (dataLength || data.length) - 1
            );
            index = (dataLength || data.length) - 1;
          }
        }
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
      this.setState({ scroll: newScroll });
      // console.log("scrollable1", scroll, newScroll, cell);
      if (this.props.onScroll) {
        if (this.props.onScroll(newScroll, cell, extension) === false) {
          return false;
        }
      }
      // console.log("scrollable2", this.props.scroll, newScroll, cell);

      return true;
    }
  };

  onScrollEvent = e => {
    if (e.type === "scrollbar") {
      this.onScroll(
        e.direction === "horizontal" ? AxisType.COLUMNS : AxisType.ROWS,
        e.sense,
        null,
        null,
        e.positionRatio
      );
    }
  };
  onWheel = e => {
    e.preventDefault();
    const sense = e.altKey || e.deltaX !== 0 ? "columns" : "rows";
    const { height, rowHeight, width, data, dataLength, onScroll } = this.props;
    const scroll = { ...this.state.scroll };
    const meta = this.state.meta;
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
          column.position + column.computedWidth > position
      );
      shift =
        column.position -
        (meta.lockedWidth || 0) * !this.props.noVerticalScrollbar -
        position;
      index = column.index;
      startIndex = index;
    }
    scroll[sense] = { index, direction, startIndex, shift, position };
    this.setState({ scroll });
    if (onScroll) {
      onScroll(scroll);
    }
  };
  _getContent = () => {
    const content = this.getContent();
    const rows = content.props.children;
    let rowIndex = 0,
      columnIndex = 0;
    if (Array.isArray(rows) && rows.length) {
      rowIndex = this.state.scroll.rows.startIndex + rows.length - 1;
      if (rows[0]) {
        const columns = rows[0].props.children;
        if (Array.isArray(columns) && columns.length) {
          // columnIndex = this.state.scroll.columns.startIndex;
          // if (
          //   this.props.meta &&
          //   !isNullOrUndefined(this.props.meta.lockedIndex)
          // ) {
          //   columnIndex = Math.max(
          //     columnIndex,
          //     this.props.meta.lockedIndex + 1
          //   );
          // }
          // columnIndex += columns.length - 1;
          columnIndex = columns[columns.length - 1].props.column.index_;
        }
      }
    }
    this.stopIndex = { rows: rowIndex, columns: columnIndex };
    return content;
  };

  // -----------------------------------------------
  // default-> list of items
  // -------------------------------------------------
  getRatios = props => {
    const { height, width, rowHeight, rowWidth, data } = props;
    const scroll = this.state.scroll;
    // const meta = props.meta.properties;
    // const lastColumn = meta[meta.length - 1];
    // const columnsWidth = lastColumn.position + lastColumn.computedWidth;
    const horizontalDisplay =
      (width - (data.length * rowHeight > height ? ScrollbarSize : 0)) /
      rowWidth;
    const verticalDisplay =
      (height - (rowWidth > width ? ScrollbarSize : 0)) /
      (data.length * rowHeight);
    // const horizontalDisplay = width / rowWidth;
    // const verticalDisplay = height / (data.length * rowHeight);
    return {
      vertical: {
        display: verticalDisplay,
        position: Math.min(
          scroll.rows.startIndex / data.length,
          1 - verticalDisplay
        )
      },
      horizontal: {
        display: horizontalDisplay,
        position: Math.min(
          scroll.columns.position / rowWidth,
          1 - horizontalDisplay
        )
      }
    };
  };

  getContent = () => {
    const { data, height, rowHeight, width, rowWidth } = this.props;
    let i = 0,
      index = this.state.scroll.rows.startIndex;
    const items = [];
    const visibleWidth = width - this.scrollbars.vertical.width;
    while (index < data.length && i < height / rowHeight) {
      const selected = index === this.state.selectedRange.end.rows;
      const ix = index;
      const onClick = e => {
        e.preventDefault();
        this.selectCell({ rows: ix, columns: 0 }, e.shiftKey);
      };
      const onMouseOver = e => {
        e.preventDefault();
        if (e.buttons === 1) {
          this.selectCell({ rows: ix, columns: 0 }, true);
        }
      };
      const className =
        "zebulon-table-cell" + (selected ? " zebulon-table-cell-selected" : "");
      items.push(
        cloneElement(data[index], {
          className,
          index: ix,
          selected,
          onClick,
          onMouseOver
        })
      );
      index++;
      i++;
    }

    return (
      <div
        style={{
          position: "absolute",
          top: this.state.scroll.rows.shift,
          width: "inherit",
          height: "inherit"
        }}
        onWheel={this.onWheel}
        // assuming that id = row index
        // onClick={e => {
        // this.selectCell({ rows: e.target.id, columns: 0 });
        // console.log("onclick", e.target.id);
        // }}
      >
        {items}
      </div>
    );
  };
}
