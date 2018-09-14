import React, { Component } from "react";
import { ScrollableGrid } from "./ScrollableGrid";
import { ScrollbarSize } from "./constants";
class FilterValues extends ScrollableGrid {
  componentDidUpdate() {
    if (this.focusedIndex !== undefined) {
      const element = document.getElementById(`checkbox ${this.focusedIndex}`);
      if (element) {
        element.focus();
      }
      this.focusedIndex = undefined;
    }
  }
  onClick = (id, index) => {
    this.selectCell({ rows: index, columns: 0 });
    this.props.onChangeCheck(id, index);
  };
  selectRange = range => {
    this.focusedIndex = range.end.rows;
    this.setState({ selectedRange: range });
  };
  getRowWidth = () => {
    this.rowWidth = this.props.width - ScrollbarSize;
    this.lockedWidth = 0;
  };
  getContent = () => {
    const items = [];
    let i = 0,
      index = this.state.scroll.rows.startIndex;
    const { filter, rowCount, height, rowHeight } = this.props;
    while (index < rowCount && i < height / rowHeight) {
      const { id, label } = this.props.data[index];
      const style = { height: rowHeight, width: "inherit", display: "block" };
      if (index === this.state.selectedRange.end.rows) {
        style.backgroundColor = "aliceblue";
      }
      const ix = index;
      items.push(
        <div key={index} style={style}>
          <input
            id={`checkbox ${index}`}
            type="checkbox"
            checked={filter[id] !== undefined}
            onChange={() => this.onClick(id, ix)}
          />
          <label htmlFor={`checkbox ${index}`}>{label}</label>
        </div>
      );
      index++;
      i++;
    }
    return (
      <div id="content" style={{}} onWheel={this.onWheel}>
        {items}
      </div>
    );
  };
}

export class Filter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [...props.items],
      filter: { ...props.filter },
      rowCount: props.items.length,
      checkAll: false,
      maxRows: props.maxRows || 10,
      rowHeight: props.rowHeight || 20
    };
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.keyEvent !== nextProps.keyEvent && this.values) {
      this.values.handleNavigationKeys(nextProps.keyEvent);
    } else if (
      nextProps.items !== this.props.items ||
      nextProps.filter !== this.props.filter
    ) {
      this.setState({
        items: [...nextProps.items],
        filter: { ...nextProps.filter },
        rowCount: nextProps.items.length
      });
    }
  }
  shouldComponentUpdate(nextProps, nextState) {
    return this.props.keyEvent === nextProps.keyEvent;
  }
  filterItems = value => {
    const v = value.toLowerCase();
    const items = this.props.items.filter(item => {
      return String(item.label)
        .toLowerCase()
        .startsWith(v);
    });
    this.setState({
      items,
      rowCount: items.length,
      changed: !this.state.changed
    });
  };
  onChangeCheck = (id, index) => {
    const filter = this.state.filter;
    const checked = filter[id] === undefined;
    if (checked) {
      filter[id] = id;
    } else {
      delete filter[id];
    }
    this.setState({ filter, index, changed: !this.state.changed });
    //this.selectCell({ rows: index, columns: 0 });
  };
  onChangeCheckAll = () => {
    const filter = this.state.items.reduce(
      (acc, item) => {
        if (this.state.checkAll) {
          delete acc[item.id];
          return acc;
        } else {
          acc[item.id] = item.id;
          return acc;
        }
      },
      { ...this.state.filter }
    );
    this.setState({
      filter,
      checkAll: !this.state.checkAll,
      changed: !this.state.changed
    });
  };
  onOk = () => {
    const filterKeys = Object.values(this.state.filter);
    const filter =
      filterKeys.length === this.props.items.length || filterKeys.length === 0
        ? null
        : this.state.filter;
    this.props.onOk(filter);
  };
  render() {
    const { maxRows, rowHeight } = this.state;
    return (
      <div
        id="filter"
        style={{
          ...this.props.style,
          height: "fit-content"
        }}
        onWheel={this.onWheel}
      >
        <div style={{ textAlign: "center" }}>
          {this.props.title || "Filter"}
        </div>
        <div>
          <input
            type="text"
            style={{
              width: "94%",
              margin: "2%",
              placeholder: "toto",
              textAlign: "left"
            }}
            autoFocus={true}
            value={this.value}
            onChange={e => this.filterItems(e.target.value)}
          />
        </div>
        <div>
          <input
            id="-1"
            value="0"
            type="checkbox"
            checked={this.state.checkAll}
            onChange={this.onChangeCheckAll}
          />
          <label htmlFor={-1}>Select all</label>
          <FilterValues
            width={(this.props.style.width || 200) * 0.98}
            height={maxRows * rowHeight - 5}
            style={{
              width: (this.props.style.width || 200) * 0.98,
              justifyContent: "space-between",
              borderTop: "solid 0.02em rgba(0, 0, 0, 0.3)",
              marginTop: 5
            }}
            rowCount={this.state.rowCount}
            rowHeight={rowHeight}
            data={this.state.items}
            filter={this.state.filter}
            onChangeCheck={this.onChangeCheck}
            changed={this.state.changed}
            ref={ref => (this.values = ref)}
          />
        </div>
        <button style={{ width: "96%", margin: "2%" }} onClick={this.onOk}>
          Apply filter
        </button>
      </div>
    );
  }
}
