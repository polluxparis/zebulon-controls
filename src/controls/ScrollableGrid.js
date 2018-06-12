import React, { cloneElement } from "react";
import { ScrollableArea } from "./ScrollableArea";
import { AxisType, toAxis, ScrollbarSize } from "./constants";
import { isEmpty, isNullOrUndefined, keyMap } from "./utils/generic";
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
      selectedRange: props.selectedRange || {
        start: { rows: 0, columns: 0 },
        end: { rows: 0, columns: 0 }
      },
      meta: props.meta
    };
    if (!props.meta) {
      this.state.meta = {
        visibleIndexes: [0],
        properties: [{ width: props.rowWidth, position: 0, visibleIndex_: 0 }]
      };
    }
    this.getRowWidth(props.meta, props.locked);
    this.stopIndex = { rows: -1, columns: -1 };
  }
  getRowWidth = (meta, locked) => {
    this.rowWidth = this.props.width;
    this.lockedWidth = 0;
    if (meta) {
      if (locked) {
        this.rowWidth = meta.lockedWidth;
        this.lockedWidth = 0;
      } else {
        this.lockedWidth = meta.lockedWidth || 0;
        const lastColumn = meta.properties[meta.properties.length - 1];
        this.rowWidth =
          lastColumn.position + lastColumn.computedWidth - this.lockedWidth;
      }
    }
  };
  componentWillReceiveProps(nextProps) {
    if (this.props.meta !== nextProps.meta) {
      this.setState({ meta: nextProps.meta });
      this.getRowWidth(nextProps.meta, nextProps.locked);
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
    } else if (
      nextProps.height !== this.props.height ||
      nextProps.width !== this.props.width
    ) {
      const ratios = this.getRatios(nextProps);
      if (
        ratios &&
        nextProps.width !== this.props.width &&
        this.ratios &&
        this.ratios.horizontal.position >
          1 - Math.min(ratios.horizontal.display, 1)
      ) {
        this.onScroll(
          AxisType.COLUMNS,
          null,
          null,
          null,
          null,
          1 - Math.min(ratios.horizontal.display, 1)
        );
      }
      if (
        ratios &&
        nextProps.height !== this.props.height &&
        this.ratios &&
        this.ratios.vertical.position > 1 - Math.min(ratios.vertical.display, 1)
      ) {
        this.onScroll(
          AxisType.ROWS,
          null,
          null,
          null,
          null,
          1 - Math.min(ratios.vertical.display, 1)
        );
      }
    }
    if (this.props.selectedRange !== nextProps.selectedRange) {
      this.setState({ selectedRange: nextProps.selectedRange });
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
  componentDidMount() {
    if (!this.state.selectedRange) {
      this.selectedRange({
        start: { rows: 0, columns: 0 },
        end: { rows: 0, columns: 0 }
      });
    }
  }
  // ------------------------------------------------
  // selected range
  // ------------------------------------------------
  selectedRange = () => this.state.selectedRange;
  selectedCell = () => {
    const cell = this.state.selectedRange.end;
    return !isEmpty(cell) ? { ...cell } : { columns: 0, rows: 0 };
  };
  selectCell = (cell, extension, fromKey) => {
    const range = extension
      ? { ...this.selectedRange(), end: cell }
      : { start: cell, end: cell };
    if (range.start.rows === undefined) {
      range.start = range.end;
    }
    const scrollOnClick =
      !fromKey &&
      this.props.locked &&
      (cell.rows === this.state.scroll.rows.startIndex ||
        cell.rows === this.stopIndex.rows);
    return this.selectRange(range, scrollOnClick);
  };
  selectRange = (range, scrollOnClick) => {
    if (this.props.selectRange) {
      this.props.selectRange(
        range,
        ok => {
          if (ok) {
            this.setState({ selectedRange: range });
          }
        },
        undefined,
        undefined,
        undefined,
        scrollOnClick
      );
    } else {
      this.setState({ selectedRange: range });
    }
  };

  // ------------------------------------------------
  // to be overwritten
  // ------------------------------------------------
  scrollOnKey = (
    cell,
    axis,
    direction,
    directionColumn,
    extension,
    dataLength = this.stopIndex[toAxis(AxisType.ROWS)] + 1
  ) => {
    const scroll = this.state.scroll;
    // console.log("scrollonkey", this.props.scroll, this.stopIndex);
    const axisRow =
      (axis === AxisType.ROWS || axis === null) &&
      this.scrollbars &&
      this.scrollbars["vertical"].width &&
      ((direction === 1 &&
        cell[toAxis(AxisType.ROWS)] >=
          Math.min(dataLength - 1, this.stopIndex[toAxis(AxisType.ROWS)])) ||
        (direction === -1 &&
          cell[toAxis(AxisType.ROWS)] <=
            scroll[toAxis(AxisType.ROWS)].startIndex));
    const directionC = axis === null ? directionColumn : direction;
    const axisColumn =
      (axis === AxisType.COLUMNS || axis === null) &&
      this.scrollbars &&
      this.scrollbars["horizontal"] &&
      this.scrollbars["horizontal"].width &&
      ((directionC === 1 &&
        cell[toAxis(AxisType.COLUMNS)] >=
          this.stopIndex[toAxis(AxisType.COLUMNS)]) ||
        (directionC === -1 &&
          cell[toAxis(AxisType.COLUMNS)] <=
            scroll[toAxis(AxisType.COLUMNS)].startIndex));
    let axis_;
    if (axis === null && axisRow && axisColumn) {
      axis_ = null;
    } else if ((axis === AxisType.ROWS || axis === null) && axisRow) {
      axis_ = AxisType.ROWS;
    } else if ((axis === AxisType.COLUMNS || axis === null) && axisColumn) {
      axis_ = AxisType.COLUMNS;
    }
    if (axis_ !== undefined) {
      this.onScroll(
        axis_,
        -(axis === null && axis_ === AxisType.COLUMNS ? directionC : direction),
        -directionColumn,
        cell,
        extension
      );
    }
    this.selectCell(cell, extension, true);
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
            Math.max(
              meta.visibleIndexes[0],
              meta.properties[index].visibleIndex_ - offset
            )
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
    const first = axis === AxisType.COLUMNS ? meta.visibleIndexes[0] : 0;
    const offset =
      this.stopIndex[toAxis(axis)] - this.state.scroll[toAxis(axis)].startIndex;
    return Math.max(first, Math.min(last, index + offset * direction));
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
  // const keyMap = {
  //   9: "tab",
  //   13: "enter",
  //   27: "escape",
  //   33: "pageUp",
  //   34: "pageDown",
  //   35: "end",
  //   36: "home",
  //   37: "leftArrow",
  //   38: "upArrow",
  //   39: "rightArrow",
  //   40: "downArrow",
  //   107: "+",
  //   109: "-",
  //   187: "=",
  //   65: "a",
  //   112: "f1"
  //   48:"0",
  //   96:"numpad0"
  // };
  navigationKeyHandler = e => {
    const keyCode = e.which || e.keyCode;
    const key = keyMap[keyCode];
    if (!((keyCode > 32 && keyCode < 41) || keyCode === 9)) {
      return false;
    }
    const element = document.activeElement;
    const tagName = element.tagName;
    // keep default behaviour for editable inputs except when alt key is pressed
    if (
      key !== "Tab" &&
      !e.altKey &&
      (tagName === "TEXTAREA" ||
        (tagName === "SELECT" && ["ArrowDown", "ArrowUp"].includes(key)) ||
        (tagName === "INPUT" && ["ArrowLeft", "ArrowRight"].includes(key)))
    ) {
      return false;
    }
    let direction, cell, axis;
    if (key === "ArrowDown" || key === "ArrowUp") {
      direction = key === "ArrowDown" ? 1 : -1;
      axis = AxisType.ROWS;
      cell = this.nextCell(axis, direction, 1);
    } else if (key === "ArrowRight" || key === "ArrowLeft" || key === "Tab") {
      direction =
        key === "ArrowRight" || (key === "Tab" && !e.shiftKey) ? 1 : -1;
      axis = AxisType.COLUMNS;
      cell = this.nextCell(axis, direction, 1);
    } else if (key === "PageUp" || key === "PageDown") {
      direction = key === "PageDown" ? 1 : -1;
      axis = e.altKey ? AxisType.COLUMNS : AxisType.ROWS;
      cell = this.nextPageCell(axis, direction);
    } else if (key === "Home" || key === "End") {
      direction = key === "End" ? 1 : -1;
      axis = e.altKey ? AxisType.COLUMNS : AxisType.ROWS;
      cell = this.endCell(axis, direction);
    }
    // selection
    e.preventDefault();
    return { cell, axis, direction, extension: e.shiftKey && key !== "Tab" };
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
        const { cell, axis, direction, extension } = navigation;
        this.scrollOnKey(cell, axis, direction, undefined, extension);
        return { ...cell, axis, direction };
      }
    }
  };

  onScroll = (axis, dir, dirC, cell, extension, positionRatio) => {
    const scroll = { ...this.state.scroll };
    // console.log("scrollable", scroll, cell);
    const { height, width, rowHeight, data, dataLength } = this.props;
    const meta = this.state.meta;
    const properties = meta.properties;
    const newScroll = {
      rows: { ...scroll.rows },
      columns: { ...scroll.columns }
    };
    let ix = cell ? cell[toAxis(AxisType.COLUMNS)] : null;
    let startIndex = ix,
      index = ix,
      direction = axis === null ? dirC : dir,
      shift = 0,
      position,
      changed = false;

    // scroll event =>scroll by position
    if (axis === AxisType.COLUMNS || axis === null) {
      if (ix === null && positionRatio !== null) {
        // const lastColumn = properties[properties.length - 1];
        position = this.rowWidth * positionRatio;
        const column = properties.find(column => {
          const pos = column.position - this.lockedWidth;
          return (
            column.computedWidth !== 0 &&
            position >= pos &&
            position < pos + column.computedWidth - 0.0001
          );
        });
        shift = column.position - position - this.lockedWidth;
        direction = 1;
        index = column.index_;
        startIndex = index;
      } else if (direction === 1) {
        startIndex = index;
        position = properties[index].position - this.lockedWidth;
      } else {
        let visibleWidth = width - this.scrollbars.vertical.width;
        position = Math.max(
          0,
          properties[index].position -
            this.lockedWidth +
            properties[index].computedWidth -
            visibleWidth
        );
        const column = properties.find(column => {
          const pos = column.position - this.lockedWidth;
          return (
            column.computedWidth !== 0 &&
            position >= pos &&
            position < pos + column.computedWidth
          );
        });
        startIndex = column.index_;
        shift = Math.min(0, column.position - position - this.lockedWidth);
      }
      // console.log("scroll", direction, shift, position);
      changed = direction || changed;
      newScroll.columns = {
        index,
        direction,
        startIndex,
        shift,
        position
      };
      // console.log(column, newScroll);
      // scroll by row step
    }
    if (axis === AxisType.ROWS || axis === null) {
      ix = cell ? cell[toAxis(AxisType.ROWS)] : null;
      startIndex = ix;
      index = ix;
      direction = dir;
      shift = 0;
      const visibleHeight = height - this.scrollbars.horizontal.width2;
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
        if (direction === 1) {
          startIndex = index;
        } else if (index - nRows + 1 <= 0) {
          startIndex = 0;
          direction = 1;
        } else {
          startIndex = index - nRows + 1;
        }
      }
      changed = direction || changed;
      newScroll.rows = {
        index,
        direction,
        startIndex,
        shift: direction === -1 ? visibleHeight - nRows * rowHeight : 0
      };
    }
    if (changed) {
      this.setState({ scroll: newScroll });
      if (this.props.onScroll) {
        if (this.props.onScroll(newScroll, cell, extension) === false) {
          return false;
        }
      }
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
        null,
        e.positionRatio
      );
    }
  };
  onWheel = e => {
    e.preventDefault();
    e.stopPropagation();
    const sense = e.altKey || e.deltaX !== 0 ? "columns" : "rows";
    const delta = e.deltaX === 0 ? e.deltaY : e.deltaX;
    const { height, rowHeight, width, data, dataLength, onScroll } = this.props;
    const scroll = { ...this.state.scroll };
    const meta = this.state.meta;
    const properties = meta.properties;
    let { shift, index, startIndex, position } = scroll[sense];
    let direction = -Math.sign(delta);
    const visibleHeight = height - this.scrollbars.horizontal.width2;
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
      position = Math.min(Math.max(position + delta, 0), this.rowWidth - width);
      const column = properties.find(column => {
        const pos = column.position - this.lockedWidth;
        return (
          column.computedWidth !== 0 &&
          position >= pos &&
          position < pos + column.computedWidth
        );
      });
      shift = column.position - position - this.lockedWidth;
      index = column.index_;
      startIndex = index;
    }
    scroll[sense] = { index, direction, startIndex, shift, position };
    // console.log("wheel", scroll);
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
          columnIndex = (columns[columns.length - 1].props.column || {
            index_: columns.length - 1
          }).index_;
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
    //  a voir pagination manager: data->rows?
    const { height, width, rowHeight, data, meta, locked, dataLength } = props;
    const scroll = this.state.scroll;
    if (data.length === 0) {
      return false;
    }
    this.getRowWidth(meta, locked);
    const horizontalDisplay =
      (width -
        ((data.length || 1) * rowHeight > height
          ? ScrollbarSize * !props.noVerticalScrollbar
          : 0)) /
      this.rowWidth;
    const verticalDisplay =
      (height - (this.rowWidth > width ? ScrollbarSize : 0)) /
      ((dataLength || data.length || 1) * rowHeight);
    return {
      vertical: {
        display: verticalDisplay,
        position: Math.min(
          (scroll.rows.startIndex +
            (scroll.rows.direction === -1 && scroll.rows.shift ? 1 : 0)) /
            (data.length || 1),
          1 - verticalDisplay
        )
      },
      horizontal: {
        display: horizontalDisplay,
        position: Math.max(
          Math.min(
            scroll.columns.position / this.rowWidth,
            1 - horizontalDisplay
          ),
          0
        )
      }
    };
  };
  getContent = () => {
    const { data, height, rowHeight } = this.props;
    let i = 0,
      index = this.state.scroll.rows.startIndex;
    const items = [];
    // const visibleWidth = width - this.scrollbars.vertical.width;
    while (index < data.length && i < height / rowHeight) {
      const selected = index === this.state.selectedRange.end.rows;
      const ix = index;
      const onClick = e => {
        e.preventDefault();
        this.selectCell({ rows: ix, columns: 0 }, e.shiftKey);
      };
      // const onMouseOver = e => {
      //   e.preventDefault();
      //   if ((e.buttons & 1) === 1) {
      //     this.selectCell({ rows: ix, columns: 0 }, true);
      //   }
      // };
      const className =
        "zebulon-table-cell" + (selected ? " zebulon-table-cell-selected" : "");
      items.push(
        cloneElement(data[index], {
          className,
          index: ix,
          selected,
          onClick
          // onMouseOver
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
      >
        {items}
      </div>
    );
  };
}
