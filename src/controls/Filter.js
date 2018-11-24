import React, { Component } from "react";
import { ScrollableGrid } from "./scrollable_grid";
import { EditableInput } from "./input_type";
import { ScrollbarSize } from "./constants";
import { ResizableBox } from "react-resizable";
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
const ResizableFilter = props => {
  if (props.resizable) {
    return (
      <ResizableBox
        id="filter"
        height={props.height}
        width={props.width}
        style={{
          ...props.style,
          height: props.height,
          width: props.width
        }}
        // onWheel={props.onWheel}
        onResize={props.onResize}
      >
        {props.children}
      </ResizableBox>
    );
  } else {
    return (
      <div
        id="filter"
        style={{
          ...props.style,
          height: "fit-content"
        }}
        // onWheel={props.onWheel}
      >
        {props.children}
      </div>
    );
  }
};
export class Interval extends Component {
  constructor(props) {
    super(props);
    const initialValues = props.initialValues || [undefined, undefined];
    // this.state = { from: initialValues[0], to: initialValues[1] };
    this.state = { from: {}, to: {} };
  }
  getFrom = () => {
    return this.state.from;
  };
  getTo = () => {
    return this.state.to;
  };
  // handleChange = (type, value) => {
  //   let vn = value,
  //     vo = this.state[type],
  //     changed = vn !== vo;
  //   if (utils.isDate(vn) || utils.isDate(vo)) {
  //     changed =
  //       utils.isNullOrUndefined(vn) !== utils.isNullOrUndefined(vo) ||
  //       new Date(vn || null).getTime() !==
  //         new Date(vo || null).getTime();
  //   }
  //   if (changed && vn !== undefined) {
  //     this.setState({ [type]: value });
  //     if (this.props.onChange) {
  //       this.props.onChange([
  //         type === "from" ? value : this.getFrom(),
  //         type === "to" ? value : this.getTo()
  //       ]);
  //     }
  //   }
  // };
  // handleBlur = (type, value) => {
  //   if (this.props.onChange) {
  //     this.props.onChange([this.getFrom(), this.getTo()]);
  //   }
  // };
  render() {
    const { dataType, format, style, hasFocus, id } = this.props;
    const inputStyle = {};
    if (dataType === "date") {
      inputStyle.textAlign = "center";
    }
    return (
      <div key={id} style={style}>
        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            paddingBottom: title ? 10 : 0
          }}
        >
          {this.props.title}
        </div>
        <div>
          <EditableInput
            hasFocus={true}
            style={inputStyle}
            value={this.getFrom()}
            dataType={dataType}
            // format={format}
            onChange={value => this.handleChange("from", value)}
            // onBlur={value => this.handleBlur("from", value)}
            editable={true}
          />
        </div>
        <div>
          <EditableInput
            hasFocus={false}
            style={{ ...inputStyle, marginTop: ".3em" }}
            value={this.getTo()}
            dataType={dataType}
            // format={format}
            onChange={value => this.handleChange("to", value)}
            // onBlur={value => this.handleBlur("to", value)}
            editable={true}
          />
        </div>
      </div>
    );
  }
}
// <button
//   style={{
//     marginTop: ".3em",
//     width: "100%"
//   }}
//   onClick={() =>
//     this.props.save({
//       from: this.getFrom(),
//       to: this.getTo()
//     })}
// >
//   Apply filter
// </button>
export class Filter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [...props.items],
      filter: { ...props.filter },
      rowCount: props.items.length,
      checkAll: false,
      maxRows: props.maxRows || 10,
      rowHeight: props.rowHeight || 20,
      width: (props.style.width || 200) * 0.98,
      height: (props.maxRows || 10) * (props.rowHeight || 20) - 5,
      type: props.type || "values"
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
  componentDidMount = () => {
    this._isMounted = true;
    if (this.props.resizable || this.props.resizable === undefined) {
      // const element= document.getElementById("filter");
      this.setState({
        filterHeight: document.getElementById("filter").getBoundingClientRect()
          .height
      });
    }
  };

  onChange = (to, value) => {
    console.log("interval", to, value);
    // const filter = this.state.filter;
    // const checked = filter[id] === undefined;
    // if (checked) {
    //   filter[id] = id;
    // } else {
    //   delete filter[id];
    // }
    // this.setState({ filter, index, changed: !this.state.changed });
    //this.selectCell({ rows: index, columns: 0 });
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
  onResize = (e, data) => {
    const newState = {
      height: this.state.height + (data.size.height - this.state.filterHeight),
      filterHeight: data.size.height,
      width: data.size.width
    };
    console.log(1, this.state, newState, data.size);
    this.setState(newState);
  };

  render() {
    const { maxRows, rowHeight } = this.state;
    let filter = (
      <div>
        <input
          type="text"
          style={{
            width: "94%",
            margin: "2%",
            textAlign: "left"
          }}
          autoFocus={true}
          value={this.value}
          onChange={e => this.filterItems(e.target.value)}
        />
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
            width={this.state.width}
            height={this.state.height}
            style={{
              width: this.state.width,
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
      </div>
    );
    // if (this.state.type === "interval") {
    //   filter = (
    //     <Interval
    //       from={this.state.items[0]}
    //       to={this.state.items[1]}
    //       dataType={null}
    //       onChange={this.onChange}
    //     />
    //   );
    // }
    return (
      <ResizableFilter
        id="filter"
        style={{
          ...this.props.style,
          height: "fit-content"
        }}
        resizable={
          this._isMounted &&
          (this.props.resizable || this.props.resizable === undefined)
        }
        height={this.state.filterHeight}
        width={this.state.width}
        onResize={(e, data) => {
          this.onResize(e, data);
        }}
      >
        <div style={{ textAlign: "center" }}>
          {this.props.title || "Filter"}
        </div>
        {filter}
        <button style={{ width: "96%", margin: "2%" }} onClick={this.onOk}>
          Apply filter
        </button>
      </ResizableFilter>
    );
  }
}
